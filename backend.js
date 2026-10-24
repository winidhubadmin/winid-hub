// WiniD Hub · connection to Supabase (logins + shared data)
// If VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY are not set, the app runs in
// "local demo mode" and keeps data in the browser, like the prototype.
import { createClient } from '@supabase/supabase-js';

const URL_ = import.meta.env.VITE_SUPABASE_URL;
const KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
export const on = !!(URL_ && KEY);
export const sb = on ? createClient(URL_, KEY, { auth: { persistSession: true, autoRefreshToken: true } }) : null;

// App collection  ->  database table (and how to find the owning student)
const COLL = [
  { key: 'styles', table: 'styles' },
  { key: 'locations', table: 'locations' },
  { key: 'plans', table: 'plans' },
  { key: 'batches', table: 'batches' },
  { key: 'cancels', table: 'cancels' },
  { key: 'students', table: 'students', phone: true },
  { key: 'enrollments', table: 'enrollments', sid: (x) => x.studentId },
  { key: 'payments', table: 'payments', sid: (x) => x.studentId },
  { key: 'txns', table: 'txns', sid: (x) => x.studentId },
  { key: 'enquiries', table: 'enquiries', sid: (x) => x.studentId || null },
  { key: 'waOut', table: 'wa_out', sid: (x) => x.studentId || null },
];
const PUBLIC = ['styles', 'locations', 'plans', 'batches', 'cancels'];

// Synthetic login address for phone-number sign-in (no SMS needed).
export const phoneEmail = (phone) => {
  const d = String(phone || '').replace(/\D/g, '').slice(-10);
  return d.length === 10 ? `91${d}@phone.winidhub.app` : null;
};

let snap = {};          // table -> Map(id -> json) of what the database has
let S = null;           // the app's state object
let onError = (m) => console.error(m);

const digits10 = (p) => String(p || '').replace(/\D/g, '').slice(-10);
const attToRows = (att) => {
  const rows = [];
  for (const [k, v] of Object.entries(att || {})) for (const [sid, st] of Object.entries(v || {})) rows.push({ id: `${k}|${sid}`, data: { v: st }, student_id: sid });
  return rows;
};

async function selectAll(table) {
  const out = []; let from = 0; const page = 1000;
  for (;;) {
    const { data, error } = await sb.from(table).select('*').range(from, from + page - 1);
    if (error) { onError(`Could not load ${table}: ${error.message}`); break; }
    out.push(...data); if (data.length < page) break; from += page;
  }
  return out;
}

function remember(table, rows) {
  const m = new Map(); for (const r of rows) m.set(r.id, JSON.stringify(r.data)); snap[table] = m;
}

/** Load everything this visitor is allowed to see. Returns the state + session. */
export async function boot(base, errorFn) {
  if (errorFn) onError = errorFn;
  S = base; snap = {};
  const { data: { session } } = await sb.auth.getSession();
  let profile = null;
  if (session) {
    const { data } = await sb.from('profiles').select('role,student_id').eq('user_id', session.user.id).maybeSingle();
    profile = data;
  }
  const admin = profile?.role === 'admin';
  const tables = session ? COLL : COLL.filter((c) => PUBLIC.includes(c.key));
  await Promise.all(tables.map(async (c) => {
    const rows = await selectAll(c.table);
    S[c.key] = rows.map((r) => (c.key === 'students' ? { ...r.data, pw: r.user_id ? true : undefined } : r.data));
    remember(c.table, rows.map((r) => ({ id: r.id, data: c.key === 'students' ? r.data : r.data })));
  }));
  for (const c of COLL) S[c.key] ||= [];
  // settings
  const st = await sb.from('settings').select('data').eq('id', 'main').maybeSingle();
  if (st.data) { S.settings = { ...S.settings, ...st.data.data }; remember('settings', [{ id: 'main', data: st.data.data }]); }
  // attendance
  S.att = {};
  if (session) {
    const rows = await selectAll('attendance');
    for (const r of rows) { const i = r.id.lastIndexOf('|'); const k = r.id.slice(0, i); (S.att[k] ||= {})[r.student_id] = r.data.v; }
    remember('attendance', rows);
  }
  // admin-only working state
  if (admin) {
    const a = await sb.from('admin_state').select('data').eq('id', 'main').maybeSingle();
    S.remLog = a.data?.data?.remLog || {};
    remember('admin_state', [{ id: 'main', data: { remLog: S.remLog } }]);
  }
  // seats taken per batch (students cannot see each other's enrolments)
  const cnt = await sb.rpc('batch_counts');
  S.enrollCounts = Object.fromEntries((cnt.data || []).map((r) => [r.batch_id, Number(r.n)]));
  S.session = session && profile ? (admin ? { role: 'admin', auth: true } : profile.student_id ? { role: 'student', studentId: profile.student_id, auth: true } : null) : null;
  S.pendingProfile = !!(session && profile && !admin && !profile.student_id);
  return S;
}

// ---------- saving: send only what changed ----------
let timer = null, busy = false, again = false;
export function queue() { clearTimeout(timer); timer = setTimeout(flush, 350); }

async function syncTable(table, rows, cols) {
  const prev = snap[table] || new Map();
  const now = new Map(rows.map((r) => [r.id, r]));
  const inserts = [], updates = [], deletes = [];
  for (const [id, r] of now) { const j = JSON.stringify(r.data); if (!prev.has(id)) inserts.push(r); else if (prev.get(id) !== j) updates.push(r); }
  for (const id of prev.keys()) if (!now.has(id)) deletes.push(id);
  const pick = (r) => { const o = { id: r.id, data: r.data, updated_at: new Date().toISOString() }; for (const c of cols) o[c] = r[c]; return o; };
  const errs = [];
  if (inserts.length) { const { error } = await sb.from(table).insert(inserts.map(pick)); if (error) errs.push(error.message); }
  for (const r of updates) { const o = pick(r); delete o.id; const { error } = await sb.from(table).update(o).eq('id', r.id); if (error) errs.push(error.message); }
  if (deletes.length) { const { error } = await sb.from(table).delete().in('id', deletes); if (error) errs.push(error.message); }
  if (!errs.length) { const m = new Map(); for (const [id, r] of now) m.set(id, JSON.stringify(r.data)); snap[table] = m; }
  else onError(`Some changes were not saved (${table}): ${errs[0]}`);
}

async function flush() {
  if (!S) return;
  if (busy) { again = true; return; }
  busy = true;
  try {
    const admin = S.session?.role === 'admin';
    for (const c of COLL) {
      if (PUBLIC.includes(c.key) && !admin) continue;
      const rows = (S[c.key] || []).map((x) => {
        const data = { ...x };
        if (c.key === 'students') delete data.pw;
        const r = { id: x.id, data };
        if (c.sid) r.student_id = c.sid(x) || null;
        if (c.phone) r.phone_digits = digits10(x.phone) || null;
        return r;
      });
      await syncTable(c.table, rows, c.sid ? ['student_id'] : c.phone ? ['phone_digits'] : []);
    }
    if (S.session) await syncTable('attendance', attToRows(S.att), ['student_id']);
    if (admin) {
      const st = { ...S.settings }; delete st.adminPw;
      await syncTable('settings', [{ id: 'main', data: st }], []);
      await syncTable('admin_state', [{ id: 'main', data: { remLog: S.remLog || {} } }], []);
    }
  } finally {
    busy = false;
    if (again) { again = false; queue(); }
  }
}

// ---------- logins ----------
export async function signInPhone(phone, password) {
  const email = phoneEmail(phone);
  if (!email) return 'Enter the 10-digit mobile number you registered with.';
  const { error } = await sb.auth.signInWithPassword({ email, password });
  if (error) return /invalid/i.test(error.message) ? 'Phone number or password is incorrect.' : error.message;
  return null;
}
export async function signInEmail(email, password) {
  const { error } = await sb.auth.signInWithPassword({ email: String(email).trim(), password });
  return error ? (/invalid/i.test(error.message) ? 'Email or password is incorrect.' : error.message) : null;
}
export async function signUpPhone(phone, password) {
  const email = phoneEmail(phone);
  if (!email) return 'Enter a 10-digit mobile number.';
  const { data, error } = await sb.auth.signUp({ email, password });
  if (error) return /registered|exists/i.test(error.message) ? 'This phone number already has a login. Sign in instead.' : error.message;
  if (!data.session) return 'Sign-up needs "Confirm email" switched off in Supabase (see README).';
  return null;
}
export async function registerStudent(id, profile) {
  const { error } = await sb.rpc('register_student', { new_id: id, profile });
  return error ? error.message : null;
}
export async function claimStudent(phone) {
  const { error } = await sb.rpc('claim_student', { phone });
  return error ? error.message : null;
}
export async function changePassword(password) {
  const { error } = await sb.auth.updateUser({ password });
  return error ? error.message : null;
}
export async function signOut() { await sb.auth.signOut(); }
export async function flushNow() { clearTimeout(timer); await flush(); }
