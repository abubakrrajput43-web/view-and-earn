const LEVELS=[
{n:1,v:10,d:10,fee:500,reward:100},{n:2,v:20,d:20,fee:700,reward:100},
{n:3,v:30,d:30,fee:1000,reward:100},{n:4,v:40,d:40,fee:1500,reward:100},
{n:5,v:15,d:30,fee:450,reward:150},{n:6,v:20,d:25,fee:2000,reward:200},
{n:7,v:30,d:30,fee:2000,reward:300},{n:8,v:20,d:30,fee:3000,reward:300},
{n:9,v:10,d:30,fee:3500,reward:350},{n:10,v:25,d:50,fee:5000,reward:400}
];
let user=JSON.parse(localStorage.getItem("ve_user")||"null");
let active=Number(localStorage.getItem("ve_active")||0);
let progress=Number(localStorage.getItem("ve_progress")||0);
const $=id=>document.getElementById(id);
function save(){localStorage.setItem("ve_user",JSON.stringify(user));localStorage.setItem("ve_active",active);localStorage.setItem("ve_progress",progress)}
function signup(){const name=$("name").value.trim(),phone=$("phone").value.trim();if(!name||!phone)return alert("نام اور موبائل نمبر درج کریں");user={name,phone,email:$("email").value};save();showApp()}
function showApp(){$("auth").hidden=true;$("app").hidden=false;$("logout").hidden=false;$("hello").textContent=`خوش آمدید، ${user.name}`;renderLevels();renderProgress()}
function renderLevels(){const box=$("levels");box.innerHTML="";LEVELS.forEach(x=>{const el=document.createElement("div");el.className="level "+(active===x.n?"active":"");el.innerHTML=`<h3>Level ${x.n}</h3><p>${x.v} videos/day</p><p>${x.d} دن access</p><p>Fee: Rs. ${x.fee.toLocaleString()}</p><button onclick="requestAccess(${x.n})">${active===x.n?"Active":"Access Request"}</button>`;box.appendChild(el)})}
function requestAccess(n){active=n;progress=0;save();$("notice").textContent=`Level ${n} کے لیے payment verify ہونے کے بعد access فعال کیا جائے گا۔ Demo میں یہ فوراً active دکھایا گیا ہے۔`;renderLevels();renderProgress()}
function renderProgress(){const x=LEVELS.find(a=>a.n===active);const max=x?x.v:0;$("bar").style.width=max?Math.min(100,progress/max*100)+"%":"0%";$("progressText").textContent=x?`${progress} / ${max} videos`:"کوئی active level نہیں"}
function openVideos(){if(!active)return alert("پہلے Level access لیں");$("app").hidden=true;$("videos").hidden=false;const x=LEVELS.find(a=>a.n===active);let html="";for(let i=1;i<=x.v;i++){html+=`<div class="video"><span>Video / Link ${i}</span><a href="#" onclick="watch(${i});return false">Open</a></div>`}$("videoList").innerHTML=html}
function watch(i){if(i>progress+1)return alert("پہلے پچھلا video مکمل کریں");progress=Math.max(progress,i);save();renderProgress();alert("Demo میں video mission complete شمار کیا گیا ہے۔")}
function back(){$("videos").hidden=true;$("app").hidden=false}
function submitPayment(){if(!active)return alert("Level منتخب کریں");const t=$("txid").value.trim();if(!t)return alert("Transaction/reference number درج کریں");$("paymentStatus").textContent="Payment request submitted — Admin verification pending.";localStorage.setItem("ve_payment",JSON.stringify({user,level:active,txid:t,status:"pending"}))}
$("logout").onclick=()=>{localStorage.clear();location.reload()};
if(user)showApp();else{$("logout").hidden=true}
if("serviceWorker"in navigator)navigator.serviceWorker.register("sw.js");