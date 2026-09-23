const user = getUser();
if (!user) location.href = "login.html";
document.getElementById("who").textContent = user.firstName + " " + user.lastName;
document.getElementById("logout").addEventListener("click", logout);
const q = document.getElementById("q"), body = document.getElementById("rows"), status = document.getElementById("status");
const dlg = document.getElementById("contact-dlg"), form = document.getElementById("contact-form"), fmsg = document.getElementById("form-msg");
const del = document.getElementById("delete-dlg");
const COLORS = ["#4338ca","#0f766e","#b45309","#be185d","#1d4ed8","#7c3aed"];
let timer, ctrl, deleteId = null;

async function search(){
  if (ctrl) ctrl.abort();
  ctrl = new AbortController();
  try {
    const res = await getJSON("SearchContacts.php", {search:q.value.trim(), userId:user.id}, ctrl.signal);
    if (res.error) return showMsg(status, res.error, "error");
    render(res.results);
  } catch (e) { if (e.name !== "AbortError") showMsg(status, "Search failed. Check your connection.", "error"); }
}
function render(list){
  body.replaceChildren();
  showMsg(status, list.length ? list.length + (list.length === 1 ? " contact" : " contacts") + " found" : (q.value ? "No contacts match your search." : "No contacts yet. Add your first one."));
  list.forEach(c => {
    const tr = document.createElement("tr");
    const nm = document.createElement("td"), wrap = document.createElement("div"), av = document.createElement("span");
    wrap.className = "name"; av.className = "avatar"; av.setAttribute("aria-hidden", "true");
    av.textContent = ((c.firstName[0] || "") + (c.lastName[0] || "")).toUpperCase();
    av.style.setProperty("--c", COLORS[(c.firstName.length + c.lastName.length + c.id) % COLORS.length]);
    wrap.append(av, document.createTextNode(c.firstName + " " + c.lastName)); nm.append(wrap); tr.append(nm);
    [c.email, c.phone, c.address].forEach(t => { const td = document.createElement("td"); td.textContent = t; tr.append(td); });
    const td = document.createElement("td"); td.className = "row-actions";
    const name = c.firstName + " " + c.lastName;
    td.append(btn("Edit", "ghost small", "Edit " + name, () => openForm(c)), btn("Delete", "danger small", "Delete " + name, () => { deleteId = c.id; document.getElementById("del-name").textContent = name; del.showModal(); }));
    tr.append(td); body.append(tr);
  });
}
function btn(text, cls, label, fn){ const b = document.createElement("button"); b.type = "button"; b.className = "btn " + cls; b.textContent = text; b.setAttribute("aria-label", label); b.onclick = fn; return b; }
function openForm(c){
  form.reset(); showMsg(fmsg, "");
  document.getElementById("dlg-title").textContent = c ? "Edit contact" : "Add contact";
  form.elements["id"].value = c ? c.id : "";
  if (c) ["firstName","lastName","email","phone","address"].forEach(k => form[k].value = c[k] || "");
  dlg.showModal(); form.firstName.focus();
}
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const f = Object.fromEntries(new FormData(form)); f.userId = user.id;
  const editing = !!f.id;
  try {
    const res = await postJSON(editing ? "UpdateContact.php" : "AddContact.php", f);
    if (res.error) return showMsg(fmsg, res.error, "error");
    dlg.close(); search();
  } catch (err) { showMsg(fmsg, "Could not save. Try again.", "error"); }
});
document.getElementById("add").onclick = () => openForm(null);
document.getElementById("cancel").onclick = () => dlg.close();
document.getElementById("del-cancel").onclick = () => del.close();
document.getElementById("del-ok").onclick = async () => {
  try {
    const res = await postJSON("DeleteContact.php", {id:deleteId, userId:user.id});
    del.close();
    res.error ? showMsg(status, res.error, "error") : search();
  } catch (e) { del.close(); showMsg(status, "Could not delete. Try again.", "error"); }
};
q.addEventListener("input", () => { clearTimeout(timer); timer = setTimeout(search, 250); });
search();
