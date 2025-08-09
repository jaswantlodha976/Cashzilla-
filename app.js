// CashZilla upgraded - client-side demo
const STORAGE_KEY = "cashzilla_upgraded_v1_user";

const defaultUser = {
  name: "Guest User",
  balance: 0,
  level: 1,
  refCode: "CZ"+Math.floor(Math.random()*900000+100000),
  referrals: [], clicks:0, videosWatched:0, depositVerified:false, withdraws:[]
};

let user = JSON.parse(localStorage.getItem(STORAGE_KEY)) || defaultUser;
localStorage.setItem(STORAGE_KEY, JSON.stringify(user));

function $(id){return document.getElementById(id)}
const tabs = document.querySelectorAll(".tab-btn");
tabs.forEach(btn=>btn.addEventListener("click",()=>{
  tabs.forEach(b=>b.classList.remove("active"));
  btn.classList.add("active");
  const id = btn.id.replace("Btn","").toLowerCase();
  showTab(id);
}));

function showTab(id){ document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active')); const el = id ? document.getElementById(id) : document.getElementById('home'); el.classList.add('active'); refreshUI(); }

function refreshUI(){
  user = JSON.parse(localStorage.getItem(STORAGE_KEY)) || defaultUser;
  $('balance').innerText = user.balance.toFixed(0);
  $('level').innerText = user.level;
  $('refCode').innerText = user.refCode;
  $('shareLink').value = location.origin + location.pathname + '?ref=' + user.refCode;
  $('refList').innerHTML = user.referrals.map(r=>`<li>${r}</li>`).join('') || '<li>No referrals yet</li>';
  $('year').innerText = new Date().getFullYear();
  // videos
  const vids = [
    {id:'f2SCN87882g',url:'https://www.youtube.com/embed/f2SCN87882g?si=7Y_C2nMMP3RqhIAy'},
    {id:'cdtHYN8uulc',url:'https://www.youtube.com/embed/cdtHYN8uulc?si=xsqs15Qbs5xwhhg1'}
  ];
  $('videos').innerHTML = vids.map(v=>`<div class="video-item"><iframe src="${v.url}" allowfullscreen></iframe><div style="margin-top:8px"><button onclick="watchVideo('${v.id}')">Mark Watched (+₹100)</button></div></div>`).join('');
  $('withdrawLog').innerHTML = user.withdraws.map(w=>`<div>₹${w.amount} — ${w.status}</div>`).join('') || 'No withdraws';
  $('depositLog').innerText = user.depositVerified ? 'Deposit verified' : 'No deposit';
  // progress
  const progress = Math.min(100, Math.round((user.videosWatched/10)*100));
  $('progressInner').style.width = progress + '%';
  $('progressText').innerText = progress + '% to Level 2';
}

$('dailyLogin').addEventListener('click', ()=>{ user.balance += 20; pushFeed('Daily login +₹20'); saveAndRefresh(); });
$('simulateClick').addEventListener('click', ()=>{ user.balance += 17; user.clicks += 1; pushFeed('Referral click +₹17'); saveAndRefresh(); });

window.watchVideo = function(id){ user.balance += 100; user.videosWatched += 1; pushFeed('Watched video +₹100'); checkLevelUp(); saveAndRefresh(); };

$('copyLink').addEventListener('click', ()=>{ $('shareLink').select(); document.execCommand('copy'); alert('Link copied'); });

$('makeDeposit').addEventListener('click', ()=>{
  const amt = Number($('depositAmount').value);
  if(!amt || amt < 500){ alert('Deposit ₹500 minimum'); return; }
  user.depositVerified = true; pushFeed('Deposit noted: ₹'+amt); saveAndRefresh();
});

$('requestWithdraw').addEventListener('click', ()=>{
  const amt = Number($('withdrawAmount').value);
  if(!amt){alert('Enter amount');return;}
  if(amt < 5000){alert('Minimum withdrawal ₹5000'); return;}
  if(user.balance < amt){alert('Insufficient balance');return;}
  if(!user.depositVerified){alert('Withdrawals require ₹500 deposit first');return;}
  user.balance -= amt; user.withdraws.push({amount:amt,status:'Pending',date:new Date().toISOString()}); pushFeed('Withdraw requested ₹'+amt); saveAndRefresh();
});

function pushFeed(text){
  const el = $('feed'); const p = document.createElement('div'); p.innerText = new Date().toLocaleString() + ' — ' + text; el.prepend(p);
  // show animated earn pill
  const anim = document.createElement('div'); anim.className='earn-pill'; anim.innerText = text; document.body.appendChild(anim);
  setTimeout(()=>anim.classList.add('show'),50); setTimeout(()=>anim.classList.remove('show'),2200); setTimeout(()=>anim.remove(),2600);
  if(Math.random() < 0.25){ showFakeWithdrawal() }
}

function showFakeWithdrawal(){ const name = FAKE_NAMES[Math.floor(Math.random()*FAKE_NAMES.length)]; const amounts = [1200,5000,750,2500,9000]; const amount = amounts[Math.floor(Math.random()*amounts.length)]; // custom styled popup
  const popup = document.createElement('div'); popup.className='fake-popup'; popup.innerHTML = `<strong>${name}</strong> withdrew ₹${amount} successfully`;
  document.body.appendChild(popup); setTimeout(()=>popup.classList.add('show'),50); setTimeout(()=>popup.classList.remove('show'),3000); setTimeout(()=>popup.remove(),3500);
}

function saveAndRefresh(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(user)); refreshUI(); }

function checkLevelUp(){
  const lv2 = (user.videosWatched >= 10 && user.referrals.length >= 2 && user.clicks >= 5);
  const lv3 = (user.videosWatched >= Math.ceil(10*1.5) && user.referrals.length >= Math.ceil(2*1.5) && user.clicks >= Math.ceil(5*1.5));
  const lv4 = (user.videosWatched >= 20 && user.referrals.length >= 4 && user.clicks >= 10);
  if(lv4) user.level = 4; else if(lv3) user.level = 3; else if(lv2) user.level = 2;
}

window.addEventListener('load', ()=>{
  const params = new URLSearchParams(location.search); const ref = params.get('ref');
  if(ref && ref !== user.refCode){ user.balance += 250; user.referrals.push(ref); pushFeed('Referred by ' + ref + ' +₹250'); saveAndRefresh(); }
  refreshUI();
  document.getElementById('adminOpen').addEventListener('click', ()=>{ const pw = prompt('Enter admin password'); if(pw==='CashZilla@123'){ location.href='admin.html' } else alert('Wrong password') });
});
