
import { firebaseConfig } from './firebase-config.js';
let useFirebase = false;
if(firebaseConfig) useFirebase = true;

function $(id){return document.getElementById(id);}

// Random Indian names and amounts for fake withdrawal marquee
const indianNames = ["Rahul Sharma","Priya Singh","Amit Kumar","Neha Patel","Vikas Yadav","Sneha Gupta","Rohit Verma","Anjali Reddy","Sanjay Mehta","Pooja Joshi","Manish Sharma","Deepa Nair","Rakesh Gupta","Kavita Rao","Arjun Desai"];
function randomWithdrawEntry(){
  const name = indianNames[Math.floor(Math.random()*indianNames.length)];
  const amount = Math.floor(Math.random()*19+1)*100; // ₹100 - ₹2000 multiples
  return {name, amount};
}

// create marquee items periodically
function startMarquee(){
  const box = $('withdrawMarquee');
  if(!box) return;
  setInterval(()=> {
    const e = randomWithdrawEntry();
    const div = document.createElement('div');
    div.className = 'item';
    div.innerHTML = `<strong>${e.name}</strong> withdrew <b>₹${e.amount}</b> - ${new Date().toLocaleTimeString()}`;
    box.prepend(div);
    // keep last 10
    while(box.children.length > 10) box.removeChild(box.lastChild);
  }, 2500);
}

// Demo storage
let currentUser = null;
let demoStore = { users:{}, withdrawals:[], balances:{} };

// UI helpers
function showTab(name){
  document.querySelectorAll('.tab').forEach(t => t.style.display='none');
  const el = $(name);
  if(el) el.style.display='block';
}
function generateRefCode(){
  if(!currentUser) return '---';
  return 'CZ' + (Math.floor(Math.random()*900000)+100000);
}

// Simple demo auth (fallback)
async function signup(email,password){
  if(useFirebase){
    const userCred = await firebase.auth().createUserWithEmailAndPassword(email,password);
    await firebase.firestore().collection('users').doc(userCred.user.uid).set({
      email, balance:0, level:1, referrals:0, watchCount:0, lastDaily:0
    });
    return userCred.user;
  } else {
    const id = 'u_' + Date.now();
    const u = { id, email, password, balance:0, level:1, referrals:0, watchCount:0, lastDaily:0 };
    demoStore.users[email] = u;
    localStorage.setItem('demoStore', JSON.stringify(demoStore));
    return u;
  }
}

async function login(email,password){
  if(useFirebase){
    const userCred = await firebase.auth().signInWithEmailAndPassword(email,password);
    const usrDoc = await firebase.firestore().collection('users').doc(userCred.user.uid).get();
    currentUser = { uid: userCred.user.uid, ...usrDoc.data() };
    return currentUser;
  } else {
    const ds = JSON.parse(localStorage.getItem('demoStore')||'{}');
    const u = (ds.users||{})[email];
    if(u && u.password === password) { currentUser = u; return u; }
    throw new Error('Invalid credentials (demo)');
  }
}

function updateUIAfterLogin(){
  $('auth').style.display='none';
  $('nav').style.display='block';
  $('logoutBtn').addEventListener('click', ()=>{ location.reload(); });
  $('refCode').innerText = generateRefCode();
  $('refLink').value = location.href + '?ref=' + $('refCode').innerText;
  refreshAccount();
}

async function refreshAccount(){
  if(useFirebase){
    const doc = await firebase.firestore().collection('users').doc(currentUser.uid).get();
    currentUser = { uid: currentUser.uid, ...doc.data() };
    $('balance').innerText = 'Balance: ₹' + (currentUser.balance||0);
    $('level').innerText = 'Level: ' + (currentUser.level||1);
    $('refCount').innerText = currentUser.referrals||0;
  } else {
    const ds = JSON.parse(localStorage.getItem('demoStore')||'{}');
    const u = ds.users[currentUser.email];
    currentUser = u;
    $('balance').innerText = 'Balance: ₹' + (currentUser.balance||0);
    $('level').innerText = 'Level: ' + (currentUser.level||1);
    $('refCount').innerText = currentUser.referrals||0;
  }
  if(currentUser.level >=4) $('depositTab').style.display='inline-block';
  loadWithdrawRequests();
}

// Daily login
$('dailyLoginBtn').addEventListener('click', async ()=>{
  if(!currentUser){ alert('Login first'); return; }
  const now = Date.now();
  const last = currentUser.lastDaily || 0;
  const lastDay = new Date(last).toDateString();
  const today = new Date(now).toDateString();
  if(lastDay === today){ alert('Already claimed today'); return; }
  await addBalance(20, 'Daily Login');
  currentUser.lastDaily = now;
  if(useFirebase){
    await firebase.firestore().collection('users').doc(currentUser.uid).update({ lastDaily: now });
  } else {
    const ds = JSON.parse(localStorage.getItem('demoStore')||'{}');
    ds.users[currentUser.email] = currentUser;
    localStorage.setItem('demoStore', JSON.stringify(ds));
  }
  refreshAccount();
  alert('₹20 added for daily login');
});

// Watch & Earn
const videos = [
  {id:'f2SCN87882g', url:'https://youtu.be/f2SCN87882g?si=7Y_C2nMMP3RqhIAy'},
  {id:'cdtHYN8uulc', url:'https://youtu.be/cdtHYN8uulc?si=xsqs15Qbs5xwhhg1'}
];

$('openVideoBtn')?.addEventListener('click', async ()=>{
  if(!currentUser){ alert('Login first'); return; }
  const v = videos[Math.floor(Math.random()*videos.length)];
  const startTS = Date.now();
  if(useFirebase){
    await firebase.firestore().collection('watchStarts').add({ uid: currentUser.uid, videoId: v.id, start: startTS });
  } else {
    const ds = JSON.parse(localStorage.getItem('demoStore')||'{}');
    ds.watchStart = { email: currentUser.email, videoId: v.id, start: startTS };
    localStorage.setItem('demoStore', JSON.stringify(ds));
  }
  window.open(v.url, '_blank');
  $('openStatus').innerText = 'Video opened. Watch minimum 2.5 min (150 sec). Return and click "Claim Watch".';
  $('checkWatchBtn').style.display = 'inline-block';
});

$('checkWatchBtn')?.addEventListener('click', async ()=>{
  if(!currentUser){ alert('Login first'); return; }
  let start = null;
  if(useFirebase){
    const q = await firebase.firestore().collection('watchStarts').where('uid','==',currentUser.uid).orderBy('start','desc').limit(1).get();
    if(q.empty){ alert('No watch start found'); return; }
    start = q.docs[0].data().start;
  } else {
    const ds = JSON.parse(localStorage.getItem('demoStore')||'{}');
    if(ds.watchStart && ds.watchStart.email === currentUser.email) start = ds.watchStart.start;
  }
  if(!start){ alert('No watch start found'); return; }
  const now = Date.now();
  const sec = Math.floor((now - start)/1000);
  if(sec < 150){ alert('Not enough watch time. Watched ' + sec + ' sec. Minimum 150 sec (2.5 min) required.'); return; }
  const earnings = Math.floor(sec / 10) * 1; // ₹1 per 10 sec
  await addBalance(earnings, 'Watch Earn ('+sec+' sec)');
  if(useFirebase){
    await firebase.firestore().collection('watchStarts').add({ uid: currentUser.uid, startClaimed: now, earned: earnings });
  } else {
    const ds = JSON.parse(localStorage.getItem('demoStore')||'{}');
    ds.balances = ds.balances || {};
    ds.balances[currentUser.email] = (ds.balances[currentUser.email]||0) + earnings;
    localStorage.setItem('demoStore', JSON.stringify(ds));
  }
  alert('You earned ₹' + earnings + ' for watching ' + sec + ' seconds.');
  refreshAccount();
});

// Add balance helper
async function addBalance(amount, reason){
  if(useFirebase){
    const uref = firebase.firestore().collection('users').doc(currentUser.uid);
    await firebase.firestore().runTransaction(async tx => {
      const doc = await tx.get(uref);
      const prev = doc.data();
      const newBal = (prev.balance||0) + amount;
      tx.update(uref, { balance: newBal });
      await firebase.firestore().collection('transactions').add({ uid: currentUser.uid, amount, reason, ts: Date.now() });
    });
  } else {
    const ds = JSON.parse(localStorage.getItem('demoStore')||'{}');
    ds.users[currentUser.email].balance = (ds.users[currentUser.email].balance||0) + amount;
    localStorage.setItem('demoStore', JSON.stringify(ds));
  }
}

// Withdraw flow
$('withdrawForm')?.addEventListener('submit', async (e)=>{
  e.preventDefault();
  if(!currentUser){ alert('Login first'); return; }
  const accName = $('bankName').value.trim();
  const accNo = $('accNo').value.trim();
  const ifsc = $('ifsc').value.trim();
  const amount = parseFloat($('withdrawAmount').value);
  if(!accName || !accNo || !ifsc || !amount) { alert('Enter all details'); return; }
  if(useFirebase){
    const doc = await firebase.firestore().collection('users').doc(currentUser.uid).get();
    const bal = doc.data().balance || 0;
    if(amount > bal){ alert('Insufficient balance'); return; }
    await firebase.firestore().collection('withdrawals').add({
      uid: currentUser.uid, email: currentUser.email, accName, accNo, ifsc, amount, status:'pending', createdAt: Date.now()
    });
    $('withdrawMsg').innerText = 'Withdraw request created and marked pending.';
  } else {
    const ds = JSON.parse(localStorage.getItem('demoStore')||'{}');
    const u = ds.users[currentUser.email];
    if(amount > u.balance){ alert('Insufficient balance'); return; }
    ds.withdrawals = ds.withdrawals || [];
    ds.withdrawals.push({ email: currentUser.email, accName, accNo, ifsc, amount, status:'pending', createdAt: Date.now() });
    localStorage.setItem('demoStore', JSON.stringify(ds));
    $('withdrawMsg').innerText = 'Withdraw request created (demo). Admin approval required.';
  }
  loadWithdrawRequests();
});

// Load withdraw requests
function loadWithdrawRequests(){
  const list = $('withdrawList');
  if(!list) return;
  list.innerHTML = '';
  if(useFirebase){
    firebase.firestore().collection('withdrawals').where('email','==', currentUser.email).onSnapshot(snap => {
      list.innerHTML = '';
      snap.forEach(doc => {
        const d = doc.data();
        const li = document.createElement('li');
        li.innerText = '₹' + d.amount + ' - ' + d.status;
        list.appendChild(li);
      });
    });
  } else {
    const ds = JSON.parse(localStorage.getItem('demoStore')||'{}');
    (ds.withdrawals||[]).forEach(w => {
      if(w.email === currentUser.email){
        const li = document.createElement('li');
        li.innerText = '₹' + w.amount + ' - ' + w.status;
        list.appendChild(li);
      }
    });
  }
}

// Deposit (visible to level 4)
$('depositBtn')?.addEventListener('click', async ()=>{
  if(!currentUser){ alert('Login first'); return; }
  if(useFirebase){
    await firebase.firestore().collection('users').doc(currentUser.uid).update({ depositDone: true, canWithdraw:true, level:4 });
    alert('Deposit simulated. You can now request withdraw when admin approves.');
  } else {
    const ds = JSON.parse(localStorage.getItem('demoStore')||'{}');
    ds.users[currentUser.email].depositDone = true;
    ds.users[currentUser.email].canWithdraw = true;
    ds.users[currentUser.email].level = 4;
    localStorage.setItem('demoStore', JSON.stringify(ds));
    alert('Deposit simulated (demo).');
    refreshAccount();
  }
});

// Signup/Login handlers
$('loginBtn').addEventListener('click', async ()=>{
  try{
    const u = await login($('email').value.trim(), $('password').value);
    updateUIAfterLogin();
    showTab('home');
  }catch(err){ $('authMsg').innerText = err.message; }
});
$('signupBtn').addEventListener('click', async ()=>{
  try{
    const u = await signup($('email').value.trim(), $('password').value);
    $('authMsg').innerText = 'Signup success. Now login.';
  }catch(err){ $('authMsg').innerText = err.message; }
});

// Nav
document.addEventListener('click', (e)=>{
  if(e.target.dataset && e.target.dataset.tab){
    const tab = e.target.dataset.tab;
    document.querySelectorAll('nav button').forEach(b=>b.classList.remove('active'));
    e.target.classList.add('active');
    showTab(tab);
  }
});

// Init
window.addEventListener('load', ()=>{
  startMarquee();
  if(useFirebase){
    const check = setInterval(()=> {
      if(window.firebase && firebase.apps !== undefined){
        clearInterval(check);
        firebase.initializeApp(firebaseConfig);
        firebase.auth().onAuthStateChanged(async (u)=>{
          if(u){
            const doc = await firebase.firestore().collection('users').doc(u.uid).get();
            currentUser = { uid:u.uid, ...doc.data() };
            updateUIAfterLogin();
            showTab('home');
          }
        });
      }
    },200);
  } else {
    const params = new URLSearchParams(location.search);
    const ref = params.get('ref');
    if(ref){
      const ds = JSON.parse(localStorage.getItem('demoStore')||'{}');
      ds.lastRef = ref;
      localStorage.setItem('demoStore', JSON.stringify(ds));
    }
    // Load demo store if exists
    const ds = JSON.parse(localStorage.getItem('demoStore')||'{}');
    demoStore = ds || demoStore;
  }
  // refresh withdraw list periodically
  setInterval(()=>{ if(currentUser) loadWithdrawRequests(); },3000);
});
