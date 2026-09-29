// Confirmed against the actual files in /var/www/html/api on 2026-09-27.
const EP = {
  searchUsers:    "AdminSearchUsers.php",     // GET  {search, isSuspended: "0"|"1"|omitted} -> {results:[{id,firstName,lastName,login,isAdmin,isSuspended}], error}
  searchContacts: "AdminSearchContacts.php",  // GET  {search}                               -> {results:[{id,firstName,lastName,email,phone,address,userId,ownerLogin}], error}
                                               // NOTE: no userId filter exists server-side. "View entries" works by searching the
                                               // user's login, then filtering to an exact ownerLogin match client-side below.
  setStatus:      "AdminSetUserStatus.php",   // POST {userId, isSuspended: 0|1}             -> {error}
  setRole:        "AdminSetUserRole.php",     // POST {userId, isAdmin: 0|1}                 -> {error}
  changePassword: "AdminChangePassword.php",  // POST {userId, password}                     -> {error}
  createUser:     "AdminCreateUser.php",      // POST {firstName,lastName,login,password,isAdmin} -> {error}
};

const user = getUser();
if (!user) location.href = "index.html";
if (user && !user.isAdmin) location.href = "contacts.html";
document.getElementById("who").textContent = safe(user.firstName) + " " + safe(user.lastName);
document.getElementById("logout").addEventListener("click", logout);

function passwordProblem(pw){
  if (pw.length < 8) return "Password must be at least 8 characters.";
  if (!/[A-Z]/.test(pw)) return "Password needs at least one uppercase letter.";
  if (!/[0-9]/.test(pw)) return "Password needs at least one number.";
  if (!/[^A-Za-z0-9]/.test(pw)) return "Password needs at least one special character.";
  return "";
}

// ---- User search + status filter ----
const uq = document.getElementById("uq"), ustatus = document.getElementById("ustatus");
const uRows = document.getElementById("user-rows"), uMsg = document.getElementById("ustatus-msg");
let uTimer, uCtrl;

async function searchUsers(){
  if (uCtrl) uCtrl.abort();
  uCtrl = new AbortController();
  const params = {search: uq.value.trim()};
  if (ustatus.value === "active") params.isSuspended = "0";
  if (ustatus.value === "suspended") params.isSuspended = "1";
  try {
    const res = await getJSON(EP.searchUsers, params, uCtrl.signal);
    if (res.error) return showMsg(uMsg, res.error, "error");
    renderUsers(res.results || []);
  } catch (e) {
    if (e.name === "AbortError") return;
    console.error("User search error:", e);
    showMsg(uMsg, "Could not load users. Check your connection.", "error");
  }
}

function renderUsers(list){
  uRows.replaceChildren();
  showMsg(uMsg, list.length ? list.length + (list.length === 1 ? " user" : " users") + " found" : "No users match.");
  list.forEach(u => {
    const tr = document.createElement("tr");
    const name = (safe(u.firstName) + " " + safe(u.lastName)).trim() || "(no name)";
    const isAdmin = !!Number(u.isAdmin || 0), isSuspended = !!Number(u.isSuspended || 0);
    const isSelf = String(u.id) === String(user.id);

    const nameTd = document.createElement("td"); nameTd.textContent = name; tr.append(nameTd);
    const loginTd = document.createElement("td"); loginTd.textContent = safe(u.login); tr.append(loginTd);

    const roleTd = document.createElement("td");
    roleTd.innerHTML = `<span class="badge ${isAdmin ? "admin" : "user"}">${isAdmin ? "Admin" : "User"}</span>`;
    tr.append(roleTd);

    const statusTd = document.createElement("td");
    statusTd.innerHTML = `<span class="badge ${isSuspended ? "suspended" : "active"}">${isSuspended ? "Suspended" : "Active"}</span>`;
    tr.append(statusTd);

    const actionsTd = document.createElement("td"); actionsTd.className = "row-actions";
    actionsTd.append(btn("Entries", "ghost small", "View entries for " + name, () => openEntries(u, name)));
    actionsTd.append(btn("Password", "ghost small", "Change password for " + name, () => openPassword(u, name)));

    // The API itself refuses to let an admin change their own role or suspension status.
    const roleBtn = btn(isAdmin ? "Demote" : "Promote", "ghost small", (isAdmin ? "Demote " : "Promote ") + name, () => togglePromote(u, isAdmin));
    const statusBtn = btn(isSuspended ? "Unsuspend" : "Suspend", isSuspended ? "teal small" : "danger small", (isSuspended ? "Unsuspend " : "Suspend ") + name, () => toggleSuspend(u, isSuspended));
    if (isSelf) {
      roleBtn.disabled = true; roleBtn.title = "You can't change your own role.";
      statusBtn.disabled = true; statusBtn.title = "You can't change your own status.";
    }
    actionsTd.append(roleBtn, statusBtn);
    tr.append(actionsTd);
    uRows.append(tr);
  });
}

function btn(text, cls, label, fn){
  const b = document.createElement("button");
  b.type = "button"; b.className = "btn " + cls; b.textContent = text;
  b.setAttribute("aria-label", label); b.onclick = fn;
  return b;
}

async function toggleSuspend(u, currentlySuspended){
  try {
    const res = await postJSON(EP.setStatus, {userId: u.id, isSuspended: currentlySuspended ? 0 : 1});
    if (res.error) return showMsg(uMsg, res.error, "error");
    searchUsers();
  } catch (e) { console.error(e); showMsg(uMsg, "Could not update that user. Try again.", "error"); }
}

async function togglePromote(u, currentlyAdmin){
  try {
    const res = await postJSON(EP.setRole, {userId: u.id, isAdmin: currentlyAdmin ? 0 : 1});
    if (res.error) return showMsg(uMsg, res.error, "error");
    searchUsers();
  } catch (e) { console.error(e); showMsg(uMsg, "Could not update that user. Try again.", "error"); }
}

// ---- Change password dialog ----
const pwDlg = document.getElementById("pw-dlg"), pwForm = document.getElementById("pw-form"), pwMsg = document.getElementById("pw-msg");
let pwTarget = null;
function openPassword(u, name){
  pwTarget = u; pwForm.reset(); showMsg(pwMsg, "");
  document.getElementById("pw-name").textContent = name;
  openDialog(pwDlg);
}
document.getElementById("pw-cancel").onclick = () => pwDlg.close();
pwForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const pw = pwForm.password.value;
  const problem = passwordProblem(pw);
  if (problem) return showMsg(pwMsg, problem, "error");
  try {
    const res = await postJSON(EP.changePassword, {userId: pwTarget.id, password: pw});
    if (res.error) return showMsg(pwMsg, res.error, "error");
    pwDlg.close();
  } catch (e) { console.error(e); showMsg(pwMsg, "Could not save. Try again.", "error"); }
});

// ---- View entries dialog ----
// AdminSearchContacts.php has no per-user filter, only a free-text "search" that also matches
// the owner's login. So we fetch by that user's login, keep only exact owner matches, then
// filter that list client-side as the person types in the dialog's own search box.
const entriesDlg = document.getElementById("entries-dlg"), entriesRows = document.getElementById("entries-rows"), entriesQ = document.getElementById("entries-q");
let entriesAll = [];
function openEntries(u, name){
  document.getElementById("entries-name").textContent = name;
  entriesQ.value = "";
  openDialog(entriesDlg);
  loadEntries(u);
}
document.getElementById("entries-close").onclick = () => entriesDlg.close();
entriesQ.addEventListener("input", () => renderEntries(entriesAll));

async function loadEntries(u){
  entriesRows.replaceChildren();
  try {
    const res = await getJSON(EP.searchContacts, {search: u.login});
    entriesAll = (res.results || []).filter(c => c.ownerLogin === u.login);
    renderEntries(entriesAll);
  } catch (e) { console.error(e); }
}
function renderEntries(list){
  const q = entriesQ.value.trim().toLowerCase();
  const filtered = q ? list.filter(c =>
    [c.firstName, c.lastName, c.email, c.phone, c.address].some(v => safe(v).toLowerCase().includes(q))
  ) : list;
  entriesRows.replaceChildren();
  filtered.forEach(c => {
    const tr = document.createElement("tr");
    [((safe(c.firstName) + " " + safe(c.lastName)).trim() || "(no name)"), c.email, c.phone].forEach(t => {
      const td = document.createElement("td"); td.textContent = safe(t); tr.append(td);
    });
    entriesRows.append(tr);
  });
}

// ---- Create account ----
const createForm = document.getElementById("create-form"), createMsg = document.getElementById("create-msg");
createForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const f = Object.fromEntries(new FormData(createForm));
  const problem = passwordProblem(f.password);
  if (problem) return showMsg(createMsg, problem, "error");
  const payload = {firstName: f.firstName, lastName: f.lastName, login: f.login, password: f.password, isAdmin: f.role === "admin" ? 1 : 0};
  try {
    const res = await postJSON(EP.createUser, payload);
    if (res.error) return showMsg(createMsg, res.error, "error");
    showMsg(createMsg, "Account created.", "ok");
    createForm.reset();
    searchUsers();
  } catch (e) { console.error(e); showMsg(createMsg, "Could not create account. Try again.", "error"); }
});

uq.addEventListener("input", () => { clearTimeout(uTimer); uTimer = setTimeout(searchUsers, 250); });
ustatus.addEventListener("change", searchUsers);
searchUsers();
