const user = getUser();
if (!user) location.href = "login.html";
document.getElementById("who").textContent = safe(user.firstName) + " " + safe(user.lastName);
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
    const res = await getJSON("SearchContacts.php", {search: q.value.trim()}, ctrl.signal);
    if (res.error) return showMsg(status, res.error, "error");
    render(res.results || []);
  } catch (e) {
    if (e.name === "AbortError") return;
    console.error("Search error:", e);
    showMsg(status, "Search failed. Check your connection.", "error");
  }
}

function render(list){
  body.replaceChildren();
  showMsg(status, list.length ? list.length + (list.length === 1 ? " contact" : " contacts") + " found" : (q.value ? "No contacts match your search." : "No contacts yet. Add your first one."));
  list.forEach(c => {
    const tr = document.createElement("tr");
    const first = safe(c.firstName), last = safe(c.lastName);
    const nm = document.createElement("td"), wrap = document.createElement("div"), av = document.createElement("span");
    wrap.className = "name"; av.className = "avatar"; av.setAttribute("aria-hidden", "true");
    const initials = ((first[0] || "") + (last[0] || "")).toUpperCase();
    av.textContent = initials;
    av.style.setProperty("--c", COLORS[(String(c.id || 0).length + first.length + last.length) % COLORS.length]);
    wrap.append(av, document.createTextNode((first + " " + last).trim() || "(no name)"));
    nm.append(wrap); tr.append(nm);
    [c.email, c.phone, c.address].forEach(t => { const td = document.createElement("td"); td.textContent = safe(t); tr.append(td); });
    const td = document.createElement("td"); td.className = "row-actions";
    const label = (first + " " + last).trim() || "this contact";
    td.append(
      btn("Edit", "ghost small", "Edit " + label, () => openForm(c)),
      btn("Delete", "danger small", "Delete " + label, () => { deleteId = c.id; document.getElementById("del-name").textContent = label; del.showModal(); })
    );
    tr.append(td); body.append(tr);
  });
}

function btn(text, cls, label, fn){
  const b = document.createElement("button");
  b.type = "button"; b.className = "btn " + cls; b.textContent = text;
  b.setAttribute("aria-label", label); b.onclick = fn;
  return b;
}

function openForm(c){
  form.reset(); showMsg(fmsg, "");
  document.getElementById("dlg-title").textContent = c ? "Edit contact" : "Add contact";
  form.elements["id"].value = c ? c.id : "";
  if (c) ["firstName","lastName","email","phone","address"].forEach(k => form[k].value = safe(c[k]));
  dlg.showModal(); form.firstName.focus();
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const f = Object.fromEntries(new FormData(form));
  const editing = !!f.id;
  const saveBtn = form.querySelector("button.btn:not(.ghost)");
  saveBtn.disabled = true;
  try {
    const res = await postJSON(editing ? "UpdateContact.php" : "AddContact.php", f);
    if (res.error) { showMsg(fmsg, res.error, "error"); saveBtn.disabled = false; return; }
    dlg.close();
    search();
  } catch (err) {
    console.error("Save error:", err);
    showMsg(fmsg, "Could not save. Try again.", "error");
    saveBtn.disabled = false;
  }
});

document.getElementById("add").onclick = () => openForm(null);
document.getElementById("cancel").onclick = () => dlg.close();
document.getElementById("del-cancel").onclick = () => del.close();
document.getElementById("del-ok").onclick = async () => {
  const okBtn = document.getElementById("del-ok");
  okBtn.disabled = true;
  try {
    const res = await postJSON("DeleteContact.php", {id: deleteId});
    del.close(); okBtn.disabled = false;
    res.error ? showMsg(status, res.error, "error") : search();
  } catch (e) {
    console.error("Delete error:", e);
    del.close(); okBtn.disabled = false;
    showMsg(status, "Could not delete. Try again.", "error");
  }
};

q.addEventListener("input", () => { clearTimeout(timer); timer = setTimeout(search, 250); });
search();
