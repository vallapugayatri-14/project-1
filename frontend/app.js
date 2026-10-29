const API = "/api";
let token = sessionStorage.getItem("hostel_token");
let currentUser = JSON.parse(sessionStorage.getItem("hostel_user") || "null");
let roomsCache = [];

const $ = (id) => document.getElementById(id);
const esc = (v) => String(v ?? "").replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function toast(msg){const el=$("toast");el.textContent=msg;el.classList.add("show");setTimeout(()=>el.classList.remove("show"),2800)}
async function api(path, options={}) {
  const headers={"Content-Type":"application/json",...(options.headers||{})};
  if(token) headers.Authorization=`Bearer ${token}`;
  const res=await fetch(API+path,{...options,headers});
  const data=await res.json().catch(()=>({}));
  if(!res.ok){ if(res.status===401){logout(false)} throw new Error(data.message||"Request failed");}
  return data;
}
function showAuth(tab="login"){
  $("authView").classList.remove("hidden");$("appView").classList.add("hidden");
  document.querySelectorAll(".tab").forEach(b=>b.classList.toggle("active",b.dataset.authTab===tab));
  $("loginForm").classList.toggle("hidden",tab!=="login");$("registerForm").classList.toggle("hidden",tab!=="register");
}
function showApp(){
  $("authView").classList.add("hidden");$("appView").classList.remove("hidden");
  $("userBadge").innerHTML=`<strong>${esc(currentUser.name)}</strong><br><span class="small">${esc(currentUser.role)}</span>`;
  document.querySelectorAll(".warden-only").forEach(el=>el.classList.toggle("hidden",currentUser.role!=="warden"));
  document.querySelectorAll(".student-only").forEach(el=>el.classList.toggle("hidden",currentUser.role!=="student"));
  navigate("dashboard"); loadDashboard();
}
function logout(show=true){token=null;currentUser=null;sessionStorage.clear();showAuth();if(show)toast("Logged out")}
function navigate(page){
  document.querySelectorAll(".nav-link").forEach(b=>b.classList.toggle("active",b.dataset.page===page));
  document.querySelectorAll(".page").forEach(p=>p.classList.toggle("active",p.id===`page-${page}`));
  const titles={dashboard:["Dashboard","A quick view of hostel activity."],rooms:["Rooms","Find an available room."],maintenance:["Maintenance","Submit and track maintenance issues."],allocations:["Allocations","Manage student room allocations."],"manage-rooms":["Manage Rooms","Create and update hostel rooms."]};
  $("pageTitle").textContent=titles[page][0];$("pageSubtitle").textContent=titles[page][1];
  if(page==="rooms")loadRooms(); if(page==="maintenance")loadMaintenance(); if(page==="allocations")loadAllocations(); if(page==="manage-rooms")loadManageRooms();
}
async function loadDashboard(){
  try{
    const d=await api("/dashboard");
    $("dashboardStats").innerHTML=[["Total rooms",d.stats.total_rooms],["Available rooms",d.stats.available_rooms],["Allocations",d.stats.allocations],["Open requests",d.stats.open_requests]].map(x=>`<div class="stat"><div class="muted">${x[0]}</div><div class="num">${x[1]}</div></div>`).join("");
    $("recentMaintenance").innerHTML=d.recent.length?d.recent.map(r=>`<div class="list-row"><strong>${esc(r.title)}</strong><br><span class="muted">${esc(r.room_number)} · ${esc(r.status.replace("_"," "))}</span></div>`).join(""):`<div class="empty">No maintenance requests yet.</div>`;
    $("roomOverview").innerHTML=`<p><strong>${d.stats.occupied_beds}</strong> of <strong>${d.stats.total_beds}</strong> beds are occupied.</p><div class="progress"><div style="width:${d.stats.total_beds?Math.round(d.stats.occupied_beds/d.stats.total_beds*100):0}%"></div></div>`;
  }catch(e){toast(e.message)}
}
async function loadRooms(){
  try{roomsCache=(await api("/rooms")).rooms;renderRooms()}catch(e){toast(e.message)}
}
function renderRooms(){
  const q=$("roomSearch").value.toLowerCase(), f=$("roomStatusFilter").value;
  const list=roomsCache.filter(r=>(!q||`${r.room_number} ${r.block}`.toLowerCase().includes(q))&&(!f||r.status===f));
  $("roomsGrid").innerHTML=list.length?list.map(r=>`<article class="room-card"><h3>Room ${esc(r.room_number)}</h3><p class="muted">${esc(r.block)}</p><p>${r.occupied_beds}/${r.capacity} beds occupied</p><span class="pill ${r.status}">${esc(r.status)}</span>${currentUser.role==="student"&&r.status==="available"?`<button class="btn primary full allocate-btn" data-id="${r.id}" style="margin-top:14px">Request allocation</button>`:""}</article>`).join(""):`<div class="empty panel">No matching rooms.</div>`;
  document.querySelectorAll(".allocate-btn").forEach(b=>b.onclick=()=>requestAllocation(b.dataset.id));
}
async function requestAllocation(roomId){
  if(!confirm("Request allocation for this room?"))return;
  try{await api("/allocations",{method:"POST",body:JSON.stringify({room_id:roomId})});toast("Allocation request submitted.");loadRooms();loadDashboard()}catch(e){toast(e.message)}
}
async function loadMaintenance(){
  try{const d=await api(`/maintenance?status=${encodeURIComponent($("maintenanceFilter").value)}`);$("maintenanceTable").innerHTML=d.requests.length?d.requests.map(r=>`<tr><td><strong>${esc(r.title)}</strong><br><span class="muted">${esc(r.description)}</span></td><td>${esc(r.room_number)}</td><td class="priority-${r.priority}">${esc(r.priority)}</td><td><span class="pill ${r.status}">${esc(r.status.replace("_"," "))}</span></td><td>${new Date(r.created_at).toLocaleDateString()}</td><td>${currentUser.role==="warden"&&r.status!=="resolved"?`<button class="action-btn" data-maint="${r.id}">Update</button>`:"—"}</td></tr>`).join(""):`<tr><td colspan="6" class="empty">No requests found.</td></tr>`;
  document.querySelectorAll("[data-maint]").forEach(b=>b.onclick=()=>updateMaintenance(b.dataset.maint));}catch(e){toast(e.message)}
}
async function updateMaintenance(id){
  const status=prompt("Enter status: pending, in_progress, or resolved");
  if(!["pending","in_progress","resolved"].includes(status))return;
  try{await api(`/maintenance/${id}`,{method:"PATCH",body:JSON.stringify({status})});toast("Request updated.");loadMaintenance();loadDashboard()}catch(e){toast(e.message)}
}
async function loadAllocations(){
  try{const d=await api("/allocations");const q=$("allocationSearch").value.toLowerCase();const list=d.allocations.filter(a=>`${a.student_name} ${a.email} ${a.room_number}`.toLowerCase().includes(q));$("allocationTable").innerHTML=list.length?list.map(a=>`<tr><td>${esc(a.student_name)}</td><td>${esc(a.email)}</td><td>${esc(a.room_number)}</td><td>${esc(a.block)}</td><td>${new Date(a.allocated_at).toLocaleDateString()}</td><td><button class="action-btn" data-release="${a.id}">Release</button></td></tr>`).join(""):`<tr><td colspan="6" class="empty">No allocations found.</td></tr>`;document.querySelectorAll("[data-release]").forEach(b=>b.onclick=()=>releaseAllocation(b.dataset.release))}catch(e){toast(e.message)}
}
async function releaseAllocation(id){if(!confirm("Release this allocation?"))return;try{await api(`/allocations/${id}`,{method:"DELETE"});toast("Allocation released.");loadAllocations();loadDashboard()}catch(e){toast(e.message)}}
async function loadManageRooms(){
  try{const d=await api("/rooms");$("manageRoomsTable").innerHTML=d.rooms.map(r=>`<tr><td>${esc(r.room_number)}</td><td>${esc(r.block)}</td><td>${r.capacity}</td><td>${r.occupied_beds}</td><td><span class="pill ${r.status}">${r.status}</span></td><td><button class="action-btn" data-edit="${r.id}">Edit</button> <button class="action-btn" data-delete="${r.id}">Delete</button></td></tr>`).join("");document.querySelectorAll("[data-edit]").forEach(b=>b.onclick=()=>editRoom(b.dataset.edit));document.querySelectorAll("[data-delete]").forEach(b=>b.onclick=()=>deleteRoom(b.dataset.delete))}catch(e){toast(e.message)}
}
function openDialog(id){$(id).showModal()}
function closeDialog(id){$(id).close()}
async function openRequestDialog(){
  try{const d=await api("/rooms");$("requestRoom").innerHTML=d.rooms.filter(r=>r.status==="available").map(r=>`<option value="${r.id}">${esc(r.room_number)} — ${esc(r.block)}</option>`).join("");if(!d.rooms.some(r=>r.status==="available")){toast("No available rooms.");return}openDialog("requestDialog")}catch(e){toast(e.message)}
}
async function loadRequestRooms(){try{const d=await api("/rooms");$("requestRoom").innerHTML=d.rooms.map(r=>`<option value="${r.id}">${esc(r.room_number)} — ${esc(r.block)}</option>`).join("")}catch(e){}}
async function editRoom(id){const r=roomsCache.find(x=>x.id===id);if(!r){const d=await api("/rooms");roomsCache=d.rooms}const x=roomsCache.find(x=>x.id===id);$("editRoomId").value=id;$("roomNumber").value=x.room_number;$("roomBlock").value=x.block;$("roomCapacity").value=x.capacity;$("roomDialogTitle").textContent="Edit room";openDialog("roomDialog")}
async function deleteRoom(id){if(!confirm("Delete this room? It must have no active allocation or request."))return;try{await api(`/rooms/${id}`,{method:"DELETE"});toast("Room deleted.");loadManageRooms();loadDashboard()}catch(e){toast(e.message)}}
$("loginForm").onsubmit=async e=>{e.preventDefault();try{const d=await api("/auth/login",{method:"POST",body:JSON.stringify({email:$("loginEmail").value,password:$("loginPassword").value})});token=d.token;currentUser=d.user;sessionStorage.setItem("hostel_token",token);sessionStorage.setItem("hostel_user",JSON.stringify(currentUser));showApp()}catch(e){toast(e.message)}};
$("registerForm").onsubmit=async e=>{e.preventDefault();try{await api("/auth/register",{method:"POST",body:JSON.stringify({name:$("registerName").value,email:$("registerEmail").value,password:$("registerPassword").value,role:$("registerRole").value})});toast("Account created. Please login.");document.querySelector('[data-auth-tab="login"]').click()}catch(e){toast(e.message)}};
$("logoutBtn").onclick=()=>logout();
document.querySelectorAll(".tab").forEach(b=>b.onclick=()=>showAuth(b.dataset.authTab));
document.querySelectorAll(".nav-link").forEach(b=>b.onclick=()=>navigate(b.dataset.page));
$("roomSearch").oninput=renderRooms;$("roomStatusFilter").onchange=renderRooms;$("maintenanceFilter").onchange=loadMaintenance;$("allocationSearch").oninput=loadAllocations;
$("newRequestBtn").onclick=openRequestDialog;$("addRoomBtn").onclick=()=>{$("roomForm").reset();$("editRoomId").value="";$("roomDialogTitle").textContent="Add room";openDialog("roomDialog")};
document.querySelectorAll("[data-close]").forEach(b=>b.onclick=()=>closeDialog(b.dataset.close));
$("requestForm").onsubmit=async e=>{e.preventDefault();try{await api("/maintenance",{method:"POST",body:JSON.stringify({room_id:$("requestRoom").value,title:$("requestTitle").value,description:$("requestDescription").value,priority:$("requestPriority").value})});closeDialog("requestDialog");e.target.reset();toast("Maintenance request submitted.");loadMaintenance();loadDashboard()}catch(err){toast(err.message)}};
$("roomForm").onsubmit=async e=>{e.preventDefault();const id=$("editRoomId").value;const body={room_number:$("roomNumber").value,block:$("roomBlock").value,capacity:Number($("roomCapacity").value)};try{await api(id?`/rooms/${id}`:"/rooms",{method:id?"PATCH":"POST",body:JSON.stringify(body)});closeDialog("roomDialog");toast(id?"Room updated.":"Room added.");loadManageRooms();loadRooms();loadDashboard()}catch(err){toast(err.message)}};
if(token&&currentUser)showApp();else showAuth();
