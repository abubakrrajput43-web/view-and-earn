const SUPABASE_URL = "https://wmeiymtthuihqbkfjcvq.supabase.co";
const SUPABASE_KEY = "sb_publishable_42k1ITAm8y_LskEeiUzr7A_F6DMIhXq";

let supabase = null;

const LEVELS = [
  {n:1,v:10,d:10,fee:500,reward:100},
  {n:2,v:20,d:20,fee:700,reward:100},
  {n:3,v:30,d:30,fee:1000,reward:100},
  {n:4,v:40,d:40,fee:1500,reward:100},
  {n:5,v:15,d:30,fee:450,reward:150},
  {n:6,v:20,d:25,fee:2000,reward:200},
  {n:7,v:30,d:30,fee:2000,reward:300},
  {n:8,v:20,d:30,fee:3000,reward:300},
  {n:9,v:10,d:30,fee:3500,reward:350},
  {n:10,v:25,d:50,fee:5000,reward:400}
];

let user = JSON.parse(localStorage.getItem("ve_user") || "null");
let profileId = localStorage.getItem("ve_profile_id") || "";
let active = Number(localStorage.getItem("ve_active") || 0);
let progress = Number(localStorage.getItem("ve_progress") || 0);

const $ = id => document.getElementById(id);

function save(){
  localStorage.setItem("ve_user", JSON.stringify(user));
  localStorage.setItem("ve_profile_id", profileId);
  localStorage.setItem("ve_active", active);
  localStorage.setItem("ve_progress", progress);
}

async function loadSupabase(){
  if(window.supabase){
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    return;
  }

  await new Promise((resolve,reject)=>{
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });

  supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
}

async function signup(){
  const name = $("name").value.trim();
  const phone = $("phone").value.trim();
  const email = $("email").value.trim();

  if(!name || !phone){
    return alert("نام اور موبائل نمبر درج کریں");
  }

  user = {name,phone,email};

  try{
    if(supabase){
      const {data,error} = await supabase
        .from("profiles")
        .insert({
          name:name,
          phone:phone,
          email:email
        })
        .select()
        .single();

      if(!error && data){
        profileId = data.id;
      }
    }
  }catch(e){
    console.log(e);
  }

  save();
  showApp();
}

function showApp(){
  $("auth").hidden = true;
  $("app").hidden = false;
  $("logout").hidden = false;
  $("hello").textContent = `خوش آمدید، ${user.name}`;
  renderLevels();
  renderProgress();
}

async function renderLevels(){
  const box = $("levels");
  box.innerHTML = "";

  let levels = LEVELS;

  try{
    if(supabase){
      const {data,error} = await supabase
        .from("levels")
        .select("*")
        .order("level_no");

      if(!error && data && data.length){
        levels = data.map(x => ({
          n:Number(x.level_no),
          v:Number(x.daily_videos),
          d:Number(x.duration_days),
          fee:Number(x.fee),
          reward:Number(x.reward)
        }));
      }
    }
  }catch(e){
    console.log(e);
  }

  levels.forEach(x=>{
    const el = document.createElement("div");
    el.className = "level " + (active === x.n ? "active" : "");

    el.innerHTML = `
      <h3>Level ${x.n}</h3>
      <p>${x.v} videos/day</p>
      <p>${x.d} دن access</p>
      <p>Fee: Rs. ${x.fee.toLocaleString()}</p>
      <button onclick="requestAccess(${x.n})">
        ${active === x.n ? "Active" : "Access Request"}
      </button>
    `;

    box.appendChild(el);
  });
}

function requestAccess(n){
  active = n;
  progress = 0;
  save();

  $("notice").textContent =
    `Level ${n} کے لیے payment verify ہونے کے بعد access فعال کیا جائے گا۔`;

  renderLevels();
  renderProgress();
}

function renderProgress(){
  const x = LEVELS.find(a=>a.n===active);
  const max = x ? x.v : 0;

  $("bar").style.width =
    max ? Math.min(100, progress/max*100) + "%" : "0%";

  $("progressText").textContent =
    x ? `${progress} / ${max} videos` : "کوئی active level نہیں";
}

function openVideos(){
  if(!active){
    return alert("پہلے Level access لیں");
  }

  $("app").hidden = true;
  $("videos").hidden = false;

  const x = LEVELS.find(a=>a.n===active);

  let html = "";

  for(let i=1;i<=x.v;i++){
    html += `
      <div class="video">
        <span>Video / Link ${i}</span>
        <a href="#" onclick="watch(${i});return false">Open</a>
      </div>
    `;
  }

  $("videoList").innerHTML = html;
}

function watch(i){
  if(i > progress + 1){
    return alert("پہلے پچھلا video مکمل کریں");
  }

  progress = Math.max(progress,i);
  save();
  renderProgress();

  alert("Demo میں video mission complete شمار کیا گیا ہے۔");
}

function back(){
  $("videos").hidden = true;
  $("app").hidden = false;
}

async function submitPayment(){
  if(!active){
    return alert("Level منتخب کریں");
  }

  const t = $("txid").value.trim();

  if(!t){
    return alert("Transaction/reference number درج کریں");
  }

  const level = LEVELS.find(x=>x.n===active);

  try{
    if(supabase && profileId){
      const {error} = await supabase
        .from("payment_requests")
        .insert({
          user_id: profileId,
          level_id: active,
          amount: level ? level.fee : 0,
          transaction_ref: t,
          status: "pending"
        });

      if(error){
        console.log(error);
      }
    }
  }catch(e){
    console.log(e);
  }

  $("paymentStatus").textContent =
    "Payment request submitted — Admin verification pending.";

  localStorage.setItem(
    "ve_payment",
    JSON.stringify({
      user,
      level:active,
      txid:t,
      status:"pending"
    })
  );
}

$("logout").onclick = ()=>{
  localStorage.clear();
  location.reload();
};

async function startApp(){
  try{
    await loadSupabase();
  }catch(e){
    console.log("Supabase loading error:",e);
  }

  if(user){
    showApp();
  }else{
    $("logout").hidden = true;
  }
}

startApp();

if("serviceWorker" in navigator){
  navigator.serviceWorker.register("sw.js");
      }
