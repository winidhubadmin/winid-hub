import QRious from 'qrious';
import * as Backend from './backend.js';


/* ---------- helpers ---------- */
const DAYS=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const WEEK=[1,2,3,4,5,6,0];
const pad=n=>String(n).padStart(2,'0');
const iso=d=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const fromISO=s=>{const[y,m,d]=s.split('-').map(Number);return new Date(y,m-1,d)};
const fmt=s=>s?fromISO(s).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'}):'—';
const fmtShort=s=>fromISO(s).toLocaleDateString('en-IN',{weekday:'short',day:'numeric',month:'short'});
const fmtDM=s=>fromISO(s).toLocaleDateString('en-IN',{day:'numeric',month:'short'});
const monthOf=s=>s.slice(0,7);
const monthLabel=m=>{const[y,mm]=m.split('-').map(Number);return new Date(y,mm-1,1).toLocaleDateString('en-IN',{month:'long',year:'numeric'})};
const inr=n=>'₹'+Number(n||0).toLocaleString('en-IN');
const t12=t=>{let[h,m]=t.split(':').map(Number);const ap=h>=12?'PM':'AM';h=h%12||12;return `${h}:${pad(m)} ${ap}`};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const uid=p=>p+(crypto.randomUUID?crypto.randomUUID().replace(/-/g,'').slice(0,12):Math.random().toString(36).slice(2,14));
const TODAY=(()=>{const d=new Date();d.setHours(0,0,0,0);return d})();
const todayISO=iso(TODAY);
const curMonth=monthOf(todayISO);
const addDays=(s,n)=>{const d=fromISO(s);d.setDate(d.getDate()+n);return iso(d)};
function cancelsOf(bid){return (typeof S!=='undefined'&&S&&S.cancels)?S.cancels.filter(c=>c.batchId===bid):[]}
function classDates(b,from,to){const out=[];if(!b||from>to)return out;const C=cancelsOf(b.id);const off=new Set(C.map(c=>c.date));const d=fromISO(from),end=fromISO(to);while(d<=end){const x=iso(d);if(b.days.includes(d.getDay())&&!off.has(x))out.push(x);d.setDate(d.getDate()+1)}
  for(const c of C)if(c.makeup&&c.makeup.date>=from&&c.makeup.date<=to&&!out.includes(c.makeup.date))out.push(c.makeup.date);return out.sort()}
const cancelOn=(bid,d)=>cancelsOf(bid).find(c=>c.date===d);
const makeupOn=(bid,d)=>cancelsOf(bid).find(c=>c.makeup&&c.makeup.date===d);
function monthsBetween(a,b){const out=[];let[y,m]=a.split('-').map(Number);const[by,bm]=b.split('-').map(Number);while(y<by||(y===by&&m<=bm)){out.push(`${y}-${pad(m)}`);m++;if(m>12){m=1;y++}}return out}
function ageOf(dob){if(!dob)return'';const d=fromISO(dob);let a=TODAY.getFullYear()-d.getFullYear();if(TODAY<new Date(TODAY.getFullYear(),d.getMonth(),d.getDate()))a--;return a}
function mulberry(a){return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
const daysText=b=>b.days.length?WEEK.filter(d=>b.days.includes(d)).map(d=>DAYS[d]).join(' · '):'By appointment';

/* ---------- sample data ---------- */
const WHY={
  dz:['Burns calories and tones muscles in the same hour','Upbeat music makes it easy to keep coming back','Right inside your apartment, so no travel'],
  zu:['Feels like a party, works like a workout','Lifts your mood and melts stress away','No dance experience needed'],
  wh:['Builds confidence, coordination and stage presence','Keeps kids active and away from screens','Learn trending choreography with friends'],
  bn:['A complete art of rhythm, expression and storytelling','Builds discipline, posture and focus','Connects children to Indian culture'],
  yo:['Better flexibility, posture and breathing','Calms the mind and improves sleep','Suits every age and fitness level'],
  fu:['The best of Indian and western dance in one','Creative pieces that stand out on stage','Perfect if you love variety'],
  wd:['Steps made for your couple and family','Look confident and relaxed on the big day','Rehearsals at your home or venue'],
  sc:['Classical grace without years of training','Perfect for festivals and functions','Expressive pieces on songs you love'],
  pc:['Your trainer’s full attention','Your goal, your pace, your schedule','At home or in your community hall']};
const LEARN={
  dz:{levels:[
      {level:'Foundation',items:['Basic Zumba steps: merengue, salsa, cumbia and reggaeton','Holding and moving with 1–2 kg dumbbells safely','Toning moves for arms, shoulders, back and core','Squats and lunges to music for legs and glutes','Pacing your breathing through a full hour of cardio']},
      {level:'Progressive',items:['Faster combinations and longer cardio blocks','Heavier dumbbells (2–3 kg) and more repetitions','Interval routines for fat burn and stamina','A monthly check of stamina, strength and flexibility']}],
    cls:['Warm-up and mobility (10 min)','Zumba dance cardio (25 min)','Dumbbell toning set (15 min)','Cool-down and stretch (10 min)'],
    good:['Adults at any fitness level','Weight loss, toning and stamina','Anyone who finds the gym boring'],
    bring:['Workout clothes and sports shoes','Water bottle and a small towel','A pair of 1–2 kg dumbbells']},
  zu:{levels:[
      {level:'All levels',items:['Core Zumba rhythms: merengue, salsa, cumbia and reggaeton','Bollywood and Indian folk-beat routines','Following the instructor’s cues and changing steps with the music','Building stamina through high and low intensity songs','Better coordination and balance']},
      {level:'Progressive',items:['Longer, faster routines','High-intensity interval songs','A monthly stamina check']}],
    cls:['Warm-up (8 min)','6 to 8 dance-cardio songs','One toning song for abs and arms','Cool-down and stretch'],
    good:['Adults, beginners welcome','Fitness, weight loss and stress relief','People who love music and movement'],
    bring:['Workout clothes and sports shoes','Water bottle and a small towel']},
  wh:{levels:[
      {level:'Beginner',items:['Bounce, rock and basic hip hop grooves','Jazz and contemporary basics: posture, lines and spins','Counting music in 8s and staying on the beat','Isolations: head, chest, shoulders and hips','Learning and remembering a full routine every month']},
      {level:'Intermediate',items:['Popping and locking basics','Turns, jumps, floor work and smooth transitions','Freestyle confidence and dance battles','Group formations and a showcase performance']}],
    cls:['Warm-up and stretching','Technique drills','Choreography practice','Freestyle circle'],
    good:['Kids and teens','Building confidence and fitness','School and event performances'],
    bring:['Comfortable clothes and sports shoes','Water bottle']},
  bn:{levels:[
      {level:'Foundation',items:['Namaskaram (salutation) and araimandi (half-sitting posture)','Adavus: Tatta, Natta, Visharu and Kuditta mettu','Asamyuta hastas (single-hand mudras) and their meanings','Keeping talam: counting Adi talam in three speeds','Eye, neck and head movements']},
      {level:'Intermediate',items:['Samyuta hastas (double-hand mudras)','Navarasa: the nine expressions','Alarippu and Jathiswaram','Shabdam: storytelling through abhinaya']},
      {level:'Advanced',items:['Varnam: the main piece combining nritta and abhinaya','Padam, Keertanam and Thillana','Stage presence and costume','Arangetram (debut performance) preparation']}],
    cls:['Namaskaram','Adavu practice','Mudras and expressions','Learning the current piece'],
    good:['Children from 5 years, and adults','Discipline, grace and culture','Students aiming for an arangetram'],
    bring:['Practice saree or salwar kameez','Small towel and water']},
  yo:{levels:[
      {level:'All levels',items:['Sun salutations (Surya Namaskar)','Standing, seated and balancing asanas','Pranayama: breathing for calm and energy','Flexibility, posture and back care','Relaxation and a short guided meditation']}],
    cls:['Breathing','Gentle warm-up','Asana practice','Relaxation'],
    good:['All ages','Stress, flexibility and back pain','Anyone wanting a calm, steady practice'],
    bring:['Yoga mat','Loose, comfortable clothes','Come on an empty stomach (2 hours after a meal)']},
  fu:{levels:[
      {level:'Beginner',items:['Classical basics: posture, mudras and footwork','Contemporary basics: flow, floor work and release','Blending Indian rhythm with western music','Expressions and storytelling']},
      {level:'Intermediate',items:['Creating short pieces of your own','Partner and group choreography','A showcase piece for events']}],
    cls:['Warm-up','Classical and contemporary drills','Choreography','Run-through'],
    good:['Teens and adults','Dancers who enjoy both Indian and western styles'],
    bring:['Comfortable clothes that allow floor work','Water bottle']},
  wd:{levels:[
      {level:'What’s included',items:['Choosing songs and editing a custom mix','Couple dance with easy, elegant steps made for you','Family and friends group numbers','Entry and exit sequences for the sangeet','Full rehearsal and a final run-through before the event']}],
    cls:['Rehearsals at your home or venue','Video of each routine to practise at home'],
    good:['Brides, grooms and their families','Any experience level, including first-timers'],
    bring:['Your song ideas and the event date','Comfortable clothes and shoes like the ones you’ll wear on the day']},
  sc:{levels:[
      {level:'Beginner',items:['Basic mudras and footwork from classical dance','Bhava: facial expressions and emotion','A complete routine on a film or devotional song']},
      {level:'Intermediate',items:['Graceful classical movement on film songs','Group formations for the stage','A full stage performance piece']}],
    cls:['Warm-up','Footwork and mudras','Song choreography','Performance practice'],
    good:['Children and adults','Festivals, functions and stage shows'],
    bring:['Practice saree or salwar kameez','Water bottle']},
  pc:{levels:[
      {level:'Made for you',items:['Any style: classical, Bollywood, western, Zumba or yoga','Your goal: fitness, a performance, a wedding or a new skill','Flexible days and timings','Classes at your home or community hall','One-to-one attention with a plan made for you','A progress review every month']}],
    cls:['Planned around your goal','One-to-one or small group'],
    good:['Busy schedules','Special events and performances','Faster, focused progress'],
    bring:['Your goal and preferred timings']}
};

const KITS=Object.fromEntries(['bn','sc','fu','bw','we','hh','zu','db','wd'].map(k=>[k,{name:'Not required',fee:0}]));
const WA_DEF={number:'9940462190',sender:'Manaswini',role:'Founder',optIn:true,
  enquiry:'Namaste {name}! This is {sender}, founder of {studio}. Thank you for your enquiry about {style}{timing}.\n\nI would love to help you choose the right batch and answer any questions. You can reply here or call me on {number}.\n\n{studio} · Where moments become art',
  welcome:'Namaste {name}! Welcome to {studio}. I am {sender}, the founder.\n\nYour profile is ready, so you can now choose a class timing and join from our website. If you need help picking a style or batch, just reply to this message or call me on {number}.\n\n{studio} · Where moments become art',
  request:'Namaste {name}! This is {sender} from {studio}. We have received your request to join {style}{timing}.\n\nAmount to pay when you join: {amount}. You can pay from the Fees page on our website, by Google Pay or any UPI app to {upi}. I will confirm your seat shortly.\n\n{studio} · Where moments become art',
  overdue:'Namaste {name}, this is {sender} from {studio}. Your fee of {amount} for {items}{due}.\n\nPlease pay today by Google Pay or any UPI app to {upi}, or at the front desk, so your classes continue without a break. Please ignore this if you have already paid. Thank you!',
  cancel:'Namaste {name}, this is {sender} from {studio}. Your {style} class on {date} is cancelled ({reason}). {makeup}\n\nSorry for the inconvenience. Reply here if you have any questions.',
  makeup:'Namaste {name}, this is {sender} from {studio}. Your make-up class for the cancelled {style} class on {date} is on {mdate}, {mtime} at {mplace}. See you there!\n\n{studio} · Where moments become art',
  birthday:'Happy birthday, {name}! Wishing you a wonderful year full of music, movement and joy. Everyone at {studio} is cheering for you today.\n\nWith love,\n{sender}, {studio}',
  festival:'Happy {festival}, {name}! Wishing you and your family a joyful and peaceful celebration.\n\nWith warm wishes,\n{sender} and the {studio} family',
  resume:'Namaste {name}, this is {sender} from {studio}. We have missed you in {style} class{timing}! We would love to see you back this week. If you need a different timing or any help, just reply here or call me on {number}.\n\n{studio} · Where moments become art',
  reminder:'Namaste {name}, this is {sender} from {studio}. A gentle reminder that {amount} is due for {items}{due}.\n\nYou can pay by Google Pay or any UPI app to {upi}, or at the front desk. Please ignore this if you have already paid. Thank you!'};
const BANK={payee:'MANASWINI',acct:'270801507749',ifsc:'ICIC0002708',bank:'ICICI Bank',branch:'Siruseri, OMR, Chennai 600130',upi:''};
function seed(){
  const start=iso(new Date(TODAY.getFullYear(),TODAY.getMonth()-2,1));
  const lastMonthStart=iso(new Date(TODAY.getFullYear(),TODAY.getMonth()-1,1));
  const yest=addDays(todayISO,-1);
  const styles=[
    {id:'dz',name:'Dumbbell Zumba fitness',h:96,blurb:'Zumba with light dumbbells: dance cardio plus strength and toning, set to music.',curriculum:[
      {level:'All levels',items:['Warm-up and mobility','Zumba dance cardio to Latin and Indian beats','Toning with 1–2 kg dumbbells','Cool-down and stretch']},
      {level:'Progressive',items:['Longer cardio intervals','Heavier dumbbells (2–3 kg)','Monthly fitness check']}]},
    {id:'zu',name:'Zumba fitness',h:322,blurb:'Dance cardio to Latin and Indian beats. All fitness levels welcome.',curriculum:[
      {level:'All levels',items:['Merengue, salsa, cumbia and reggaeton steps','Bollywood and folk-beat routines','Cardio intervals','Cool-down and stretch']},
      {level:'Progressive',items:['Higher-intensity routines','Endurance tracking','Monthly fitness check']}]},
    {id:'wh',name:'Western / Hip hop (kids & teens)',h:200,blurb:'Western and hip hop for kids and teens: grooves, choreography, musicality and stage confidence.',curriculum:[
      {level:'Beginner',items:['Bounce, rock and basic grooves','Jazz and contemporary basics','Musicality and counting','One full routine each month']},
      {level:'Intermediate',items:['Popping and locking basics','Turns, floor work and transitions','Freestyle and battle prep','Showcase piece']}]},
    {id:'bn',name:'Bharatanatyam',h:352,request:true,blurb:'Classical dance of Tamil Nadu: rhythm, geometry and storytelling through abhinaya.',curriculum:[
      {level:'Foundation',items:['Namaskaram and araimandi posture','Tatta, Natta and Visharu adavus','Asamyuta hastas (single-hand mudras)','Counting Adi talam']},
      {level:'Intermediate',items:['Kuditta mettu, Mandi and Sarukkal adavus','Samyuta hastas and navarasa','Alarippu and Jathiswaram','Shabdam with abhinaya']},
      {level:'Advanced',items:['Varnam: nritta and abhinaya','Padam and Keertanam','Thillana','Arangetram preparation']}]},
    {id:'yo',name:'Yoga',h:160,request:true,blurb:'Asanas, breathing and flexibility for all ages. Batches and timings arranged on request.',curriculum:[
      {level:'All levels',items:['Sun salutations and standing asanas','Pranayama (breathing)','Flexibility and balance','Relaxation']}]},
    {id:'fu',name:'Fusion',h:275,request:true,blurb:'Indian classical vocabulary blended with contemporary and western movement.',curriculum:[
      {level:'Beginner',items:['Classical and contemporary basics','Floor work and transitions','Musicality across genres']},
      {level:'Intermediate',items:['Choreography workshops','Partner and group work','Showcase piece']}]},
    {id:'wd',name:'Wedding choreography',h:44,request:true,blurb:'Sangeet and reception performances for couples, families and friends.',curriculum:[
      {level:'Package',items:['Song selection and mix edit','Couple dance routine','Family and friends group numbers','Sangeet rehearsal and final run-through']}]},
    {id:'sc',name:'Semi-classical',h:14,request:true,blurb:'Classical technique set to film and devotional songs. Graceful, expressive, stage-ready.',curriculum:[
      {level:'Beginner',items:['Basic mudras and footwork','Facial expressions (bhava)','First song routine']},
      {level:'Intermediate',items:['Classical movement on film songs','Group formations','Stage performance piece']}]},
    {id:'pc',name:'Customised personal classes',h:260,request:true,blurb:'One-to-one or small-group sessions in any style, at a time and place that suits you.',curriculum:[
      {level:'Made for you',items:['Choose the style and goal','Flexible days and timings','At your home or community hall','Progress review every month']}]}
  ];
  const locations=[
    {id:'H1',name:'House of Hiranandani',type:'community',area:'Egattur, OMR, Chennai',address:'Edina Tower, ground floor room, House of Hiranandani, Egattur, OMR, Chennai',contact:''},
    {id:'E1',name:'Emami Tejomaya',type:'community',area:'Egattur, OMR, Chennai',address:'MPH hall, Emami Tejomaya, Egattur, OMR, Chennai',contact:''},
    {id:'O1',name:'Olympia Panache',type:'community',area:'Navalur, OMR, Chennai',address:'Clubhouse, Olympia Panache, Navalur, OMR, Chennai',contact:''}
  ];
  const plans=[
    {id:'p-dz-e',styleId:'dz',batchId:'B1',name:'Monthly',type:'monthly',classes:8,fee:2699},
    {id:'p-zu-h',styleId:'zu',batchId:'B2',name:'Monthly',type:'monthly',classes:8,fee:2499},
    {id:'p-wh-h',styleId:'wh',batchId:'B3',name:'Monthly',type:'monthly',classes:8,fee:2699},
    {id:'p-dz-o',styleId:'dz',batchId:'B4',name:'Monthly',type:'monthly',classes:8,fee:2999}
  ];
  const batches=[
    {id:'B1',styleId:'dz',title:'Dumbbell Zumba · Emami Tejomaya',level:'All levels',ages:'Adults',days:[1,3],start:'17:00',end:'18:00',locationId:'E1',venue:'MPH hall',instructor:'WiniD Hub trainer',capacity:20},
    {id:'B2',styleId:'zu',title:'Zumba · Hiranandani',level:'All levels',ages:'Adults',days:[2,4],start:'09:30',end:'10:30',locationId:'H1',venue:'Edina Tower, ground floor room',instructor:'WiniD Hub trainer',capacity:20},
    {id:'B3',styleId:'wh',title:'Western / Hip hop · Kids & teens',level:'Beginner',ages:'Kids & teens',days:[2,4],start:'17:00',end:'18:00',locationId:'H1',venue:'Edina Tower, ground floor room',instructor:'WiniD Hub trainer',capacity:20},
    {id:'B4',styleId:'dz',title:'Dumbbell Zumba · Olympia Panache',level:'All levels',ages:'Adults',days:[1,3],start:'10:00',end:'11:00',locationId:'O1',venue:'',instructor:'WiniD Hub trainer',capacity:20}
  ];
  const raw=[
    ['S1','Ananya Krishnan','2014-03-12','Female','98401 22314','ananya.k@example.com','Lakshmi Krishnan (mother)','H1','Edina Tower, Flat 304','Ramesh Krishnan (father), 98840 22314'],
    ['S2','Rohan Iyer','2010-07-02','Male','98402 77120','rohan.iyer@example.com','Venkat Iyer (father)','O1','Block C, Flat 1102','Uma Iyer (mother), 98840 77120'],
    ['S3','Meera Subramanian','1992-01-19','Female','98403 55410','meera.s@example.com','Self','E1','Tower A, Flat 702','Arvind Subramanian (husband), 98840 55410'],
    ['S5','Karthik Raj','1997-05-27','Male','98405 81922','karthik.raj@example.com','Self','O1','Block D, Flat 403','Priya Raj (sister), 98840 81922'],
    ['S8','Lakshmi Prakash','1985-06-30','Female','98408 19004','lakshmi.p@example.com','Self','H1','Edina Tower, Flat 501','Prakash Rao (husband), 98840 19004'],
  ];
  const students=raw.map(([id,name,dob,gender,phone,email,guardian,communityId,address,emergency])=>({id,name,dob,gender,phone:'+91 '+phone,email,guardian,communityId,address,emergency,notes:'',joined:start}));
  const enrollments=[
    ['S1','B3','p-wh-h'],['S2','B3','p-wh-h'],['S3','B1','p-dz-e'],['S5','B4','p-dz-o'],['S8','B2','p-zu-h']
  ].map(([studentId,batchId,planId,since],i)=>({id:'E'+(i+1),studentId,batchId,planId,since:since||start,status:'active'}));
  enrollments.push({id:'E99',studentId:'S3',batchId:'B2',planId:'p-zu-h',since:todayISO,status:'pending'});
  styles.forEach(s=>{s.kit={name:'Not required',fee:0};if(LEARN[s.id])s.curriculum=LEARN[s.id].levels});
  const rng=mulberry(20261002);
  const hadReg=new Set(),hadKit=new Set();
  const att={};
  const payments=[];
  for(const e of enrollments){
    if(e.status!=='active')continue;
    const b=batches.find(x=>x.id===e.batchId), p=plans.find(x=>x.id===e.planId);
    for(const d of classDates(b,e.since,yest)){(att[b.id+'|'+d] ||= {})[e.studentId]=rng()<0.85?'P':'A'}
    const base={studentId:e.studentId,enrollmentId:e.id};
    if(!hadReg.has(e.studentId)){hadReg.add(e.studentId);payments.push({id:uid('P'),...base,type:'reg',month:monthOf(e.since),amount:500,status:'paid',paidOn:e.since,method:'Cash'})}
    const kk=e.studentId+b.styleId;if(!hadKit.has(kk)&&(KITS[b.styleId]||{}).fee){hadKit.add(kk);payments.push({id:uid('P'),...base,type:'kit',styleId:b.styleId,month:monthOf(e.since),amount:KITS[b.styleId].fee,status:'paid',paidOn:e.since,method:'Google Pay'})}
    if(p.type==='package'){payments.push({id:uid('P'),...base,type:'fee',month:monthOf(e.since),amount:p.fee,status:'paid',paidOn:e.since,method:'Split: Google Pay + Cash'});continue}
    for(const m of monthsBetween(monthOf(e.since),curMonth)){
      let paid = m<curMonth || !['S2','S5'].includes(e.studentId);
      payments.push({id:uid('P'),...base,type:'fee',month:m,amount:p.fee,status:paid?'paid':'due',paidOn:paid?(m<curMonth?m+'-04':todayISO):'',method:paid?(rng()<0.55?'Google Pay':rng()<0.5?'UPI':'Cash'):''});
    }
  }
  const kp=payments.find(x=>x.studentId==='S5'&&x.type==='fee'&&x.month===curMonth);
  const txns=[];
  if(kp){const tx={id:'WH-'+todayISO.replace(/-/g,'').slice(2)+'-4821',studentId:'S5',date:todayISO,ids:[kp.id],total:kp.amount,parts:[{method:'gpay',amount:kp.amount,status:'verify',ref:'427915036482'}]};kp.status='pending';kp.txnId=tx.id;kp.method='Google Pay';txns.push(tx)}
  return {v:6,demo:1,txns,styles,locations,plans,batches,students,enrollments,att,payments,
    settings:{studio:'WiniD Hub',tagline:'Where moments become art · Chennai',welcome:'Dance and fitness classes right inside your apartment community. Sign in to see your classes, attendance and fees.',bank:{...BANK},regFee:500,dueDay:5,lateFee:100,siblingDiscount:10,communityNote:'Classes in apartment communities need at least 8 sign-ups to start a batch.'},
    session:null};
}

/* ---------- state ---------- */
const LS='winid-dance-demo-v2';
const DEMO_PW='dance123',ADMIN_PW='admin123';
const DEMO=[['S1','Kid · Western / Hip hop · fees paid'],['S2','Teen · Western / Hip hop · fee overdue'],['S3','Dumbbell Zumba · Zumba request waiting'],['S5','Dumbbell Zumba · payment being checked'],['S8','Zumba · fees paid']];
async function setDemoPasswords(){for(const [id] of DEMO){const st=S.students.find(x=>x.id===id);if(st&&!st.pw)st.pw=await makePw(DEMO_PW)}if(!S.settings.adminPw)S.settings.adminPw=await makePw(ADMIN_PW);save()}
let S;
function initLocal(){
try{const s=localStorage.getItem(LS);if(s)S=JSON.parse(s)}catch(e){}
if(!S||!S.styles)S=seed();
S.cancels ||= [];
if(!S.cancelSeed){S.cancelSeed=1;setTimeout(()=>{const b=S.batches.find(x=>x.id==='B2');if(b){const d=nextClass(b);if(d&&!S.cancels.some(c=>c.batchId==='B2')){S.cancels.push({id:'X1',batchId:'B2',date:d,reason:'Venue not available',note:'Clubhouse booked for an association event',createdOn:todayISO,makeup:null});save();render()}}},0)}
if(S.demo===1&&!S.demoPw){S.demoPw=1;setTimeout(setDemoPasswords,0)}
if(S.session&&!S.session.auth)S.session=null;
if(S.settings.welcome==null)S.settings.welcome='Dance and fitness classes right inside your apartment community. Sign in to see your classes, attendance and fees.';
if(S.settings.tagline==null)S.settings.tagline='Where moments become art · Chennai';
if(S.settings.studio==='WiniD Dance Studio')S.settings.studio='WiniD Hub';
if(!S.v||S.v<2){S.v=2;S.settings.dueDay=5;S.txns=S.txns||[];
  S.styles.forEach(st=>{if(!st.kit)st.kit={...(KITS[st.id]||{name:'Studio T-shirt',fee:500})}});
  S.payments.forEach(x=>{if(!x.type)x.type='fee';if(!x.studentId){const e=S.enrollments.find(y=>y.id===x.enrollmentId);x.studentId=e?e.studentId:null}if(x.status==='paid'&&!x.method)x.method='Cash'});
  save();}
if(!S.enquiries){const d=n=>addDays(todayISO,-n);S.enquiries=[
  {id:'Q1',name:'Revathi S',phone:'+91 98840 11223',styleId:'wd',batchId:'',message:'Sangeet in December for 10 family members. Want to know the package cost.',date:d(0),status:'new',seen:false,source:'Website'},
  {id:'Q2',name:'Mohan Das (for daughter, 8 yrs)',phone:'+91 98840 55667',styleId:'bn',batchId:'',message:'Can she attend a trial class first?',date:d(2),status:'contacted',seen:true,source:'Website',note:'Called on '+fmt(d(1))+'. Trial on Monday.'},
  {id:'Q3',name:'Farah Khan',phone:'+91 98840 77889',styleId:'zu',batchId:'',message:'Is there a Zumba batch at Olympia Panache?',date:d(5),status:'new',seen:true,source:'Website'}];}
if(!S.settings.wa)S.settings.wa={...WA_DEF};
for(const k of ['request','overdue','birthday','festival','resume','cancel','makeup'])if(!S.settings.wa[k])S.settings.wa[k]=WA_DEF[k];
if(!S.waOut){S.waOut=[];setTimeout(()=>{(S.enquiries||[]).filter(q=>q.status==='new').forEach(q=>queueWA('enquiry',{name:q.name,phone:q.phone,styleId:q.styleId,batchId:q.batchId,enquiryId:q.id}));save()},0)}
if((!S.v||S.v<5)&&!S.locations.some(l=>l.id==='H1')){
  const NEW=[
    {id:'H1',name:'House of Hiranandani',type:'community',area:'Egattur, OMR, Chennai',address:'Clubhouse, House of Hiranandani, Egattur, OMR, Chennai',contact:''},
    {id:'E1',name:'Emami Tejomaya',type:'community',area:'Egattur, OMR, Chennai',address:'Clubhouse, Emami Tejomaya, Egattur, OMR, Chennai',contact:''},
    {id:'O1',name:'Olympia Panache',type:'community',area:'Navalur, OMR, Chennai',address:'Clubhouse, Olympia Panache, Navalur, OMR, Chennai',contact:''}];
  const map={L1:'H1',L2:'E1',C1:'H1',C2:'O1',C3:'E1',C4:'O1'};const ok=id=>NEW.some(l=>l.id===id);
  S.locations=NEW;
  S.batches.forEach(b=>{b.locationId=map[b.locationId]||(ok(b.locationId)?b.locationId:'H1')});
  S.students.forEach(st=>{if(st.communityId)st.communityId=map[st.communityId]||(ok(st.communityId)?st.communityId:'')});
  setTimeout(()=>{S.v=Math.max(S.v||0,5);save()},0);
}
if((S.v||0)<6&&!S.batches.some(b=>b.venue!==undefined)){
  const f=seed();
  S.styles=f.styles;S.plans=f.plans;S.batches=f.batches;S.locations=f.locations;S.att=f.att;S.txns=[];
  const keepIds=new Set(f.students.map(x=>x.id));
  S.students.forEach(st=>{const fs=f.students.find(x=>x.id===st.id);if(fs)st.communityId=fs.communityId;else if(!S.locations.some(l=>l.id===st.communityId))st.communityId=''});
  S.enrollments=f.enrollments;S.payments=f.payments;
  (S.enquiries||[]).forEach(q=>{if(!S.styles.some(x=>x.id===q.styleId))q.styleId='';const b=S.batches.find(x=>x.id===q.batchId);if(!b||b.styleId!==q.styleId)q.batchId=''});
  setTimeout(()=>{S.v=6;save()},0);
}
if(!S.learnV){S.styles.forEach(st=>{if(LEARN[st.id])st.curriculum=JSON.parse(JSON.stringify(LEARN[st.id].levels))});S.learnV=1;setTimeout(save,0)}
if(S.v<3){S.v=3;
  S.styles.forEach(st=>st.kit={name:'Not required',fee:0});
  S.payments=S.payments.filter(x=>!(x.type==='kit'&&x.status==='due'));
  S.payments.forEach(x=>{if(x.status==='cash')x.status='pending'});
  (S.txns||[]).forEach(t=>t.parts.forEach(q=>{if(q.status==='due'&&q.method!=='cash')q.status='verify'}));
  if(!S.settings.bank)S.settings.bank={...BANK};
  save();}
}
function save(){if(Backend.on){Backend.queue();return}try{localStorage.setItem(LS,JSON.stringify(S))}catch(e){}}
const ui={weekOff:0,stuStatus:'active',enqFilter:'open',loginMode:'login',loginMsg:'',tab:null,clsStyle:'all',clsLoc:'all',attMonth:curMonth,stuQ:'',stuComm:'all',stuStyle:'all',attBatch:null,attDate:null,payMonth:curMonth};

const style=id=>S.styles.find(x=>x.id===id)||{name:'—',h:0,curriculum:[]};
const batch=id=>S.batches.find(x=>x.id===id);
const loc=id=>S.locations.find(x=>x.id===id);
const plan=id=>S.plans.find(x=>x.id===id);
const student=id=>S.students.find(x=>x.id===id);
const enrollsOf=sid=>S.enrollments.filter(e=>e.studentId===sid);
const activeIn=bid=>S.enrollments.filter(e=>e.batchId===bid&&e.status==='active');
const chip=sid=>{const s=style(sid);return `<span class="chip" style="--h:${s.h}">${esc(s.name)}</span>`};
const locName=id=>{const l=loc(id);return l?esc(l.name):'—'};
const locBadge=id=>{const l=loc(id);if(!l)return'';return l.type==='community'?'<span class="pill info">Apartment community</span>':'<span class="pill neutral">Studio</span>'};
const commName=id=>{const l=loc(id);return l?esc(l.name):'<span class="muted">Not in a listed community</span>'};
const plansFor=sid=>S.plans.filter(p=>p.styleId===sid);
const plansForBatch=(sid,bid)=>S.plans.filter(p=>p.styleId===sid&&(!p.batchId||p.batchId===bid));
const bWhere=b=>{const l=loc(b.locationId);return l?esc(l.name)+(b.venue?' · '+esc(b.venue):''):'—'};
const isRequest=st=>!!st.request||!S.batches.some(b=>b.styleId===st.id);
const planText=p=>p?(p.type==='package'?`${esc(p.name)} · ${p.classes} sessions · ${inr(p.fee)}`:`${esc(p.name)} · ${p.classes} classes/month · ${inr(p.fee)}/month`):'—';

function attRecords(e,from,to){
  const b=batch(e.batchId);if(!b)return[];
  const f=e.since>from?e.since:from;const t=to<todayISO?to:todayISO;
  return classDates(b,f,t).map(d=>({d,s:(S.att[b.id+'|'+d]||{})[e.studentId]||null})).filter(r=>r.s||r.d<todayISO);
}
function attStats(recs){const p=recs.filter(r=>r.s==='P').length,a=recs.filter(r=>r.s==='A').length;return{p,a,u:recs.length-p-a,pct:p+a?Math.round(p*100/(p+a)):null}}
function studentPct(sid,from,to){let p=0,a=0;for(const e of enrollsOf(sid).filter(e=>e.status==='active')){const s=attStats(attRecords(e,from,to));p+=s.p;a+=s.a}return p+a?Math.round(p*100/(p+a)):null}
const ord=n=>n+((n%100>=11&&n%100<=13)?'th':({1:'st',2:'nd',3:'rd'}[n%10]||'th'));
const isOpen=p=>p.status==='due'||p.status==='pending';
const B=()=>S.settings.bank||BANK;
const upiId=()=>B().upi||`${B().acct}@${B().ifsc}.ifsc.npci`;
const upiLink=(amt,note)=>`upi://pay?pa=${encodeURIComponent(upiId())}&pn=${encodeURIComponent(B().payee)}&am=${Number(amt).toFixed(2)}&cu=INR&tn=${encodeURIComponent(note)}`;
const acctFmt=a=>String(a).replace(/(\d{4})(?=\d)/g,'$1 ');
const copyBtn=t=>`<button type="button" class="btn sm" data-act="copy" data-text="${esc(t)}">Copy</button>`;
const txnOf=p=>p.txnId&&(S.txns||[]).find(x=>x.id===p.txnId);
function pendText(p){const t=txnOf(p);if(!t)return'Pending';const v=t.parts.some(q=>q.status==='verify'),c=t.parts.some(q=>q.method==='cash'&&q.status!=='paid');return v&&c?'Being checked + cash due':v?'Being checked by studio':'Cash due at desk'}
const txnRefs=p=>{const t=txnOf(p);return t?t.parts.filter(q=>q.ref).map(q=>`${METHODS[q.method]?.short||q.method} ${q.ref}`).join(', '):''};
function bankKV(){const b=B();return `<dl class="kv">
  <dt>Account name</dt><dd><b>${esc(b.payee)}</b> ${copyBtn(b.payee)}</dd>
  <dt>Account number</dt><dd class="num"><b>${acctFmt(b.acct)}</b> ${copyBtn(b.acct)}</dd>
  <dt>IFSC</dt><dd class="num"><b>${esc(b.ifsc)}</b> ${copyBtn(b.ifsc)}</dd>
  <dt>Bank</dt><dd>${esc(b.bank)}</dd><dt>Branch</dt><dd>${esc(b.branch)}</dd>
  <dt>UPI ID</dt><dd><code>${esc(upiId())}</code> ${copyBtn(upiId())}</dd></dl>`}
const dueDate=p=>p.dueOn||(p.month+'-'+pad(S.settings.dueDay));
function payStatus(pay){if(['paid','pending','refund'].includes(pay.status))return pay.status;if(pay.type!=='fee')return'due';return todayISO>dueDate(pay)?'overdue':'due'}
const payPill=pay=>{const s=payStatus(pay);
  if(s==='paid')return `<span class="pill ok">Paid${pay.method?' · '+esc(pay.method):''}</span>`;
  if(s==='pending')return `<span class="pill info">${pendText(pay)}</span>`;
  if(s==='refund')return '<span class="pill neutral">Refund due</span>';
  if(s==='overdue')return '<span class="pill bad">Overdue</span>';
  return pay.type==='fee'?'<span class="pill warn">Due '+fmtDM(dueDate(pay))+'</span>':'<span class="pill warn">Due now</span>'};
const paymentsOf=sid=>S.payments.filter(p=>p.studentId===sid);
function payWhat(p){if(p.type==='reg')return'Registration fee';if(p.type==='kit')return'Dance kit · '+style(p.styleId).name;const e=S.enrollments.find(x=>x.id===p.enrollmentId);const b=e&&batch(e.batchId);return b?b.title:'Class fee'}
const payWhen=p=>p.type==='fee'?monthLabel(p.month):'One-time';
const METHODS={
  gpay:{label:'Google Pay',short:'Google Pay',sub:'Scan the studio’s UPI QR code or pay its UPI ID from Google Pay',kind:'upi'},
  upi:{label:'PhonePe, Paytm or any UPI app',short:'UPI',sub:'The same QR code works in every UPI app',kind:'upi'},
  bank:{label:'Bank transfer (NEFT / IMPS)',short:'Bank transfer',sub:'From your net banking to the studio’s bank account',kind:'bank'},
  razorpay:{label:'Card, net banking or wallet',short:'Razorpay',sub:'Through Razorpay. Available once the studio connects a Razorpay account.',kind:'off'},
  cash:{label:'Cash at the front desk',short:'Cash',sub:'Pay at the studio. The front desk confirms your receipt.',kind:'cash'},
  split:{label:'Split payment',short:'Split',sub:'Pay part online now and the rest in cash at the studio',kind:'split'}};
function hasKit(sid,styleId,exceptEid){return S.payments.some(x=>x.studentId===sid&&x.type==='kit'&&x.styleId===styleId&&x.status!=='refund')||S.enrollments.some(e=>e.id!==exceptEid&&e.studentId===sid&&e.status==='active'&&batch(e.batchId)?.styleId===styleId)}
const needsReg=sid=>S.settings.regFee>0&&!S.payments.some(x=>x.studentId===sid&&x.status!=='refund');
function joinCharges(sid,styleId,planId){
  const p=plan(planId),st=style(styleId),out=[];
  if(needsReg(sid))out.push(['Registration fee (one-time)',S.settings.regFee]);
  if(st.kit&&st.kit.fee>0&&!hasKit(sid,styleId))out.push([`Dance kit (one-time): ${st.kit.name}`,st.kit.fee]);
  if(p)out.push([p.type==='package'?`Package: ${p.name}, ${p.classes} sessions`:`First month: ${p.name}, ${p.classes} classes`,p.fee]);
  return out;
}
const sumBlock=rows=>`<div class="sum">${rows.map(([a,b])=>`<span>${esc(a)}</span><span class="num">${inr(b)}</span>`).join('')}<span class="tot">Total</span><span class="tot num">${inr(rows.reduce((x,r)=>x+r[1],0))}</span></div>`;
function createDues(e,months){
  const p=plan(e.planId),b=batch(e.batchId),sid=e.studentId,out=[];
  const add=o=>{const x={id:uid('P'),studentId:sid,enrollmentId:e.id,status:'due',paidOn:'',method:'',month:monthOf(e.since>todayISO?e.since:todayISO),...o};S.payments.push(x);out.push(x.id)};
  if(needsReg(sid))add({type:'reg',amount:S.settings.regFee});
  const k=style(b.styleId).kit;
  if(k&&k.fee>0&&!hasKit(sid,b.styleId,e.id))add({type:'kit',styleId:b.styleId,amount:k.fee});
  for(const m of months)if(!S.payments.some(x=>x.enrollmentId===e.id&&x.type==='fee'&&x.month===m)){
    const dd=m+'-'+pad(S.settings.dueDay);const o={type:'fee',month:m,amount:p.fee};
    if(m===monthOf(e.since)&&dd<todayISO&&m===curMonth)o.dueOn=todayISO;
    add(o);
  }
  return out;
}
function nextClass(b){
  const now=new Date();const nowT=pad(now.getHours())+':'+pad(now.getMinutes());
  for(const d of classDates(b,todayISO,addDays(todayISO,40))){if(d>todayISO||slotOf(b,d).end>nowT)return d}
  return null;
}
function slotOf(b,d){const m=makeupOn(b.id,d);if(m)return{start:m.makeup.start,end:m.makeup.end,where:(loc(m.makeup.locationId)?.name||'')+(m.makeup.venue?' · '+m.makeup.venue:''),makeup:m};return{start:b.start,end:b.end,where:bWhere(b),makeup:null}}
const CANCEL_REASONS=['Trainer unavailable','Venue not available','Public holiday','Festival','Heavy rain','Other'];
const seatsLeft=b=>b.capacity-(S.enrollCounts&&S.session?.role!=='admin'?(S.enrollCounts[b.id]||0):activeIn(b.id).length);

function enrollPay(e){const ps=S.payments.filter(p=>p.enrollmentId===e.id&&p.status!=='refund');if(!ps.length)return'none';if(ps.every(p=>p.status==='paid'))return'paid';if(ps.some(p=>p.status==='pending'))return'checking';return ps.some(p=>p.status==='paid')?'part':'unpaid'}
const enrollPayPill=e=>({paid:'<span class="pill ok">Paid</span>',checking:'<span class="pill info">Payment being checked</span>',part:'<span class="pill warn">Part paid</span>',unpaid:'<span class="pill bad">Not paid</span>',none:'<span class="pill bad">Not paid</span>'})[enrollPay(e)];
function studentPayPill(sid){const ps=paymentsOf(sid);const open=ps.filter(p=>p.status==='due'),chk=ps.filter(p=>p.status==='pending');
  if(open.some(p=>payStatus(p)==='overdue'))return `<span class="pill bad">Overdue ${inr(open.reduce((a,p)=>a+p.amount,0))}</span>`;
  if(open.length)return `<span class="pill bad">Not paid ${inr(open.reduce((a,p)=>a+p.amount,0))}</span>`;
  if(chk.length)return '<span class="pill info">Being checked</span>';
  return ps.length?'<span class="pill ok">Paid</span>':'<span class="pill neutral">No charges</span>'}
function payLoc(p){const e=S.enrollments.find(x=>x.id===p.enrollmentId);const b=e&&batch(e.batchId);return b?b.locationId:null}
const locCell=id=>{const l=loc(id);return l?`${esc(l.name)}<div>${locBadge(id)}</div>`:'<span class="muted">—</span>'};
const enqNew=()=>(S.enquiries||[]).filter(q=>q.status==='new');

/* ---------- WhatsApp ---------- */
const WA=()=>S.settings.wa||WA_DEF;
const waNum=ph=>{const d=digits(ph);return d.length===10?'91'+d:''};
const waLink=(ph,text)=>`https://wa.me/${waNum(ph)}${text?'?text='+encodeURIComponent(text):''}`;
const phFmt=ph=>{const d=digits(ph);return d.length===10?`+91 ${d.slice(0,5)} ${d.slice(5)}`:ph};
const firstName=n=>{const f=String(n||'').trim().split(/\s+/)[0]||'';return f.charAt(0).toUpperCase()+f.slice(1)};
const fillTpl=(t,o)=>String(t||'').replace(/\{(\w+)\}/g,(m,k)=>o[k]!=null?o[k]:'');
function tplVars(o){const b=o.batchId&&batch(o.batchId);return{name:firstName(o.name),sender:WA().sender,studio:S.settings.studio,number:phFmt(WA().number),
  style:o.styleId?style(o.styleId).name:'our dance classes',timing:b?` (${daysText(b)}, ${t12(b.start)} at ${loc(b.locationId)?.name||''})`:'',upi:upiId(),...o.extra}}
function queueWA(kind,o){
  if(!waNum(o.phone))return null;
  const m={id:uid('W'),kind,name:o.name,phone:o.phone,text:fillTpl(WA()[kind],tplVars(o)),date:todayISO,time:new Date().toLocaleTimeString('en-IN',{hour:'numeric',minute:'2-digit'}),status:'pending',studentId:o.studentId||null,enquiryId:o.enquiryId||null};
  (S.waOut ||= []).push(m);return m;
}
function autoReminders(){
  S.remLog ||= {};let n=0;
  for(const st of S.students){
    const actE=new Set(S.enrollments.filter(e=>e.status==='active').map(e=>e.id));const open=paymentsOf(st.id).filter(p=>p.status==='due'&&p.type==='fee'&&actE.has(p.enrollmentId));if(!open.length||!waNum(st.phone))continue;
    const dd=open.map(dueDate).sort()[0];const m=dd.slice(0,7);
    let kind=null;
    if(todayISO>dd)kind='overdue';else if(todayISO>=addDays(dd,-3))kind='reminder';
    if(!kind)continue;const key=`${st.id}|${m}|${kind}`;if(S.remLog[key])continue;
    const msg=queueWA(kind,{name:st.name,phone:st.phone,studentId:st.id});if(msg){msg.text=reminderText(st.id,kind);S.remLog[key]=todayISO;n++}
  }
  const md=todayISO.slice(5),yr=todayISO.slice(0,4);
  for(const st of S.students){
    if(st.dob&&st.dob.slice(5)===md&&waNum(st.phone)){const key=`${st.id}|${yr}|birthday`;if(!S.remLog[key]){queueWA('birthday',{name:st.name,phone:st.phone,studentId:st.id});S.remLog[key]=todayISO;n++}}
  }
  for(const e of S.enrollments.filter(x=>x.status==='active')){
    const st=student(e.studentId);if(!st||!waNum(st.phone))continue;
    const recs=attRecords(e,addDays(todayISO,-30),todayISO).filter(r=>r.s);const last=recs.slice(-3);
    if(last.length===3&&last.every(r=>r.s==='A')){const key=`${st.id}|${e.id}|${curMonth}|resume`;if(!S.remLog[key]){const b=batch(e.batchId);queueWA('resume',{name:st.name,phone:st.phone,studentId:st.id,styleId:b.styleId,batchId:b.id});S.remLog[key]=todayISO;n++}}
  }
  if(n)save();return n;
}
const waPending=()=>(S.waOut||[]).filter(m=>m.status==='pending');
function reminderText(sid,kind='reminder'){
  const st=student(sid);const actE=new Set(S.enrollments.filter(e=>e.status==='active').map(e=>e.id));const open=paymentsOf(sid).filter(p=>p.status==='due'&&(kind==='reminder'&&p.type!=='fee'||actE.has(p.enrollmentId)));
  const amt=open.reduce((a,p)=>a+p.amount,0);const items=[...new Set(open.map(p=>payWhat(p)+(p.type==='fee'?' ('+monthLabel(p.month)+')':'')))].join(', ');
  const dd=open.filter(p=>p.type==='fee').map(dueDate).sort()[0];
  return fillTpl(WA()[kind],tplVars({name:st.name,extra:{amount:inr(amt),items,due:dd?(dd<todayISO?(kind==='overdue'?` was due on ${fmt(dd)}`:`, which was due on ${fmt(dd)}`):(kind==='overdue'?` is due on ${fmt(dd)}`:` by ${fmt(dd)}`)):(kind==='overdue'?' is due':'')}}));
}
function thanksModal(title,body){
  openModal(`<div style="display:flex;flex-direction:column;gap:14px"><h2>${title}</h2><p>${body}</p>
    <div class="banner info"><span>You will get a WhatsApp message from <b>${esc(WA().sender)}, ${esc(WA().role)} of ${esc(S.settings.studio)}</b> on <b class="num">${phFmt(WA().number)}</b>. Save this number so you don’t miss it.</span></div>
    <div class="actions"><a class="btn wa" href="${waLink(WA().number,`Hi ${WA().sender}, I just contacted ${S.settings.studio} through the website.`)}" target="_blank" rel="noopener">Chat on WhatsApp now</a><button class="btn primary" data-act="close">Done</button></div></div>`);
}
const waOptBox=id=>`<label class="check full" for="${id}"><input id="${id}" type="checkbox" name="wa" value="1" checked> Send me updates on WhatsApp from ${esc(WA().sender)}, ${esc(S.settings.studio)} (${phFmt(WA().number)})</label>`;

/* ---------- passwords ---------- */
async function hashPw(pw,salt){
  const data=new TextEncoder().encode(salt+':'+pw);
  if(window.crypto&&crypto.subtle){const h=await crypto.subtle.digest('SHA-256',data);return [...new Uint8Array(h)].map(b=>b.toString(16).padStart(2,'0')).join('')}
  let h=5381;for(const c of data)h=(Math.imul(h,33)^c)>>>0;return 'f'+h.toString(16);
}
async function makePw(pw){const salt=Math.random().toString(36).slice(2,12);return{salt,hash:await hashPw(pw,salt)}}
async function checkPw(rec,pw){return !!rec&&(await hashPw(pw,rec.salt))===rec.hash}
function pwProblem(pw,confirm){
  if(pw.length<8)return'Password must be at least 8 characters.';
  if(!/[A-Za-z]/.test(pw)||!/[0-9]/.test(pw))return'Password must include at least one letter and one number.';
  if(confirm!==undefined&&pw!==confirm)return'The two passwords do not match.';
  return'';
}
const ecDigits=x=>{const d=String(x||'').replace(/\D/g,'');return d.length>=10?d.slice(-10):''};
function checkEmergency(){const ec=document.getElementById('sf-ec'),ph=document.getElementById('sf-ph'),m=document.getElementById('sf-ec-msg');if(!ec||!ph||!m)return true;const same=ecDigits(ec.value)&&ecDigits(ec.value)===digits(ph.value);m.textContent=same?'This is the same as your own phone number. Please give someone else’s number for emergencies.':'Must be a different number from your own phone.';m.classList.toggle('err',!!same);if(same)ec.setAttribute('aria-invalid','true');else if(ec.getAttribute('aria-invalid')&&ecDigits(ec.value))ec.removeAttribute('aria-invalid');return !same}
const digits=x=>String(x||'').replace(/\D/g,'').slice(-10);
function findStudent(id){
  id=String(id||'').trim();if(!id)return null;
  if(id.includes('@'))return S.students.find(s=>s.email&&s.email.toLowerCase()===id.toLowerCase())||null;
  const d=digits(id);return d.length===10?S.students.find(s=>digits(s.phone)===d)||null:null;
}
function formErr(f,msg){let el=f.querySelector('.auth-err');if(!el){el=document.createElement('p');el.className='auth-err';el.setAttribute('role','alert');f.querySelector('h2').after(el)}el.textContent=msg}
const pwField=(id,name,label,auto,hint='')=>`<label class="f" for="${id}"><span>${label}</span><input id="${id}" name="${name}" type="password" required autocomplete="${auto}">${hint?`<span class="hint">${hint}</span>`:''}</label>`;
const showPw=id=>`<label class="showpw" for="${id}"><input id="${id}" type="checkbox" data-showpw> Show password</label>`;
const PW_HINT='At least 8 characters, with a letter and a number.';

/* ---------- rendering ---------- */
const STU_TABS=[['home','Overview'],['styles','Dance styles'],['classes','Join a class'],['attendance','My attendance'],['fees','Fees'],['profile','My profile']];
const ADM_TABS=[['dash','Dashboard'],['enquiries','Enquiries'],['whatsapp','WhatsApp'],['students','Students'],['schedule','Class schedule'],['attendance','Attendance'],['fees','Fees'],['styles','Dance styles'],['places','Locations']];

const MARK=`<img class="logo" src="data:image/webp;base64,UklGRvRdAABXRUJQVlA4WAoAAAAQAAAAKwEAKwEAQUxQSJwNAAABzlHQto3k8Ie9exlExASoMlufdNInO1hYl+ln2zZFtmvbioiWYpY/eAwxu4O62NUPGHIHiQZazNxlsi39AVkDzW4OZu6WBjPzGA2qWlVWNvf54v2+LyJiAixB26f4beTp/5QZFN+WObzMG7IdZvItdFo0u+JTmJlNKt+WmTF0YuZEQZkCTinMnu7+LYQjTf+Wv5++6VZETAC7unK9Ohtee+aWO8ydd8rKn15608D6oedflNccHRtaP1Aujcc+9IC/8qorOdj2pmjGCdpyyXjNvk8esHT5727d8IK87eZffo7Rb7y8HBgZ9SRkuTgAsI/suey7N2yS14/BFwBm9kbMDCAT0+E/68PvfUktQJvCTjLGQgDYYsfFP7zzRXlN33QlROPbbka6pw7sX3/2La+6ogBtUj2RWM4A0M065k+PyT+GxiMa3+FmpKP9z/d3nbqiABH1hGE5A8ifXvzbx4RkbLpgfBcb7iZJz/e3ZBSIqCcGyxnAlF3Puz0IGRtvHBYt3STx1dN39gIR9STgagDT9lz1sJBsfOSwaumS9KMYlwBTW3hVj0CZs3qdkLEJxmHYcJN0Nu+YCi3qcmMB8MlT7hYydOAwjiMpPnRjgWzLrEdgxuGXbhZGHzjskyb9ffTLCi0WV5UBbHvmOiGbwBESl2QfzwJRl5RlAHv84lXSl8gR1DKlv/UA9upSsgxMOuIaIUvgiEtKOnP/KIQtIauBvnn3CoOPHJEtkb79QC9MdelYBkaPHhT6wBGclKJfXtizRZOBaUsHyRI4wpNSjEsKe8vFGcZ/4z5hCWyBpPTd1/dibZlYBubeIiyRLdFS+pJD1AWSga/+hfSBLZKUPjMKsTQy8IH+QIAtE8STLyjEkrAMt2CT0LOFpvSzhxphiyEDO1wl9GypKdELsQwso+/8QB/ZWi3Fo71EXQAZ2O9eRs9WmyZGIXZdlTHaTzZsvS7RS9hOc8DuAxLAFgzqdxfaDqsx/kxhw5bs0sc7uass45PXSAxszZjO3Fii7iQHHPWcNGzVrhjQdlDB5NVCz5ad0hOUaecUbHUjfWTrtpRfzbRbqh4OHpKGrdz1y0HYDnHAMULPlp7Su6DtjIzJ35UQ2doNjQtL7Iga77uKnbHFm4souRMKPveQdGz5rn4buQMK9nxKPFt/atzLNHdVwVEdPRMw5YPJZs0KFjEGJiGmXrLOmPVwAkNkIhryEnW2zOE88ZHJaCmn1ZmyjEukYVK6krBZMoflslkS8+//oTSbIcso0jE5XUnY7FhGYccEdSVhM2M1zmPDJHWdJm1eCk5gE9PEXO8jZ6VglI0xUc3VyRkpOJLemKyWCqbZKNijC8aENTxKzkQPn32agUmLftNLzILDewYlMHFRWGkzUHHSNeKZvKkzo9nWWY3vS8cEdnXStq3gGG6WJP77f5Jpy3o4kD6mkaWc2CqHLZ+yIImMjatK26IqT7pFCpM5ZSPq9tToZ8OEdlFyawqOZMekdgW5JQ7bPB9iWhnDS9uKqjf+BvFM7FQ/N2wbapzFhsntCnILepgTvaWXpd1BbJzj9AclMMHRD0bTpmWsEc8kTz1NbFjGXlKY6ClKbFTlxh6MIdWwH4xWNynjAilM9tQgNijjy6Uw4TOd2BjL+XqmnSyibkrGfBYmfSrY2xBn7xkKSDv4pdW2GRlrpDDxU08TG5HxhRJi6hk5SmyCw5XimfypL9I2IOMg8VTA1H3EsVVuwl0xaAD2jfNaPa6Mr4unCqaMOKbKpg7GoANYeLXj6WEJC5UwFewdi9m0DTFoAeZR7Th6WMpCNUwN4hjMpncx6AHmo9r6aswTT0VMPcC0NrOJ98egCVicX21dPRxGT1VMUWJdLt+gDz3amjJ2lUBlRHeWWNevWbQhNdbksNUrUdTRxtW0dWScJUUfUsHeGipM38igDyhHsdVqHEZPhUxRptUcLo86YZ+nrURs82oUlbS/OW2VGidLoxMuI1fB+AEGnUD93LJixiwJVEp0qsQqq6XTCleuUGHKegatQP2iYkfJ2JOBaolGiaP1s9MLF0cyTF7PqBemTqmHZcxhoGKiLHFYjfPYaIbrNHmYlTsYNAN9Le0Qh+19NM0wyxtoB9VYKA1V00XJgxx+K143Up12QIUZj0vUDVNcRt3XwyyJVE7TKWJfjWOk0w5XMu1z+LN47Ug5DVChb5NE7TBlpwKHHSRSPU2dBmoslkY/XG8hQcYPdOQZggr5Tgb9QBalOnz4JYn6YfKg9TAmgQqKRomCZWw0xPVOMuN7WmJEZTcwaAjqZuP6nmDUEBO94JOmJXYjOEACVRT1giXsdMQVYLmeUPA7eh1JOe42CTqCvM3coCeeW77AqCOmP44dItXU+lyalph8nngtST1wsqbYSk157KcCLUFxmabYjZriA5rS1zFqienskCjqL5/TlHhRUzr/a/CopvSsKTGkKb80iVpiOjtAaAnqnab4ZZpiP9WUWClFS1KPnawpNk9THpgrUUtMvoNRTa2PvcCoI6Y/jpkbCB1Bnu42PfE27nfidSTlYDkbHXFRsERPAhzAoCOoF3wyimmIyW4EfU9oCb1UdgODhqBu1hv3PXYa4jKixjIteSeZsSeDhqBRwuHDL0nUD5MHrULvTgn6gSxKRcYP2OiH6xkCFCzWkbeQwGEHifph6jRQoW+TRO0wZacCOPxZvHaknAZAjWOk0Q5XMu3LmCVRO0yniH0VZjwuUTdMcRl1Hxx+K143Up3GgTUWSqcbLkoe5LC9j6YZZnkD7SBU9R0SNAN9La0cWnAeG81wnSYP62EOg2agLHGYYfJ6Rr0wdUo9DBn9bPTCRQmONMagF2gczTBlPYNWoH5RsaMgYzU7rXAlwQqzJGgFOrUKMH5Agk6gfm5ZtcbJ7HTCZeQqDtu8GnXC/ua0VUBcHr1GpH2exso1DhOdEGVarcL0jQz6gHIUWw0ZZ9HrQyrYY40OW70S9cHG1bR1IOPXUrQhNQjWtCuDNqA71wWXb5CiC6kejTVnHKYPlFhXZRPvj0ETsDi/2rpQY554TUg9wMTazaZviEEPMB/V1oceltLrQWoQHKPZtC4GLcA8qh0HeljCogWpYI9jNZs6GIMOYOHVjgc9fJ1FB1JGcMyVm3BXDBqAfeO8Vo8LGQeJ14DUfQTH73Cl+PRLfZHGBmZ8wYeYekaOEpuAjDVSUi/1NMFGuuo9QwFpB7+02jYDGfOlpF0q2GNDLefrWVIuZRF1U5Dx5ZJ26QSbm3EBS7qlBsEGm5v+YAyphv1gtLpJyNhLSqqlKMFmZ6yRkmappwk23HHsQQkphn4wmjYNGXOit/SytDsINr/GWWzSyxUkW1j1xt9An1qpfm7YNsBhm+dDTCtjeGlsZ40jpUkrV5Bsa0E/u5RyUZKtrXqTbqFPp5SNqNsDhy2fiiGVsHFVaWxzxoFSLI0s5QTbXeMYbk6jv/8nmdjyquD7bFLI1UnbNpibdI349EmdGc3YfuI9gxJSB4WVxhz28NmnJaQN+k0vwTzW2KMLMWUMj5LMZcGR9JYulgom5rNgETtLFXN1kjktOIGNpYm53kcyq1XBeWzSxHWatHmB9XAJmxRxJWHMrWUUdunhSsKYX3NYLptT4+//oTRjji2jSJcWriSMeTaH88THdLCU0ypzbRknSIipYMhLVObbaowyhjTA1EtW5twKjmroUyDlg8mY+YI9n6Jvf6lxLxPzX/C5h6Rre65+G8kuLHjfVdLFNmcuoiS7sYfJ32Ww9mZoXFiCXemAY4S+raX0Lmjszirj4CHp2pnrl4MwdmqNrW4UH9uXpfxqJnZtweTVpG9bKT1Bmdi9DjjqOWnalSsGNHZx1cMnr5EY2hOmMzeWqOzogvFnCpu25NLHO8nudsDuAxLQhkD97kJjl1tGX7+waT8u0UsYOz4D+93L6NtNmhiFYPdXGaPnB/rYXizFo71EZRFmYIerSN9WUqIXgqVoGW7BJqFvIyn97KFGGAsyAx/oDwK0DRBPvqAQLMwMfPUvpA9tgpQ+MwrB8rQMzL2F9LEtWEpfcojKInWG8d+4T1hCGyCl776+F2ss1gxMWzooLGGkI6UYlxT2WLKWgb6jB8kSRjJSin55Yc9YuFYDo/PuFQYfRyZLpG8/0AtTZQFbBiYdcY2QPow8pKQz949CGAvZMoA9fvGqsJQ4klim9LcewF5lQVsA1338rMQmjBS4JPt4FojK0o4Gl73us5uF0YfhjzTp76NfVmjBItcEfPKUu4UMDYYzHEnxoRsLZGOx1z0BZc7qdULGLthwZLhJOpt3TIUWlWXPAmDanqseFpKNj8OLpUvSj2JcAkyNE2DVywCm7Hre7UHI2HgbHizdJPHV03f2AhGVk6LlDCB/evFvHxOSsemCvZsMd5Ok5/tbMgpEVE6WljMAbDHrmD89Jv8YGo9o7zQz0tH+5/u7Tl1RgIjKSdRcTQDodlz8wztflNf0TVdCtLfPjHRPHdi//uxbXnVFAdqkygnWciEA2Ef2XPbdGzbJ68fgCwAzeyNmBpCJ6fCf9eH3vqQWoE1hnIAtl4zX7PvkAUuX/+7WDS/I227+5ecY/cbLy4GRUTlBm8slG1575pY7zJ13ysqfXnrTwPqh5198rdGxofUD5dJ47EMP+CuvupKDbW+KZuxqVlA4IDJQAADQ0QCdASosASwBPj0YikMiIaEWSnZ8IAPEtgQ66MgXEf8L1CWF+1f2X9hf8B+z3y21N+kf2H/Gf3f+z/+D/TfJP/jd7PV/l3+Vfo/+h/tf+L/7H+P/////+63+B/1f+h/c75J/oH/W/4391PoA/Un/R/3z/P/+T/H//////Vd/y/9l7kv3S/Jn4A/0P+/f9b/I/v18tH+M/6v+s9zf9m/zf/G/1X+5/+v0C/z7+4f9X82/ji9h/9z///7iP9Z/2X/w9nf/m/tp8LH9S/1v/t/2f7//Q//Ov8B/zPz/+QD//+2D/AOnv60/1X8iPBD+0f2n+8frj6g/kXzv9x/sv+P/3398/bDoq9b+a38c+zH5f+2/u3/lP3c++P8r/1f7j4v/Iv/R/MX4AvxX+U/6X/AfuD/ffU32XXAf6D0Bffv65/sP79/lv/b/lvgq+L/1v9u/q/sf9dv9x/i/gA/pP9e/2394/Jj2rf168pL8D/vv18+AH+a/1f/t/5H/Q/Dl/T/+7/Yfmr7ev0j/If/H/QfAZ/NP7D/zP8L+V/zqf+33O/vD7L37Ef8xyEY9Tbg+7nRwf0D41LRjWb+YoK53ORK/kTagtU/5UeDIWETcaeM8SBlgMwkoa0fY3YVlVfRmDit5qb855relyf7hVXU9s8mJ/9+qRZ1C5JoqzMTxMyzBACnDvlg+i4md9pPVsV1k/5hS66CizqWeFU26esSilE+oOlzew11eaEbTxHh0M12dIqldsLnMDfmHHQXpz0IBQqNlf7uIE5DNw9Vo360gdXs54ncXKPgbkVH62N0dOqnbCmzUWEtyhzVzwgpMO3+rWnoPFhpJyBfMH4s9Bh4Kh2yzDNFAlvVnIPSoAwZFnMwWmZqaAnA32f+6gVNyLJX84LuEyQe2SfltZ1zlUUj2aCen/+nXfsYeY3fsTqLgwUfjV3uD4kHp26lwPt7aJ/RkX6ROHSRlU+AO/ahabSvZ547g45VYpi4BWheSjykxXB6FRn9Zcdkp2Wng2AsBAnelQYh3hNWjPoTi5ptrB7HtjaVcqzwB8L7Rjfv33fYXRh+9NE7hh3E9cuy0ySyybBk9AN2/ERGO8EDaz/WOamdi3sANfxrn+YgMJyPlBerhaXAjHWoCKInpHUOsMRJC7vG00sxucuPinL+7JAPOuZopGlT9bByi67zKFobdpJs9Edn7sycMIgSrOX5kcd2L2iOkyGETkt79we9s2WWQ2VCbOYb/ft0aV4AP/wMzbR+ijvqaN+kVyyuk4PXnyJv3vtElw64UD6s98iVxOL79sqGjJyPU7Iv/mpApkly3TebyTO+mWbom5rKTdnDW2CepgLhvmegw6K3T4cYql12SIYoWpcB2XwUDaXGbBfIhqmkNLTSkoNmNzIbjIwMMMbrkV/bKClKU4FoGVaUro/MefN208EPSGFdk48zCX2xUDdGqyI0RATNLn5R1ueCuTjT2zgT4eJnLvzSBtgKAjhezw3OrPcuvZQMsdJN6wu3Pa+yoqh4Uhvs9VjJ132/ZbeBhySagilCFb11D5jbgQmNNgGHyfV+pBaIqGzxpW3XjzMIdUldycUzbizlEFzqMZj1rRRXtPYo7kOcYKAuEBo15zU29RAfl8zqJt/HPDTJ8zs8nr4g+xugjKNO3WD6rJa7lijFnEP7otXt+9CED740XjbfEltn+vfHzRFgopbgEH1f97yGxxRr4tMkzUqXzb3TtOkz+/7ikMlcxVuAB6KMYKIuM4wMJCc0mTsSb3u3I3wJciNE2AtKStWTWCkKDcvuJH0SwfESAD26yxDmj4eXOj4dfFTlG/1Ctx3ZOtwYfH5HOC9nNjdngFjhAvNEtrSozDlcLxdWjzJgj+SVzqr7SBtSH5GvXNS7JiQxKNWiyO/oRFBEBU1EUUhovnUkeo4eH+Z8uCmNl+vkMWrvK1PC1qYxuh981cRQ3bHM6OUOSlZpbeol2VvoMiY38uPmqgtnoZixnfhfs694hfbV9LeL+gXqsK6AbYFKcaBcrTyg1RMrX9SwMKsPH6HkMDyyDK54FtUxP6CGSkiF9uriCogDP7aQsaS6aRHdm+s6RgG+Xx7R0GFvhvQCf0VZOttAo4PUvDknUqf9mp3pn3y8tMzl8CHz1/kIxj71j6A9kDm8yTH15vXtVOGyhU4mh5/qHg2yPOwtGuQ14v/2gGdfv0Kc9EwurYsxqP/qNMdZlZkjZbF+bfQYgO3nxVwARUMIzGzhfxugw0H+Z8jt9aPMAAP76xEA3k/K04iDln/4wiQjaPpHQjvFFQZzWolgTHGu6fSaP4bxCmatuBN42qEkHM0JgqWDtlD4GqBZIa78CNI6tV28THDW+jx8zfx9ZJw9y0rGG/Y1Z/jls3c/zALztJ9uUsUKCV5WFjAFDUtLON0T0xowEA8JcIGQ88kWhB1RDb6XGu20RZAVu9PIaWtrb//M6mFHTDIMWd9dFuWnPOAOMoKonZ4KZ41l3Li5z8Nhwklpi0pD1fxIyRDJA7qKcw8TnYZwZi153iCoQ+OEGsHkjkygOVRPibL39UWCOYXjWXA3ZWE5U+d6KFZLPHyeOObz7VLuL4gsNf1HrXUYZ4rz0ej4sNlU/+5U/4+4CG1xMHj3gTeTjaUwwjcUAS9wwsOkOu37LrZwHfzAMbhvvl8qEt5BydiChVv5q537m304NcugKo2NwicFFqoc+rhU11jPmhiNYQ3wYeHKyq/b5rkXsbyplVhc6f79ELJ6bSc3ttxlob/w2uX7mZO4jvOZSHamYovhryfNhb1ATX2w8gjcvmFturEfN7qP4QUdnYUp26kuOkS804xwpn2lX8LPmdYFn5Iop942UCQujVZt/JJWfgIoCU5jTlIA0ao+1gW0NyOaiDanti/tsTGvX7Y8tAI0lzRnCAqq5qFMHggKCDFQtHNekWhQA1xiyRQAACuDnvyrfliOmgcXqYzQ4tYiR7jZRfNiYG9DKD8MQqJnxPUZn3Ma06O/z9ZeFcSQElN5YcBclkWw0SjyEsb0PCxkYzjUTuEvzCtxyKPWrunf/lKyRJIzW1l/WUChAJdLFCsW0ZFvuNPAoCe8EM0ObXPUBiTuU07Pbfjx82EdEptKXux5qLnjh+ZAF6QQ9rK4iO+6Xe8xCFkoWehsEr3UONHwsoxZ3vCD1K2J3eXXf/cgxui+6Mm7zCpTmUWznJeNm43swexHmI9B0XQXAA4qGwB/XawvRMwOocYW8ufc0bB2I9RYZ7mcW2ZcfxDessgXmG4K5e+rdDPi3rTosUo/Jexi4kBTDz6Sm0OSWTPpnPPBEuvMW4yPnPLmRbI5esiBdyeV2fU8AIcBAOkLQakSSgLX9+suY7QjmrW6nuqvFGj+nsI07OND1i33/11XiUgKnfBeos008jRfnuz9rj0Fz1uBDdicn0gjO2DR5AkgSxpfe9erHhq6Q93wtXe8YkyxrgV1lcnPjsUoFYa1vCWEUxKQ3ccCrF3bgRkg/R07hz0HPFzLwG/u4OkTMr8LM8tF5rBHsyxRgnluHKS1c8j2H5eF9hi5Zw9qdu1tfcwThgnLKruIM45XpAxcNfB/kV7ENcWyf+T6f8+oA+BrL05iPHvjTMEvjjE9rM4BzAvMaWvz1SEMpWcWfxlaB6UszT/oN61yGsE5CP3UmpNq28FBTxlIqRhNaAEkYTRU6C9/TDriQOKRLMR8xaZ8zwK4tg4GhaZNQ4sv8slI78Ljp8teI+yhDcNmf9IE7caQY/vZL7HUXRPSpUAdaeTQbjYDdqB0mSnmmKEhrF80YQ0+qP3o2uogvvF61TRXMQMgEpzqr3G7MH6t4ZlDfeQDVFmvi5n16i2bZgCWoj1nG4qnXcwg6EkHdDRG7+ZohVvd7XY062+gA1ggbH7HYiJGXWB3Fi4KNBzZROzg1eQIxLIV/0UD9wRf/N+1QmHunBV7fJ9OezpbMUqDCF2SnEYBBV1Th5zLVVw7S4lToxFN0Nwe+lnPNwXBs+pCR+uDg0mNv8RESF6PsQoAmfVwIrWGOgXeU4jvawtZt3dpULX6SBdcVBveWhWfJLIF1qoQUIQWOBcLmR5y6egcR0EjgdU4rzZnLyK4x2x5Qqedk4yebkakVOFZ1gv3T8ILZZNOpK2MEKorVx4Wc3mk0Av8CUlsuwGQmiDAwQrQm5CCkXYim8SeFTQAGQ5nKXSpnbkD+19iprQ2O2dfckdWuSqOxg84gUQdLaa6wd817pmBP+5ZlRuy37Yy+0rw7ghDfoUrvjqTtg/7T6I2Lum2Zwg/MIwg+5WK8KfB21aj9sFlR6FJu+ds7uvVKQcTx9jK++C5lumUf1XYgKnL8c6m/jwe3QHFpkoe+QdeEjtFPTolZTI6Rk8w/067rG8dd01RrXsEmoHbuG255e30Ux6HSt9SZM+TEBEQ70c7xK/iJGhRIIEEhGYb4SqgRQWdkoC8T/cCmo1VVcGr+yHadm4rK2jJZWEx8iA6WhFNYf/i3MHMi9cHbnBovLALeMHJt6/8lsyNSQIJK9WzOQfBX1WbrGfOdrXtVSGHrjgKYiKyYM0B1/sxYyFRpJMmGQDnda7rDzK+WH6wOgaAy+Ut0/jhAH97aFWwUKom4uJjxOhITzL/lNcaYjrnfNk17A4u+CKJlNKFmig6l9aWLwgUG0WmRMHkczRBcFGzzEHtxpz23f5a0NPPTrfgfE2vVB+16NOUU3l0vkvC6rL4qTJE3FkdAXuijXtnlytPIxHR4pisXF1JgYx+g3yKOSn/jjQBUjxSv27tncn69nuheB/Am//qGAA4KH+3EB6WPGwzknITdXAq4dGd2xHCDEiw4teEKvaxa2iZrs4U4joeOH/hpDE2hOeeo00dZXYSRsa+y8Gy/U/vbHXPjKO4JI6mfXBPHWKI4ZBYHtTqou1+yz/WIy/gdydKapmgjLbr+4vxok0PWIaGkbDAxZXHLlukE85S6uqGZ/I5ml58nDd6MEujjdjIRZAPF2UjjThs5/Z0vh5eV5xAAKJehTYy8GZXHy1iLwRAbMb15dpoJL6U9hD6vdFu/W+s8JxzLhwH8MXH2wfehf+LpBVBC/biBpnR312aNzE3rvkkaMHxmg6vsnTODU7la+TSKgGQmEKRIXhjobnn932CpfwUs7Kam7WcvtCiOh8F2vw6bhm9qGe/2GD45IEmC95Ebe9Guxqcugq+VSz+ZugcXWm/ugNO7JB0eTp3KGR6YhT1BNVnd/+Wzo57FyI3NFZodp2WpecJ3VSBX1Du3OoyNlnf2sRNp1PH9O6mMnMUjmoteder+E8Bykw6MlwLhRXq6otGjFcH5qM5RVppiJSAnMYskrxdf+v4EZw/qT/kyEn/nrloky4RNP9ng4iUBEhA/oHpntV4MQ7VDnFI6OmwpdFetZSToClSKBqezB/SU7YI9aLpPyDaaSvYgtf5aQvfnVs8eQThUhC3yEOr1ME/NzYMW9Jszv1+GQDqfuNPVjZd1ITFf2j2qq0jUL1CENxGz+hOYMNYYo+JfGNYxWIfEBNv/z5Py7zU+qMHesmEHCbdLHU06BosMdlTQBwvMbuG/gNsj8lTvDfthMgGghTTEosdATC52FGHFzHdL6rrCcDkhTJxUpyrqC3fRHbKrWZ20W3uAJOuNAlx5GeLW/8IpHrrQau1HFYMkpe+ykCWKrmrql1LCgH2+ZR6tAnWFcWehKNUFIt3FggeK/Mfaie5JCk8sjGeVlpK4JgWvslWw9KU5eupK842Pedpcti/mUxfoObbFqc1ON/fgn5eEt+tgthhgFGCf+ZOL/Wi+E4efjq9uAAwmHu7YcDfHAOGcy0nnZ5l6ry4uh7U9n6jVvp4P99cSlIMEPEfRXtKnYIFYxMlWuFLSo4mapW/Nr8rCwqkOuvtSTyD4lvDSY0OsCcu5ouOyu/gNNyN8h/P3Vf8SSJO4OudfmZtaItsGT8jwdhZjERv/gfNNlt4Tjv9nmIuw/EQzwmARzT1WXzfvlnG7npDndglEiXzBaaSbHXkHZLpDzq7CtuKxdUiHd65V20u4/Lg1tylkVetoc1eQD6d+JPAjaAAzPpK9uuAAQRAd8c4nbUk8yA3cdZp8UFOVQ+LaY2GKNX7SQm2smdzk9s5WSf1QDs8vwmVrg97eUh0kh6bZKHxl4J0Xo/BOFu2AO4SuBKWg3txgnz6jhs2oa+An0MzQngv7nbqFsMwRzO5XIb0qyPk/hZHp2H8Nkf02FbpGbJIk+A7nmfRXSeN8CSptHJEKg09lVb4mWfGoHv89nE37+ADKkOA1UQxnuzEWK/RAPDutKIcvnJ+dzJupn9BhDDCVcDRREvYXo0sepl+URkCKFR9BTHrLxdLYZf6l/rpFe465uDvznI+aR4unbLTsuu9QBd9OdLrotC0G0kYdT+o2FDuOTXtMUZQ5iD/GrHU0p2bbefYcWV2Px34ircs2LcSC4Q/eOfve/NhVc4zHG1okqIbBELH0cUwCjy/MgKdVtQmkBS6ic/txpRIlsr4GvJsgLmVwcoJsC3HrK5Q2tuQid4OXpJb3UtJ+twLfvF58DkjTGPIcrMKDsdnkFRFPJEOd3eLGbtbZhQR50SEWKFq3Vyn6xAUUGnR4fxgaucQSwt/wX5IRbPyav4txIoHIUvHZ8aKVVFisNuLN3xRuzSYolYzQdOm8w9Xj9IjvY304Hnn6rGQvrYULIhjBB3iSUx5Y4f94wvyfq6StBNwaobSdbn2+X+wllsKv5+OmB+L/UXLsN7WKT4HgfqPrpAjts5uPTzvGX+TC/wtEU5WF0oHmdJdaHJaCp8Jc8XmNRmo4qO4JXKktylexrjbOHF14gpmuorl4hZ+ft8DCKKTb9Ux4f3TIktCUnsX8fz9XQ+eHblSkumL7sel19YJd6hrBSlfcQI8j3r4Ueb2O/2ZZ7jHYOkcnUc0FjMOT5el6yx/Je3yOPINw4ODJFyhU36Iy1VGdaAAUqMq5/iOpSdAsRyBvffTpj7MRTb+EqJ1QXkfRPYu1pviVXv38zzs8IJEg1tGlqeoEMWBoApzSNfv/CL/who+dpIQA/vG0XNpv7iKekdLbETvaMQ/g7WiIF4Prd67Zxpb3HRPCHmcQPyo/cglhPLefK1etRfhDC4DzlEfg1PPF3kFZl9gzQ9ispjL3aDJ3/3/2gbyNrrKB8BzFmcmtskrGpr6tzukl7RZWe6EjTdK7rY0WR/ZQYoAiiqgSefyZubc743aHvEB5kdtYupLPiDSDXKVJC6f/8vdur9VJYxXseToTnnIsoXHPNkI93JRXhPmubG4tWU8NERlLpnSIbt+/1BUlYpbZCYEDyLz9PwkrYV+kGV4C8HhkqDon+CrX56VxU2Va2cIISD0Cf/JmUOTToMX5ZPosIKuBY2V5Noeu7qLcum20zYyAoGPRKmNDXmWJ+nc0HmAqS0PRcCPaYMB1mEMBnoKVWoTgqzgc3ZZykTYYQuRmaQDiV12vRQSBHXuo2yZ5JTv/bt7J5dfWkdL9f4f/SkYfm0Tjke/3P1mOTX6ygRdZXAC+8nsD1WXYrl06MMWk7UwkSyFsPM4mQFlnqbTufWBhlVP3J0ffN2aWFDzVQoLYRjDNWB4putZzlcFkiUu2OXIh8wQWxdjYX7NOeKZL+L6SCJhpfVHNUVf2EM3ISAKt9xVUydnUxNFHiFEZZc16MnoxikxJiHUluMKF5OpWwf0sriCcA5E/I6yf2jn35vdLiDhT/wHZ3Nzcwtlc45D6Axpq3CkLjbSlX3qsFHcoYqHMzii5Uf5QaC/cU4ELhms5d4XK7OR329UkCPTvWNGuhEqYgY0c0VwAhwpUr5/y/CVf2+Q7u+893DdmlPdcmY7FUezvfpz0oLKcfgRctvYIAJcg5eJ8vFHbxiO56Rop5snxh5Mkv7o9qYHX7utxrjCf8vRNR+H9FcATTH5UeSCPWOXyQPIUAWIlvuQQUsZtM2qV8U8Aog6vnLLhRrRibGKARPjs9IAE0HsGBQ/1OXPMeSn0RJE7TknVYoNXr3Qly4gzlcbaedgGzLoKzK68lptnG1+zp7kW4fvQW8UPSl3/DccgWJ2B2e5/6ZJFc/z7T9iDwWajMajHQLWTDCY432wfJSGMzvpl3J+Apt61lUtijX1ND2iJpE1rX2Du6lLhtdx6N7xh7yfMD20XXFU1thesKqfmkXrVa97WQwPx73n8eD0Nt6oWZpfefyUfe1SuhIom01lmzoh0VnCkAhBi/Y0SCwd/rHY/Z9pYjHrvWRNr+C/wYmhOYg0mGuL3o8veMY/dZFIMtkWHMvzFD7RIPC2imJAYV59C3v1PBS1LxXap+31skPsdY7/4u3+haeHBNKrHAWi7fU/myZRkbzQmgir5kD1i4qMcyP9/Kupup1x1+tNXTsaaZRLcxcaNZZPeLgLaT0QeblJshrsec1ow2KszXEBkjHNn83JQ0GASrRBC5CoUsQAkGqTXAesl8W6kPaUnz/0YXSZZPnGc4CnD4ZPjzr8X426LICcoIMVdSOn2I+6FAsq1BGAxOcHgy0c4b/T7wOJeqdbMlss1b4ovP6O1zka1ZtUYoNL5UO3E/+xgl9Bim8yt0uLVbdCEDNQ1qMS5EWp3sJd+TxZlnt+dB0/xhGJAGk0cs0FEAJT9lwYDiQwxQDSKoPX+fxEmAqqEfNYcq0T6zwgDpZwD5tqUpCYFPlgl0luKLuYRf71Z2di69Au8TPAuO+pyQVXQzJjhYgszZfJNdXnE7r7j1a+7c2iZ+G0mXOI+A3Z40WxskbqbY/SBxPHve5XbWf1tYr7L6KLxVe5Z1TwFjE+vWjb59JqUIwWp5DNCXxo5doj0gAg5AjFW5TluXNxFYfOoxgiaD5d5tW6HHRVtbFjsjHb8VFDipA2rJ4J9JZAVAyNVvitXY4seAEg0bLEsbMxchXq6zp/yaJaJfxtKyE6S3uyeWFZ1pWqolkjznXu1+l7bFJ8HBpc1plHSw4b1G7WQA8iwBqm49AD1E6nPyLazj+QRGhR6aSfnbriw7XSZVUnqTDE33anM6a9CYqPetwJLI1NjkwVU8IQeKF7ZrWSIlftz+CzBkfWgy6Sia9HUV1+ZK40AdzeOVcwaYlrrIzP5kdN91pPy+immw0JDEZSZOK8mt9jXCnnYT5yX+NYOBpWqsAb3trLxj7e8jMHekpn3xFT51ukl05m7S5DAgG71zxP4r7wz6Wjwg/QwWjrz0XMbw9DehtLbDFU6ZJVBCdkE4ThGN+iFWssNVflPGayvwWrQeXC8UT4AvpbE3lwiWk6lYSc/TYkxN/pvPkkCkdCx+kAhJjG4QqSIuT2cK4Ycn+2TG2F0D/YDGg7Bg7XsxvIp0mIU1kcmkQvMu4oTaLHwRYFs6+WAQTEMtxQonWYcOK2ahY2xXpaJqyQdLhoQ9J3eyUdhkaoWh69j082F8PpNM4eMOALN6d+t90pYF9BBGESmOeDSIZGaVx3PFKNs9m6LXxd4yytQLMEjqDX3ZEVeWZ8wMdJhdRWT/X9XVWXO8fyTYey9cEZ4tsQA93YpHHj2G8cy4aIGpkVQT1QGWzm70dW7tq+36H9/fI1XI+JzI6QaZC8bqEfuVrHrwVP24R0+TlUuaNasd7DPb6S+NdhVD0JhJ2/zYSAg7hevIWulDX7F4VpUVzjwm4fx61NsWCZJVYEsnNQzDxGy34LjC/3jvHBRs1NiiOo7ySf7X9mbUQ3IOTBPxEcEK2Ie99tCy70KnP6urQ5HFuwUGwm3/EoFQ5R2fAghIhtWWXJUIyd8BSLEMSXzWjlFWliP+34I6PMdlxeLejSsPEzpxdWDV89M3FFewRh07RbbK2PmuALUMqsAMqo5/imoAfwPcRQuckpDy5k4ypg9+vBxLRt/wHgYhtoSLHLcV9AvGHpUSn0ND9P/QcC6XsgtykcpSWcScPvQPcIpCmDwKh+STdGepAq8GUe2TS1n51iaLFZ6fwoeHVxJ9N6y5F0noIGmMfqTq9CnhFOezguJXyhXXYa6DSFD/tExvvfi/F8PM6RBaNibGKJOd0ao1EQuFtZRL0nYk455+eH1QtfMhRSjCTmbG/Wl7/yezPytdrNAlaPLuvsGbl7BsuUZKt8C7Ed58550d9DHYgHT8YRsW2qHvGgAJkuU5VKDJkmqKtrUlwDbb2ftRvosa5X1/Mp7mp+henztVFX/nxxcckJgPsw6qStmwhUoOppTCaQOhHa9ZE7pDfKuRaGIfLtjENNZTv6qO8T0z8li+3pxd8t2E1QO0G7RGgZT/pYrJnZ9bVWYHe/Ddgf3EIKRS+ntqKUCKzLKdatcSM7xR559eejZdDyEG9e4hS+/RrEDC+QM84cqGWyz8/idGWex1sQv5+8U1CPHlqsECtXjB0+GmjH9FDgsoyyJuyZY5UOB/uggti2gi9hNvKf0KjKs8N/cjhDW1CKdz/5xZiRlOxG3a+wtURwCFPRzFPSe5xgQCXfppGkynb0yZnQSF8eNvHWc0XCpXS6YZF6rBDdT5Y4M6YmPLENbmZgYiVZDgzKtAYNAX2iRDQ1aj++F1EwLkJPIWNzgze1DNo5Ops+DrMeOkTN86qCNMbJrLC0hN1Xpd39xy3K1ivMx04aRugLLYDvPx4+mgnudSibHS2X4P8z7wqG0kvSdDpQZUMV2itxmdjdwMmXmS77ZsxCRc5TOfvSlnzP9bM+W4mpPwa2ATabRQ9tBvSnzBjHDv3nLdT2j+Okxz29wX5qQCalq+Bz3Mwo6rb/PCmP95vfzKlbk6tXKQW5MqkiQtP12wM3T9EkeFo+zMoBCSc8AL1Gz3eGQzSJSQuM7DqnoSwF/JjthY22ao0t85464TmvFDkyIBQ5uSPgDfD36H3SSOUEHF7p5l2ONO8jgrQWX+u96gIkMaSr8oDDdwzQC47KyIf+Lh/OpZ/V+Npf5nszyC4jttR1NYVuNq/PgZvhh9IWWk/FOk1IHeIVJKirG1VnFyGQ09qBtiCOEExuk3+5m+dVn4fLORbWw+KAxQifFzzou6WOEdrzkB52FiZqBp/cQ1jLpzKhLKai6aZPwhIZ+uw7E76L7Qv0B26Y9RzrgbH0l+MJqifH3mylblgHID2ksdceP3Y0BQQUYCdlP3ftT2ahjYwe9//e2NkEH9Caw2i4z+q7FBfAS9c+zerAfouL6mvdiCKqMcc9Qz61sSsn9qB3PcyJWx1K/fTZYgBC5THL9IHM0PLxkxnC8cXJ4iw7m3yF5I1jggMLy4vmCN35Fp27XOorPgCJq1Z+r+qOH22xE/Pb5fDj37O07n+ONVBDM73ZITbpRuQQKwbAp38pHHSndsBmlry3rK6+BYElWbMI/P/54LgbqRc3RzCk379pxDEIV+Q+NEqG7FXe3ynDyIKnmFf1zLLtVmS4lfzx9duwFgVEoOEcZuTplCgNlroxKlqlNn4q+9m1siOrYreSUXYEhKqZgKF1vnofBbTlYmzLxQbzdlKKFKlEJCST3ALD2oxyGrPud6TDd5GZJfVm1tCmkqtNGoHX7QTEbefOvGirmF7y6+6tkCbo3h23UsuQNcRPGs7uSpJo5jTuPQ0wgBBYnx5TgdUMmwwQBaTyj9uDMfDL3a+0lI/Nz+u0rmcufDzXagNGHT3zIFq391uDTJiV8DXoM1jm7V9M6iX8DzyxduMm8PR4N+JQSzUto4czUvcZmQHRRHGFZNJmfgaDWmRqJyf+PP+60entcsYq+GiwMdzId4OpVgnMRUqrep/I0ngZ8h5DX8iA742+0Axc2BWDDUMcqO9BhUc1dz+KKlwpG5Kh96Tx3fSt52uCEF960p5bUrBApO2enNpGXIGkaxwO+ZR51ysCHf/3URQcgCBoWQfaekHAMzoTRq9Lb8KqfL07h3FXsJFbJf1iNsHNAQ6mEsoDt/7Hh6E+q7WsuLJxoF36WrlxGNm6oPLYX5Ja0OMdnkVibJPGV54JRtT4is07TucwnMt+9Z1enILUhKrN6/W+a8o8htaR1BvXxDNq3hCvd9OY6C9+xoE4AzMMhN8DaT47t80OH/n3z8uBHgWW3tKFIuNRQKK6kPfINYwBJ2ygsQ1JhCGvb7K1AyORP9DZUkhwmIpVvFkjk0uGUruGEVM66R2sxQHjsOz3JAVIKUzwruDpSW5Df2eXGvwXanZdvxeRsGPz2Q1ZE70iA0z21s4rPBpZRTceLIeUd2uT2ChKYXUTlpn3pOWUJ2jP6xE3FS/GOvrJyXw7IRV7ts2e/JV7dOFxX6g/zEj2IM3IJjsjdgwUBXrmL6S4MEXtM8zRFMd8GfnmcVktP8MPKAiJ9UOfadSq1ui6NPsFh6InIII4jEzdFzqRTDZoaFcDs/KuSl5dNQdiH1AC1al3x4qAK5ACfDyXAvJeBhrbOv9PLaJvsrlBrMopyf6K8VI5khQbS99A2CyAssOtaNFNCDh/7b1551uNpVYPpXA0wja+HY0+DE/0c0+Dge3IzpRPVvVdMivJPN2hNHWy+EJ1ME89H0OLTIsAGq+b8f3VyRMw0iE3rMQnGCRVXNGKNZ4DqFemS2ZNWqQc79rsBCD1GqIhKZiuArBf975FNmIXqIL893V96xdZbaci8L71gZnFW+2CooMEzDhMUeA3pA484JKiMrq7I4t4V+MYtY+3SuXQohCV3/kHrEkYLldWeB6N8mjgZC/0+TW5aPLMOLjI/q1Uh2NLEjHTHCpRsW/0vDEnDA2FLRB96mO7Xbu0aUbSXpu+VImOmXv4wuGJwMIDGBzzqMtlof/yZuZoRTMhLZ0vruEt6VjqVSJHXb6B0Iim+NzSfrU4b2YASM0/ea+C3IeNgKemZWjw28eUft/voxr8Yyv5LhX36ZHE/OYU4OqhmNu4Dmwr1W5ImFZtqY3m+pJCXVrer7uIv53mqanP80PbcMUO+9Au7oP8WS6WFGe3Bg9WJMnWquRTqHaUg/6a4I6Qn5s9JC4YDKgjkjwFmvmH1uWIeawnP4U0XzAMqRtc07MLX2o+wY7Y3W9dtIrooabvp4DccXoaR6kZK8y6uB53dVX58quBB9aChtZgeeQk8xUvwosknkkGfWzsP/55ivQdUW5UAmr93YAxD6ddO7Q+emSNS/5+kJRkXT4GNpvYLJ5febRIhf+IQYPnRBSe+27Jc0xbW5QFCt36nl4szZtglJ4DJ2WzmCTf5CovTivv3QwZsWZVVt5Hzfh39Ae6AtZ3jqFUvEzEahYI63fincTok5lco17b/015eT3bC+hkGvIKNXm9fmpN9di5DxshIpnNlf0O6EFucRzIw/xPIIfoJIT0rVHPOlL8S/8Yh/EMMoW/HfFWPeab6HehH2AoFpfMf5rUILWK7oCctKGipJ+jAiG8QXCFRJIU8YSiiBAdqCNjw4D/d0NfBgwyqkxZMGAzK0PNUPHEf6P/Quwfb+vMc0FByILoAjNJ4J3dhtqh/HtKkv7Y8RnQfDKa4n6S2fKSKIt8mM3gRhmtbhZfiwdLrGbGPWd9WLwkD3x0p1B551N9rJz8+WyM6nRP5DAx+Sud7QWzARMdz63LQD8NBvZaOhyW2K00IPsBW5veFmMywwgVj4mzh9BvSguoldnRNsthCxxBEnF6nphpC3QBrzGX1VBo2eQZTlom4osRWHxV/7+7k2Pa1Cdxwl3iviotZdvRmcvGHJmflgZZdiPD7yrvvIZEuBny7sBnHD8FvrSmtpC8ekKznktSMUKC4I9naoDkbG3I9Dkr89K3D3x8tdOgoDu7Hl/wpYyqrzutTP8TY8lX8lAYWW2GRPSu28AU21AY9PUyTR6/dOIvJHj+IvZASxsDjGeigSpldkaNsvySFClj2g+xomQAdLimfjIWgwCuT3FyQ1xQf4YdDKX82lL4nuZGYE2eq4/eZl1E8g+G+8Dz5xHz+biqjNUkdA/dvMf0RjZu4jx22C5tJeQvUtnUO/otRZSMqceSrSAZ7gD1z9ugjaN1MseBcGVbUVYQyaZMPXFWiImtOnLdC7yW5+lG+fRyl5NdLxRAMbN6sLnEW8j1bIkekEJwoJYx00i9HTEda304+9ase2/QZb4xUeMO8d1y26wuWLYTmofYfN5tpqn6IiD51wHujhU5jEsMuzYMStEcnCx95q2Fs+nHzCcvSe3KdV6xS6fO1LUvd0jILvINloTA8IZhqAf733TKBwJMWxFIJZU7VA97nhs5EE7iVeioO8rPxheqbtIrckYltD45/kimtF2CVAZQiK/yxZCHEX7ibjwTtK60SH/qJlSamNc2RexV54UpVtfB+o68NbyEk1nnRNGjGpa7vcTDYx7s19d3ebdycbQv4ow14FFEVMm4u2ZYR/uDETIzgiFNeU5UeusaARTf9xnZEpwBLBbqcING6GOfAErJTT/1x+laGZCt7OiCuir0UOqOT8RahYFa3XMcHAgYtwjCLoIOi3PZhuaUhyVIB3UgdrxYKoOTzGHcNoeQO+aJXfn/q3tVsa7YAbLJaa+pErJVYxENkU5rkkKb/tEQda2GjH/rtxrYIKm97JFj+l7VluZZ9aN4Od6GduzKRZSDz9SO28dsmZs8ZSz5UogPeCsU0z08mYGEuQPzWTkE6wCdWddiK/c8/i5JjKv+pWQo4lSN6WakKbWJ+lAKNWwlM41kfkQO1kVNOYOHyMPs6tmCW+PZRtImCKmaOq0ZfLt6rJq/8TDYQkd8NXAsTVzSHmGVntVgbIkFQ+fN0mTOk/U311vE+UkX/C5EydxqLeg5YNkXs19yCfa9DDYKnslwvsE80Tgzdz6OAiIns3YENmiW7ys7GwDBzBOvkaGe15zVfq1XmdGykTR/xtHN/IwX/NwgiSK8wzl1m4LY0lKKeUp0QGFgGlykOLmN4NNMRGxyKthTrxbnSfps0MK1AV5X9a6Cojkse5Lsz6mF8z0hXdn28HdRHGDLLDuh+FSLF/pYufBr/5VnDYAqrKdziijjm9EAeLb7Wqshj5zr4MpPgiyLAEyVn8aX6L3uaZhks7/vnTU3NJHpcR+qOfDZgxD6skNwZA64bmCR65PVN58Ici7LT4koIXA2+bN052g9DLxUHIDtOmgDrH88PXzm/DrrtDkJGYGbotva64Uz8+jSE/GIpNLo3L79mm6TnvfYB0SP1xH8CcOnYxJk0CXMJBRJjx5Eh0bAdQQTrjNVAucQ5lvTf0O2KTWlyPewJ0ykoePzToBcoWQkixQo9CFcvLen4N9XNH4/w1/Jt9kniBSV8RGKcE6FPOmy7N8nA+vQrnRXzKThxW+D7khnWEV06HWUznIvDt+L6f2/pP0pNtd516lzjdUkqdWb1nloDT99uoqO16Gr0aUb1glp9BS4f3Zu7SNZm4ooJX9G0TICPlFVDt46bEA9fyLioUn3xra2eKeC3kpcXgHpm1IXKxs1D/D2ef1VVoU33HjP5OBy8492Xshd1uaU4ZioFcc1/YtLjJjeKPhyMz0ryF8fg4p26SAFEuo4FVpuoWCgJzuOHuo9zaqM7STeaoI7FxcWixB2knwX7DGwZlqkLFbnRjhf6fcM7knY3iLW41nUb4RXtCGioLPaWeiOGAxSAgBqOHlFU+4IaVPBxcsTPmzv9j44qlzKNY1tXDV1CXiDXbyb30M7epogJC/HHjzY79pWQIJeuYcmmx6gyEh7Cu63WSvNS3+t+P4sOO6njvoGroBt00cWfBsOx9xaQVeYuz9/uOdjatJ3DJte651oo1lOthSHAsxjY+dEQstspdDMk/wA/PlBMnXkg9+VyaPLZriDU4X+ibT03VMchia5IK0zGDM+ZiXIOFmnBkpLjKu4yq51nftsgY6KjWu8AcMRRQow6AcFQwm6zfjds/+0bFDZj7f89yRPLD0xJLmmxsnBExl0wDKf7pVZJ8v9hRhQgP4H+j36kIuNf4njKmx4IwlZSzQ3FyUW3U1WYolOOxJWFQgOstGG3gGWTqXEjtWfFPlad0vAnmc2KnI4879Nc/rHEIWrmegM64MWkVgaTPcaIbFVCMAf9tHaz34Pw/QHPbBmU0LMo45MXaNvae6n2al83yxwfSTD3q6djUcRooYc7s2BZF9sABakn+dsHGj8ZMiHgeIgXTPNFCumtgIKLmriIBJyaAeQbxsGkaBksD2gvMRwyHDBKr/SMXQ2Cp0MIbisY938KPJQkPATkNeOKz1V4sNk719otdpV7MYqE0WlnsRU1uhS+e4uNpjjxx40ekNxxFCgXRSJL2ru1+gYQkgMFJ/P4GhYciqro1a8TY4dfc2OZWrDsHDLZRi5CcGpFu4pUBEwz62DmP4FiqLAErWQa/QRiIA1AobXz8M2EXqoOEZvV2XY8CZ25aU07b6SuXHKtjUXf7gUe0/vrRc7zA+/7VwL7FR9ZSMTGTv8ky+eWP8wrKe53nsE3SxvDEZpjsWwiOC9Br+fkFMQ9Efp56GUiX14YlCPQyxOHaW7Tlgo1+fIqz+Cf2wtbbWHgeHojRjZwHebgTueuADHBL5HpSONne3IwzEwaO+7BQcMCXM8Ih3vwB2e5aHq6eGd1u/Z3NGDQw3oXZ2mmi984GmkeXQdLZZFXXoCoaStiEZLykEDKlY7TpE4ljA74hguV8n71+bbzvFpLkHLGGx0wvAAKIYnVXzxR4eFibE41qIKBOESnf0gf9JLfjWC6WbI7ZVWwNPE38S94jZDg/fT+OCPNXRXrLsX9VlmT2fh3NLXXjJc8fam15VTyTVHgei6/aaWRZ+ksrAAl9uRgQ98H/r7RQMtXLHw9TtiaW/a3PCTmqEe+OGa1vWV8t77PhOAo9O6Nhj3ly48ZbXK5XHI5BRQuo5M8gyAn4Z5UfE3G/12AR9qmYS0F+Ug+xtaBd7Vem9muQ8unWey9Evgffq5okUudpu2ZxWuI0JTj1h+7y6y1guWoUVR5zgH4nrtaUcr8ApSZ685SNxl9DNvmA0RO3/wQtnIjE92BrHxYh4mQxDDR9pSwYFtfyOvP2JLkOqVV3t4d/8KqSuAAzlQnpGf8hAgt7+fljO20arVC37LUQU9IVYvHAB1opgyArFbRZTGuhs4TxdH0uBOOwyZFgXncrEMSQU0WrjXaTPndHViqGcgGELhiXT1C+8TI1d+WUp4gbV8Ad9yNMOmgcGuYa6iLKN31uvrfLmofl3FPVU/BxPCLmHax/jhZQvPWbQy4cXGC5oWw6PgWAM+gnlyo0XBjyIhgQ+SXoUXJtUofwgw06Hhx1jGbbCspqG4UCbRGPVKZ9H570M3IzdaYep7Zk5o7PT9722i6Ww30lF7mQL6nLGarowF2ZNIiaMZi3FxD2IFdITQXFF6jVhEWsJZbZnRNCYydCXfzZjgUvqpJtEWnYQh0Mzk6xXc7/zGUUr7GaPmwa3pCT1r+HOwVe7uGwzUqFvdZBLdTT/Vi1TM5jEfFLJEjRn2RG/yxzo3udIgpQXhMcxyQd07mcy4zp9ijLQuQ+kIgUdGkJoDB/SVkhZTnavtZo24iNRbf5iIaCS+nxHXDq+7yDPGug8+yuLlhRi4acpZYY8LsrUrQtHrfaMqpFG28xmhin/UCmt3+PhzjVyV+qE2vmUaIsadpCCcPDzoJ0KatEvJ7xezs2ZY0Ajm0B/8f0YthqgAAzvGHi25pR3N3ZSn7UXzEsAIADa4SxnEUkTKwtSEZ/FkD6XKcgtMJUlAHw5We6K7JdTLWfYA9Yom0HVSKwhSUgeOuZQy75EJLifMQJH459tooPcwxz6JstXRZr5HVHN82GIu1o8BOFzT1X9bMhEa77IuU5HXXOPma3TXNEh5moR0ssDuj8/oH6RveyAn0znBxuIO6iWdRFlfSMI+iQzgqsW8uMWaYeHDxtCCLmXcY/0zpv2Db8qwzo+pw8IJr4GMCHkWLr1MMtleARzdju41ujy781cmVbxtRLxZmY7oyxkWoMGcELxMuwvCuH1baAechpePyede0+KNp4qfXyOJx8Kf1RIRCs67Zi9vusM/pOj8UdijoWwwzesKy3ZwhY/TkoqVrzz9TX9IFfhTv47GCnHd+giLEo3go9wojnjfLaQVg5j7IZ28l2hfucDaIY1V9LWmvzgZnv//z39JjUSnEs8YeAd3hXWjuR07LJ21VOmpZu/AOtYI9wVcoNbqslxbQeGfYzuu5BTElrV9DtK7un8nKniSJJUJmnjr38F0FHWJekwZ95gRcnCtnGDnu0GSG3Lx/7Dc17t5n6s5z/cc/lu7888gXbQx5y8ACtobMT5xe/Yqw/5FJ/6SnmVG8xXxxJ527CV2mkP7kz9LxafaaBOnh4fb2Bh2YvjSdxPOfrf/qutnl5KZOEPZxvKs/9bAKZEMyDwOM+Rk5V/hWhh2aD6K+SlJ3zs5/GnwGB25yZgD5PCa64MPa1anKb8W1zHWJ5WLRTYbhfiw7aR/lIvVHxpp/gxTnJe6RmfRvOwGys0kHmielRZHnRM8mqFWog2JpNNbJcLH+HcxtNHMbjJoyb1oOg9m1mVSt4gX4mh0R6IylL/EGqCTcVN0SRiiQgV3RP5Oo1ISssu9m2WWjyqeJXlzl4okJHPnzes/JvYe6Y1f2sGfxkPMHlmPvAyseaf+nstH+2VvL2Za0vTPaNYCVWxPeSr7hJNyBqTMbyE4xPm8zPWPFenRBRRaplq8xYKKCCo7DS5SZfvepyC9KrKxRate4EcFgKZjDJR4c+bJErmD/dktBhlnyAgs+g1Sk9DECCYCeWXAcndIDE2O6cwGzfoVZJKsm/yuUb6Pd0uvEIbrYKzM6+zFynCS/6czlf/VVXNiwGIyDtFY+njglTde7e13fz60KEQHviVXAiT4wARi95lQ6cP+cGUPU6lxCeQSF7pOQhsMao+fLJ+rVYo5FM6At5kL+bPIAG+xv42r7kVI3umtYUNVFtCEnI819vI65W1Rnbo4Om6977TvfOsbkUwNABeRJ9y8kOg4W23meklTpYrtqjYix38qlHGQIAIwD/EkVCEaGMkoAO8UDPT/zTWTHTsSHUwIoBVvJOrxQYnE5zKPeXu/hwoLLgV185Tg+G75crxAh0KfZdk/KcVVxNSNajuBoOFfOiQU7n3lsIvymO4N8K56e6xXIUYj0szUyY0HGFCEhDRYgjsiNYjUik28oovPgD33BzUr9+BseEg2ozfMFKg6t63yhApyJNKPCRes2sjrDXyfC1lmQHjTsJKc5dtXJNHpUT7Ong4hX1BvcUDD2sIBYZ4IIi9RQz5Fr/XlnUkC5loypVzb4DR3P49blIokbWLwEdFFytyKebL3vmkPOCt2YOb5aKcA4HKTLB3sQuHOs6DU0545xEeEDyiW9wO4dm2tBqb5QGfPWZX+ZECsPutzcJ9SChkMhU75ERrHyk9A2yQROrvKaE0HX+Qw3U5zEfyDe7SGgWNH26k/F6N2xwsgbaIrV1AjOwpZkeOHH4iT8U4owCLhO1Epfl1RqtvhcWKnS+1B8SLt9Dk7laSTE/xYEzFYKJiylNClCUz2BMiU7tKk3HN4pAyY97z57hf9KvpxjAJ9TK7ZZqW9znLuE9x4d62m1KcPl1gW5C2Xccb3IObjmsHzihQXKLncc5elr2QnkJd43ft4ZpmQLFcED4ez1Tw4xDapA6hljqJzXxZgMlJOnp3WCC/sQ9sjVI1IUPLlXolYVyOsl5HsWs2licLo9yZ3Cj/ub9G4QH9QAtVuKPgDAZewMPIkcYmgUhooXRAuchiY6aXs1UAgDs5oBt1MBliRQyYSgrMfRtt6uSwawULjuBiyIMtcvcXvbVJC5DnRNY6tRq05HiibbJSs6jYxTCmFQyReo2d1MNsDJUt6Ui8+W9IIa0D/Krhv+LOI2K966eDu7bbUoqOuqs4vx1Jn6s5XaAGFMzYR1uORSfmFlSVZB0FKMrG47/xbm0z9ZfiSzOv1q9BEYMdEDgyPzfFtrcw1nv0H/2E/SsgP11Ml40SEEanhLIAbSDHSxOdrfzMMggt0/AFuqBt+owvYDK8034LSUKWc/7/cjCwP3wTOYEGV4T5PnpLa1/YTTjaQT8y7HpbO7aIaeahv4X4xHGSJT4NHJWV73eyP+PzjErddRW5axV5JB4Xc/5vVnZt7AWkZg6cQsUGm4YjuCumgfbWATHpKGeOvlay3dR/HTo45aJpDQisZWbYwau+3W5St2lGWCm+kEu0vlyieLooT2KakGBeajtWnnrejBvEow0qlQ4XkRFT4CxNetnMzKjILO8pjLYvYZzyYqFyMyjn8MnwMecYV+GlKVXvA3tEeKR6fICchFxW0kgNzzUWsCkDNPeKZbRak28lRKIQRVUZQRhlo8r78wcUHFk2Mfzn4AIPkL6i9LfAOzXrD/a6HPkpHTHC2v4ZJEmrYcj5TWqevKcEj+L9gdorakmz8PSRn9Nhp0A3EHmlWnXtWGL1GCaxmCECQISIBX/loNoqcIt/yOrzXkX1O0leBWvp7AI3l54uRAvA3jI/fRrQ6Nl8dzg5YUlQPkne4Wndu00Rkmnr2bPh76XrKHtH2+qrEgMh/creUY4OdIY822wTAbPsjcIuz2GlIuG2jwdU1/fW+VzYGRlPoqAsrOPtrZOrC256GzgBzJh/XLz8ik8UVi4eUOMHWshK2v24jH5WtvJ61C+j2dG2XwPJWMCWHwuo6XnXJSNlUIZ82fBpguWERUpxoTsjNsaiW92P5QRs4TMyl2Soyu905RhcA4cC2WyfMiMCUOJfTJFwpTp6OL9/5weXxhWWxZDARV0B6Bq3DNilKittWLOxJ0Ri8vtQRBsmiE5kzwfmoHNIeA2UJdzzN11o5XPjBp5aPJHFZ+u7bAddjbnHu/4woc5+hqhc7Eg2PtOq4Ht4sRhQ5xprc6gerVSFJBegr4SJnUEw8mB1jbyCpxjmwn8+31E/45zGLxE1uyGx1jpy0DOOPoYljjIUX6xRfP05iyBxcG+a+KihalsYW+3HiD0PMSwdXaan5w1Bf8/TJCH9C6IzFmM+oNDxcCSD38FOz/7fopGLLqJuPw9dNhSTomzZBSr5i9p01HNdd63lBvaaqEF3fzbdcT5Kbl6n3K/9/d9rdOGez1NZsQqrwTrbX6ZCtDR74TcFQdzIFX5jL6ahIAYKs49dogeaGkea7WqFIrPXuqrPpZYaLWDjVubLdGvlGep0TYdSNVaEn/VwTOZMKm61tizAq0Lt4OYNkgw0tBHBx1NuYc2blyOFpG/Xlfaflk/3k2qQPUArf8NFkLSTjSHc1BefQ46TKcVYdbtJvPciQqZkYeBvUbtFvfhZ+WIxNyIwG7N2xQ7HQ1MUOhmMkEK7C8tu6uj6XDBRq9zNVNhoEcYFfXBiVV3t7+ROKjsToD6lJkHz1gZIZKWZpbgK0zXtBJUPETYR/33rDjST6v3+OsZlkq3C9kEyrLGwgg42Lqms+drCCmge2V64bnYC6S+P8XWjTmVO/lYj0Bhty8cLs2slt1amWyTOcx8idBsDVpducI4PcYMs8dkC4B2YGNjnhpHdFjcEz3xLT2zgq1XLUgKKYkRiLsyuNi51cX5MqOSBmaxN/Zm/qnk64DlTfozCqiVhDbbO3F+7faVBr9dfainMpMvvzA6nZVp8j07WuZQZQXd6mlByDiezdF0zY0iBWbbPBiCo3J+w+RfPvG3hrRUolzWXEeT2h6F+CttAQ/DHQwTHv3nM2IWfDN6e59YJ0zhlc9eBFIsMVB6NQTw1cdheQJgXWr3OyZhprlfVePiph0ado5a3Q2YM/b9kW6dluZgn/Z57pVFw8NT2SKoVp4dk91YOt0oHstqDI6sDYZxcWHzf42A+kDPtp96LZpp5nTQYANorA1PzPzKlBWBkOsigG2mABOn3GHegYYc0Cx9tpnUHLzwOE/CVsLZjbWUPqBvs4FN2lfoSwO9dyRve4aTVOcIu+UWVKPtumvea1BN8LnW7h/wJ89yYqaNDwn8Nc3G5vZEPW7azHWjCktpmtFKspqlJN9IoWKwKA1hyM2X6Brx71294OrW5O3ueVMEWpGXmMa1iuICc7reOoOxJIQDoBsmbVbmPfl5pJm3uoytfeA6d7YEppom7gqQevdicIaPRCq7tQraeJ8E0DUI6LoWY03TvRCO88CBi/5nOPzAPqU/V/HZWWwtoyQgqQCS4BpIIB2rhny4do9XQT0aE9pLk1G0nfX+HoXyFI3ovGC1r4Iuocao9I+jG6q8jQQRXHVatU6wqAlb7COtn8bBkfSJAKvs95JBCynIqaMkb9N8++jvCKVfCRAKiUcKrVujXUaEwIq30xGOY5//bM6B7wRutf7oHdqQOzzx0BLIZrT0fOhpUJ+rL1Hu/mquUgFIIfIj3KhnzyN6WkDZZM1ml70BfEDIQXpQE6tYGrpBOQ5v8kLfXi1HIyE8PeJsieUMmjgqoOBmgFerOsBuPqSVhGuNMhYdPwBMvrsBAnlxY6bs/5SrsjxsOluC/2SLOC2xtTNzhtzc4aBfS8qeNnlwdCrNAgOgjt830VCFfG82Q8GCMZ15ZJv8fWYSA/hZzZZ4PFx2/QIxYmm6qoKDff0/tkPCGefWMTUDMEo84z08JGo+ejIQCe1NjhQsokMG2pBegi34zAtULPNSI3EKK8JIXIMwaWLFomulJj5cK6tpSoidTf5ZWL/XpLuRSdNDdX7jL2UA8VpVkEaRp2WkbiU0jlRYrwxtdwE2Lg/EfQ0KKnJreAil9FcNbgrXjxF763g4N1ijJtGHT9Ji0ueSEpHzVTGp5YkqTilOMToSTT1tAiUBFH0pDcr9ZuPq1tb2/3TTJqzR45QTEKnBwy0zs9i8hbM0XjxVvnoluLamt4eq8HhDBJb2WnSksyCK92PZsQza4XZW/C5ZL6CM+8zJC1PMclZbqnY1c/r3rcnO6HinFtold8KF+G0lHWaZQE0Y3SN6xZsGQN8XzgsyHHpsZ2NkUt2mp1le9aCsnE+rj1YZbxaAXru8g9ES1IT67zUucEs3Ft3BOGzgon1F1Y/a1PW5tUQlMUkOFkyJWpQQm0LmJ5qYw/d073kNtvMxToUz4VsD4E8fZ2bRiHwEVae125yCrXY+fsZOygE5myI6pQARjgisAPtJapR0KdAIWrUxN2n81AwUxWLWeBhu/CEKI6CN+I6QXPPhbvrOKN1ZsJMJKCun+os75cQvAPiBwkwm8VO/3XBwtVrKrbvXwXS2KhRrDJaHa1CiH67wAr5RCukABEcmliybbpcityQwZ5qSFF1ffz5Ix3pb8jbpnICPrm6ezl0ggdEfkj8HrBbqB/5KIccGDh6oaIjd3pYTq3XuL/o5wa1DInWsb3LrnL4OBYHkge/EmFJAVdyzIOw56XfTeLpZaQ5fXVSRShPanusiLsgJeUbPfChz+M9Z2k18X5UDYEew0ny6Lv91URukBqEsCqVNgOfLRl7caG7gbpzq8PTOU+ahwnUc/YKCMGY28cIiWyS758qKPm4BUZtMA2n/X15oyiukFuMOMiD6oAgw325lfsQ+fKjyOqtBcBQ3DY36YQyNx9gASic1s3yRXGW7s1cfvRYvaRfe04Nt3tr6+OkBaz3j4Y7AR9/Zxi5EovA1wzJhVCCjm8S28YauhkHllwhLVyCKsbuh7x/7i2bgzT/jQYw5NiMEaf169E6vQDGPLsokALLgf0tAfXJBXJ+L8zGryLNwBx8tBPOgpQdh4BK+4mJm9VbwVUwJo6mOnqAYfqizcKPv+tbsPP6jTurrpQI0hZHP+H08Zj5fN/PJhQPmh1gKLVc00hkCFeDvV8vJBW433aOpdQYOUqtOBGBRy4niqJcKsIXpG+F9rIP2RIZcFzUpYzUM5JOrvPo2Gl42wlX0bpdk68jLldcrVJD8V+E6kB8g6R8t+qCO93QYRbPTz3FXZTz1HQMBWqojKh8G9EraBgOWX0k7o7YC8CNK41wT/z9NAZgw1xnEE7QNf3D2gzez1fTT06Pc8h+B+G8oiTnLyz8woCdsHqKPKDyLawcSR2UAEyeTjn50f372N6as8yyicj3HLS+9sgCuner73BKz/C7bRDtlPhdsqEp0/fAW1u5YFXTM9NVv6Bm/ilE3/izylLWj/8CNb0y1cn2dvb2dCgaooGDXp1ENp7ODHzU1UtAmSgOIBdUBKvUvVl++dXLZU9i7PM2ZVUxliUd90Q3UYuy3m82E1RH7NI29W2Qm+a060qxGu9B4KqFOxmWHbd1sNPIvZigRP41kupt5z9E6fbJuBTLOEU1iAcpW0D4oh+wdSLJyTRUePO9AwvAKwGkEjxGW7rCizJ5sH2lE+ueL6oSvd8Er54XYho8WXyCltOe4wE23rCkPB4glidRObTFksHI4YoG8CjMYkWiQGCRsTxWAUf9+nHUc26IwL7D3ersYu7kjFxyzlYkHgJHtrZ8gQGbNCiI3qDYy3k1lfXr5XqAU6Eobq57iqpgTiySMmIT/c/QZ1loXMOKwmyjJU99YebtDVdq3wUfJ4n4yz4bhBjMGhZrFy51+oIHdypd7qqFI0vomErBv6g4vSbhNEOQKjM9e+8CtH+wWOJBylFPwvpSZek8WCc9mdYQJQBFD7PMveo9vZRg3DHkGLklSDCQ6hvmMef0tRZzRjO/PAj9DjlRV7XNkSfFtRvpikjdzFiwvQ8wR4mPAisUS8ONH8XCLZP+6o5WGTRzhhkv3XwOXc+hmDBEXeCPNzTIqPCIP97a6++LLtr5OUfcALWINqO2SBkW9fe0lYBNFzJg6Ed6PDMoculfDJINukJfdFzpseDOncmWH5wUkIxa234VkP6/5dZs23A8OyVsJC6sooLrCs+oTaarJYchjDJaOKbKTRRUOWqWQwIjJaUVaEzcntQIa2Zvp5/R8FE0euv9jj4xnuMXEWdE5Diw3o8u8nuPy7WpuL/DeH+/+wCTPjPk17KQ1cMOLrOCKm7Jby4jqAn/RFIbaOlrAGYw90gC5RA0vAf3v3TnrTnR+OPwt+vG2VjdQXke0nXc/txTijgVmDlQex3XAU0BEqBaM/vaiMDOZFhx18wWswL5+WC17FW33n8oPPu5V8t9MX2v5TWbzzsnAlngfo75CFL4L42D6xlANvCih95anXNmaLVGQepc3LVWtITTNQPzW4rq4HGCyylyZWlFqe3aV0JNsTCvraIvIaHDkC7F0XtO6zkaBcPUANXygoI7eW38GIv455+Wy95YsbTvPXEGwk52g8zb9WIYXFBEqXCu/qUupoDxA043GyjLxZd42zZ8OCCIY/+OaL2PTr4eq1COoJK4C6TJE3DQYAvFGstJhlPL3C9ilzBi8myhD/njEGQEbe9HDuEfg4XoTcklzvxS8YjWYBGolN78KnIf4RM0DJR/kqBGrOOqpPF6+zxyUHhxTMkTW6QUWa3pzcJXK4H0ORzcI4AVzfXCgo+xV6Zn/7krKgvPkzwGbHukhqibrSVFGsGTfOCptw0D+2hEu+L+j6blP0OPoaGKFnnMW7p5LK6N7/vgGHX/8NLcGcyFVjrE4Yv9KG4IqKZjj0cLyeMh7C60ci+mtC/spFEZE0JZNAi/323/Efcx5Cp5TjYZjQNW4XX/Ab1WL0ydbPzf//YbBK46R1AewGTAa6oQeuTF8yfxIGJp1pg7if7cQtkGsbrZSu9tJ6Xjsiy1kwSVFBdvX2gqT7LrUJNrdhO3SXgaDWp9X9REPYGykS7YI4jjM3TzXTBve4yZOCbxo2NofBPV2e+uYTpQlkRwtsuKprPV/aF7efKurPWl2zBnaCWaA/a69Aiq6nMme59jO2ceAduhuJcYb6uLSP1ACAzO39a+Ou2TU2qGPOM8B7JZP/Mrp0Vr+6USVZsa6eWaxHkW2tN83wHHDTUg8YcME19ek1QO1jFZ1VKuIdmTbnetSZFgB8HQHQ8SMbajH7Al/nubDWV7Oyu9Tbc0Hrhjjkj2K0+A52yAqecBBzXULOk7+ylON8+XzI222N7ZoMeq9NNMKtatlsng4kRF6mU0+n2EudXQ7qytNOQPnu3qCucLCY9XABUgHemZ5aDw0Brj7bkcU3lnwcmnVtiBQTGORUzjhQYfW/hlH8xtitGDafAEuCqNoAAAw/nS1de4e6UCNt411WKyohvO9kCetZ5vefgkwBG58yZLcPRSAjecvQn+AVyh5Lyb+JRwPg6FMCFXgksj9B7RVX5+RmUbS6GC54A5p1FYEMUYVQSj1fNjWGAMOS/THGllkTcZolViwyha1KUUjy/VqdixUws4vt774NOaabMWsq9c9RkflHDejaP2UCxUf/D5Pt9oY63QZDHpaTKJRfG5HMExKtl7k2IA9VQZMul5G0iL2UY9tjowtMOjC6p8unT+SxPTozpFIvkAmab10ksbo7rIdy2CJbrDPiF1uoT7nsot/LPrSZzizqhEyMREfK2i0vMg/tdhNZUlWzOc0ve71e1nxKo7MUjk7KmCbRfGbSsTcIIEXUS6nZchfTotnePsglUeuskM5kP6atFuBMO+Hm7ABySMUFgsujRWjhiOXNKf5Yx17nYbgDIlDb38/39gq0CdbaVEq9n98RvjnjDvVGQJ03rod8MiMoJWNtHqxGCwsRzHK6ODWLsUPtKLxWS7gCRZYkLIdeFNAtDP+6sBsKDGl6V3PpssELUxyaJXmJbGdiM5CWz3x0Key86bmlLzN8ZbmEQq44qt48OxACu73miyRhLJavszADRDhTpDeeZKC8Ldt/H7qSA18LlND++4XolpGzKC1rSJLYnrxa0Ab74T4qHid1vzlNC+C+nGb/R5GtmAHSYH+3L42y0+ar2jVorMK2+zi8PeJLKF0VgpeHK1xPxHb77zqysK+BRl4MOFyErolISMgr70IAAAAAA8iiwflACZY5nu350UH3UAmJhUCQfILoGlwSw0NZy6//x3uTzKXs7ipOytr8toPv4sO8dRrgK0H4/V4u4Ay/7EKa9kCilGH5l9n7k4rZHcHJmWBJHvAyRHrtxN8uhWDo7ogznOGeeyFKsMw+8b913l9wgTCmSMWsQlSYJIBjR0GvBNGZhEiIk8Th6YE9okCzwFeBPZb2NJhSQwYcJIPYl5zhX8NQmrupbyLjEeW2c9StPhXle7UyRG8L3DHoPeJCsMKa7tHABaZiZlbddYiT/zEZyVgjzGuON2FH9MqYTRc8Inmj6Z3mNUmiUUwO/YVMT6/oNBaT5o/KSKoTvISoRGAGx7kXugzT9k1mhXcUKXaO43XPXr0I+vjpr9xK4wUW5F7Ieyzu4ClotiVNkLkYi9V4R0Q3EQYOUDOpIPJjCsYt9PIZQjSTt7MEria0OHn5atUlw4hhBcRnRXGuWEgPN+8NewTalQ6DVYTbm5A1+/XtuLOdtDf5ucC9FGb0JxaN3gGH9iVTqM+qMLOmjoYZGbzQsrEpZ4idJKCwwopWAgC5FIEgG9Va4jBpVIW4IUUku2sgavyAAaDpfdWheYvM8fAePxfjAolMWD2xCIOYQ71TTcLSZYGDspHE5GNmlf4QNonWHq8bPDRArT2LSJECEGC2pSYA0DQF8bopSAAC/10mAAAAAA" alt="WiniD Hub logo">`;

function render(){
  const app=document.getElementById('app');
  if(!S.session){app.innerHTML=loginView();return}
  const admin=S.session.role==='admin';
  const tabs=admin?ADM_TABS:STU_TABS;
  if(!ui.tab||!tabs.some(t=>t[0]===ui.tab))ui.tab=tabs[0][0];
  const me=admin?null:student(S.session.studentId);
  if(!admin&&!me){S.session=null;save();return render()}
  const pending=S.enrollments.filter(e=>e.status==='pending').length;
  app.innerHTML=`
  <header class="top">
    <div class="brand">${MARK}<span class="bn"><span>${esc(S.settings.studio)}</span><small>Where moments become art</small></span></div>
    <div class="who"><span class="role ${admin?'admin':''}">${admin?'Admin':'Student'}</span><span>${admin?'Studio office':esc(me.name)}</span>${admin?`<button class="btn sm bell" data-act="tab" data-tab="enquiries" aria-label="Enquiries, ${enqNew().length} new">Enquiries${enqNew().length?`<span class="dot">${enqNew().length}</span>`:''}</button>`:''}<button class="btn sm" data-act="changePw">Change password</button><button class="btn sm" data-act="logout">Sign out</button></div>
  </header>
  <div class="shell">
    <nav class="side" aria-label="Sections">${tabs.map(([k,l])=>`<button data-act="tab" data-tab="${k}" ${ui.tab===k?'aria-current="page"':''}>${l}${admin&&k==='dash'&&pending?`<span class="count">${pending}</span>`:''}${admin&&k==='enquiries'&&enqNew().length?`<span class="count">${enqNew().length}</span>`:''}${admin&&k==='whatsapp'&&waPending().length?`<span class="count">${waPending().length}</span>`:''}</button>`).join('')}</nav>
    <main id="main">${admin?adminView():studentView(me)}</main>
  </div>`;
  if(admin&&!ui.remRan){ui.remRan=1;if(autoReminders())render()}
  if(admin&&M.hidden){const un=(S.enquiries||[]).filter(q=>!q.seen);if(un.length){un.forEach(q=>q.seen=true);save();enquiryPopup(un)}}
}
function enquiryPopup(list){
  openModal(`<div style="display:flex;flex-direction:column;gap:14px" role="alert">
    <div class="spread"><h2>New enquir${list.length>1?'ies':'y'}</h2><span class="pill warn">${list.length} new</span></div>
    <p class="small muted">${list.length>1?'These people are':'This person is'} interested but not ready to pay yet. Call back to help them choose a class.</p>
    <div class="list">${list.map(q=>`<div class="li"><div class="main"><b>${esc(q.name)}</b><span class="small muted num">${esc(q.phone)} · ${fmt(q.date)}</span><span class="small">${q.styleId?chip(q.styleId):''} ${q.batchId&&batch(q.batchId)?esc(daysText(batch(q.batchId))+', '+t12(batch(q.batchId).start)+' · '+(loc(batch(q.batchId).locationId)?.name||'')):''}</span>${q.message?`<span class="small">“${esc(q.message)}”</span>`:''}</div></div>`).join('')}</div>
    ${waPending().length?`<p class="small">A WhatsApp reply from ${esc(WA().sender)} is ready for ${waPending().length===1?'1 person':waPending().length+' people'}.</p>`:''}
    <div class="actions"><button class="btn" data-act="enqSeen">Later</button>${waPending().length?'<button class="btn wa" data-act="waOpen">Send WhatsApp replies</button>':''}<button class="btn primary" data-act="enqOpen">Open enquiries</button></div></div>`);
}

function loginView(){
  const msg=ui.loginMsg?`<p class="auth-ok" role="status">${esc(ui.loginMsg)}</p>`:'';
  const panel=ui.loginMode==='setup'?`
    <form class="panel" data-form="setupPw" autocomplete="on">
      <div><h2>Set up your password</h2><p class="muted small">For students the studio has already registered. Enter the phone number or email you gave the studio, then choose a password.</p></div>
      <label class="f" for="su-id">${Backend.on?'Mobile number you gave the studio':'Phone number or email'}<input id="su-id" name="ident" type="${Backend.on?'tel':'text'}" required autocomplete="username" placeholder="${Backend.on?'98401 22314':'98401 22314 or name@email.com'}"></label>
      ${pwField('su-pw','pw','New password','new-password',PW_HINT)}
      ${pwField('su-pw2','pw2','Confirm password','new-password')}
      ${showPw('su-show')}
      <button class="btn primary" type="submit">Save password and sign in</button>
      <p class="small muted">Already have a password? <button type="button" class="link" data-act="loginMode" data-mode="login">Sign in</button></p>
    </form>`:`
    <form class="panel" data-form="loginStudent" autocomplete="on">
      <div><h2>Student or parent sign in</h2><p class="muted small">See your timetable, attendance and fees, and join new classes.</p></div>
      ${msg}
      <label class="f" for="li-id">${Backend.on?'Mobile number':'Phone number or email'}<input id="li-id" name="ident" type="${Backend.on?'tel':'text'}" required autocomplete="username" placeholder="${Backend.on?'98401 22314':'98401 22314 or name@email.com'}"></label>
      ${pwField('li-pw','pw','Password','current-password')}
      ${showPw('li-show')}
      <button class="btn primary" type="submit">Sign in</button>
      <div class="small muted" style="display:flex;flex-direction:column;gap:4px">
        <span>New student? <button type="button" class="link" data-act="register">Create a profile</button></span>
        <span>Just want to know more? <button type="button" class="link" data-act="enquire">Send an enquiry</button></span>
        <span>Registered by the studio but no password yet? <button type="button" class="link" data-act="loginMode" data-mode="setup">Set up your password</button></span>
      </div>
    </form>`;
  return `<div class="login">
    <div class="brandblock">
      ${MARK}
      ${S.settings.tagline?`<span class="eyebrow">${esc(S.settings.tagline)}</span>`:''}
      <h1>${esc(S.settings.studio)}</h1>
      ${S.settings.welcome?`<p class="lede">${esc(S.settings.welcome)}</p>`:''}
      <div class="chips">${S.styles.map(s=>chip(s.id)).join('')}</div>
    </div>
    ${panel}
    ${Backend.on?'':`<section class="panel demo"><div class="spread"><div><span class="eyebrow">Try the demo</span><h2>Sign in with one tap</h2></div><span class="small muted">Student password <code>${DEMO_PW}</code> · Admin password <code>${ADMIN_PW}</code></span></div>
      <div class="demogrid">${DEMO.map(([id,desc])=>{const st=S.students.find(x=>x.id===id);return st?`<button class="demob" data-act="demoLogin" data-id="${id}"><b>${esc(st.name)}</b><span class="small">${esc(desc)}</span><span class="small muted num">${esc(st.phone)}</span></button>`:''}).join('')}
        <button class="demob adm" data-act="demoLogin" data-id="admin"><b>Studio admin</b><span class="small">Dashboard, enquiries, WhatsApp, fees</span><span class="small muted">Manaswini’s view</span></button></div></section>`}
    <footer class="login-foot">
      ${Backend.on?`<p class="small muted">© ${new Date().getFullYear()} ${esc(S.settings.studio)} · Where moments become art</p>`:`<p class="small muted">Working prototype with demo data, saved in this browser only. <button class="link small" data-act="reset">Reset demo data</button></p>`}
      <button class="btn sm" data-act="adminLogin">Admin login</button>
    </footer>
  </div>`;
}

function enquiryForm(){
  openModal(`<form data-form="enquiry"><div style="display:flex;flex-direction:column;gap:16px">
    <h2>Send an enquiry</h2><p class="small muted">No payment needed. The studio will call you to answer your questions and suggest a class.</p>
    <div class="fgrid">
      <label class="f" for="eq-n">Your name<input id="eq-n" name="name" type="text" required autocomplete="name"></label>
      <label class="f" for="eq-p">Phone number<input id="eq-p" name="phone" type="tel" required autocomplete="tel" placeholder="98401 22314"></label>
      <label class="f" for="eq-s">Dance style<select id="eq-s" name="styleId">${S.styles.map(x=>opt(x.id,x.name,false)).join('')}</select></label>
      <label class="f" for="eq-b">Preferred timing<select id="eq-b" name="batchId">${enqTimings(S.styles[0].id)}</select></label>
      <label class="f full" for="eq-m">Your question<textarea id="eq-m" name="message" rows="3" placeholder="e.g. Is there a trial class? Which batch suits a 9-year-old?"></textarea></label>
    </div>${actions('Send enquiry')}</div></form>`);
}
const enqTimings=sid=>(S.batches.some(b=>b.styleId===sid)?opt('','Not sure yet',true):opt('','Days and timings arranged on request',true))+S.batches.filter(b=>b.styleId===sid).map(b=>opt(b.id,`${daysText(b)}, ${t12(b.start)}–${t12(b.end)} · ${loc(b.locationId)?.name||''}`,false)).join('');

function adminLoginForm(){
  if(Backend.on){openModal(`<form data-form="adminAuth" autocomplete="on"><div style="display:flex;flex-direction:column;gap:16px"><h2>Admin login</h2>
    <label class="f" for="ad-em">Email<input id="ad-em" name="email" type="email" required autocomplete="username"></label>
    ${pwField('ad-pw','pw','Password','current-password')}${showPw('ad-show')}${actions('Sign in')}</div></form>`);return}
  const first=!S.settings.adminPw;
  openModal(`<form data-form="adminAuth" autocomplete="on"><div style="display:flex;flex-direction:column;gap:16px">
    <h2>${first?'Create the admin password':'Admin login'}</h2>
    ${first?'<p class="small muted">No admin password has been set yet. The password you create here will be needed for every admin sign-in.</p>':''}
    <input type="text" name="user" value="admin" autocomplete="username" hidden>
    ${pwField('ad-pw','pw',first?'New admin password':'Password',first?'new-password':'current-password',first?PW_HINT:'')}
    ${first?pwField('ad-pw2','pw2','Confirm password','new-password'):''}
    ${showPw('ad-show')}
    ${actions(first?'Create password and sign in':'Sign in')}</div></form>`);
}

function changePwForm(){
  const admin=S.session.role==='admin';const rec=Backend.on?true:admin?S.settings.adminPw:student(S.session.studentId).pw;
  openModal(`<form data-form="changePw"><div style="display:flex;flex-direction:column;gap:16px"><h2>Change password</h2>
    ${rec?pwField('cp-old','old','Current password','current-password'):''}
    ${pwField('cp-pw','pw','New password','new-password',PW_HINT)}
    ${pwField('cp-pw2','pw2','Confirm new password','new-password')}
    ${showPw('cp-show')}
    ${actions('Save password')}</div></form>`);
}

/* ---------- student module ---------- */
function studentView(me){
  const v={styles:stuStyles,home:stuHome,classes:stuClasses,attendance:stuAttendance,fees:stuFees,learn:stuLearn,profile:stuProfile}[ui.tab];
  return v(me);
}
function head(title,lede,actions=''){return `<div class="pagehead"><div><h1>${title}</h1>${lede?`<p class="lede">${lede}</p>`:''}</div>${actions?`<div class="row">${actions}</div>`:''}</div>`}

function stuHome(me){
  const ens=enrollsOf(me.id);
  const act=ens.filter(e=>e.status==='active'), pend=ens.filter(e=>e.status==='pending');
  const open=paymentsOf(me.id).filter(p=>p.status==='due');
  const dueAmt=open.reduce((a,p)=>a+p.amount,0);
  const mStart=curMonth+'-01';
  const first=me.name.trim().split(/\s+/)[0]||'';const nm=first.charAt(0).toUpperCase()+first.slice(1);
  const sub=act.length?`You are enrolled in ${act.length} class${act.length===1?'':'es'}. Keep the rhythm going!`:pend.length?'Your join request is with the studio. Your dance journey is about to begin!':'Find your rhythm. Pick a style that moves you and begin your dance journey with WiniD Hub.';
  return `${head(`Namaste, ${esc(nm)}`,sub)}
  ${whyHub(me)}
  ${dueAmt?`<div class="banner warn"><span><b>${inr(dueAmt)}</b> to pay · ${[...new Set(open.map(payWhat))].map(esc).join(', ')}</span><button class="btn sm primary" data-act="payAll">Pay now</button></div>`:''}
  ${(()=>{const my=new Set(ens.filter(e=>e.status!=='declined').map(e=>e.batchId));
    const cs=(S.cancels||[]).filter(c=>my.has(c.batchId)&&(c.date>=addDays(todayISO,-1)||(c.makeup&&c.makeup.date>=todayISO))).sort((a,b)=>a.date.localeCompare(b.date));
    return cs.map(c=>{const b=batch(c.batchId),m=c.makeup;return `<div class="banner warn"><span><b>${esc(style(b.styleId).name)} class on ${fromISO(c.date).toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'long'})} is cancelled</b> (${esc(c.reason)}${c.note?': '+esc(c.note):''}). ${m?`Make-up class: <b>${fromISO(m.date).toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'long'})}, ${t12(m.start)}–${t12(m.end)}</b> at ${esc(loc(m.locationId)?.name||'')}${m.venue?' · '+esc(m.venue):''}.`:'The make-up class date will be shared soon.'}</span></div>`}).join('')})()}
  ${pend.length?`<div class="banner info"><span>Join request sent for ${pend.map(e=>{const b=batch(e.batchId);return `${esc(style(b.styleId).name)} (${daysText(b)}, ${t12(b.start)})`}).join('; ')}. The studio will confirm your seat.</span></div>`:''}
  ${act.length?`<div class="cards">${act.map(e=>{const b=batch(e.batchId),p=plan(e.planId),n=nextClass(b);const st=attStats(attRecords(e,mStart,todayISO));
    return `<article class="ccard">
      <div class="spread">${chip(b.styleId)}<span class="pill neutral">${esc(b.level)}</span></div>
      <h3>${esc(b.title)}</h3>
      <dl class="meta"><dt>Next class</dt><dd><b>${n?fmtShort(n):'—'}</b>, ${n?t12(slotOf(b,n).start):t12(b.start)}${n&&makeupOn(b.id,n)?' <span class="pill ok">Make-up</span>':''}</dd>
        <dt>Timings</dt><dd>${daysText(b)} · ${t12(b.start)}–${t12(b.end)}</dd>
        <dt>Where</dt><dd>${bWhere(b)}</dd>
        <dt>Teacher</dt><dd>${esc(b.instructor)}</dd>
        <dt>Plan</dt><dd>${planText(p)}</dd></dl>
      <div class="foot"><span class="small">This month: <b class="num">${st.p}</b> of <b class="num">${p.classes}</b> classes attended</span><button class="link" data-act="tab" data-tab="attendance">Attendance</button></div>
    </article>`}).join('')}</div>`:''}
  <section class="panel"><div class="panel-head"><h2>${act.length?'Explore more styles':'Pick your style'}</h2><button class="btn" data-act="tab" data-tab="styles">See all dance styles</button></div>
    <p class="small muted">Tap a style to see what it is and why you’ll love it.</p>
    ${heartsBlock(me,false)}</section>`;
}

function classCard(b,me){
  const s=style(b.styleId),l=loc(b.locationId),left=seatsLeft(b);
  let action='';
  if(me){
    const e=enrollsOf(me.id).find(e=>e.batchId===b.id);
    action=e?(e.status==='active'?'<span class="pill ok">Enrolled</span>':'<span class="pill warn">Request sent</span>')
      :left>0?`<button class="btn primary sm" data-act="join" data-id="${b.id}">Request to join</button>`:'<span class="pill bad">Batch full</span>';
  }else action=`<button class="btn sm" data-act="editBatch" data-id="${b.id}">Edit</button>`;
  const ps=plansFor(b.styleId);
  return `<article class="ccard">
    <div class="spread">${chip(b.styleId)}${locBadge(b.locationId)}</div>
    <div><h3>${esc(b.title)}</h3><p class="small muted">${esc(b.level)} · ${esc(b.ages)}</p></div>
    <dl class="meta"><dt>Days</dt><dd>${daysText(b)}</dd><dt>Time</dt><dd class="num">${t12(b.start)} – ${t12(b.end)}</dd>
      <dt>Where</dt><dd>${l?esc(l.name)+'<br><span class="small muted">'+esc(l.area)+'</span>':'—'}</dd><dt>Teacher</dt><dd>${esc(b.instructor)}</dd>
      <dt>Fees</dt><dd>${ps.map(p=>`<div class="small">${p.type==='package'?`${esc(p.name)}: ${p.classes} sessions, <b>${inr(p.fee)}</b>`:`${p.classes} classes/month: <b>${inr(p.fee)}</b>`}</div>`).join('')||'—'}</dd></dl>
    <div class="foot"><span class="seats"><b>${Math.max(left,0)}</b> of ${b.capacity} seats left</span>${action}</div>
  </article>`;
}
function classFilters(){
  return `<div class="filters">
    <label class="f" for="f-style">Dance style<select id="f-style" data-filter="clsStyle"><option value="all">All styles</option>${S.styles.map(s=>`<option value="${s.id}" ${ui.clsStyle===s.id?'selected':''}>${esc(s.name)}</option>`).join('')}</select></label>
    <label class="f" for="f-loc">Location<select id="f-loc" data-filter="clsLoc"><option value="all">All locations</option>${S.locations.map(l=>`<option value="${l.id}" ${ui.clsLoc===l.id?'selected':''}>${esc(l.name)}</option>`).join('')}</select></label>
  </div>`;
}
const filteredBatches=()=>S.batches.filter(b=>(ui.clsStyle==='all'||b.styleId===ui.clsStyle)&&(ui.clsLoc==='all'||b.locationId===ui.clsLoc)).sort((a,b)=>a.start.localeCompare(b.start));
function stuClasses(me){
  const list=S.styles.filter(st=>!isRequest(st)).map(st=>({s:st,bs:S.batches.filter(b=>b.styleId===st.id&&(ui.clsLoc==='all'||b.locationId===ui.clsLoc)).sort((a,b)=>a.start.localeCompare(b.start))})).filter(x=>x.bs.length);
  const reqs=S.styles.filter(isRequest);
  return `${head('Join a class','Pick a class and choose the timing that suits you. The studio confirms your seat, and you can pay straight away.')}
  <div class="filters"><label class="f" for="f-loc">Location<select id="f-loc" data-filter="clsLoc"><option value="all">All locations</option>${S.locations.map(l=>`<option value="${l.id}" ${ui.clsLoc===l.id?'selected':''}>${esc(l.name)}</option>`).join('')}</select></label></div>
  <div class="cards">${list.map(({s,bs})=>{
    const mine=enrollsOf(me.id).filter(e=>batch(e.batchId)?.styleId===s.id);
    return `<article class="ccard">
      <div class="spread">${chip(s.id)}<span class="small muted">${bs.length} timing${bs.length===1?'':'s'}</span></div>
      <div><h3>${esc(s.name)}</h3><p class="small muted">${esc(s.blurb)}</p></div>
      <div class="list">${bs.map(b=>{const p=plansForBatch(s.id,b.id)[0];return `<div class="li" style="padding:8px 0"><div class="main"><b class="small">${daysText(b)} · <span class="num">${t12(b.start)}–${t12(b.end)}</span></b><span class="small muted">${bWhere(b)} · ${esc(b.ages)}</span></div>${p?`<span class="small"><b class="num">${inr(p.fee)}</b>/month · ${p.classes} classes</span>`:''}</div>`}).join('')}</div>
      <button class="learnbar" style="--h:${s.h}" data-act="learnOpen" data-id="${s.id}"><span><b>What you’ll learn</b></span><span aria-hidden="true">›</span></button>
      <div class="foot"><span>${mine.map(e=>e.status==='active'?'<span class="pill ok">Enrolled</span>':'<span class="pill warn">Request sent</span>').join(' ')}</span><button class="btn primary sm" data-act="joinStyle" data-id="${s.id}">${mine.length?'Add another timing':'Request to join'}</button></div>
    </article>`}).join('')||'<p class="empty">No regular classes at this location yet.</p>'}</div>
  ${reqs.length?`<div class="pagehead"><div><h2>On request</h2><p class="lede">Days, timings and fees for these are arranged with you. Send an enquiry and the studio will get back to you.</p></div></div>
  <div class="cards">${reqs.map(st=>`<article class="ccard"><div class="spread">${chip(st.id)}<span class="pill neutral">On request</span></div><div><h3>${esc(st.name)}</h3><p class="small muted">${esc(st.blurb)}</p></div>
    <button class="learnbar" style="--h:${st.h}" data-act="learnOpen" data-id="${st.id}"><span><b>What you’ll learn</b></span><span aria-hidden="true">›</span></button>
    <div class="foot"><span>${(S.enquiries||[]).some(q=>q.studentId===me.id&&q.styleId===st.id&&(q.status==='new'||q.status==='contacted'))?'<span class="pill warn">Enquiry sent</span>':''}</span><button class="btn sm" data-act="reqEnquiry" data-id="${st.id}">Request an enquiry</button></div></article>`).join('')}</div>`:''}`;
}
function reqEnquiryForm(styleId){
  const st=style(styleId);
  openModal(`<form data-form="reqEnquiry" data-style="${styleId}"><div style="display:flex;flex-direction:column;gap:16px">
    <div class="row">${chip(styleId)}<h2>Enquire about ${esc(st.name)}</h2></div>
    <p class="small muted">${esc(st.blurb)} The studio will contact you to arrange days, timings and fees.</p>
    <div class="fgrid">
      <label class="f" for="rq-loc">Preferred place<select id="rq-loc" name="locationId">${S.locations.map(l=>opt(l.id,l.name,student(S.session.studentId)?.communityId===l.id)).join('')}${opt('home','At my home',false)}</select></label>
      <label class="f" for="rq-when">Preferred days and time<input id="rq-when" name="when" type="text" placeholder="e.g. Weekday evenings after 6 pm"></label>
      <label class="f full" for="rq-msg">Anything else?<textarea id="rq-msg" name="message" rows="3" placeholder="e.g. For my 9-year-old daughter, beginner level"></textarea></label>
    </div>${actions('Send enquiry')}</div></form>`);
}

function joinForm(styleId){
  const s=style(styleId),sid=S.session.studentId;
  const bs=S.batches.filter(b=>b.styleId===styleId).sort((a,b)=>a.start.localeCompare(b.start));
  const mine=new Map(enrollsOf(sid).map(e=>[e.batchId,e.status]));
  const firstOk=bs.find(b=>!mine.has(b.id)&&seatsLeft(b)>0&&(ui.clsLoc==='all'||b.locationId===ui.clsLoc))||bs.find(b=>!mine.has(b.id)&&seatsLeft(b)>0);
  const p0=firstOk?plansForBatch(styleId,firstOk.id)[0]:null;
  openModal(`<form data-form="join" data-style="${styleId}"><div style="display:flex;flex-direction:column;gap:16px">
    <div class="row">${chip(styleId)}<h2>Join ${esc(s.name)}</h2></div>
    <fieldset class="opts" style="border:0;padding:0;margin:0"><legend class="eyebrow" style="margin-bottom:8px">1. Choose a timing</legend>
    ${bs.map(b=>{const st=mine.get(b.id),left=seatsLeft(b),dis=!!st||left<=0;
      return `<label class="opt" ${dis?'style="opacity:.6;cursor:default"':''}><input type="radio" name="batchId" value="${b.id}" ${b===firstOk?'checked':''} ${dis?'disabled':''}>
        <span class="main"><b>${daysText(b)} · <span class="num">${t12(b.start)}–${t12(b.end)}</span></b><span class="small muted">${esc(b.title)} · ${esc(b.level)} · ${esc(b.ages)}</span><span class="small muted">${bWhere(b)} · ${esc(b.instructor)}</span></span>
        <span class="side-note">${st==='active'?'<span class="pill ok">Enrolled</span>':st?'<span class="pill warn">Requested</span>':left<=0?'<span class="pill bad">Full</span>':`<b class="num">${left}</b> seats left`}</span></label>`}).join('')}
    </fieldset>
    ${firstOk?`<div class="fgrid"><label class="f" for="jn-plan">2. Fee plan<select id="jn-plan" name="planId">${planOptions(styleId,firstOk.id)}</select></label>
      <label class="f" for="jn-since">3. Start date<input id="jn-since" name="since" type="date" required min="${todayISO}" value="${todayISO}"></label></div>
      <div><div class="eyebrow" style="margin-bottom:8px">To pay when you join</div><div id="jn-sum">${sumBlock(joinCharges(sid,styleId,p0&&p0.id))}</div>
      <p class="small muted" style="margin-top:8px">Monthly fees after this are due by the ${ord(S.settings.dueDay)} of each month. Pay by Google Pay, any UPI app, bank transfer, cash, or split between online and cash.</p></div>
      <div class="actions"><button type="button" class="btn" data-act="close">Cancel</button><button class="btn" type="submit" name="go" value="enquire">Just enquiring</button><button class="btn" type="submit" name="go" value="later">Send request, pay later</button><button class="btn primary" type="submit" name="go" value="pay">Send request and pay now</button></div>`
    :`<p class="empty">No open timings for you in this style right now. Ask the studio about the waiting list.</p><div class="actions"><button type="button" class="btn" data-act="close">Close</button></div>`}
  </div></form>`,true);
}

function stuAttendance(me){
  const ens=enrollsOf(me.id).filter(e=>e.status==='active');
  const months=[...new Set(ens.flatMap(e=>monthsBetween(monthOf(e.since),curMonth)))].sort().reverse();
  if(!months.includes(ui.attMonth))ui.attMonth=months[0]||curMonth;
  const from=ui.attMonth+'-01',to=ui.attMonth+'-31';
  return `${head('My attendance','Classes attended and missed, with dates.')}
  <div class="filters"><label class="f" for="att-m">Month<select id="att-m" data-filter="attMonth">${months.map(m=>`<option value="${m}" ${m===ui.attMonth?'selected':''}>${monthLabel(m)}</option>`).join('')}</select></label>
    <div class="row small"><span class="dchip P">Attended</span><span class="dchip A">Missed</span><span class="dchip U">Not marked yet</span><span class="dchip X">Cancelled</span><span class="dchip U Mk">Make-up</span></div></div>
  ${ens.map(e=>{const b=batch(e.batchId),p=plan(e.planId),recs=attRecords(e,from,to),st=attStats(recs);
    return `<section class="panel">
      <div class="panel-head"><div class="row">${chip(b.styleId)}<h3>${esc(b.title)}</h3></div><span class="small muted">${daysText(b)} · ${t12(b.start)}</span></div>
      <div class="kpis">
        <div><div class="eyebrow">Attended</div><div class="num" style="font-size:1.4rem">${st.p}<span class="muted small"> / ${p.classes} in plan</span></div></div>
        <div><div class="eyebrow">Missed</div><div class="num" style="font-size:1.4rem">${st.a}</div></div>
        <div><div class="eyebrow">Attendance</div><div class="num" style="font-size:1.4rem">${st.pct==null?'—':st.pct+'%'}</div><div class="bar"><i style="width:${st.pct||0}%"></i></div></div>
      </div>
      <div class="dates">${[...recs.map(r=>({d:r.d,h:`<span class="dchip ${r.s||'U'} ${makeupOn(b.id,r.d)?'Mk':''}" title="${(r.s==='P'?'Attended':r.s==='A'?'Missed':'Not marked')+(makeupOn(b.id,r.d)?' · make-up class':'')}">${fmtShort(r.d)}</span>`})),...cancelsOf(b.id).filter(c=>c.date.slice(0,7)===ui.attMonth&&c.date>=e.since).map(c=>({d:c.date,h:`<span class="dchip X" title="Cancelled: ${esc(c.reason)}">${fmtShort(c.date)}</span>`}))].sort((x,y)=>x.d.localeCompare(y.d)).map(x=>x.h).join('')||'<span class="empty">No classes in this month.</span>'}</div>
    </section>`}).join('')||'<p class="empty">Attendance appears here once you join a class.</p>'}`;
}

function stuFees(me){
  const pays=paymentsOf(me.id).slice().sort((a,b)=>(b.paidOn||b.month||'').localeCompare(a.paidOn||a.month||''));
  const open=pays.filter(p=>p.status==='due');
  const toPay=open.reduce((a,p)=>a+p.amount,0);
  const cashDue=(S.txns||[]).filter(t=>t.studentId===me.id).flatMap(t=>t.parts).filter(x=>x.method==='cash'&&x.status!=='paid').reduce((a,x)=>a+x.amount,0);
  const ens=enrollsOf(me.id);
  const monthly=ens.filter(e=>e.status==='active').map(e=>plan(e.planId)).filter(p=>p&&p.type==='monthly').reduce((a,p)=>a+p.fee,0);
  const kits=[...new Set(ens.map(e=>batch(e.batchId)?.styleId).filter(Boolean))].map(id=>style(id)).filter(x=>x.kit&&x.kit.fee>0);
  const hist=pays.filter(p=>p.status!=='due');
  const checking=(S.txns||[]).filter(t=>t.studentId===me.id).flatMap(t=>t.parts).filter(x=>x.status==='verify').reduce((a,x)=>a+x.amount,0);
  return `${head('Fees',`Monthly fees are due by the ${ord(S.settings.dueDay)} of every month. Pay online by Google Pay, any UPI app or bank transfer, or in cash at the studio.`)}
  <div class="kpis">
    <div class="kpi"><span class="l">To pay now</span><span class="v num">${inr(toPay)}</span></div>
    ${cashDue?`<div class="kpi"><span class="l">Cash to hand in at the desk</span><span class="v num">${inr(cashDue)}</span></div>`:''}
    ${checking?`<div class="kpi"><span class="l">Being checked by the studio</span><span class="v num">${inr(checking)}</span></div>`:''}
    <div class="kpi"><span class="l">Monthly fee total</span><span class="v num">${inr(monthly)}</span></div>
  </div>
  <section class="panel"><div class="panel-head"><h2>Payment due</h2>${open.length?`<button class="btn primary" id="pay-now" data-act="payNow">Pay ${inr(toPay)}</button>`:''}</div>
    ${open.length?`<div class="list">${open.map(p=>`<label class="li" for="due-${p.id}"><span class="row"><input id="due-${p.id}" type="checkbox" value="${p.id}" checked data-due><span class="main"><b>${esc(payWhat(p))}</b><span class="small muted">${payWhen(p)}</span></span></span><span class="row"><span class="num">${inr(p.amount)}</span>${payPill(p)}</span></label>`).join('')}</div>
      <p class="small muted">Untick anything you want to pay later.</p>`:'<p class="empty">Nothing to pay right now.</p>'}
  </section>
  <div class="grid2">
    <section class="panel"><h2>Ways to pay</h2>
      <div class="list">${Object.values(METHODS).map(m=>`<div class="li"><div class="main"><b>${m.label}</b><span class="small muted">${m.sub}</span></div></div>`).join('')}</div>
      <p class="small muted">The registration fee can be paid the same way, on its own or together with the monthly fee.</p></section>
    <section class="panel"><h2>Studio bank account</h2><p class="small muted">Google Pay, UPI apps and bank transfers all go to this account.</p>${bankKV()}</section>
    ${kits.length?`<section class="panel"><h2>Dance kit</h2>
      ${kits.length?`<div class="list">${kits.map(st=>{const p=pays.find(x=>x.type==='kit'&&x.styleId===st.id&&x.status!=='refund');return `<div class="li"><div class="main"><div>${chip(st.id)}</div><span class="small">${esc(st.kit.name)}</span></div><div class="row"><span class="num">${inr(st.kit.fee)}</span>${p?payPill(p):'<span class="pill ok">Received</span>'}</div></div>`}).join('')}</div>`:'<p class="empty">Your kit appears here once you join a class.</p>'}
      <p class="small muted">The kit is paid once per dance style, using any of the payment options.</p></section>`:''}
  </div>
  <section class="panel"><h2>My plans</h2><div class="scroll"><table><thead><tr><th>Class</th><th>Timing</th><th>Plan</th><th class="r">Classes</th><th class="r">Fee</th></tr></thead><tbody>
    ${ens.map(e=>{const b=batch(e.batchId),p=plan(e.planId);return `<tr><td>${chip(b.styleId)} ${esc(b.title)}${e.status==='pending'?' <span class="pill warn">Requested</span>':''}</td><td class="small">${daysText(b)} · ${t12(b.start)}</td><td>${esc(p.name)}</td><td class="r num">${p.classes}${p.type==='package'?' sessions':'/month'}</td><td class="r num">${inr(p.fee)}${p.type==='package'?'':'/mo'}</td></tr>`}).join('')||'<tr><td colspan="5" class="empty">No plans yet.</td></tr>'}
  </tbody></table></div></section>
  <section class="panel"><h2>Payment history</h2><div class="scroll"><table><thead><tr><th>For</th><th>Period</th><th class="r">Amount</th><th>Status</th><th>Paid on</th><th>Receipt</th></tr></thead><tbody>
    ${hist.map(p=>`<tr><td>${esc(payWhat(p))}</td><td>${payWhen(p)}</td><td class="r num">${inr(p.amount)}</td><td>${payPill(p)}</td><td class="num">${p.paidOn?fmt(p.paidOn):'—'}</td><td class="num small">${p.txnId?esc(p.txnId):'—'}${txnRefs(p)?`<div class="muted">${esc(txnRefs(p))}</div>`:''}</td></tr>`).join('')||'<tr><td colspan="6" class="empty">No payments yet.</td></tr>'}
  </tbody></table></div></section>`;
}

function curriculumBlock(s,curLevel){
  return `<div class="levels">${s.curriculum.map(l=>`<div class="level ${l.level===curLevel?'cur':''}"><div class="spread"><b>${esc(l.level)}</b>${l.level===curLevel?'<span class="pill info">Your level</span>':''}</div><ul>${l.items.map(i=>`<li>${esc(i)}</li>`).join('')}</ul></div>`).join('')}</div>`;
}
function stuLearn(me){
  const ens=enrollsOf(me.id).filter(e=>e.status!=='declined');
  const mineIds=new Set(ens.map(e=>batch(e.batchId)?.styleId).filter(Boolean));
  const order=[...S.styles.filter(x=>mineIds.has(x.id)),...S.styles.filter(x=>!mineIds.has(x.id))];
  return `${head('What I’ll learn','Select a style to see exactly what you will learn, what happens in each class and what to bring.')}
  <div class="ltiles">${order.map(st=>{const mine=mineIds.has(st.id);return `<button class="ltile ${mine?'mine':''}" style="--h:${st.h}" data-act="learnOpen" data-id="${st.id}" aria-label="${esc(st.name)}: see what you will learn">
    <span class="nm">${esc(st.name)}</span><span class="tg">${esc(st.blurb)}</span>
    <span class="ft">${mine?'<span class="pill info">Your class</span>':isRequest(st)?'<span class="pill neutral">On request</span>':'<span></span>'}<span class="go">See more ›</span></span></button>`}).join('')}</div>`;
}
const ICONS={dz:`<g class="lift"><rect class="m" x="22" y="37" width="36" height="6" rx="3"/><rect class="m" x="11" y="26" width="9" height="28" rx="2.5"/><rect class="m" x="60" y="26" width="9" height="28" rx="2.5"/><rect class="d" x="19" y="31" width="5" height="18" rx="2"/><rect class="d" x="56" y="31" width="5" height="18" rx="2"/></g><g class="twinkle"><path class="s thin" d="M60 17l4-5M65 21l6-1M18 17l-4-5"/></g>`,zu:`<g class="sway"><circle class="m" cx="38" cy="17" r="6"/><path class="s" d="M38 24V45M38 29L50 17M38 29L26 37M38 45L30 63M38 45L48 59"/></g><g class="note"><circle class="m" cx="59" cy="46" r="3.4"/><path class="s thin" d="M62 46V33l5 2"/></g><g class="note n2"><circle class="m" cx="19" cy="55" r="2.8"/><path class="s thin" d="M21.5 55V45l4 2"/></g>`,wh:`<g class="bob"><path class="s" d="M24 31V23H56V31"/><rect class="m" x="12" y="30" width="56" height="32" rx="6"/><circle class="l pulse" cx="27" cy="47" r="9"/><circle class="l pulse p2" cx="53" cy="47" r="9"/><circle class="d" cx="27" cy="47" r="3.5"/><circle class="d" cx="53" cy="47" r="3.5"/><rect class="l" x="34" y="34" width="12" height="6" rx="1.5"/></g><g class="note"><path class="s thin" d="M63 20q3-4 6 0M66 14q4-5 8 0"/></g>`,bn:`<g class="sway slow"><path class="l2" d="M34 41H46L51 57H29Z"/><path class="s thin dk" d="M37 43L35 56M40 43V56M43 43L45 56"/><circle class="m" cx="40" cy="15" r="5.5"/><circle class="d" cx="45" cy="11.5" r="2.6"/><path class="s" d="M40 21V40M40 26H26L22 17M40 26H58M40 40L28 50L30 63M40 40L52 50L50 63"/><path class="s thin" d="M26 64H33M47 64H54"/><circle class="m" cx="60.5" cy="26" r="2.4"/></g><g class="twinkle"><circle class="d" cx="30" cy="67" r="1.8"/><circle class="d" cx="50" cy="67" r="1.8"/></g>`,yo:`<circle class="l aura" cx="40" cy="38" r="27"/><g class="breathe"><circle class="m" cx="40" cy="20" r="5.5"/><path class="s" d="M40 27V44M40 31L30 40L24 47M40 31L50 40L56 47"/><path class="m" d="M19 50Q40 40 61 50Q40 60 19 50Z"/></g>`,fu:`<g class="spin"><path class="s2" d="M13 40C13 20 40 11 55 21"/><path class="s2" d="M67 40C67 60 40 69 25 59"/></g><g class="sway"><circle class="m" cx="40" cy="24" r="5"/><path class="s" d="M40 30V46M40 34L51 27M40 34L29 30M40 46L34 60M40 46L47 58"/></g>`,wd:`<g class="bob"><circle class="s" cx="32" cy="47" r="13"/><circle class="s2" cx="48" cy="47" r="13"/><path class="d" d="M27 31L32 25L37 31L32 36Z"/></g><g class="twinkle"><path class="m" d="M61 14l2 5 5 2-5 2-2 5-2-5-5-2 5-2z"/></g><g class="twinkle t2"><path class="m" d="M17 18l1.5 3.5 3.5 1.5-3.5 1.5-1.5 3.5-1.5-3.5-3.5-1.5 3.5-1.5z"/></g>`,sc:`<g class="swing"><path class="s thin" d="M12 22Q40 36 68 22"/><path class="s thin" d="M20 26V31"/><circle class="m" cx="20" cy="36" r="5.5"/><path class="s thin dk" d="M17.5 38h5"/><path class="s thin" d="M30 29V34"/><circle class="m" cx="30" cy="39" r="5.5"/><path class="s thin dk" d="M27.5 41h5"/><path class="s thin" d="M40 30V35"/><circle class="m" cx="40" cy="40" r="5.5"/><path class="s thin dk" d="M37.5 42h5"/><path class="s thin" d="M50 29V34"/><circle class="m" cx="50" cy="39" r="5.5"/><path class="s thin dk" d="M47.5 41h5"/><path class="s thin" d="M60 26V31"/><circle class="m" cx="60" cy="36" r="5.5"/><path class="s thin dk" d="M57.5 38h5"/></g><g class="twinkle"><path class="s thin" d="M34 56l-2 5M46 56l2 5M40 57v6"/></g>`,pc:`<g class="spin slow"><path class="l" d="M40.0,10.0 L47.6,29.5 L68.5,30.7 L52.4,44.0 L57.6,64.3 L40.0,53.0 L22.4,64.3 L27.6,44.0 L11.5,30.7 L32.4,29.5Z"/></g><g class="bob"><circle class="m" cx="40" cy="25" r="5.5"/><path class="s" d="M40 32V48M40 36L30 26M40 36L50 26M40 48L34 62M40 48L46 62"/></g>`};
const styleIcon=id=>`<svg class="ic" viewBox="0 0 80 80" aria-hidden="true"><circle class="bgc" cx="40" cy="40" r="38"/>${ICONS[id]||`<circle class="m" cx="40" cy="40" r="14"/>`}</svg>`;
const HEART='<svg viewBox="0 0 64 58" aria-hidden="true"><path d="M32 56S2 38 2 18C2 8.6 9.4 2 18 2c6.2 0 11 3.4 14 8.4C35 5.4 39.8 2 46 2c8.6 0 16 6.6 16 16 0 20-30 38-30 38z"/></svg>';
function styleFacts(st){
  if(isRequest(st))return '<span class="pill neutral">On request · days and fees arranged with you</span>';
  return S.batches.filter(b=>b.styleId===st.id).map(b=>{const p=plansForBatch(st.id,b.id)[0];return `<div class="small"><b>${daysText(b)}, ${t12(b.start)}–${t12(b.end)}</b> · ${bWhere(b)}${p?` · <b class="num">${inr(p.fee)}</b>/month`:''}</div>`}).join('');
}
function openSheet(id){
  const st=style(id);const SH=document.getElementById('sheet'),BK=document.getElementById('drawer-back');
  const ul=a=>`<ul class="pts">${a.map(x=>`<li><span>${esc(x)}</span></li>`).join('')}</ul>`;
  const req=isRequest(st);
  SH.style.setProperty('--h',st.h);
  SH.innerHTML=`<div class="grab" aria-hidden="true"></div><div class="sh">${styleIcon(id)}<div style="flex:1;min-width:0"><span class="eyebrow">Dance style</span><h2 id="sheet-title">${esc(st.name)}</h2></div><button class="btn sm" data-act="sheetClose" aria-label="Close">Close</button></div>
    <div class="sb">
      <div><h3>What it is</h3><p>${esc(st.blurb)}</p></div>
      ${WHY[id]?`<div><h3>Why you’ll love it</h3>${ul(WHY[id])}</div>`:''}
      <div><h3>${req?'Timings':'Timings and fees'}</h3><div style="display:flex;flex-direction:column;gap:4px;margin-top:6px">${styleFacts(st)}</div></div>
      <button class="link" style="align-self:flex-start" data-act="sheetLearn" data-id="${id}">See the full syllabus ›</button>
      <div class="acts"><button class="btn" data-act="sheetEnquire" data-id="${id}">Send an enquiry</button>${req?'':`<button class="btn primary" data-act="sheetJoin" data-id="${id}">Request to join</button>`}</div>
    </div>`;
  SH.hidden=false;BK.hidden=false;SH.querySelector('button').focus();
}
function closeSheet(){const SH=document.getElementById('sheet');if(SH.hidden)return;SH.hidden=true;SH.innerHTML='';if(document.getElementById('drawer').hidden)document.getElementById('drawer-back').hidden=true}
function heartsBlock(me,exclude){
  const ens=enrollsOf(me.id);const mine=new Set(ens.map(e=>batch(e.batchId)?.styleId));
  return `<div class="hearts">${S.styles.filter(st=>!exclude||!mine.has(st.id)).map(st=>`<button class="heart" style="--h:${st.h}" data-act="sheetOpen" data-id="${st.id}" aria-label="${esc(st.name)}">${styleIcon(st.id)}<span>${esc(st.name)}</span>${mine.has(st.id)?'<em class="mine">Your class</em>':''}</button>`).join('')}</div>`;
}
function whyHub(me){
  const seen=me&&me.whySeen;
  return `<details class="whybar ${seen?'':'unseen'}" data-why>
    <summary><span class="dot" aria-hidden="true"></span><span class="wt"><b>Why choose WiniD Hub?</b><span class="small">${seen?'Our promise to you':'Tap to read before you pick your style'}</span></span><span class="chev" aria-hidden="true"></span></summary>
    <div class="wb"><h2>Dance where you live. Shine wherever you go.</h2>
      <p class="lead">From Bharatanatyam to Zumba, our trainers bring the stage to your apartment clubhouse. Small batches, personal attention and a joyful community turn every class into a moment you will remember.</p>
      <div class="pts4"><div>Classes inside your community</div><div>Classical, western and fitness</div><div>Small batches, real attention</div><div>Easy online payments and attendance</div></div></div>
  </details>`;
}
function stuStyles(me){
  const ens=enrollsOf(me.id);
  return `${head('Dance styles','Everything we teach, with the syllabus for each level. Tap a style’s button to enquire or join.')}
  ${S.styles.map(st=>{const my=ens.filter(e=>batch(e.batchId)?.styleId===st.id);const lvl=my[0]&&batch(my[0].batchId)?.level;const req=isRequest(st);
    return `<section class="panel stylepanel" style="--h:${st.h}"><div class="panel-head"><div class="row">${chip(st.id)}${my.length?'<span class="pill info">Your class</span>':req?'<span class="pill neutral">On request</span>':''}</div>
      <div class="row"><button class="btn sm" data-act="learnOpen" data-id="${st.id}">Class plan and what to bring</button><button class="btn sm" data-act="sheetEnquire" data-id="${st.id}">Enquire</button>${req?'':`<button class="btn sm primary" data-act="sheetJoin" data-id="${st.id}">${my.length?'Add another timing':'Request to join'}</button>`}</div></div>
      <p>${esc(st.blurb)}</p>
      <div style="display:flex;flex-direction:column;gap:4px">${styleFacts(st)}</div>
      ${curriculumBlock(st,lvl)}</section>`}).join('')}`;
}

function openLearn(id){
  const st=style(id),L=LEARN[id]||{};const sid=S.session?.studentId;
  const myE=sid?enrollsOf(sid).filter(e=>batch(e.batchId)?.styleId===id):[];const curLevel=myE[0]&&batch(myE[0].batchId)?.level;
  const ul=a=>`<ul class="pts">${a.map(x=>`<li><span>${esc(x)}</span></li>`).join('')}</ul>`;
  const D=document.getElementById('drawer'),BK=document.getElementById('drawer-back');
  D.style.setProperty('--h',st.h);
  D.innerHTML=`<div class="dh" style="position:relative"><span class="eyebrow">What you will learn</span><h2 id="drawer-title">${esc(st.name)}</h2><p class="small">${esc(st.blurb)}</p>
      <button class="btn sm x" data-act="learnClose" aria-label="Close">Close</button></div>
    <div class="db">
      ${myE.length?`<div class="banner info"><span>Your class: ${myE.map(e=>{const b=batch(e.batchId);return `${daysText(b)}, ${t12(b.start)}–${t12(b.end)} · ${bWhere(b)}${e.status==='pending'?' (requested)':''}`}).join('; ')}</span></div>`:''}
      ${(st.curriculum||[]).map(l=>`<div class="lvl ${l.level===curLevel?'cur':''}"><h3>${esc(l.level)}${l.level===curLevel?' <span class="pill info">Your level</span>':''}</h3>${ul(l.items)}</div>`).join('')}
      ${L.cls?`<div><h3>In every class</h3>${ul(L.cls)}</div>`:''}
      ${L.good?`<div><h3>Good for</h3>${ul(L.good)}</div>`:''}
      ${L.bring?`<div><h3>What to bring</h3>${ul(L.bring)}</div>`:''}
      ${S.session?.role==='student'&&!myE.length?`<button class="btn primary" data-act="learnJoin" data-id="${id}">${isRequest(st)?'Request an enquiry':'See timings and join'}</button>`:''}
    </div>`;
  D.hidden=false;BK.hidden=false;D.querySelector('.x').focus();
}
function closeLearn(){const D=document.getElementById('drawer');D.hidden=true;D.innerHTML='';if(document.getElementById('sheet').hidden)document.getElementById('drawer-back').hidden=true}

function profileKV(s){
  const l=loc(s.communityId);
  return `<dl class="kv"><dt>Name</dt><dd>${esc(s.name)}</dd><dt>Date of birth</dt><dd>${fmt(s.dob)} <span class="muted">(${ageOf(s.dob)} yrs)</span></dd><dt>Gender</dt><dd>${esc(s.gender)||'—'}</dd>
    <dt>Phone</dt><dd class="num">${esc(s.phone)}</dd><dt>Email</dt><dd>${esc(s.email)}</dd><dt>Parent / guardian</dt><dd>${esc(s.guardian)||'—'}</dd>
    <dt>Community</dt><dd>${l?esc(l.name)+' <span class="muted">· '+esc(l.area)+'</span>':'<span class="muted">Not in a listed community</span>'}</dd><dt>Address</dt><dd>${esc(s.address)||'—'}</dd>
    <dt>Emergency contact</dt><dd>${esc(s.emergency)||'—'}</dd><dt>Health notes</dt><dd>${esc(s.notes)||'—'}</dd><dt>Joined</dt><dd>${fmt(s.joined)}</dd></dl>`;
}
function stuProfile(me){
  return `${head('My profile','',`<button class="btn" data-act="editStudent" data-id="${me.id}">Edit profile</button>`)}<section class="panel">${profileKV(me)}</section>`;
}

/* ---------- admin module ---------- */
function adminView(){return {whatsapp:admWhatsApp,enquiries:admEnquiries,dash:admDash,students:admStudents,schedule:admSchedule,attendance:admAttendance,fees:admFees,styles:admStyles,places:admPlaces}[ui.tab]()}

function activeBreakdown(){
  const act=S.enrollments.filter(e=>e.status==='active');
  const total=new Set(act.map(e=>e.studentId));
  const byLoc=S.locations.map(l=>{const es=act.filter(e=>batch(e.batchId)?.locationId===l.id);const ids=[...new Set(es.map(e=>e.studentId))];return{l,ids,es}});
  const inType=t=>new Set(byLoc.filter(x=>x.l.type===t).flatMap(x=>x.ids)).size;
  return{total,byLoc,studios:inType('studio'),comms:inType('community')};
}
function locGroup(list,title){
  return `<div><div class="spread" style="margin-bottom:4px"><h3>${title}</h3></div>${list.map(({l,ids,es})=>`<details class="loc"><summary><span>${esc(l.name)} <span class="small muted">· ${esc(l.area)}</span></span><span class="n">${ids.length}</span></summary>
    ${ids.length?`<ul>${ids.map(id=>{const st=student(id);return `<li><button class="link" data-act="openStudent" data-id="${id}">${esc(st.name)}</button><span class="chips">${es.filter(e=>e.studentId===id).map(e=>chip(batch(e.batchId).styleId)).join('')}</span></li>`}).join('')}</ul>`:'<p class="empty">No active students here yet.</p>'}</details>`).join('')}</div>`;
}
function admDash(){
  const bd=activeBreakdown();
  const dow=TODAY.getDay();
  const todays=S.batches.filter(b=>b.days.includes(dow)||makeupOn(b.id,todayISO)).sort((a,b)=>slotOf(a,todayISO).start.localeCompare(slotOf(b,todayISO).start));
  const needMk=(S.cancels||[]).filter(c=>!c.makeup).length;
  const from=addDays(todayISO,-30);let p=0,a=0;
  for(const[k,v]of Object.entries(S.att)){const d=k.split('|')[1];if(d>=from)for(const x of Object.values(v)){if(x==='P')p++;else if(x==='A')a++}}
  const curPays=S.payments.filter(isOpen);
  const dueAmt=curPays.filter(x=>x.status==='due').reduce((s,x)=>s+x.amount,0);
  const pend=S.enrollments.filter(e=>e.status==='pending');
  const enq=(S.enquiries||[]).filter(q=>q.status==='new'||q.status==='contacted').sort((x,y)=>y.date.localeCompare(x.date));
  return `${head('Dashboard',TODAY.toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'long',year:'numeric'}),`<button class="btn" data-act="addBatch">Add class</button><button class="btn" data-act="editSettings">Edit front page</button>`)}
  <details class="panel bd" ${ui.bdOpen?'open':''} data-bd>
    <summary><div style="display:flex;flex-direction:column;gap:2px"><span class="eyebrow">Active students</span><span class="v num">${bd.total.size}</span></div>
      <div class="bd-split">${S.locations.some(l=>l.type==='studio')?`<span class="pill neutral">Studios: <b class="num">${bd.studios}</b></span>`:''}<span class="pill info">Apartment communities: <b class="num">${bd.comms}</b></span></div>
      <span class="chev">${ui.bdOpen?'Hide':'Show'} by location</span></summary>
    <div class="bd-body">${S.locations.some(l=>l.type==='studio')?locGroup(bd.byLoc.filter(x=>x.l.type==='studio'),'Studios'):''}${locGroup(bd.byLoc.filter(x=>x.l.type==='community'),'Apartment communities')}
      <p class="small muted" style="grid-column:1/-1">Counted by where each student attends class. A student with classes in two places appears under both. Select a place to see who attends.</p></div>
  </details>
  <div class="kpis">
    <div class="kpi"><span class="l">Classes today</span><span class="v num">${todays.filter(b=>!cancelOn(b.id,todayISO)).length}</span>${needMk?`<span class="l" style="color:var(--bad)">${needMk} cancelled class${needMk===1?'':'es'} need a make-up</span>`:''}</div>
    <div class="kpi"><span class="l">Attendance, last 30 days</span><span class="v num">${p+a?Math.round(p*100/(p+a))+'%':'—'}</span></div>
    <div class="kpi"><span class="l">Fees not paid</span><span class="v num">${inr(dueAmt)}</span><span class="l">${curPays.filter(x=>x.status==='pending').length} payments waiting to be checked</span></div>
    <div class="kpi"><span class="l">Open enquiries</span><span class="v num">${enq.length}</span><span class="l">${enqNew().length} new</span></div>
  </div>
  <div class="grid2">
    <section class="panel"><div class="panel-head"><h2>Join requests</h2></div>
      <div class="list">${pend.map(e=>{const s=student(e.studentId),b=batch(e.batchId);return `<div class="li"><div class="main"><b>${esc(s.name)}</b><span class="small muted">${esc(b.title)} · ${daysText(b)}, ${t12(b.start)}</span><span class="small muted">${esc(loc(b.locationId)?.name||'')} · ${planText(plan(e.planId))}</span><span>${enrollPayPill(e)}</span></div><div class="row"><button class="btn primary sm" data-act="approve" data-id="${e.id}">Accept</button><button class="btn sm danger" data-act="decline" data-id="${e.id}">Decline</button></div></div>`}).join('')||'<p class="empty">No pending requests.</p>'}</div>
      <p class="small muted">Accepting a request adds the student to Students automatically.</p></section>
    <section class="panel"><div class="panel-head"><h2>Enquiries</h2><button class="link" data-act="tab" data-tab="enquiries">All enquiries</button></div>
      <div class="list">${enq.slice(0,5).map(q=>`<div class="li"><div class="main"><b>${esc(q.name)}</b><span class="small muted num">${esc(q.phone)} · ${fmt(q.date)}</span><span class="small">${q.styleId?chip(q.styleId):''}</span></div>${q.status==='new'?'<span class="pill warn">New</span>':'<span class="pill info">Contacted</span>'}</div>`).join('')||'<p class="empty">No open enquiries.</p>'}</div></section>
    <section class="panel"><div class="panel-head"><h2>Today’s classes</h2><button class="link" data-act="tab" data-tab="schedule">Full schedule</button></div>
      <div class="list">${todays.map(b=>{const marked=Object.keys(S.att[b.id+'|'+todayISO]||{}).length;const c=cancelOn(b.id,todayISO),sl=slotOf(b,todayISO);return `<div class="li"><span class="time">${t12(sl.start)}</span><div class="main" style="flex:1"><b>${esc(b.title)}${sl.makeup?' <span class="pill ok">Make-up</span>':''}</b><span class="small muted">${sl.where} · ${activeIn(b.id).length} students · ${esc(b.instructor)}</span></div>${c?`<span class="pill bad">Cancelled</span>${c.makeup?'':`<button class="btn sm" data-act="makeupForm" data-id="${c.id}">Set make-up</button>`}`:marked?'<span class="pill ok">Marked</span>':`<div class="row"><button class="btn sm" data-act="takeAtt" data-id="${b.id}">Take attendance</button>${sl.makeup?'':`<button class="btn sm danger" data-act="cancelForm" data-id="${b.id}" data-date="${todayISO}">Cancel</button>`}</div>`}</div>`}).join('')||'<p class="empty">No classes today.</p>'}</div></section>
    <section class="panel"><div class="panel-head"><h2>Fees to collect</h2><button class="link" data-act="tab" data-tab="fees">All payments</button></div>
      <div class="list">${curPays.sort((x,y)=>(x.status==='pending'?-1:0)-(y.status==='pending'?-1:0)||x.month.localeCompare(y.month)).slice(0,8).map(x=>{const s=student(x.studentId);return `<div class="li"><div class="main"><b>${esc(s?s.name:'—')}</b><span class="small muted">${esc(payWhat(x))} · ${payWhen(x)} · ${esc(loc(payLoc(x))?.name||'')}</span>${txnRefs(x)?`<span class="small muted num">${esc(x.txnId)} · ${esc(txnRefs(x))}</span>`:''}</div><div class="row"><span class="num">${inr(x.amount)}</span>${payPill(x)}<button class="btn sm" data-act="markPaid" data-id="${x.id}">${x.status==='pending'?'Confirm received':'Mark paid'}</button></div></div>`}).join('')||'<p class="empty">All fees collected.</p>'}</div></section>
  </div>`;
}

const WA_CATS=[
  ['enquiry','Enquiry replies',35,'Sent when someone enquires about a class'],
  ['welcome','Welcome messages',205,'Sent when someone creates a profile'],
  ['request','Class requests',265,'Sent when a student requests to join a class'],
  ['reminder','Fee due soon',48,'3 days before the fee due date'],
  ['overdue','Fee overdue',0,'After the due date if the fee is unpaid'],
  ['birthday','Birthday wishes',330,'On each student’s birthday'],
  ['festival','Festival wishes',140,'Write once, send to everyone'],
  ['resume','Resume your classes',180,'For students who missed their last 3 classes'],
  ['cancel','Cancelled & make-up classes',20,'When a class is cancelled or a make-up class is set']];
const FESTIVALS=['Deepavali','Navratri','Vijayadashami','Karthigai Deepam','Christmas','New Year','Pongal','Tamil New Year','Ugadi','Vinayaka Chathurthi','Onam','Holi','Eid','Raksha Bandhan','Independence Day'];
function waRow(m){
  return `<div class="li" style="align-items:flex-start"><div class="main" style="gap:6px;flex:1 1 30em"><div class="row"><b>${esc(m.name)}</b><span class="small num muted">${phFmt(m.phone)}</span><span class="small muted">${fmt(m.date)} · ${esc(m.time||'')}</span></div><div class="msg">${esc(m.text)}</div>
    <div class="row">${m.status==='pending'?`<a class="btn wa sm" href="${waLink(m.phone,m.text)}" target="_blank" rel="noopener" data-wa="${m.id}">Send on WhatsApp</a>${copyBtn(m.text).replace('>Copy<','>Copy text<')}<button class="btn sm" data-act="waMark" data-id="${m.id}" data-v="skipped">Skip</button>`:`<span class="pill ${m.status==='sent'?'ok':'neutral'}">${m.status==='sent'?'Sent':'Skipped'}${m.sentOn?' · '+fmt(m.sentOn):''}</span><a class="btn sm" href="${waLink(m.phone,'')}" target="_blank" rel="noopener">Open chat</a>${m.status==='skipped'?`<button class="btn sm" data-act="waMark" data-id="${m.id}" data-v="pending">Move back to send</button>`:''}`}</div></div></div>`;
}
function upcomingBirthdays(days){
  const out=[];for(const st of S.students){if(!st.dob)continue;for(let i=0;i<=days;i++){const d=addDays(todayISO,i);if(d.slice(5)===st.dob.slice(5)){out.push({st,d,i});break}}}
  return out.sort((a,b)=>a.i-b.i);
}
function waCatExtra(k){
  if(k==='festival'){
    const locs=S.locations;
    return `<form class="panel" data-form="festival" style="background:var(--bg)"><h3>Write a festival wish</h3>
      <div class="fgrid">
        <label class="f" for="fs-n">Festival<select id="fs-n" name="festival">${FESTIVALS.map(f=>opt(f,f,f===ui.fest)).join('')}<option value="__other">Other…</option></select></label>
        <label class="f" for="fs-o">Other festival name<input id="fs-o" name="other" type="text" placeholder="Only if you chose Other"></label>
        <label class="f full" for="fs-a">Send to<select id="fs-a" name="aud">${opt('active','All active students',true)}${locs.map(l=>opt('loc:'+l.id,'Active students at '+l.name,false)).join('')}${opt('all','All students and open enquiries',false)}</select></label>
        <label class="f full" for="fs-t">Message<textarea id="fs-t" name="text" rows="6">${esc(WA().festival)}</textarea><span class="hint">{name} becomes each person’s first name and {festival} the festival name.</span></label>
      </div><div class="actions"><button class="btn primary" type="submit">Create messages</button></div></form>`;
  }
  if(k==='birthday'){
    const up=upcomingBirthdays(30);
    return `<div class="panel" style="background:var(--bg)"><h3>Birthdays in the next 30 days</h3><p class="small muted">A wish is written automatically on the day. You can also write one early.</p>
      <div class="list">${up.map(({st,d,i})=>`<div class="li"><div class="main"><b>${esc(st.name)}</b><span class="small muted">${i===0?'<b>Today</b>':fromISO(d).toLocaleDateString('en-IN',{weekday:'short',day:'numeric',month:'short'})} · turns ${ageOf(st.dob)+(i===0?0:1)}</span></div><button class="btn sm" data-act="waBirthday" data-id="${st.id}">Write wish now</button></div>`).join('')||'<p class="empty">No birthdays in the next 30 days.</p>'}</div></div>`;
  }
  if(k==='resume'){
    const cands=[];for(const e of S.enrollments.filter(x=>x.status==='active')){const recs=attRecords(e,addDays(todayISO,-45),todayISO).filter(r=>r.s);const last=recs.slice(-2);if(last.length===2&&last.every(r=>r.s==='A'))cands.push(e)}
    return `<div class="panel" style="background:var(--bg)"><h3>Students missing classes</h3><p class="small muted">Students who missed their last 3 classes get a message automatically. These students missed their last 2.</p>
      <div class="list">${cands.map(e=>{const st=student(e.studentId),b=batch(e.batchId);return `<div class="li"><div class="main"><b>${esc(st.name)}</b><span class="small muted">${esc(b.title)} · last attended ${(()=>{const p=attRecords(e,addDays(todayISO,-90),todayISO).filter(r=>r.s==='P').pop();return p?fmt(p.d):'—'})()}</span></div><button class="btn sm" data-act="waResume" data-id="${e.id}">Write message</button></div>`}).join('')||'<p class="empty">Nobody has missed 2 classes in a row.</p>'}</div></div>`;
  }
  return '';
}
function admWhatsApp(){
  const all=S.waOut||[];
  const cnt=k=>all.filter(m=>m.kind===k&&m.status==='pending').length;
  const sentN=k=>all.filter(m=>m.kind===k&&m.status==='sent').length;
  if(ui.waCat===undefined){const first=['overdue','request','enquiry','welcome','reminder','birthday','resume','festival'].find(k=>cnt(k));ui.waCat=first||null}
  const cat=WA_CATS.find(c=>c[0]===ui.waCat);
  const list=cat?all.filter(m=>m.kind===cat[0]).slice().reverse():[];
  const pend=list.filter(m=>m.status==='pending'),done=list.filter(m=>m.status!=='pending');
  return `${head('WhatsApp messages',`From ${esc(WA().sender)}, ${esc(WA().role)} of ${esc(S.settings.studio)} · ${phFmt(WA().number)}`,`<button class="btn" data-act="editSettings">Edit message wording</button>`)}
  <div class="banner warn"><span><b>Automatic sending is not connected yet.</b> Messages are written automatically. Open a box, then select <b>Send on WhatsApp</b> while signed in as ${phFmt(WA().number)}.</span></div>
  <div class="wacats">${WA_CATS.map(([k,t,h,d])=>`<button class="wacat" style="--h:${h}" data-act="waCat" data-v="${k}" aria-pressed="${ui.waCat===k}"><span class="sent">${sentN(k)} sent</span><span class="t">${t}</span><span class="d">${d}</span><span class="c"><b class="num">${cnt(k)}</b><span>to send</span></span></button>`).join('')}</div>
  ${cat?`<section class="panel wadetail" style="--h:${cat[2]}" id="wa-detail"><div class="panel-head"><div><h2>${cat[1]}</h2><p class="small muted">${cat[3]}</p></div><button class="btn sm" data-act="waCat" data-v="${cat[0]}">Close</button></div>
    ${waCatExtra(cat[0])}
    <div><div class="spread"><h3>Ready to send</h3><span class="pill warn">${pend.length}</span></div><div class="list walist">${pend.map(waRow).join('')||'<p class="empty">Nothing waiting here.</p>'}</div></div>
    ${done.length?`<details><summary class="small" style="cursor:pointer;font-weight:700">Sent and skipped (${done.length})</summary><div class="list walist">${done.slice(0,40).map(waRow).join('')}</div></details>`:''}
  </section>`:'<p class="empty">Select a box to see its messages and send them.</p>'}`;
}

function admEnquiries(){
  const all=(S.enquiries||[]).slice().sort((x,y)=>y.date.localeCompare(x.date));
  const f=ui.enqFilter;const list=all.filter(q=>f==='all'||(f==='open'?(q.status==='new'||q.status==='contacted'):q.status===f));
  const cnt=k=>all.filter(q=>k==='open'?(q.status==='new'||q.status==='contacted'):q.status===k).length;
  const pill={new:'<span class="pill warn">New</span>',contacted:'<span class="pill info">Contacted</span>',joined:'<span class="pill ok">Joined</span>',closed:'<span class="pill neutral">Closed</span>'};
  return `${head('Enquiries','People who asked about classes but are not ready to pay yet. Call them back, note what you discussed, and mark them joined when they sign up.')}
  <div class="filters"><label class="f" for="eq-f">Show<select id="eq-f" data-filter="enqFilter">${[['open','Open (new and contacted)'],['new','New'],['contacted','Contacted'],['joined','Joined'],['closed','Closed'],['all','All']].map(([k,l])=>`<option value="${k}" ${f===k?'selected':''}>${l} (${k==='all'?all.length:cnt(k)})</option>`).join('')}</select></label></div>
  <section class="panel" style="padding:6px 8px"><div class="scroll"><table><thead><tr><th>Date</th><th>Name and phone</th><th>Interested in</th><th>Question</th><th>Status</th><th></th></tr></thead><tbody>
  ${list.map(q=>{const b=q.batchId&&batch(q.batchId);return `<tr><td class="num small">${fmt(q.date)}</td><td><b>${esc(q.name)}</b><div class="small num">${esc(q.phone)} ${copyBtn(q.phone)}</div><div class="small muted">${esc(q.source||'')}${q.studentId?' · has a profile':''}</div></td>
    <td>${q.styleId?chip(q.styleId):''}${b?`<div class="small">${daysText(b)}, ${t12(b.start)}</div><div class="small muted">${esc(loc(b.locationId)?.name||'')}</div>`:'<div class="small muted">Timing not chosen</div>'}</td>
    <td class="small" style="max-width:28ch">${esc(q.message)||'—'}${q.note?`<div class="muted">Note: ${esc(q.note)}</div>`:''}</td><td>${pill[q.status]}</td>
    <td><div class="row">${q.status==='new'?`<button class="btn sm primary" data-act="enqStatus" data-id="${q.id}" data-v="contacted">Mark contacted</button>`:''}${q.status==='new'||q.status==='contacted'?`<button class="btn sm" data-act="enqStatus" data-id="${q.id}" data-v="joined">Joined</button><button class="btn sm" data-act="enqStatus" data-id="${q.id}" data-v="closed">Close</button>`:`<button class="btn sm" data-act="enqStatus" data-id="${q.id}" data-v="new">Reopen</button>`}<button class="btn sm" data-act="enqNote" data-id="${q.id}">Note</button></div></td></tr>`}).join('')||'<tr><td colspan="6" class="empty">No enquiries here.</td></tr>'}
  </tbody></table></div></section>`;
}

function payGroupOf(sid){const ps=paymentsOf(sid);if(ps.some(p=>p.status==='due'))return'unpaid';if(ps.some(p=>p.status==='pending'))return'checking';return'paid'}
function payTiles(){
  const withClass=S.students.filter(s=>enrollsOf(s.id).length);
  const g={paid:[],unpaid:[],checking:[]};withClass.forEach(s=>g[payGroupOf(s.id)].push(s));
  const dueAmt=g.unpaid.reduce((a,s)=>a+paymentsOf(s.id).filter(p=>p.status==='due').reduce((x,p)=>x+p.amount,0),0);
  const over=g.unpaid.filter(s=>paymentsOf(s.id).some(p=>p.status==='due'&&payStatus(p)==='overdue')).length;
  const chkAmt=g.checking.reduce((a,s)=>a+paymentsOf(s.id).filter(p=>p.status==='pending').reduce((x,p)=>x+p.amount,0),0);
  const tile=(k,cls,label,sub)=>`<button class="tile ${cls}" data-act="payTile" data-v="${k}" aria-pressed="${ui.payTile===k}"><span class="l">${label}</span><span class="v num">${g[k].length}</span><span class="s">${sub}</span><span class="go">${ui.payTile===k?'Hide details':'View details ›'}</span></button>`;
  return `<section class="panel"><div class="panel-head"><h2>Fee status</h2><span class="small muted">Students with a class or a class request</span></div>
    <div class="tiles">${tile('paid','ok','Paid','All fees received')}${tile('unpaid','bad','Not paid',`${inr(dueAmt)} due${over?` · ${over} overdue`:''}`)}${tile('checking','info','Being checked',`${inr(chkAmt)} to confirm`)}</div>
    ${ui.payTile?payTileDetail(ui.payTile,g[ui.payTile]):''}</section>`;
}
function payTileDetail(k,list){
  const where=s=>enrollsOf(s.id).map(e=>{const b=batch(e.batchId);return `<div class="row" style="gap:6px;margin-bottom:3px">${chip(b.styleId)}<span class="small">${esc(loc(b.locationId)?.name||'')}</span>${e.status==='pending'?'<span class="pill warn">Requested</span>':''}</div>`}).join('');
  const who=s=>`<button class="link" data-act="openStudent" data-id="${s.id}">${esc(s.name)}</button><div class="small muted num">${esc(s.phone)}</div>`;
  let head2,rows;
  if(k==='unpaid'){
    head2='<th>Student</th><th>Classes and where</th><th>What is due</th><th class="r">Total</th><th></th>';
    rows=list.map(s=>{const open=paymentsOf(s.id).filter(p=>p.status==='due');const tot=open.reduce((a,p)=>a+p.amount,0);
      return `<tr><td>${who(s)}</td><td>${where(s)}</td><td><div class="dues">${open.map(p=>`<div><span>${esc(payWhat(p))} · ${payWhen(p)}</span><span class="row" style="gap:6px"><span class="num">${inr(p.amount)}</span>${payPill(p)}</span></div>`).join('')}</div></td><td class="r num"><b>${inr(tot)}</b></td>
      <td><div class="row">${waNum(s.phone)?`<a class="btn wa sm" href="${waLink(s.phone,reminderText(s.id))}" target="_blank" rel="noopener">Remind on WhatsApp</a>`:''}<button class="btn sm" data-act="openStudent" data-id="${s.id}">Mark paid</button></div></td></tr>`}).join('');
  }else if(k==='paid'){
    head2='<th>Student</th><th>Classes and where</th><th>Last payment</th><th class="r">Paid this month</th>';
    rows=list.map(s=>{const ps=paymentsOf(s.id).filter(p=>p.status==='paid').sort((a,b)=>(b.paidOn||'').localeCompare(a.paidOn||''));const last=ps[0];const mon=ps.filter(p=>(p.paidOn||'').startsWith(curMonth)).reduce((a,p)=>a+p.amount,0);
      return `<tr><td>${who(s)}</td><td>${where(s)}</td><td class="small">${last?`${fmt(last.paidOn)} · <span class="num">${inr(last.amount)}</span><div class="muted">${esc(payWhat(last))} · ${esc(last.method||'')}${last.txnId?' · '+esc(last.txnId):''}</div>`:'—'}</td><td class="r num">${inr(mon)}</td></tr>`}).join('');
  }else{
    head2='<th>Student</th><th>Classes and where</th><th>Payment to confirm</th><th class="r">Amount</th><th></th>';
    rows=list.map(s=>{const pp=paymentsOf(s.id).filter(p=>p.status==='pending');const tot=pp.reduce((a,p)=>a+p.amount,0);const refs=[...new Set(pp.map(txnRefs).filter(Boolean))].join('; ');
      return `<tr><td>${who(s)}</td><td>${where(s)}</td><td class="small">${pp.map(p=>esc(payWhat(p))).join(', ')}<div class="muted num">${esc(pp[0]?.txnId||'')}${refs?' · '+esc(refs):''}</div><div>${payPill(pp[0])}</div></td><td class="r num"><b>${inr(tot)}</b></td><td><button class="btn sm primary" data-act="markPaid" data-id="${pp[0].id}">Confirm received</button></td></tr>`}).join('');
  }
  const title={paid:'Paid',unpaid:'Not paid',checking:'Being checked'}[k];
  return `<div id="tile-detail" style="display:flex;flex-direction:column;gap:10px;margin-top:6px"><div class="spread"><h3>${title} · ${list.length} student${list.length===1?'':'s'}</h3><button class="btn sm" data-act="payTile" data-v="${k}">Close</button></div>
    <div class="scroll"><table><thead><tr>${head2}</tr></thead><tbody>${rows||`<tr><td colspan="5" class="empty">No students here.</td></tr>`}</tbody></table></div></div>`;
}

function admStudents(){
  const q=ui.stuQ.toLowerCase();
  const stOf=s=>{const ens=enrollsOf(s.id);return ens.some(e=>e.status==='active')?'active':ens.some(e=>e.status==='pending')?'requested':'registered'};
  const counts={active:0,requested:0,registered:0};S.students.forEach(s=>counts[stOf(s)]++);
  const list=S.students.filter(s=>(ui.stuStatus==='all'||stOf(s)===ui.stuStatus)&&(!q||s.name.toLowerCase().includes(q)||s.phone.includes(q))&&(ui.stuComm==='all'||(ui.stuComm==='none'?!s.communityId:s.communityId===ui.stuComm))&&(ui.stuStyle==='all'||enrollsOf(s.id).some(e=>batch(e.batchId)?.styleId===ui.stuStyle)));
  return `${head('Students',`${counts.active} active students. Students are added here automatically when you accept their class request. Select a row for details, classes, attendance and payments.`)}
  ${payTiles()}
  <div class="filters">
    <label class="f" for="s-st">Status<select id="s-st" data-filter="stuStatus">${[['active','Active (accepted)'],['requested','Requested, not accepted'],['registered','Registered, no class yet'],['all','All']].map(([k,l])=>`<option value="${k}" ${ui.stuStatus===k?'selected':''}>${l} (${k==='all'?S.students.length:counts[k]})</option>`).join('')}</select></label>
    <label class="f" for="s-q">Search<input id="s-q" type="search" placeholder="Name or phone" value="${esc(ui.stuQ)}" data-filter="stuQ"></label>
    <label class="f" for="s-c">Community<select id="s-c" data-filter="stuComm"><option value="all">All</option>${S.locations.filter(l=>l.type==='community').map(l=>`<option value="${l.id}" ${ui.stuComm===l.id?'selected':''}>${esc(l.name)}</option>`).join('')}<option value="none" ${ui.stuComm==='none'?'selected':''}>Not in a listed community</option></select></label>
    <label class="f" for="s-s">Dance style<select id="s-s" data-filter="stuStyle"><option value="all">All styles</option>${S.styles.map(s=>`<option value="${s.id}" ${ui.stuStyle===s.id?'selected':''}>${esc(s.name)}</option>`).join('')}</select></label>
  </div>
  ${(()=>{
    const row=s=>{const ens=enrollsOf(s.id);const pct=studentPct(s.id,addDays(todayISO,-30),todayISO);
      return `<tr class="click" data-act="openStudent" data-id="${s.id}" tabindex="0"><td><b>${esc(s.name)}</b><div class="small muted num">${esc(s.phone)}</div></td><td class="r num">${ageOf(s.dob)}</td><td>${commName(s.communityId)}</td>
      <td>${ens.map(e=>{const b=batch(e.batchId);return `<div class="row" style="gap:6px;margin-bottom:4px">${chip(b.styleId)}<span class="small">${esc(loc(b.locationId)?.name||'')}</span>${e.status==='pending'?'<span class="pill warn">Requested</span>':''}</div>`}).join('')||'<span class="muted small">None</span>'}</td>
      <td class="r num">${pct==null?'—':pct+'%'}</td><td>${studentPayPill(s.id)}</td></tr>`};
    const grp=s=>enrollsOf(s.id).length?payGroupOf(s.id):'noclass';
    const G=[['unpaid','Not paid','bad'],['checking','Payment being checked','info'],['paid','Paid','ok'],['noclass','No class yet','neutral']];
    const parts=G.map(([k,label,cls])=>{const rows=list.filter(s=>grp(s)===k).sort((a,b)=>a.name.localeCompare(b.name));if(!rows.length)return'';
      return `<section class="panel" style="padding:14px 8px 6px"><div class="spread" style="padding:0 10px"><h2 style="font-size:1.2rem">${label}</h2><span class="pill ${cls}">${rows.length} student${rows.length===1?'':'s'}</span></div>
      <div class="scroll"><table><thead><tr><th>Name</th><th class="r">Age</th><th>Lives in</th><th>Classes and where</th><th class="r">Attendance (30 days)</th><th>Payment</th></tr></thead><tbody>${rows.map(row).join('')}</tbody></table></div></section>`}).join('');
    return parts||'<section class="panel"><p class="empty">No students match.</p></section>';
  })()}`;
}

function cancelRecipients(bid){return S.enrollments.filter(e=>e.batchId===bid&&(e.status==='active'||e.status==='pending')).map(e=>student(e.studentId)).filter(Boolean)}
function notifyCancel(c,kind){
  const b=batch(c.batchId);const m=c.makeup;const out=[];
  for(const st of cancelRecipients(c.batchId)){
    const extra={date:fromISO(c.date).toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'long'}),reason:c.reason.toLowerCase(),
      makeup:m?`A make-up class is on ${fromISO(m.date).toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'long'})}, ${t12(m.start)}–${t12(m.end)} at ${loc(m.locationId)?.name||''}${m.venue?', '+m.venue:''}.`:'We will share the make-up class date soon.',
      mdate:m?fromISO(m.date).toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'long'}):'',mtime:m?`${t12(m.start)}–${t12(m.end)}`:'',mplace:m?`${loc(m.locationId)?.name||''}${m.venue?', '+m.venue:''}`:''};
    const msg=queueWA(kind,{name:st.name,phone:st.phone,studentId:st.id,styleId:b.styleId,extra});if(msg){msg.kind='cancel';out.push(msg)}
  }
  return out;
}
function sentPopup(msgs,title,sub){
  openModal(`<div style="display:flex;flex-direction:column;gap:14px">
    <div class="spread"><h2>${title}</h2><span class="pill ok">Saved</span></div>
    <div class="banner info"><span>${sub} ${msgs.length?`Send the WhatsApp message to each student below.`:'No students are in this batch yet, so there is no one to notify.'}</span></div>
    <div class="list">${msgs.map(m=>`<div class="li" style="align-items:flex-start"><div class="main" style="gap:6px;flex:1 1 24em"><div class="row"><b>${esc(m.name)}</b><span class="small num muted">${phFmt(m.phone)}</span></div><details><summary class="small" style="cursor:pointer">See message</summary><div class="msg" style="margin-top:6px">${esc(m.text)}</div></details></div>
      <a class="btn wa sm" href="${waLink(m.phone,m.text)}" target="_blank" rel="noopener" data-wa="${m.id}">Send on WhatsApp</a></div>`).join('')}</div>
    <div class="actions"><button class="btn" data-act="waOpenCancel">Open WhatsApp messages</button><button class="btn primary" data-act="close">Done</button></div></div>`);
}
function classDayModal(bid,d){
  const b=batch(bid),c=cancelOn(bid,d),mk=makeupOn(bid,d),sl=slotOf(b,d);
  const n=cancelRecipients(bid).length;
  openModal(`<div style="display:flex;flex-direction:column;gap:14px">
    <div class="spread"><div class="row">${chip(b.styleId)}<h2>${esc(b.title)}</h2></div>${c?'<span class="pill bad">Cancelled</span>':mk?'<span class="pill ok">Make-up class</span>':''}</div>
    <dl class="kv"><dt>Date</dt><dd><b>${fromISO(d).toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}</b></dd>
      <dt>Time</dt><dd class="num">${t12(sl.start)}–${t12(sl.end)}</dd><dt>Where</dt><dd>${sl.where}</dd><dt>Students</dt><dd>${n}</dd>
      ${c?`<dt>Reason</dt><dd>${esc(c.reason)}${c.note?' · '+esc(c.note):''}</dd><dt>Make-up</dt><dd>${c.makeup?`${fmtShort(c.makeup.date)}, ${t12(c.makeup.start)}–${t12(c.makeup.end)} · ${esc(loc(c.makeup.locationId)?.name||'')}${c.makeup.venue?' · '+esc(c.makeup.venue):''}`:'<span class="pill warn">Not set yet</span>'}</dd>`:''}
      ${mk?`<dt>Replaces</dt><dd>Cancelled class on ${fmtShort(mk.date)} (${esc(mk.reason)})</dd>`:''}</dl>
    <div class="actions">
      ${c?`<button class="btn" data-act="restoreClass" data-id="${c.id}">Restore this class</button><button class="btn primary" data-act="makeupForm" data-id="${c.id}">${c.makeup?'Change make-up class':'Schedule make-up class'}</button>`
        :mk?`<button class="btn" data-act="makeupForm" data-id="${mk.id}">Change make-up class</button>`
        :`<button class="btn" data-act="editBatch" data-id="${b.id}">Edit batch details</button><button class="btn danger" data-act="cancelForm" data-id="${b.id}" data-date="${d}">✕ Cancel this class</button>`}
      <button class="btn" data-act="close">Close</button></div></div>`);
}
function cancelForm(bid,d){
  const b=batch(bid);const dates=[...new Set([...(d&&!cancelOn(bid,d)?[d]:[]),...classDates(b,todayISO,addDays(todayISO,45))])].filter(x=>!makeupOn(bid,x)).sort();
  openModal(`<form data-form="cancelClass" data-id="${bid}"><div style="display:flex;flex-direction:column;gap:16px">
    <div class="row">${chip(b.styleId)}<h2>Cancel a class</h2></div><p class="small muted">${esc(b.title)} · ${daysText(b)}, ${t12(b.start)}–${t12(b.end)} · ${bWhere(b)}</p>
    <div class="fgrid">
      <label class="f" for="cn-d">Class date<select id="cn-d" name="date">${dates.map(x=>opt(x,fromISO(x).toLocaleDateString('en-IN',{weekday:'short',day:'numeric',month:'short',year:'numeric'}),x===d)).join('')}</select></label>
      <label class="f" for="cn-r">Reason<select id="cn-r" name="reason">${CANCEL_REASONS.map(r=>opt(r,r,false)).join('')}</select></label>
      <label class="f full" for="cn-n">Note for students (optional)<input id="cn-n" name="note" type="text" placeholder="e.g. Clubhouse booked for an association meeting"></label>
      <div class="full"><h3>Make-up class (compensation)</h3><p class="small muted">Set it now, or leave the date empty and schedule it later.</p></div>
      ${makeupFields(b,null)}
    </div>
    <p class="small muted">${cancelRecipients(bid).length} students in this batch will get a WhatsApp message from ${esc(WA().sender)}.</p>
    ${actions('Cancel class and notify')}</div></form>`);
}
function makeupFields(b,m){
  return `<label class="f" for="mk-d">Make-up date<input id="mk-d" name="mdate" type="date" min="${todayISO}" value="${m?m.date:''}"></label>
      <label class="f" for="mk-l">Place<select id="mk-l" name="mloc">${S.locations.map(l=>opt(l.id,l.name,(m?m.locationId:b.locationId)===l.id)).join('')}</select></label>
      <label class="f" for="mk-s">Starts<input id="mk-s" name="mstart" type="time" value="${m?m.start:b.start}"></label>
      <label class="f" for="mk-e">Ends<input id="mk-e" name="mend" type="time" value="${m?m.end:b.end}"></label>
      <label class="f full" for="mk-v">Room / hall<input id="mk-v" name="mvenue" type="text" value="${esc(m?m.venue:(b.venue||''))}"></label>`;
}
function makeupForm(cid){
  const c=S.cancels.find(x=>x.id===cid),b=batch(c.batchId);
  openModal(`<form data-form="makeup" data-id="${cid}"><div style="display:flex;flex-direction:column;gap:16px">
    <div class="row">${chip(b.styleId)}<h2>${c.makeup?'Change make-up class':'Schedule make-up class'}</h2></div>
    <p class="small muted">Compensation for the ${esc(b.title)} class cancelled on <b>${fromISO(c.date).toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'long'})}</b> (${esc(c.reason)}).</p>
    <div class="fgrid">${makeupFields(b,c.makeup)}</div>
    <p class="small muted">${cancelRecipients(b.id).length} students will get a WhatsApp message with the new date.</p>
    ${actions(c.makeup?'Save and notify':'Schedule and notify')}</div></form>`);
}
function readMakeup(fd,f,b){
  if(!fd.mdate)return null;
  if(fd.mdate<todayISO)return {err:'The make-up date can’t be in the past.'};
  if(!fd.mstart||!fd.mend||fd.mend<=fd.mstart)return {err:'Make-up end time must be after the start time.'};
  if(b.days.includes(fromISO(fd.mdate).getDay())&&!cancelOn(b.id,fd.mdate))return {err:'That day already has a regular class for this batch. Pick another day.'};
  return {date:fd.mdate,start:fd.mstart,end:fd.mend,locationId:fd.mloc,venue:(fd.mvenue||'').trim()};
}
function cancelsPanel(){
  const list=(S.cancels||[]).slice().sort((a,b)=>b.date.localeCompare(a.date));
  const need=list.filter(c=>!c.makeup).length;
  return `<section class="panel"><div class="panel-head"><div><h2>Cancelled classes and make-ups</h2><p class="small muted">Select a class on the timetable to cancel it, or use the button.</p></div><div class="row">${need?`<span class="pill warn">${need} need a make-up</span>`:''}<button class="btn sm danger" data-act="cancelPick">Cancel a class</button></div></div>
    <div class="scroll"><table><thead><tr><th>Cancelled class</th><th>Reason</th><th>Make-up class</th><th></th></tr></thead><tbody>
    ${list.map(c=>{const b=batch(c.batchId);if(!b)return'';return `<tr><td>${chip(b.styleId)}<div><b>${fromISO(c.date).toLocaleDateString('en-IN',{weekday:'short',day:'numeric',month:'short'})}</b> · ${t12(b.start)}</div><div class="small muted">${esc(b.title)}</div></td>
      <td class="small">${esc(c.reason)}${c.note?`<div class="muted">${esc(c.note)}</div>`:''}</td>
      <td>${c.makeup?`<span class="pill ok">${fromISO(c.makeup.date).toLocaleDateString('en-IN',{weekday:'short',day:'numeric',month:'short'})}, ${t12(c.makeup.start)}</span><div class="small muted">${esc(loc(c.makeup.locationId)?.name||'')}${c.makeup.venue?' · '+esc(c.makeup.venue):''}</div>`:'<span class="pill warn">Make-up needed</span>'}</td>
      <td><div class="row"><button class="btn sm ${c.makeup?'':'primary'}" data-act="makeupForm" data-id="${c.id}">${c.makeup?'Change':'Schedule make-up'}</button><button class="btn sm" data-act="restoreClass" data-id="${c.id}">Restore</button></div></td></tr>`}).join('')||'<tr><td colspan="4" class="empty">No cancelled classes.</td></tr>'}
    </tbody></table></div></section>`;
}

function admSchedule(){
  const dow=TODAY.getDay();
  const mon=addDays(todayISO,-((dow+6)%7)+7*ui.weekOff);
  const dates=WEEK.map((d,i)=>addDays(mon,i));
  const long=d=>fromISO(d).toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'long',year:'numeric'});
  const rng=`${fromISO(dates[0]).toLocaleDateString('en-IN',{day:'numeric',month:'short'})} – ${fromISO(dates[6]).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}`;
  return `${head('Class schedule',`Today is <b>${long(todayISO)}</b>. Select a class to cancel it, set a make-up class or edit its details.`,`<button class="btn primary" data-act="addBatch">Add class</button>`)}
  <section class="panel"><div class="panel-head"><div><span class="eyebrow">${ui.weekOff===0?'This week':ui.weekOff<0?'Past week':'Upcoming week'}</span><div class="today-line">${rng}</div></div>
    <div class="weeknav"><button class="btn sm" data-act="weekNav" data-v="-1" aria-label="Previous week">‹ Previous</button>${ui.weekOff?'<button class="btn sm" data-act="weekNav" data-v="0">This week</button>':''}<button class="btn sm" data-act="weekNav" data-v="1" aria-label="Next week">Next ›</button></div></div>
  <div class="scroll"><div class="week">${WEEK.map((d,i)=>{const ds=dates[i];
    const items=[...S.batches.filter(b=>b.days.includes(d)).map(b=>({b,ds,st:b.start})),...S.batches.flatMap(b=>cancelsOf(b.id).filter(c=>c.makeup&&c.makeup.date===ds).map(c=>({b,ds,st:c.makeup.start})))].sort((x,y)=>x.st.localeCompare(y.st));
    const live=items.filter(x=>!cancelOn(x.b.id,ds)).length;
    return `<div class="wcol ${ds===todayISO?'today':''}"><h4><span>${DAYS[d]}<small>${fromISO(ds).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}</small></span><span>${live}</span></h4>${items.map(({b})=>{const c=cancelOn(b.id,ds),sl=slotOf(b,ds);
      return `<div class="slotw"><button class="slot ${c?'cancelled':''} ${sl.makeup?'makeup':''}" style="--h:${style(b.styleId).h}" data-act="classDay" data-id="${b.id}" data-date="${ds}">${c?'<i class="tag c">Cancelled</i>':sl.makeup?'<i class="tag m">Make-up</i>':''}<b>${t12(sl.start)}–${t12(sl.end)}</b><span>${esc(b.title)}</span><i>${sl.where}</i></button>
        ${c?`<button class="slot-x ${c.makeup?'ok':'warn'}" data-act="makeupForm" data-id="${c.id}">${c.makeup?'Change make-up':'Set make-up class'}</button>`:!sl.makeup?`<button class="slot-x" data-act="cancelForm" data-id="${b.id}" data-date="${ds}" aria-label="Cancel ${esc(b.title)} on ${fmtShort(ds)}">✕ Cancel class</button>`:''}</div>`}).join('')}</div>`}).join('')}</div></div>
    <p class="small muted">Use <b>✕ Cancel class</b> under any class to cancel it. Select a class to see its details or edit the batch.</p></section>
  ${cancelsPanel()}
  <section class="panel"><h2>All batches</h2>${classFilters()}
  <div class="scroll"><table><thead><tr><th>Class</th><th>Days</th><th>Time</th><th>Location</th><th>Teacher</th><th class="r">Enrolled</th><th></th></tr></thead><tbody>
  ${filteredBatches().map(b=>`<tr><td>${chip(b.styleId)}<div><b>${esc(b.title)}</b> <span class="small muted">${esc(b.level)} · ${esc(b.ages)}</span></div></td><td>${daysText(b)}</td><td class="num">${t12(b.start)}–${t12(b.end)}</td><td>${bWhere(b)}<div>${locBadge(b.locationId)}</div></td><td>${esc(b.instructor)}</td><td class="r num">${activeIn(b.id).length}/${b.capacity}</td><td><button class="btn sm" data-act="editBatch" data-id="${b.id}">Edit</button></td></tr>`).join('')}
  </tbody></table></div></section>`;
}

function admAttendance(){
  if(!ui.attBatch||!batch(ui.attBatch))ui.attBatch=S.batches[0]?.id;
  const b=batch(ui.attBatch);
  if(!b)return head('Attendance','Add a class first.');
  const dates=classDates(b,addDays(todayISO,-62),todayISO).reverse();
  if(!dates.includes(ui.attDate))ui.attDate=dates[0];
  const roster=activeIn(b.id).filter(e=>!ui.attDate||e.since<=ui.attDate).map(e=>({e,s:student(e.studentId)}));
  const rec=S.att[b.id+'|'+ui.attDate]||{};
  const last=dates.slice(0,8).reverse();
  const allRoster=activeIn(b.id).map(e=>student(e.studentId));
  return `${head('Attendance','Mark who attended each class. Students see these dates in their own attendance page.')}
  <div class="filters">
    <label class="f" for="a-b">Class<select id="a-b" data-filter="attBatch">${S.batches.map(x=>`<option value="${x.id}" ${x.id===b.id?'selected':''}>${esc(x.title)} (${daysText(x)})</option>`).join('')}</select></label>
    <label class="f" for="a-d">Date<select id="a-d" data-filter="attDate">${dates.map(d=>`<option value="${d}" ${d===ui.attDate?'selected':''}>${fmtShort(d)}${d===todayISO?' (today)':''}${makeupOn(b.id,d)?' · make-up':''}</option>`).join('')||'<option>No past classes</option>'}</select></label>
  </div>
  <section class="panel">
    <div class="panel-head"><div><h2>${esc(b.title)}</h2><p class="small muted">${ui.attDate?fmtShort(ui.attDate):''} · ${t12(b.start)} · ${bWhere(b)}</p></div>${ui.attDate?`<button class="btn sm" data-act="allPresent">Mark all present</button>`:''}</div>
    <div class="list">${roster.map(({s})=>{const v=rec[s.id];return `<div class="li"><b>${esc(s.name)}</b><div class="toggle" role="group" aria-label="Attendance for ${esc(s.name)}"><button class="P ${v==='P'?'on':''}" data-act="mark" data-sid="${s.id}" data-v="P" aria-pressed="${v==='P'}">Present</button><button class="A ${v==='A'?'on':''}" data-act="mark" data-sid="${s.id}" data-v="A" aria-pressed="${v==='A'}">Absent</button></div></div>`}).join('')||'<p class="empty">No students enrolled for this date.</p>'}</div>
  </section>
  <section class="panel"><h2>Register: last ${last.length} classes</h2><div class="scroll"><table class="reg"><thead><tr><th>Student</th>${last.map(d=>`<th class="r">${fmtDM(d)}</th>`).join('')}<th class="r">Rate</th></tr></thead><tbody>
    ${allRoster.map(s=>{let p=0,a=0;const cells=last.map(d=>{const v=(S.att[b.id+'|'+d]||{})[s.id];if(v==='P')p++;if(v==='A')a++;return `<td class="c">${v?`<span class="${v}">${v}</span>`:'<span class="muted">·</span>'}</td>`}).join('');return `<tr><td>${esc(s.name)}</td>${cells}<td class="r num">${p+a?Math.round(p*100/(p+a))+'%':'—'}</td></tr>`}).join('')}
  </tbody></table></div><p class="small muted">P = present, A = absent, · = not marked or not yet enrolled.</p></section>`;
}

function admFees(){
  const months=[...new Set(S.payments.map(p=>p.month))].sort().reverse();
  if(!months.includes(ui.payMonth))ui.payMonth=months[0]||curMonth;
  const pays=S.payments.filter(p=>p.month===ui.payMonth&&(!ui.payLoc||ui.payLoc==='all'||payLoc(p)===ui.payLoc));
  const coll=pays.filter(p=>p.status==='paid').reduce((a,p)=>a+p.amount,0),pend=pays.filter(isOpen).reduce((a,p)=>a+p.amount,0);
  const st=S.settings;
  const rank={pending:0,due:1,refund:2,paid:3};const anyKit=S.styles.some(x=>x.kit&&x.kit.fee>0);
  return `${head('Fees','Fee structure by dance style, and payments by studio or community.',`<button class="btn primary" data-act="addPlan">Add fee plan</button><button class="btn" data-act="editSettings">Studio settings</button>`)}
  <section class="panel"><div class="panel-head"><h2>Fee structure</h2><span class="small muted">Monthly fees due by the ${ord(st.dueDay)} · one-time registration ${inr(st.regFee)} · late fee ${inr(st.lateFee)} · sibling discount ${st.siblingDiscount}%</span></div>
  <div class="scroll"><table><thead><tr><th>Style</th><th>Plan</th><th>Type</th><th class="r">Classes</th><th class="r">Fee</th><th class="r">Per class</th>${anyKit?'<th>Dance kit (one-time)</th>':''}<th></th></tr></thead><tbody>
  ${S.styles.filter(s=>isRequest(s)).map(s=>`<tr><td>${chip(s.id)}</td><td colspan="5" class="muted">On request · arranged with each student</td>${anyKit?'<td></td>':''}<td></td></tr>`).join('')}${S.styles.flatMap(s=>plansFor(s.id).map((p,i)=>`<tr><td>${i===0?chip(s.id):''}</td><td>${esc(p.name)}${p.batchId&&batch(p.batchId)?`<div class="small muted">${bWhere(batch(p.batchId))} · ${daysText(batch(p.batchId))} ${t12(batch(p.batchId).start)}</div>`:''}</td><td>${p.type==='package'?'Package':'Monthly'}</td><td class="r num">${p.classes}${p.type==='package'?' sessions':'/month'}</td><td class="r num">${inr(p.fee)}</td><td class="r num muted">${inr(Math.round(p.fee/p.classes))}</td>${anyKit?`<td class="small">${i===0?(s.kit&&s.kit.fee?`<b class="num">${inr(s.kit.fee)}</b> · ${esc(s.kit.name)}`:'<span class="muted">Not required</span>'):''}</td>`:''}<td><button class="btn sm" data-act="editPlan" data-id="${p.id}">Edit</button></td></tr>`)).join('')}
  </tbody></table></div>
  <p class="small muted">Accepted payment options: Google Pay, other UPI apps, bank transfer (NEFT/IMPS), cash at the front desk, or split between online and cash. Card and net banking through Razorpay can be added once a Razorpay account is connected.</p></section>
  <section class="panel"><div class="panel-head"><h2>Payment account</h2><button class="btn sm" data-act="editSettings">Edit</button></div>
    <p class="small muted">All online payments go to this account. Students enter their UPI or bank reference after paying; match it with your ICICI statement, then select “Confirm received”.</p>${bankKV()}</section>
  <section class="panel"><div class="panel-head"><h2>Payments</h2><div class="filters"><label class="f" for="p-l" style="width:min(100%,240px)">Studio / community<select id="p-l" data-filter="payLoc"><option value="all">All locations</option>${S.locations.map(l=>`<option value="${l.id}" ${ui.payLoc===l.id?'selected':''}>${esc(l.name)}</option>`).join('')}</select></label><label class="f" for="p-m" style="width:min(100%,220px)">Month<select id="p-m" data-filter="payMonth">${months.map(m=>`<option value="${m}" ${m===ui.payMonth?'selected':''}>${monthLabel(m)}</option>`).join('')}</select></label></div></div>
  <div class="row"><span class="pill ok">Collected ${inr(coll)}</span><span class="pill warn">Pending ${inr(pend)}</span></div>
  <div class="scroll"><table><thead><tr><th>Student</th><th>For</th><th>Studio / community</th><th class="r">Amount</th><th>Status</th><th>Paid on / receipt</th><th></th></tr></thead><tbody>
  ${pays.sort((a,b)=>(rank[a.status]??1)-(rank[b.status]??1)).map(p=>{const s=student(p.studentId);return `<tr><td><b>${esc(s?s.name:'—')}</b></td><td>${esc(payWhat(p))}</td><td class="small">${locCell(payLoc(p))}</td><td class="r num">${inr(p.amount)}</td><td>${payPill(p)}</td><td class="num small">${p.paidOn?fmt(p.paidOn):'—'}${p.txnId?`<div>${esc(p.txnId)}</div>`:''}${txnRefs(p)?`<div class="muted">${esc(txnRefs(p))}</div>`:''}</td><td>${p.status==='paid'?`<button class="btn sm" data-act="unpay" data-id="${p.id}">Undo</button>`:p.status==='refund'?'':`<button class="btn sm primary" data-act="markPaid" data-id="${p.id}">${p.status==='pending'?'Confirm received':'Mark paid'}</button>`}</td></tr>`}).join('')||'<tr><td colspan="7" class="empty">No payments this month.</td></tr>'}
  </tbody></table></div></section>`;
}

function admStyles(){
  return `${head('Dance styles','What students learn in each style. Edit the syllabus and it updates on every student’s “What I’ll learn” page.')}
  ${S.styles.map(s=>`<section class="panel"><div class="panel-head"><div class="row">${chip(s.id)}<span class="small muted">${S.batches.filter(b=>b.styleId===s.id).length} batches · ${new Set(S.enrollments.filter(e=>e.status==='active'&&batch(e.batchId)?.styleId===s.id).map(e=>e.studentId)).size} students</span></div><button class="btn sm" data-act="editStyle" data-id="${s.id}">Edit kit and syllabus</button></div><p class="muted">${esc(s.blurb)}</p>${s.kit&&s.kit.fee?`<p class="small"><b>Dance kit:</b> ${esc(s.kit.name)} · <span class="num">${inr(s.kit.fee)}</span> one-time</p>`:''}${curriculumBlock(s,null)}</section>`).join('')}`;
}

function admPlaces(){
  const row=l=>{const bs=S.batches.filter(b=>b.locationId===l.id);const res=S.students.filter(s=>s.communityId===l.id).length;
    return `<tr><td><b>${esc(l.name)}</b><div class="small muted">${esc(l.area)}</div></td><td>${esc(l.address)}</td><td>${esc(l.contact)}</td><td>${bs.map(b=>`<div class="small">${chip(b.styleId)} ${daysText(b)} ${t12(b.start)}</div>`).join('')||'<span class="muted small">No classes yet</span>'}</td>${l.type==='community'?`<td class="r num">${res}</td>`:''}<td><button class="btn sm" data-act="editPlace" data-id="${l.id}">Edit</button></td></tr>`};
  return `${head('Locations','Studios and the local apartment communities where classes run.',`<button class="btn primary" data-act="addPlace">Add location</button>`)}
  ${S.locations.some(l=>l.type==='studio')?`<section class="panel"><h2>Studios</h2><div class="scroll"><table><thead><tr><th>Studio</th><th>Address</th><th>Contact</th><th>Classes here</th><th></th></tr></thead><tbody>${S.locations.filter(l=>l.type==='studio').map(row).join('')}</tbody></table></div></section>`:''}
  <section class="panel"><div class="panel-head"><h2>Apartment communities</h2><span class="small muted">${esc(S.settings.communityNote)}</span></div><div class="scroll"><table><thead><tr><th>Community</th><th>Venue</th><th>Contact</th><th>Classes here</th><th class="r">Students living here</th><th></th></tr></thead><tbody>${S.locations.filter(l=>l.type==='community').map(row).join('')}</tbody></table></div></section>`;
}

/* ---------- modals ---------- */
const M=document.getElementById('modal');
function openModal(html,wide){M.innerHTML=`<div class="modal ${wide?'wide':''}" role="dialog" aria-modal="true">${html}</div>`;M.hidden=false;const f=M.querySelector('input,select,textarea,button');f&&f.focus()}
function closeModal(){M.hidden=true;M.innerHTML=''}
let toastT;function toast(msg){const t=document.getElementById('toast');t.textContent=msg;t.hidden=false;clearTimeout(toastT);toastT=setTimeout(()=>t.hidden=true,2600)}
const opt=(v,l,sel)=>`<option value="${esc(v)}" ${sel?'selected':''}>${esc(l)}</option>`;
const actions=(submit,extra='')=>`<div class="actions">${extra}<button type="button" class="btn" data-act="close">Cancel</button><button class="btn primary" type="submit">${submit}</button></div>`;

function studentForm(s,mode){
  s=s||{name:'',dob:'',gender:'',phone:'+91 ',email:'',guardian:'',communityId:'',address:'',emergency:'',notes:''};
  const req='';
  const comms=S.locations.filter(l=>l.type==='community');
  openModal(`<form data-form="student" data-id="${s.id||''}" data-mode="${mode}" novalidate><div style="display:flex;flex-direction:column;gap:16px">
    <h2>${s.id?'Edit profile':'New student profile'}</h2>
    <div class="fgrid">
      <label class="f full" for="sf-name"><span>Full name ${req}</span><input id="sf-name" name="name" type="text" required autocomplete="name" value="${esc(s.name)}"></label>
      <label class="f" for="sf-dob"><span>Date of birth ${req}</span><input id="sf-dob" name="dob" type="date" required max="${todayISO}" value="${esc(s.dob)}"></label>
      <label class="f" for="sf-g"><span>Gender ${req}</span><select id="sf-g" name="gender" required>${opt('','Select gender',!s.gender)}${['Female','Male','Other'].map(g=>opt(g,g,s.gender===g)).join('')}</select></label>
      <label class="f" for="sf-ph"><span>Phone (WhatsApp) ${req}</span><input id="sf-ph" name="phone" type="tel" required autocomplete="tel" value="${esc(s.phone)}"></label>
      <label class="f" for="sf-em"><span>Email ${req}</span><input id="sf-em" name="email" type="email" required autocomplete="email" value="${esc(s.email)}"></label>
      <label class="f full" for="sf-gu"><span>Parent / guardian name ${req}</span><input id="sf-gu" name="guardian" type="text" required value="${esc(s.guardian)}"><span class="hint">If you are 18 or older, enter “Self”.</span></label>
      <label class="f" for="sf-c"><span>Select apartment community ${req}</span><select id="sf-c" name="communityId" required>${opt('','Select apartment community',!comms.some(l=>l.id===s.communityId))}${comms.map(l=>opt(l.id,`${l.name} (${l.area})`,s.communityId===l.id)).join('')}</select></label>
      <label class="f" for="sf-ad"><span>Flat / block number ${req}</span><input id="sf-ad" name="address" type="text" required placeholder="e.g. Tower B, Flat 1204" value="${esc(s.address)}"></label>
      <label class="f full" for="sf-ec"><span>Emergency contact (name and phone) ${req}</span><input id="sf-ec" name="emergency" type="text" required placeholder="e.g. Ravi Kumar, 98401 12345" value="${esc(s.emergency==='—'?'':s.emergency)}"><span class="hint" id="sf-ec-msg" aria-live="polite">Must be a different number from your own phone.</span></label>
      <label class="f full" for="sf-n">Health notes (optional)<input id="sf-n" name="notes" type="text" placeholder="Injuries, allergies, anything the teacher should know" value="${esc(s.notes)}"></label>
      ${mode==='register'?`<div class="full"><h3>Create your password</h3><p class="small muted">You’ll sign in with your phone number or email and this password.</p></div>
      ${pwField('sf-pw','pw',`Password ${req}`,'new-password',PW_HINT)}${pwField('sf-pw2','pw2',`Confirm password ${req}`,'new-password')}<div class="full">${showPw('sf-show')}</div>`:''}
    </div>${actions(s.id?'Save profile':'Create profile')}</div></form>`);
}

function batchForm(b){
  const isNew=!b;
  b=b||{title:'',styleId:S.styles[0].id,level:'',ages:'',days:[],start:'18:00',end:'19:00',locationId:S.locations[0].id,instructor:'',capacity:15};
  const n=b.id?activeIn(b.id).length:0;
  openModal(`<form data-form="batch" data-id="${b.id||''}"><div style="display:flex;flex-direction:column;gap:16px">
    <h2>${isNew?'Add class':'Edit class'}</h2>
    <div class="fgrid">
      <label class="f full" for="bf-t">Class name<input id="bf-t" name="title" type="text" required value="${esc(b.title)}" placeholder="e.g. Bollywood Kids"></label>
      <label class="f" for="bf-s">Dance style<select id="bf-s" name="styleId">${S.styles.map(s=>opt(s.id,s.name,b.styleId===s.id)).join('')}</select></label>
      <label class="f" for="bf-l">Level<input id="bf-l" name="level" type="text" value="${esc(b.level)}" placeholder="Beginner, Foundation…"></label>
      <label class="f" for="bf-a">Age group<input id="bf-a" name="ages" type="text" value="${esc(b.ages)}" placeholder="6–12 yrs"></label>
      <label class="f" for="bf-cap">Capacity<input id="bf-cap" name="capacity" type="number" min="1" required value="${b.capacity}"></label>
      <div class="f full"><span>Days</span><div class="daypick">${WEEK.map(d=>`<label><input type="checkbox" name="days" value="${d}" ${b.days.includes(d)?'checked':''}>${DAYS[d]}</label>`).join('')}</div></div>
      <label class="f" for="bf-st">Starts<input id="bf-st" name="start" type="time" required value="${b.start}"></label>
      <label class="f" for="bf-en">Ends<input id="bf-en" name="end" type="time" required value="${b.end}"></label>
      <label class="f" for="bf-loc">Location<select id="bf-loc" name="locationId">${S.locations.map(l=>opt(l.id,`${l.name}${l.type==='community'?' (community)':''}`,b.locationId===l.id)).join('')}</select></label>
      <label class="f" for="bf-ve">Room / hall<input id="bf-ve" name="venue" type="text" placeholder="e.g. MPH hall" value="${esc(b.venue||'')}"></label>
      <label class="f" for="bf-in">Teacher<input id="bf-in" name="instructor" type="text" required value="${esc(b.instructor)}"></label>
    </div>
    ${b.id?`<p class="small muted">${n} students enrolled. Changing days or times updates their timetable.</p>`:''}
    ${actions(isNew?'Add class':'Save changes',b.id?`<button type="button" class="btn danger" data-act="delBatch" data-id="${b.id}" style="margin-right:auto">${n?'Delete (has students)':'Delete class'}</button>`:'')}</div></form>`);
}

function planForm(p){
  const isNew=!p;p=p||{styleId:S.styles[0].id,name:'',type:'monthly',classes:8,fee:2000};
  openModal(`<form data-form="plan" data-id="${p.id||''}"><div style="display:flex;flex-direction:column;gap:16px"><h2>${isNew?'Add fee plan':'Edit fee plan'}</h2>
  <div class="fgrid">
    <label class="f" for="pf-s">Dance style<select id="pf-s" name="styleId">${S.styles.map(s=>opt(s.id,s.name,p.styleId===s.id)).join('')}</select></label>
    <label class="f" for="pf-n">Plan name<input id="pf-n" name="name" type="text" required value="${esc(p.name)}"></label>
    <label class="f" for="pf-t">Billing<select id="pf-t" name="type">${opt('monthly','Monthly',p.type==='monthly')}${opt('package','One-time package',p.type==='package')}</select></label>
    <label class="f" for="pf-c">Classes (per month, or in package)<input id="pf-c" name="classes" type="number" min="1" required value="${p.classes}"></label>
    <label class="f" for="pf-f">Fee (₹)<input id="pf-f" name="fee" type="number" min="0" step="50" required value="${p.fee}"></label>
  </div>${actions(isNew?'Add plan':'Save plan')}</div></form>`);
}

function placeForm(l){
  const isNew=!l;l=l||{name:'',type:'community',area:'',address:'',contact:''};
  openModal(`<form data-form="place" data-id="${l.id||''}"><div style="display:flex;flex-direction:column;gap:16px"><h2>${isNew?'Add location':'Edit location'}</h2>
  <div class="fgrid">
    <label class="f full" for="lf-n">Name<input id="lf-n" name="name" type="text" required value="${esc(l.name)}"></label>
    <label class="f" for="lf-t">Type<select id="lf-t" name="type">${opt('studio','Studio',l.type==='studio')}${opt('community','Apartment community',l.type==='community')}</select></label>
    <label class="f" for="lf-a">Area<input id="lf-a" name="area" type="text" required value="${esc(l.area)}" placeholder="e.g. Sholinganallur"></label>
    <label class="f full" for="lf-ad">Venue / address<input id="lf-ad" name="address" type="text" value="${esc(l.address)}"></label>
    <label class="f full" for="lf-c">Contact person<input id="lf-c" name="contact" type="text" value="${esc(l.contact)}"></label>
  </div>${actions(isNew?'Add location':'Save')}</div></form>`);
}

function styleForm(s){
  const txt=s.curriculum.map(l=>`${l.level}: ${l.items.join('; ')}`).join('\n');
  openModal(`<form data-form="style" data-id="${s.id}"><div style="display:flex;flex-direction:column;gap:16px"><h2>${esc(s.name)}: kit and syllabus</h2>
  <label class="f" for="yf-b">Short description<input id="yf-b" name="blurb" type="text" value="${esc(s.blurb)}"></label>
  <div class="fgrid"><label class="f" for="yf-kn">Dance kit contents<input id="yf-kn" name="kitName" type="text" value="${esc(s.kit?.name||'')}"></label><label class="f" for="yf-kf">Kit fee (₹, 0 if not needed)<input id="yf-kf" name="kitFee" type="number" min="0" step="50" value="${s.kit?.fee||0}"></label></div>
  <label class="f" for="yf-c">Levels and topics<textarea id="yf-c" name="cur" rows="7">${esc(txt)}</textarea><span class="small muted" style="font-weight:400">One level per line: level name, a colon, then topics separated by semicolons.</span></label>
  ${actions('Save syllabus')}</div></form>`,true);
}

function settingsForm(){
  const st=S.settings;
  openModal(`<form data-form="settings"><div style="display:flex;flex-direction:column;gap:16px"><h2>Studio settings</h2><div class="fgrid">
    <div class="full"><h3>Front page</h3></div>
    <label class="f full" for="st-n">Studio name<input id="st-n" name="studio" type="text" required value="${esc(st.studio)}"></label>
    <label class="f full" for="st-tg">Tagline (small text above the name)<input id="st-tg" name="tagline" type="text" maxlength="80" value="${esc(st.tagline)}"></label>
    <label class="f full" for="st-w">Welcome message<textarea id="st-w" name="welcome" rows="3" maxlength="300">${esc(st.welcome)}</textarea><span class="hint">Shown under the studio name on the sign-in page. Leave empty to hide it.</span></label>
    <div class="full"><h3>WhatsApp messages</h3><p class="small muted">Use {name}, {style}, {timing}, {sender}, {studio}, {number}; reminders can also use {amount}, {items}, {due}, {upi}.</p></div>
    <label class="f" for="st-wn">WhatsApp number<input id="st-wn" name="waNumber" type="tel" required value="${esc(WA().number)}"></label>
    <label class="f" for="st-ws">Sent by (name)<input id="st-ws" name="waSender" type="text" required value="${esc(WA().sender)}"></label>
    <label class="f full" for="st-we">Reply to enquiries<textarea id="st-we" name="waEnquiry" rows="5">${esc(WA().enquiry)}</textarea></label>
    <label class="f full" for="st-ww">Welcome after creating a profile<textarea id="st-ww" name="waWelcome" rows="5">${esc(WA().welcome)}</textarea></label>
    <label class="f full" for="st-wq">After a class request<textarea id="st-wq" name="waRequest" rows="5">${esc(WA().request)}</textarea></label>
    <label class="f full" for="st-wr">Fee due soon (3 days before)<textarea id="st-wr" name="waReminder" rows="5">${esc(WA().reminder)}</textarea></label>
    <label class="f full" for="st-wb">Birthday wish<textarea id="st-wb" name="waBirthday" rows="4">${esc(WA().birthday)}</textarea></label>
    <label class="f full" for="st-wf">Festival wish (default)<textarea id="st-wf" name="waFestival" rows="4">${esc(WA().festival)}</textarea></label>
    <label class="f full" for="st-wc">Class cancelled<textarea id="st-wc" name="waCancel" rows="4">${esc(WA().cancel)}</textarea></label>
    <label class="f full" for="st-wm">Make-up class set<textarea id="st-wm" name="waMakeup" rows="4">${esc(WA().makeup)}</textarea></label>
    <label class="f full" for="st-wz">Resume your classes<textarea id="st-wz" name="waResume" rows="4">${esc(WA().resume)}</textarea></label>
    <label class="f full" for="st-wo">Fee overdue<textarea id="st-wo" name="waOverdue" rows="5">${esc(WA().overdue)}</textarea></label>
    <div class="full"><h3>Payment account</h3><p class="small muted">Google Pay, UPI apps and bank transfers all pay into this account.</p></div>
    <label class="f" for="st-bp">Account name<input id="st-bp" name="payee" type="text" required value="${esc(B().payee)}"></label>
    <label class="f" for="st-ba">Account number<input id="st-ba" name="acct" type="text" required inputmode="numeric" value="${esc(B().acct)}"></label>
    <label class="f" for="st-bi">IFSC<input id="st-bi" name="ifsc" type="text" required value="${esc(B().ifsc)}"></label>
    <label class="f" for="st-bn">Bank<input id="st-bn" name="bankName" type="text" value="${esc(B().bank)}"></label>
    <label class="f full" for="st-bb">Branch<input id="st-bb" name="branch" type="text" value="${esc(B().branch)}"></label>
    <label class="f full" for="st-bu">UPI ID (optional)<input id="st-bu" name="upi" type="text" placeholder="e.g. winidhub@icici" value="${esc(B().upi)}"><span class="hint">Leave empty to use the account number and IFSC as the UPI address.</span></label>
    <div class="full"><h3>Fees</h3></div>
    <label class="f" for="st-r">Registration fee (₹)<input id="st-r" name="regFee" type="number" min="0" value="${st.regFee}"></label>
    <label class="f" for="st-d">Fees due by day<input id="st-d" name="dueDay" type="number" min="1" max="28" value="${st.dueDay}"></label>
    <label class="f" for="st-l">Late fee (₹)<input id="st-l" name="lateFee" type="number" min="0" value="${st.lateFee}"></label>
    <label class="f" for="st-s">Sibling discount (%)<input id="st-s" name="siblingDiscount" type="number" min="0" max="100" value="${st.siblingDiscount}"></label>
    <label class="f full" for="st-c">Note for apartment communities<input id="st-c" name="communityNote" type="text" value="${esc(st.communityNote)}"></label>
  </div>${actions('Save settings')}</div></form>`);
}

function enrollForm(sid,batchId,asStudent){
  const b0=batchId?batch(batchId):S.batches[0];
  const s=student(sid);
  openModal(`<form data-form="enroll" data-sid="${sid}" data-student="${asStudent?1:0}"><div style="display:flex;flex-direction:column;gap:16px">
    <h2>${asStudent?'Request to join':'Enroll '+esc(s.name)}</h2>
    ${asStudent?`<div class="row">${chip(b0.styleId)}<b>${esc(b0.title)}</b></div><p class="small muted">${daysText(b0)} · ${t12(b0.start)}–${t12(b0.end)} · ${locName(b0.locationId)}</p><input type="hidden" name="batchId" value="${b0.id}">`
    :`<label class="f" for="en-batch">Class<select id="en-batch" name="batchId">${S.batches.filter(b=>!enrollsOf(sid).some(e=>e.batchId===b.id)).map(b=>opt(b.id,`${b.title} · ${daysText(b)} ${t12(b.start)}`,b.id===b0.id)).join('')}</select></label>`}
    <label class="f" for="en-plan">Fee plan<select id="en-plan" name="planId">${planOptions(b0.styleId,b0.id)}</select></label>
    <label class="f" for="en-since">Start date<input id="en-since" name="since" type="date" required value="${todayISO}"></label>
    ${asStudent&&!paymentsOf(sid).length?`<p class="small muted">A one-time registration fee of ${inr(S.settings.regFee)} applies to new students.</p>`:''}
    ${actions(asStudent?'Send request':'Enroll')}</div></form>`);
}
const planOptions=(sid,bid)=>(bid?plansForBatch(sid,bid):plansFor(sid)).map(p=>opt(p.id,p.type==='package'?`${p.name}: ${p.classes} sessions, ${inr(p.fee)}`:`${p.name}: ${p.classes} classes/month, ${inr(p.fee)}/month`)).join('');

function studentDetail(id){
  const s=student(id);const ens=enrollsOf(id);const pays=paymentsOf(id).slice().sort((a,b)=>(b.month||'').localeCompare(a.month||''));
  openModal(`<div class="spread"><h2>${esc(s.name)}</h2><div class="row"><button class="btn sm" data-act="editStudent" data-id="${id}">Edit profile</button><button class="btn sm primary" data-act="enrollAdmin" data-id="${id}">Enroll in class</button><button class="btn sm" data-act="close">Close</button></div></div>
  ${profileKV(s)}
  <div class="spread"><span class="small">Website login: ${s.pw?'<span class="pill ok">Password set</span>':'<span class="pill neutral">No password yet</span>'}</span>${s.pw?`<button class="btn sm" data-act="resetPw" data-id="${id}">Reset password</button>`:''}</div>
  <h3>Classes</h3>
  <div class="list">${ens.map(e=>{const b=batch(e.batchId),st=attStats(attRecords(e,e.since,todayISO));return `<div class="li"><div class="main"><div class="row">${chip(b.styleId)}<b>${esc(b.title)}</b>${e.status==='pending'?'<span class="pill warn">Requested</span>':''}${enrollPayPill(e)}</div><span class="small muted">${daysText(b)} · ${t12(b.start)} · ${bWhere(b)} · ${planText(plan(e.planId))} · since ${fmt(e.since)}</span>${e.status==='active'?`<span class="small">Attended <b class="num">${st.p}</b>, missed <b class="num">${st.a}</b>${st.pct!=null?` · ${st.pct}%`:''}</span>`:''}</div>
    ${e.status==='pending'?`<button class="btn sm primary" data-act="approve" data-id="${e.id}">Accept</button>`:`<button class="btn sm danger" data-act="unenroll" data-id="${e.id}">Remove</button>`}</div>`}).join('')||'<p class="empty">Not enrolled in any class.</p>'}</div>
  <h3>Payments</h3>
  <div class="scroll"><table><thead><tr><th>For</th><th>Where</th><th>Period</th><th class="r">Amount</th><th>Status</th><th></th></tr></thead><tbody>${pays.map(p=>`<tr><td>${esc(payWhat(p))}</td><td class="small">${esc(loc(payLoc(p))?.name||'—')}</td><td>${payWhen(p)}</td><td class="r num">${inr(p.amount)}</td><td>${payPill(p)}</td><td>${isOpen(p)?`<button class="btn sm" data-act="markPaid" data-id="${p.id}">${p.status==='pending'?'Confirm received':'Mark paid'}</button>`:''}</td></tr>`).join('')||'<tr><td colspan="6" class="empty">No payments.</td></tr>'}</tbody></table></div>`,true);
}

/* ---------- checkout ---------- */
let CK=null;
const ckItems=()=>CK.ids.map(id=>S.payments.find(x=>x.id===id)).filter(Boolean);
const ckTotal=()=>ckItems().reduce((a,p)=>a+p.amount,0);
const ckSummary=()=>sumBlock(ckItems().map(p=>[`${payWhat(p)} · ${payWhen(p)}`,p.amount]));
function checkout(ids){
  CK={ids:ids.filter(id=>S.payments.find(x=>x.id===id)?.status==='due'),method:'gpay',splitOnline:'gpay',splitAmt:0,step:'method',rid:'WH-'+todayISO.replace(/-/g,'').slice(2)+'-'+Math.floor(1000+Math.random()*9000)};
  if(!CK.ids.length){CK=null;return toast('Nothing to pay')}
  ckRender();
}
function ckRender(){
  const T=ckTotal();
  if(CK.step==='method'){
    const half=CK.splitAmt||Math.max(1,Math.round(T/200)*100);
    openModal(`<form data-form="ckMethod"><div style="display:flex;flex-direction:column;gap:16px">
      <h2>Pay ${inr(T)}</h2>${ckSummary()}
      <fieldset class="opts" style="border:0;padding:0;margin:0"><legend class="eyebrow" style="margin-bottom:8px">Choose how to pay</legend>
      ${Object.entries(METHODS).map(([k,m])=>`<label class="opt"><input type="radio" name="method" value="${k}" ${CK.method===k?'checked':''} ${m.kind==='off'?'disabled':''}><span class="main"><b>${m.label}</b><span class="small muted">${m.sub}</span></span>${m.kind==='off'?'<span class="side-note"><span class="pill neutral">Coming soon</span></span>':''}</label>`).join('')}
      </fieldset>
      <div id="ck-split" class="fgrid" ${CK.method==='split'?'':'hidden'}>
        <label class="f" for="ck-sm">Pay online now with<select id="ck-sm" name="splitOnline">${['gpay','upi','bank'].map(k=>opt(k,METHODS[k].label,CK.splitOnline===k)).join('')}</select></label>
        <label class="f" for="ck-sa">Amount to pay online (₹)<input id="ck-sa" name="splitAmt" type="number" min="1" max="${T-1}" step="1" value="${half}"><span class="hint" id="ck-rest">Cash at the front desk: ${inr(T-half)}</span></label>
      </div>
      ${actions('Continue')}</div></form>`);
  }else if(CK.step==='gateway'){
    const part=CK.parts.find(x=>x.method!=='cash');const m=METHODS[part.method];const cash=CK.parts.find(x=>x.method==='cash');
    const rest=cash?`<p class="small muted">The remaining ${inr(cash.amount)} is paid in cash at the front desk.</p>`:'';
    if(m.kind==='upi'){
      const link=upiLink(part.amount,`${S.settings.studio} ${CK.rid}`);
      openModal(`<form data-form="ckRef"><div class="gate">
        <h2 style="font-size:1.15rem">Pay with ${m.short==='UPI'?'any UPI app':m.label}</h2>
        <div class="amt num">${inr(part.amount)}</div>
        <p>to <b>${esc(B().payee)}</b> · ${esc(B().bank)}</p>${rest}
        <canvas id="ck-qr" class="qr" width="220" height="220" role="img" aria-label="UPI QR code for ${inr(part.amount)}"></canvas>
        <p class="small muted" style="max-width:44ch">Scan with ${part.method==='gpay'?'Google Pay':'PhonePe, Paytm or any UPI app'}. On a phone, you can also <a href="${link}">open your UPI app</a>. If it doesn’t open, scan the code or pay the UPI ID below.</p>
        <div class="copyrow"><span class="small muted">UPI ID</span><code>${esc(upiId())}</code>${copyBtn(upiId())}</div>
        <p class="small muted" style="max-width:44ch">If the amount isn’t filled in, enter <b>${inr(part.amount)}</b> and write <b class="num">${CK.rid}</b> in the note.</p>
        <label class="f" for="ck-ref" style="width:min(100%,320px);text-align:left">After paying, enter the UPI transaction ID (UTR)<input id="ck-ref" name="ref" required inputmode="numeric" autocomplete="off" placeholder="12-digit number from your UPI app"></label>
        <div class="row" style="justify-content:center"><button type="button" class="btn" data-act="ckBack">Back</button><button class="btn primary" type="submit">I’ve paid ${inr(part.amount)}</button></div>
        <p class="small muted" style="max-width:44ch">The studio checks the payment in its bank account and then confirms your receipt.</p></div></form>`);
      const c=document.getElementById('ck-qr');
      try{new QRious({element:c,value:link,size:220,padding:14,background:'#ffffff',foreground:'#111111',level:'M'})}catch(e){c.hidden=true}
    }else{
      openModal(`<form data-form="ckRef"><div style="display:flex;flex-direction:column;gap:14px">
        <h2>Bank transfer · ${inr(part.amount)}</h2>${rest}
        <p class="small muted">Send ${inr(part.amount)} by NEFT or IMPS from your net banking or bank app to this account. Add <b class="num">${CK.rid}</b> as the remark.</p>
        ${bankKV()}
        <label class="f" for="ck-ref">After paying, enter the transaction reference (UTR or IMPS ref)<input id="ck-ref" name="ref" required autocomplete="off" placeholder="e.g. 427812345678"></label>
        <div class="actions"><button type="button" class="btn" data-act="ckBack">Back</button><button class="btn primary" type="submit">I’ve paid ${inr(part.amount)}</button></div>
        <p class="small muted">The studio checks the payment in its bank account and then confirms your receipt.</p></div></form>`);
    }
  }else if(CK.step==='done'){
    const t=CK.txn;const cash=t.parts.find(x=>x.method==='cash');const onlyCash=cash&&t.parts.length===1;
    openModal(`<div style="display:flex;flex-direction:column;gap:16px">
      <div class="spread"><h2>${onlyCash?'Cash payment noted':'Payment sent'}</h2><span class="pill info">Awaiting studio confirmation</span></div>
      <dl class="kv"><dt>Receipt no.</dt><dd class="num">${t.id}</dd><dt>Date</dt><dd>${fmt(t.date)}</dd><dt>Student</dt><dd>${esc(student(t.studentId).name)}</dd></dl>
      ${ckSummary()}
      <div class="list">${t.parts.map(x=>`<div class="li"><div class="main"><b>${METHODS[x.method].label}</b><span class="small muted num">${x.ref?'Ref '+esc(x.ref):'Pay at the front desk'}</span></div><div class="row"><span class="num">${inr(x.amount)}</span>${x.status==='paid'?'<span class="pill ok">Received</span>':x.status==='verify'?'<span class="pill info">Being checked</span>':'<span class="pill warn">Due at desk</span>'}</div></div>`).join('')}</div>
      ${t.parts.some(x=>x.status==='verify')?'<p class="small muted">The studio matches your reference with its bank account. Your fees show as paid once it’s confirmed, usually within a working day.</p>':''}
      ${cash?`<div class="banner warn">Please pay ${inr(cash.amount)} in cash at the front desk. Your fees show as paid once the studio confirms it.</div>`:''}
      <div class="actions"><button class="btn primary" data-act="ckDone">Done</button></div></div>`);
  }
}
function ckFinish(){
  const items=ckItems();
  const t={id:CK.rid,studentId:items[0].studentId,date:todayISO,ids:[...CK.ids],total:ckTotal(),parts:CK.parts};
  (S.txns ||= []).push(t);
  const allPaid=t.parts.every(x=>x.status==='paid');
  const label=t.parts.length>1?'Split: '+t.parts.map(x=>METHODS[x.method].short).join(' + '):METHODS[t.parts[0].method].short;
  items.forEach(p=>{p.txnId=t.id;p.method=label;if(allPaid){p.status='paid';p.paidOn=todayISO}else p.status='pending'});
  CK.txn=t;CK.step='done';save();ckRender();
}
const upiRef=()=>String(Math.floor(1e11+Math.random()*9e11));
const rzpRef=()=>'pay_'+Array.from({length:14},()=>'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789'[Math.floor(Math.random()*57)]).join('');

/* ---------- actions ---------- */
function activate(e){
  e.status='active';const p=plan(e.planId);
  createDues(e,p.type==='package'?[monthOf(e.since)]:monthsBetween(monthOf(e.since),monthOf(e.since)>curMonth?monthOf(e.since):curMonth));
}
let reopenStudent=null;
function afterModal(){if(reopenStudent&&S.session?.role==='admin'){const id=reopenStudent;render();studentDetail(id)}else{closeModal();render()}}

const ACTS={
  tab:el=>{ui.tab=el.dataset.tab;render();window.scrollTo(0,0)},
  logout:async()=>{if(Backend.on){await Backend.flushNow();await Backend.signOut();ui.loginMode='login';ui.loginMsg='';closeModal();return reboot()}S.session=null;ui.loginMode='login';ui.loginMsg='';save();closeModal();render()},
  demoLogin:el=>{const id=el.dataset.id;S.session=id==='admin'?{role:'admin',auth:true}:{role:'student',studentId:id,auth:true};ui.tab=null;ui.waCat=undefined;save();render();window.scrollTo(0,0)},
  loginMode:el=>{ui.loginMode=el.dataset.mode;ui.loginMsg='';render()},
  adminLogin:()=>{reopenStudent=null;adminLoginForm()},
  changePw:()=>{reopenStudent=null;changePwForm()},
  resetPw:el=>{if(Backend.on)return toast('Reset this student’s password in Supabase → Authentication → Users, or ask them to sign up again with “Set up your password” after you remove their login.');const s=student(el.dataset.id);delete s.pw;save();toast(`Password cleared. ${s.name.split(' ')[0]} can set a new one with “Set up your password”.`);reopenStudent=s.id;afterModal()},
  reset:()=>{try{localStorage.removeItem(LS)}catch(e){}S=seed();S.demoPw=1;setDemoPasswords();ui.remRan=0;render();toast('Sample data restored')},
  register:()=>{reopenStudent=null;studentForm(null,'register')},
  close:()=>{reopenStudent=null;closeModal()},
  join:el=>enrollForm(S.session.studentId,el.dataset.id,true),
  browseStyle:el=>{ui.clsStyle=el.dataset.id;ui.clsLoc='all';ui.tab='classes';render();window.scrollTo(0,0)},
  editStudent:el=>{reopenStudent=S.session.role==='admin'?el.dataset.id:null;studentForm(student(el.dataset.id),'edit')},
  addStudent:()=>{reopenStudent=null;studentForm(null,'add')},
  openStudent:el=>{reopenStudent=el.dataset.id;studentDetail(el.dataset.id)},
  enrollAdmin:el=>{reopenStudent=el.dataset.id;const avail=S.batches.find(b=>!enrollsOf(el.dataset.id).some(e=>e.batchId===b.id));if(!avail)return toast('Already in every class');enrollForm(el.dataset.id,avail.id,false)},
  unenroll:el=>{const e=S.enrollments.find(x=>x.id===el.dataset.id);S.enrollments=S.enrollments.filter(x=>x!==e);S.payments=S.payments.filter(p=>p.enrollmentId!==e.id||p.status==='paid');save();toast('Removed from '+batch(e.batchId).title);reopenStudent=e.studentId;afterModal()},
  approve:el=>{const e=S.enrollments.find(x=>x.id===el.dataset.id);activate(e);
    (S.enquiries||[]).forEach(q=>{if(q.studentId===e.studentId&&q.status!=='closed'&&(q.styleId===batch(e.batchId).styleId))q.status='joined'});
    save();const ps=enrollPay(e);toast(`${student(e.studentId).name} added to Students · ${batch(e.batchId).title} · ${ps==='paid'?'Paid':ps==='checking'?'Payment being checked':'Not paid yet'}`);if(!M.hidden){reopenStudent=e.studentId;afterModal()}else render()},
  decline:el=>{const id=el.dataset.id;S.enrollments=S.enrollments.filter(x=>x.id!==id);S.payments=S.payments.filter(p=>p.enrollmentId!==id||p.status!=='due');S.payments.forEach(p=>{if(p.enrollmentId===id)p.status='refund'});save();render();toast('Request declined')},
  learnOpen:el=>openLearn(el.dataset.id),
  classDay:el=>classDayModal(el.dataset.id,el.dataset.date),
  cancelForm:el=>cancelForm(el.dataset.id,el.dataset.date),
  cancelPick:()=>{openModal(`<div style="display:flex;flex-direction:column;gap:14px"><h2>Which class?</h2><div class="list">${S.batches.map(b=>`<div class="li"><div class="main"><div class="row">${chip(b.styleId)}<b>${esc(b.title)}</b></div><span class="small muted">${daysText(b)}, ${t12(b.start)}–${t12(b.end)} · ${bWhere(b)}</span></div><button class="btn sm danger" data-act="cancelForm" data-id="${b.id}" data-date="${nextClass(b)||''}">Choose</button></div>`).join('')}</div><div class="actions"><button class="btn" data-act="close">Close</button></div></div>`)},
  makeupForm:el=>makeupForm(el.dataset.id),
  waOpenCancel:()=>{closeModal();ui.tab='whatsapp';ui.waCat='cancel';render();window.scrollTo(0,0)},
  restoreClass:el=>{const c=S.cancels.find(x=>x.id===el.dataset.id);if(el.dataset.confirm!=='1'){el.dataset.confirm='1';el.textContent='Restore? Select again to confirm';return}
    S.cancels=S.cancels.filter(x=>x!==c);save();closeModal();render();toast('Class restored. Let students know the class is back on.')},
  sheetOpen:el=>openSheet(el.dataset.id),
  sheetClose:()=>closeSheet(),
  sheetLearn:el=>{closeSheet();openLearn(el.dataset.id)},
  sheetEnquire:el=>{closeSheet();reqEnquiryForm(el.dataset.id)},
  sheetJoin:el=>{closeSheet();joinForm(el.dataset.id)},
  learnClose:()=>closeLearn(),
  learnJoin:el=>{closeLearn();ACTS.joinStyle(el)},
  joinStyle:el=>isRequest(style(el.dataset.id))?reqEnquiryForm(el.dataset.id):joinForm(el.dataset.id),
  reqEnquiry:el=>reqEnquiryForm(el.dataset.id),
  enquire:()=>enquiryForm(),
  waOpen:()=>{(S.enquiries||[]).forEach(q=>q.seen=true);save();closeModal();ui.tab='whatsapp';ui.waCat='enquiry';render();window.scrollTo(0,0)},
  waCat:el=>{ui.waCat=ui.waCat===el.dataset.v?null:el.dataset.v;render();if(ui.waCat)setTimeout(()=>document.getElementById('wa-detail')?.scrollIntoView({behavior:'smooth',block:'start'}),0)},
  waBirthday:el=>{const st=student(el.dataset.id);queueWA('birthday',{name:st.name,phone:st.phone,studentId:st.id});save();render();toast('Birthday wish ready to send')},
  waResume:el=>{const e=S.enrollments.find(x=>x.id===el.dataset.id),st=student(e.studentId),b=batch(e.batchId);queueWA('resume',{name:st.name,phone:st.phone,studentId:st.id,styleId:b.styleId,batchId:b.id});save();render();toast('Message ready to send')},
  waMark:el=>{const m=S.waOut.find(x=>x.id===el.dataset.id);m.status=el.dataset.v;save();render()},
  payTile:el=>{ui.payTile=ui.payTile===el.dataset.v?null:el.dataset.v;render();if(ui.payTile)setTimeout(()=>document.getElementById('tile-detail')?.scrollIntoView({behavior:'smooth',block:'start'}),0)},
  enqSeen:()=>{(S.enquiries||[]).forEach(q=>q.seen=true);save();closeModal()},
  enqOpen:()=>{(S.enquiries||[]).forEach(q=>q.seen=true);save();closeModal();ui.tab='enquiries';ui.enqFilter='open';render();window.scrollTo(0,0)},
  enqStatus:el=>{const q=S.enquiries.find(x=>x.id===el.dataset.id);q.status=el.dataset.v;q.seen=true;save();render();toast(`Marked ${({contacted:'as contacted',closed:'as closed',joined:'as joined',new:'as new'})[el.dataset.v]}`)},
  enqNote:el=>{const q=S.enquiries.find(x=>x.id===el.dataset.id);openModal(`<form data-form="enqNote" data-id="${q.id}"><div style="display:flex;flex-direction:column;gap:14px"><h2>Note for ${esc(q.name)}</h2><label class="f" for="enq-note">Follow-up note<textarea id="enq-note" name="note" rows="4" placeholder="e.g. Called on Monday, coming for a trial on Saturday">${esc(q.note||'')}</textarea></label>${actions('Save note')}</div></form>`)},
  weekNav:el=>{ui.weekOff=el.dataset.v==='0'?0:ui.weekOff+Number(el.dataset.v);render()},
  payAll:()=>checkout(paymentsOf(S.session.studentId).filter(p=>p.status==='due').map(p=>p.id)),
  payNow:()=>{const ids=[...document.querySelectorAll('[data-due]:checked')].map(i=>i.value);if(!ids.length)return toast('Select at least one item to pay');checkout(ids)},
  ckBack:()=>{CK.step='method';CK.parts=null;ckRender()},
  copy:el=>{const t=el.dataset.text;const done=()=>toast('Copied: '+t);try{navigator.clipboard.writeText(t).then(done,()=>toast(t))}catch(e){toast(t)}},
  ckDone:()=>{CK=null;closeModal();render()},
  markPaid:el=>{const p=S.payments.find(x=>x.id===el.dataset.id);
    const t=p.txnId&&(S.txns||[]).find(x=>x.id===p.txnId);
    if(p.status==='pending'&&t){t.parts.forEach(x=>{if(x.status!=='paid'){x.status='paid';if(x.method==='cash')x.ref='Received at front desk'}});S.payments.filter(x=>x.txnId===t.id).forEach(x=>{x.status='paid';x.paidOn=todayISO});save();toast(inr(t.total)+' confirmed. Receipt '+t.id+' is complete.')}
    else{p.status='paid';p.paidOn=todayISO;p.method='Cash';save();toast(inr(p.amount)+' marked paid')}if(!M.hidden&&reopenStudent)afterModal();else render()},
  unpay:el=>{const p=S.payments.find(x=>x.id===el.dataset.id);p.status='due';p.paidOn='';p.method='';p.txnId='';save();render()},
  addBatch:()=>batchForm(null),
  editBatch:el=>{if(S.session.role!=='admin')return;batchForm(batch(el.dataset.id))},
  delBatch:el=>{const id=el.dataset.id;const n=activeIn(id).length;
    if(n&&el.dataset.confirm!=='1'){el.dataset.confirm='1';el.textContent=`Delete and remove ${n} students?`;return}
    const ens=S.enrollments.filter(e=>e.batchId===id).map(e=>e.id);S.batches=S.batches.filter(b=>b.id!==id);S.enrollments=S.enrollments.filter(e=>e.batchId!==id);S.payments=S.payments.filter(p=>!ens.includes(p.enrollmentId));save();closeModal();render();toast('Class deleted')},
  takeAtt:el=>{ui.attBatch=el.dataset.id;ui.attDate=todayISO;ui.tab='attendance';render();window.scrollTo(0,0)},
  mark:el=>{const k=ui.attBatch+'|'+ui.attDate;(S.att[k] ||= {})[el.dataset.sid]=el.dataset.v;save();render()},
  allPresent:()=>{const k=ui.attBatch+'|'+ui.attDate;const r=(S.att[k] ||= {});activeIn(ui.attBatch).filter(e=>e.since<=ui.attDate).forEach(e=>r[e.studentId]='P');save();render();toast('Everyone marked present')},
  addPlan:()=>planForm(null),editPlan:el=>planForm(plan(el.dataset.id)),
  editSettings:()=>settingsForm(),
  addPlace:()=>placeForm(null),editPlace:el=>placeForm(loc(el.dataset.id)),
  editStyle:el=>styleForm(style(el.dataset.id))
};

const FORMS={
  loginStudent:async(fd,f)=>{
    if(Backend.on){const err=String(fd.ident).includes('@')?await Backend.signInEmail(fd.ident,fd.pw):await Backend.signInPhone(fd.ident,fd.pw);if(err)return formErr(f,err);await reboot();if(!S.session){await Backend.signOut();await reboot();return toast('This login is not linked to a student yet. Use “Set up your password” or contact the studio.')}return}
    const s=findStudent(fd.ident);
    if(!s)return formErr(f,'No student found with that phone number or email. Check it, or create a profile.');
    if(!s.pw)return formErr(f,'This account has no password yet. Use “Set up your password” below.');
    if(!(await checkPw(s.pw,fd.pw)))return formErr(f,'Incorrect password. Try again, or ask the studio to reset it.');
    S.session={role:'student',studentId:s.id,auth:true};ui.tab=null;ui.loginMsg='';save();render();
  },
  setupPw:async(fd,f)=>{
    if(Backend.on){const prob=pwProblem(fd.pw,fd.pw2);if(prob)return formErr(f,prob);
      let err=await Backend.signUpPhone(fd.ident,fd.pw);if(err)return formErr(f,err);
      err=await Backend.claimStudent(fd.ident);if(err){await Backend.signOut();return formErr(f,err+' Please check the number with the studio.')}
      ui.loginMode='login';await reboot();return toast('Password saved. You are signed in.')}
    const s=findStudent(fd.ident);
    if(!s)return formErr(f,'No student found with that phone number or email. Check it with the studio, or create a new profile.');
    if(s.pw)return formErr(f,'This account already has a password. Sign in instead, or ask the studio to reset it.');
    const prob=pwProblem(fd.pw,fd.pw2);if(prob)return formErr(f,prob);
    s.pw=await makePw(fd.pw);S.session={role:'student',studentId:s.id,auth:true};ui.tab=null;ui.loginMode='login';save();render();toast('Password saved. You are signed in.');
  },
  adminAuth:async(fd,f)=>{
    if(Backend.on){const err=await Backend.signInEmail(fd.email,fd.pw);if(err)return formErr(f,err);await reboot();if(S.session?.role!=='admin'){await Backend.signOut();await reboot();return toast('This login does not have admin access.')}return}
    if(!S.settings.adminPw){const prob=pwProblem(fd.pw,fd.pw2);if(prob)return formErr(f,prob);S.settings.adminPw=await makePw(fd.pw)}
    else if(!(await checkPw(S.settings.adminPw,fd.pw)))return formErr(f,'Incorrect admin password.');
    S.session={role:'admin',auth:true};ui.tab=null;save();closeModal();render();
  },
  changePw:async(fd,f)=>{
    if(Backend.on){const {data:{user}}=await Backend.sb.auth.getUser();const chk=await Backend.signInEmail(user.email,fd.old);if(chk)return formErr(f,'Current password is incorrect.');
      const prob=pwProblem(fd.pw,fd.pw2);if(prob)return formErr(f,prob);const err=await Backend.changePassword(fd.pw);if(err)return formErr(f,err);closeModal();return toast('Password changed')}
    const admin=S.session.role==='admin';const owner=admin?S.settings:student(S.session.studentId);const key=admin?'adminPw':'pw';
    if(owner[key]&&!(await checkPw(owner[key],fd.old)))return formErr(f,'Current password is incorrect.');
    const prob=pwProblem(fd.pw,fd.pw2);if(prob)return formErr(f,prob);
    owner[key]=await makePw(fd.pw);save();closeModal();toast('Password changed');
  },
  student:async(fd,f)=>{
    const id=f.dataset.id,mode=f.dataset.mode;
    const need=[['name','Full name'],['dob','Date of birth'],['gender','Gender'],['phone','Phone'],['email','Email'],['guardian','Parent / guardian name'],['communityId','Apartment community'],['address','Flat / block number'],['emergency','Emergency contact']];
    if(mode==='register')need.push(['pw','Password'],['pw2','Confirm password']);
    f.querySelectorAll('[aria-invalid]').forEach(x=>x.removeAttribute('aria-invalid'));
    const bad=[];const flag=(k,label)=>{bad.push(label);const el=f.querySelector(`[name="${k}"]`);if(el)el.setAttribute('aria-invalid','true')};
    need.forEach(([k,l])=>{if(!String(fd[k]||'').trim())flag(k,l)});
    if(fd.phone&&String(fd.phone).trim()&&digits(fd.phone).length!==10)flag('phone','a 10-digit mobile number');
    if(fd.email&&String(fd.email).trim()&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fd.email.trim()))flag('email','a valid email address');
    if(fd.dob&&fd.dob>todayISO)flag('dob','a date of birth in the past');
    if(String(fd.emergency||'').trim()&&!ecDigits(fd.emergency))flag('emergency','a 10-digit phone number for the emergency contact');
    else if(ecDigits(fd.emergency)&&ecDigits(fd.emergency)===digits(fd.phone)){flag('emergency','an emergency contact number different from your own phone');checkEmergency()}
    if(bad.length){formErr(f,'Please fill in: '+bad.join(', ')+'.');f.querySelector('[aria-invalid]')?.focus();return}
    const data={name:fd.name.trim(),dob:fd.dob,gender:fd.gender,phone:fd.phone.trim(),email:fd.email.trim(),guardian:fd.guardian.trim(),communityId:fd.communityId,address:fd.address.trim(),emergency:fd.emergency.trim(),notes:(fd.notes||'').trim()};
    if(id){Object.assign(student(id),data);save();toast('Profile saved');afterModal();return}
    if(mode==='register'){
      const prob=pwProblem(fd.pw||'',fd.pw2);if(prob)return formErr(f,prob);
      if(findStudent(data.phone)||(data.email&&findStudent(data.email)))return formErr(f,'An account with this phone number or email already exists. Sign in, or use “Set up your password”.');
      if(digits(data.phone).length!==10)return formErr(f,'Enter a 10-digit mobile number.');
    }
    if(mode==='register'&&Backend.on){
      let err=await Backend.signUpPhone(data.phone,fd.pw);if(err)return formErr(f,err);
      const nid=uid('S');err=await Backend.registerStudent(nid,{id:nid,joined:todayISO,...data,waOpt:true});if(err){await Backend.signOut();return formErr(f,err)}
      await reboot();queueWA('welcome',{name:data.name,phone:data.phone,studentId:nid});save();ui.tab='classes';render();
      return thanksModal(`Welcome, ${esc(firstName(data.name))}`,'Your profile is ready. Close this to choose a dance style and timing.')}
    const s={id:uid('S'),joined:todayISO,...data};
    if(mode==='register'){s.pw=await makePw(fd.pw);s.waOpt=true;queueWA('welcome',{name:s.name,phone:s.phone,studentId:s.id})}
    S.students.push(s);save();
    if(mode==='register'){S.session={role:'student',studentId:s.id,auth:true};ui.tab='classes';save();render();if(s.waOpt)thanksModal(`Welcome, ${esc(firstName(s.name))}`,'Your profile is ready. Close this to choose a dance style and timing.');else{closeModal();toast('Profile created. Pick a class to join.')}return}
    reopenStudent=s.id;toast('Student added');afterModal();
  },
  enroll:(fd,f)=>{
    const sid=f.dataset.sid,asStudent=f.dataset.student==='1';const b=batch(fd.batchId),p=plan(fd.planId);
    if(!p||p.styleId!==b.styleId)return toast('Choose a fee plan for this style');
    const e={id:uid('E'),studentId:sid,batchId:b.id,planId:p.id,since:fd.since,status:'pending'};S.enrollments.push(e);
    if(asStudent){save();closeModal();render();toast('Join request sent. The studio will confirm your seat.');return}
    activate(e);save();toast(`Enrolled in ${b.title}`);afterModal();
  },
  batch:(fd,f)=>{
    const days=new FormData(f).getAll('days').map(Number);
    if(!days.length)return toast('Pick at least one day');
    if(fd.end<=fd.start)return toast('End time must be after start time');
    const data={title:fd.title.trim(),styleId:fd.styleId,level:fd.level.trim()||'All levels',ages:fd.ages.trim()||'All ages',days,start:fd.start,end:fd.end,locationId:fd.locationId,venue:(fd.venue||'').trim(),instructor:fd.instructor.trim(),capacity:Number(fd.capacity)};
    if(f.dataset.id)Object.assign(batch(f.dataset.id),data);else S.batches.push({id:uid('B'),...data});
    save();closeModal();render();toast(f.dataset.id?'Class updated':'Class added to the schedule');
  },
  join:(fd,f)=>{
    if(!fd.batchId)return formErr(f,'Choose a timing first.');
    if(fd.go==='enquire'){const me=student(S.session.studentId);(S.enquiries ||= []).push({id:uid('Q'),name:me.name,phone:me.phone,studentId:me.id,styleId:f.dataset.style,batchId:fd.batchId,message:'Interested in this timing. Not ready to pay yet.',date:todayISO,status:'new',seen:false,source:'Student app'});if(me.waOpt!==false)queueWA('enquiry',{name:me.name,phone:me.phone,styleId:f.dataset.style,batchId:fd.batchId,studentId:me.id});save();render();return me.waOpt!==false?thanksModal('Enquiry sent','The studio will answer your questions before you pay.'):(closeModal(),toast('Enquiry sent. The studio will call you to answer your questions.'))}
    const b=batch(fd.batchId),p=plan(fd.planId);if(!p)return formErr(f,'Choose a fee plan.');
    const e={id:uid('E'),studentId:S.session.studentId,batchId:b.id,planId:p.id,since:fd.since&&fd.since>todayISO?fd.since:todayISO,status:'pending'};
    S.enrollments.push(e);const ids=createDues(e,[monthOf(e.since)]);
    {const me=student(e.studentId);const amt=ids.map(id=>S.payments.find(x=>x.id===id)).reduce((a,x)=>a+x.amount,0);queueWA('request',{name:me.name,phone:me.phone,styleId:b.styleId,batchId:b.id,studentId:me.id,extra:{amount:inr(amt)}})}
    save();render();
    if(fd.go==='pay')checkout(ids);else{closeModal();toast('Request sent. You can pay any time from the Fees page.')}
  },
  ckMethod:(fd,f)=>{
    const T=ckTotal();CK.method=fd.method;
    if(fd.method==='split'){const a=Math.round(Number(fd.splitAmt));if(!(a>=1&&a<T))return formErr(f,`Enter an online amount between ₹1 and ${inr(T-1)}.`);CK.splitAmt=a;CK.splitOnline=fd.splitOnline;CK.parts=[{method:fd.splitOnline,amount:a,status:'due'},{method:'cash',amount:T-a,status:'due'}]}
    else CK.parts=[{method:fd.method,amount:T,status:'due'}];
    if(fd.method==='razorpay')return formErr(f,'Card and net banking through Razorpay are not connected yet. Choose Google Pay, a UPI app or bank transfer.');
    if(fd.method==='cash')return ckFinish();
    CK.step='gateway';ckRender();
  },
  ckRef:(fd,f)=>{
    const part=CK.parts.find(x=>x.method!=='cash');const kind=METHODS[part.method].kind;const ref=String(fd.ref||'').replace(/\s+/g,'');
    if(kind==='upi'&&!/^\d{12}$/.test(ref))return formErr(f,'Enter the 12-digit UPI transaction ID (UTR) shown in your UPI app after paying.');
    if(kind==='bank'&&!/^[A-Za-z0-9]{6,22}$/.test(ref))return formErr(f,'Enter the transaction reference from your bank (6 to 22 letters or numbers).');
    part.ref=ref;part.status='verify';ckFinish();
  },
  reqEnquiry:(fd,f)=>{
    const me=student(S.session.studentId);const sid=f.dataset.style;
    const where=fd.locationId==='home'?'At home':(loc(fd.locationId)?.name||'');
    const msg=[`Preferred place: ${where}`,fd.when.trim()?`Preferred time: ${fd.when.trim()}`:'',fd.message.trim()].filter(Boolean).join('. ');
    const q={id:uid('Q'),name:me.name,phone:me.phone,studentId:me.id,styleId:sid,batchId:'',message:msg,date:todayISO,status:'new',seen:false,source:'Student app',waOpt:true};
    (S.enquiries ||= []).push(q);queueWA('enquiry',{name:me.name,phone:me.phone,styleId:sid,studentId:me.id,enquiryId:q.id});
    save();render();thanksModal('Enquiry sent',`The studio will contact you about ${esc(style(sid).name)}.`);
  },
  enquiry:(fd,f)=>{
    if(digits(fd.phone).length!==10)return formErr(f,'Enter a 10-digit mobile number so the studio can call you.');
    const q={id:uid('Q'),name:fd.name.trim(),phone:fd.phone.trim(),styleId:fd.styleId,batchId:fd.batchId,message:fd.message.trim(),date:todayISO,status:'new',seen:false,source:'Website',waOpt:true};
    (S.enquiries ||= []).push(q);
    if(q.waOpt)queueWA('enquiry',{name:q.name,phone:q.phone,styleId:q.styleId,batchId:q.batchId,enquiryId:q.id});
    save();
    if(q.waOpt)thanksModal('Thank you for your enquiry',`${esc(firstName(q.name))}, we have received your enquiry and will get back to you soon.`);
    else{closeModal();toast('Thank you. The studio will call you soon.')}
  },
  enqNote:(fd,f)=>{const q=S.enquiries.find(x=>x.id===f.dataset.id);q.note=fd.note.trim();save();closeModal();render();toast('Note saved')},
  festival:(fd,f)=>{
    const fest=fd.festival==='__other'?fd.other.trim():fd.festival;if(!fest)return formErr(f,'Type the festival name.');
    let people=[];const act=S.enrollments.filter(e=>e.status==='active');
    if(fd.aud==='active')people=[...new Set(act.map(e=>e.studentId))].map(student);
    else if(fd.aud.startsWith('loc:')){const L=fd.aud.slice(4);people=[...new Set(act.filter(e=>batch(e.batchId)?.locationId===L).map(e=>e.studentId))].map(student)}
    else{people=S.students.slice();(S.enquiries||[]).filter(q=>q.status==='new'||q.status==='contacted').forEach(q=>people.push({name:q.name,phone:q.phone}))}
    const seen=new Set();let n=0;
    for(const p of people){const d=digits(p.phone);if(!waNum(p.phone)||seen.has(d))continue;seen.add(d);
      (S.waOut ||= []).push({id:uid('W'),kind:'festival',name:p.name,phone:p.phone,text:fillTpl(fd.text,tplVars({name:p.name,extra:{festival:fest}})),date:todayISO,time:new Date().toLocaleTimeString('en-IN',{hour:'numeric',minute:'2-digit'}),status:'pending',studentId:p.id||null});n++}
    ui.fest=fd.festival;save();render();toast(`${n} ${fest} wishes ready to send`);
  },
  cancelClass:(fd,f)=>{
    const b=batch(f.dataset.id);if(!fd.date)return formErr(f,'Choose the class date to cancel.');
    if(cancelOn(b.id,fd.date))return formErr(f,'This class is already cancelled.');
    const m=readMakeup(fd,f,b);if(m&&m.err)return formErr(f,m.err);
    const c={id:uid('X'),batchId:b.id,date:fd.date,reason:fd.reason,note:(fd.note||'').trim(),createdOn:todayISO,makeup:m||null};
    (S.cancels ||= []).push(c);const ms=notifyCancel(c,'cancel');save();render();
    sentPopup(ms,'Class cancelled',`<b>${esc(b.title)}</b> on <b>${fromISO(c.date).toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'long'})}</b> is cancelled (${esc(c.reason)}). ${m?`Make-up class: <b>${fmtShort(m.date)}, ${t12(m.start)}–${t12(m.end)}</b>.`:'You can schedule the make-up class later.'}`);
  },
  makeup:(fd,f)=>{
    const c=S.cancels.find(x=>x.id===f.dataset.id),b=batch(c.batchId);
    if(!fd.mdate)return formErr(f,'Choose the make-up date.');
    const m=readMakeup(fd,f,b);if(m.err)return formErr(f,m.err);
    c.makeup=m;const ms=notifyCancel(c,'makeup');save();render();
    sentPopup(ms,'Make-up class scheduled',`Make-up for <b>${esc(b.title)}</b> (cancelled ${fmtShort(c.date)}) is on <b>${fromISO(m.date).toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'long'})}, ${t12(m.start)}–${t12(m.end)}</b>.`);
  },
  plan:(fd,f)=>{const data={styleId:fd.styleId,name:fd.name.trim(),type:fd.type,classes:Number(fd.classes),fee:Number(fd.fee)};
    if(f.dataset.id)Object.assign(plan(f.dataset.id),data);else S.plans.push({id:uid('p-'),...data});save();closeModal();render();toast('Fee plan saved. Applies to new payments.')},
  place:(fd,f)=>{const data={name:fd.name.trim(),type:fd.type,area:fd.area.trim(),address:fd.address.trim(),contact:fd.contact.trim()};
    if(f.dataset.id)Object.assign(loc(f.dataset.id),data);else S.locations.push({id:uid(fd.type==='studio'?'L':'C'),...data});save();closeModal();render();toast('Location saved')},
  style:(fd,f)=>{const s=style(f.dataset.id);s.blurb=fd.blurb.trim();s.kit={name:fd.kitName.trim()||'Not required',fee:Number(fd.kitFee)||0};
    s.curriculum=fd.cur.split('\n').map(l=>l.trim()).filter(Boolean).map(l=>{const i=l.indexOf(':');return i<0?{level:l,items:[]}:{level:l.slice(0,i).trim(),items:l.slice(i+1).split(';').map(x=>x.trim()).filter(Boolean)}});
    save();closeModal();render();toast('Syllabus saved')},
  settings:fd=>{S.settings.wa={...WA(),number:digits(fd.waNumber)||WA().number,sender:fd.waSender.trim()||WA().sender,enquiry:fd.waEnquiry,welcome:fd.waWelcome,reminder:fd.waReminder,request:fd.waRequest,overdue:fd.waOverdue,birthday:fd.waBirthday,festival:fd.waFestival,resume:fd.waResume,cancel:fd.waCancel,makeup:fd.waMakeup};S.settings.bank={payee:fd.payee.trim(),acct:fd.acct.replace(/\s+/g,''),ifsc:fd.ifsc.trim().toUpperCase(),bank:fd.bankName.trim(),branch:fd.branch.trim(),upi:fd.upi.trim()};Object.assign(S.settings,{studio:fd.studio.trim(),tagline:fd.tagline.trim(),welcome:fd.welcome.trim(),regFee:Number(fd.regFee),dueDay:Number(fd.dueDay),lateFee:Number(fd.lateFee),siblingDiscount:Number(fd.siblingDiscount),communityNote:fd.communityNote.trim()});save();closeModal();render();toast('Settings saved')}
};

document.addEventListener('click',ev=>{
  const wa=ev.target.closest('[data-wa]');
  if(wa){const m=(S.waOut||[]).find(x=>x.id===wa.dataset.wa);if(m){m.status='sent';m.sentOn=todayISO;save();if(!M.hidden){wa.textContent='Sent ✓';wa.classList.remove('wa');wa.removeAttribute('data-wa')}else setTimeout(render,300)}return}
  if(ev.target===M){reopenStudent=null;closeModal();return}
  if(ev.target.id==='drawer-back'){closeSheet();closeLearn();return}
  const el=ev.target.closest('[data-act]');if(!el)return;
  const fn=ACTS[el.dataset.act];if(fn){ev.preventDefault();fn(el)}
});
document.addEventListener('toggle',ev=>{if(ev.target.matches&&ev.target.matches('[data-why]')&&ev.target.open&&S.session?.role==='student'){const me=student(S.session.studentId);if(me&&!me.whySeen){me.whySeen=true;save();ev.target.classList.remove('unseen');const sm=ev.target.querySelector('.wt .small');if(sm)sm.textContent='Our promise to you'}}if(ev.target.matches&&ev.target.matches('[data-bd]')){ui.bdOpen=ev.target.open;const c=ev.target.querySelector('.chev');if(c)c.textContent=(ev.target.open?'Hide':'Show')+' by location'}},true);
document.addEventListener('keydown',ev=>{
  if(ev.key==='Escape'&&!document.getElementById('sheet').hidden){closeSheet();return}
  if(ev.key==='Escape'&&!document.getElementById('drawer').hidden){closeLearn();return}
  if(ev.key==='Escape'&&!M.hidden){reopenStudent=null;closeModal()}
  if(ev.key==='Enter'&&ev.target.matches('tr[data-act]'))ACTS[ev.target.dataset.act](ev.target);
});
document.addEventListener('submit',ev=>{ev.preventDefault();const f=ev.target;const fn=FORMS[f.dataset.form];if(!fn)return;let fd;try{fd=new FormData(f,ev.submitter||undefined)}catch(e){fd=new FormData(f)}fn(Object.fromEntries(fd),f)});
document.addEventListener('change',ev=>{
  const t=ev.target;
  if(t.matches('[data-showpw]')){t.closest('form').querySelectorAll('input[name=pw],input[name=pw2],input[name=old]').forEach(i=>i.type=t.checked?'text':'password');return}
  if(t.name==='method'&&t.form?.dataset.form==='ckMethod'){document.getElementById('ck-split').hidden=t.value!=='split';return}
  if(t.id==='jn-plan'){const f=t.form;document.getElementById('jn-sum').innerHTML=sumBlock(joinCharges(S.session.studentId,f.dataset.style,t.value));return}
  if(t.matches('[data-due]')){const n=[...document.querySelectorAll('[data-due]:checked')].reduce((a,i)=>a+S.payments.find(x=>x.id===i.value).amount,0);const b=document.getElementById('pay-now');if(b)b.textContent=n?'Pay '+inr(n):'Pay';return}
  if(t.id==='eq-s'){document.getElementById('eq-b').innerHTML=enqTimings(t.value);return}
  if(t.id==='en-batch'){document.getElementById('en-plan').innerHTML=planOptions(batch(t.value).styleId,t.value);return}
  if(t.name==='batchId'&&t.form?.dataset.form==='join'){const f=t.form;const sel=document.getElementById('jn-plan');if(sel){sel.innerHTML=planOptions(f.dataset.style,t.value);document.getElementById('jn-sum').innerHTML=sumBlock(joinCharges(S.session.studentId,f.dataset.style,sel.value))}return}
  if(t.dataset.filter&&t.dataset.filter!=='stuQ'){ui[t.dataset.filter]=t.value;if(t.dataset.filter==='attBatch')ui.attDate=null;render()}
});
document.addEventListener('input',ev=>{
  const t=ev.target;
  if(t.id==='sf-ec'||t.id==='sf-ph'){checkEmergency();return}
  if(t.id==='ck-sa'){const T=ckTotal(),a=Math.round(Number(t.value)||0);document.getElementById('ck-rest').textContent=a>=1&&a<T?'Cash at the front desk: '+inr(T-a):'Enter between ₹1 and '+inr(T-1);return}
  if(t.dataset.filter==='stuQ'){ui.stuQ=t.value;render();const n=document.getElementById('s-q');n.focus();n.setSelectionRange(n.value.length,n.value.length)}
});

/* ---------- start ---------- */
function baseState(){const d=seed();return{styles:[],locations:[],plans:[],batches:[],cancels:[],students:[],enrollments:[],payments:[],txns:[],enquiries:[],waOut:[],att:{},remLog:{},settings:{...d.settings,adminPw:undefined},v:6,learnV:1,cancelSeed:1,demo:0}}
function ensureDefaults(){S.settings.wa ||= {...WA_DEF};for(const k of Object.keys(WA_DEF))if(!S.settings.wa[k])S.settings.wa[k]=WA_DEF[k];if(!S.settings.bank)S.settings.bank={...BANK}}
async function reboot(){
  if(!Backend.on)return render();
  S=await Backend.boot(baseState(),m=>toast(m));ensureDefaults();ui.tab=null;ui.remRan=0;ui.waCat=undefined;
  if(!M.hidden)closeModal();render();
}
(async()=>{
  if(Backend.on){document.getElementById('app').innerHTML='<p style="padding:40px;text-align:center" class="muted">Loading WiniD Hub…</p>';await reboot();
    Backend.sb.auth.onAuthStateChange(ev=>{if(ev==='SIGNED_OUT'&&S?.session)reboot()});
    window.addEventListener('beforeunload',()=>{Backend.flushNow()});}
  else{initLocal();render();}
})();
