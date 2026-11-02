// MyPaisa starter: Firebase Authentication + private transactions + admin overview.
// 1) Create a Firebase project and register a Web App.
// 2) Paste your Firebase web config below. This config is not a password.
// 3) Enable Google sign-in and create a Firestore database.
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import { getFirestore, collection, doc, setDoc, addDoc, getDocs, query, orderBy, serverTimestamp, limit } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBApw1zKU8-XaCNo2pe_R0IOdyHC5lb8mU",
  authDomain: "mypaisa-3497c.firebaseapp.com",
  projectId: "mypaisa-3497c",
  storageBucket: "mypaisa-3497c.firebasestorage.app",
  messagingSenderId: "119643118866",
  appId: "1:119643118866:web:27120d415758ed3bc827cb",
  measurementId: "G-4TQN44GG2R"
};

const configReady = !Object.values(firebaseConfig).some(v => v.startsWith("PASTE_"));
const authScreen = document.querySelector("#auth-screen");
const appScreen = document.querySelector("#app");
const authMessage = document.querySelector("#auth-message");
const dialog = document.querySelector("#transaction-dialog");
let auth, db, currentUser, isAdmin = false, transactions = [];

const money = n => new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:2}).format(n || 0);
const safe = value => String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function showMessage(el,text){el.textContent=text;}
function showView(name){
  document.querySelectorAll(".view").forEach(v=>v.classList.add("hidden"));
  document.querySelector(`#${name}-view`)?.classList.remove("hidden");
  document.querySelectorAll(".nav-item[data-view]").forEach(b=>b.classList.toggle("active",b.dataset.view===name));
  if(name==="admin") loadAdmin();
}
function renderTransactions(){
  const totalIncome=transactions.filter(t=>t.type==="income").reduce((s,t)=>s+t.amount,0);
  const totalExpense=transactions.filter(t=>t.type==="expense").reduce((s,t)=>s+t.amount,0);
  document.querySelector("#income").textContent=money(totalIncome);
  document.querySelector("#expenses").textContent=money(totalExpense);
  document.querySelector("#balance").textContent=money(totalIncome-totalExpense);
  const html=transactions.slice(0,30).map(t=>`<div class="transaction"><div class="transaction-icon">${t.type==="income"?"↙":"↗"}</div><div class="transaction-info"><strong>${safe(t.description)}</strong><small>${safe(t.category)} · ${safe(t.date)}</small></div><div class="transaction-amount ${t.type==="income"?"positive":"negative"}">${t.type==="income"?"+":"−"}${money(t.amount)}</div></div>`).join("");
  const empty='<p class="muted">No transactions yet. Add your first one.</p>';
  document.querySelector("#recent-list").innerHTML=html||empty;
  document.querySelector("#all-list").innerHTML=html||empty;
}
async function loadTransactions(){
  const q=query(collection(db,"users",currentUser.uid,"transactions"),orderBy("createdAt","desc"),limit(100));
  const snap=await getDocs(q);
  transactions=snap.docs.map(d=>({id:d.id,...d.data()}));
  renderTransactions();
}
async function recordLogin(){
  const userRef=doc(db,"users",currentUser.uid);
  await setDoc(userRef,{uid:currentUser.uid,name:currentUser.displayName||"MyPaisa user",email:currentUser.email||"",photoURL:currentUser.photoURL||"",lastLoginAt:serverTimestamp(),createdAt:serverTimestamp()},{merge:true});
  await addDoc(collection(db,"users",currentUser.uid,"loginEvents"),{at:serverTimestamp(),method:"google"});
}
async function checkAdmin() {
  const adminRef = doc(db, "admins", currentUser.uid);
  const snap = await getDoc(adminRef);

  isAdmin = snap.exists();

  document.querySelector("#admin-link")
    .classList.toggle("hidden", !isAdmin);
}
}
async function loadAdmin(){
  document.querySelector("#admin-denied").classList.toggle("hidden",isAdmin);
  document.querySelector("#admin-content").classList.toggle("hidden",!isAdmin);
  if(!isAdmin)return;
  try{
    const users=await getDocs(collection(db,"users"));
    let loginCount=0;
    const rows=[];
    for(const u of users.docs){
      const data=u.data();
      const logs=await getDocs(collection(db,"users",u.id,"loginEvents"));
      loginCount+=logs.size;
      rows.push(`<div class="transaction"><div class="transaction-icon">◎</div><div class="transaction-info"><strong>${safe(data.name||"User")}</strong><small>${safe(data.email||"No email")} · UID: ${safe(u.id.slice(0,9))}…</small></div><small class="muted">${data.lastLoginAt?.toDate?.().toLocaleDateString("en-IN")||"Recently"}</small></div>`);
    }
    document.querySelector("#admin-users").textContent=users.size;
    document.querySelector("#admin-logins").textContent=loginCount;
    document.querySelector("#admin-user-list").innerHTML=rows.join("")||'<p class="muted">No registered users yet.</p>';
  }catch(e){document.querySelector("#admin-user-list").textContent="Could not load admin data. Check Firestore rules.";}
}
async function startApp(user){
  currentUser=user;
  authScreen.classList.add("hidden");appScreen.classList.remove("hidden");
  document.querySelector("#user-name").textContent=user.displayName||"MyPaisa user";
  document.querySelector("#user-email").textContent=user.email||"";
  document.querySelector("#user-avatar").textContent=(user.displayName||"U").charAt(0).toUpperCase();
  document.querySelector("#greeting").textContent=`Welcome, ${(user.displayName||"there").split(" ")[0]}`;
  document.querySelector("#today").textContent=new Date().toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"});
  try{await recordLogin();await checkAdmin();await loadTransactions();}
  catch(e){console.error(e);alert("Signed in, but MyPaisa could not load your data. Check your Firestore setup and security rules.");}
}
if(configReady){
  const fb=initializeApp(firebaseConfig);auth=getAuth(fb);db=getFirestore(fb);
  onAuthStateChanged(auth,user=>{if(user)startApp(user);else{currentUser=null;appScreen.classList.add("hidden");authScreen.classList.remove("hidden");}});
}else{
  showMessage(authMessage,"Setup needed: add your Firebase web configuration in app.js before signing in.");
}
document.querySelector("#google-signin").addEventListener("click",async()=>{
  if(!configReady){showMessage(authMessage,"First complete the Firebase setup in app.js.");return;}
  try{await signInWithPopup(auth,new GoogleAuthProvider());}
  catch(e){showMessage(authMessage,e.message);}
});
document.querySelector("#signout").addEventListener("click",()=>signOut(auth));
document.querySelectorAll("[data-view]").forEach(b=>b.addEventListener("click",()=>showView(b.dataset.view)));
document.querySelectorAll("[data-goto]").forEach(b=>b.addEventListener("click",()=>showView(b.dataset.goto)));
document.querySelector("#admin-link").addEventListener("click",e=>{e.preventDefault();showView("admin");});
function openTransaction(){document.querySelector("#transaction-form").reset();document.querySelector("#transaction-date").value=new Date().toISOString().slice(0,10);showMessage(document.querySelector("#form-message"),"");dialog.showModal();}
document.querySelector("#add-expense").addEventListener("click",openTransaction);
document.querySelector("#add-expense-top").addEventListener("click",openTransaction);
document.querySelector("#close-dialog").addEventListener("click",()=>dialog.close());
document.querySelector("#transaction-form").addEventListener("submit",async e=>{
  e.preventDefault();if(!currentUser)return;
  const amount=Number(document.querySelector("#amount").value);
  if(!Number.isFinite(amount)||amount<=0){showMessage(document.querySelector("#form-message"),"Enter a valid amount.");return;}
  const record={description:document.querySelector("#description").value.trim(),amount,type:document.querySelector("#type").value,category:document.querySelector("#category").value,date:document.querySelector("#transaction-date").value,createdAt:serverTimestamp()};
  try{await addDoc(collection(db,"users",currentUser.uid,"transactions"),record);await loadTransactions();dialog.close();}
  catch(err){showMessage(document.querySelector("#form-message"),"Could not save. Check your Firebase rules.");console.error(err);}
});
