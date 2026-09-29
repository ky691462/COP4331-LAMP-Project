const user = getUser();
if (!user) location.href = "index.html";
if (user.isAdmin) document.getElementById("admin-link").style.display = "inline-block";
document.getElementById("who").textContent = safe(user.firstName) + " " + safe(user.lastName);
document.getElementById("logout").addEventListener("click", logout);
const q = document.getElementById("q"), entries = document.getElementById("entries"), status = document.getElementById("status");
const dlg = document.getElementById("contact-dlg"), form = document.getElementById("contact-form"), fmsg = document.getElementById("form-msg");
const del = document.getElementById("delete-dlg");
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

function linkBtn(text, cls, label, fn){
  const b = document.createElement("button");
  b.type = "button"; b.className = "link-btn " + cls; b.textContent = text;
  b.setAttribute("aria-label", label); b.onclick = fn;
  return b;
}

function render(list){
  showMsg(status, list.length ? list.length + (list.length === 1 ? " contact" : " contacts") + " found" : (q.value ? "No contacts match your search." : "No contacts yet. Add your first one."));
  entries.replaceChildren();
  const sorted = [...list].sort((a, b) =>
    (safe(a.lastName) + " " + safe(a.firstName)).localeCompare(safe(b.lastName) + " " + safe(b.firstName), undefined, {sensitivity: "base"}));
  const present = new Set();
  let group = null, ul = null;

  sorted.forEach(c => {
    const first = safe(c.firstName), last = safe(c.lastName);
    const key = ((last || first).trim()[0] || "#").toUpperCase();
    if (key !== group) {
      group = key; present.add(key);
      const sec = document.createElement("section"); sec.className = "letter-group";
      const h = document.createElement("h2"); h.className = "letter";
      const sp = document.createElement("span"); sp.textContent = key; h.append(sp);
      ul = document.createElement("ul"); ul.className = "entries";
      sec.append(h, ul); entries.append(sec);
    }
    const li = document.createElement("li"); li.className = "entry";
    const main = document.createElement("div"); main.className = "entry-main";
    const nm = document.createElement("span"); nm.className = "entry-name";
    const strong = document.createElement("strong"); strong.textContent = last || first || "(no name)";
    nm.append(strong);
    if (last && first) nm.append(document.createTextNode(", " + first));
    const lead = document.createElement("span"); lead.className = "leader"; lead.setAttribute("aria-hidden", "true");
    const ph = document.createElement("span"); ph.className = "entry-phone"; ph.textContent = safe(c.phone);
    main.append(nm, lead, ph);
    li.append(main);
    const sub = [safe(c.address), safe(c.email)].filter(Boolean).join("  \u00b7  ");
    if (sub) { const d = document.createElement("div"); d.className = "entry-sub"; d.textContent = sub; li.append(d); }
    const label = (first + " " + last).trim() || "this contact";
    const acts = document.createElement("div"); acts.className = "entry-actions";
    acts.append(
      linkBtn("Edit", "", "Edit " + label, () => openForm(c)),
      linkBtn("Delete", "danger", "Delete " + label, () => { deleteId = c.id; document.getElementById("del-name").textContent = label; openDialog(del); })
    );
    li.append(acts); ul.append(li);
  });

  if (!list.length) {
    const p = document.createElement("p"); p.className = "dir-empty";
    p.textContent = q.value ? "No listings match your search." : "No listings yet. Add the first entry.";
    entries.append(p);
  }
  const lastName = c => (safe(c.lastName) || safe(c.firstName) || "").toUpperCase();
  document.getElementById("guide-l").textContent = sorted.length ? lastName(sorted[0]) : "\u2014";
  document.getElementById("guide-r").textContent = sorted.length ? lastName(sorted[sorted.length - 1]) : "\u2014";
  document.getElementById("dir-foot").textContent = "\u2014  " + list.length + (list.length === 1 ? " listing" : " listings") + "  \u2014";
  document.querySelectorAll(".thumb-index span").forEach(t => t.classList.toggle("on", present.has(t.textContent)));
}

function openForm(c){
  form.reset(); showMsg(fmsg, "");
  form.querySelector("button.btn:not(.ghost)").disabled = false;
  document.getElementById("dlg-title").textContent = c ? "Edit contact" : "Add contact";
  form.elements["id"].value = c ? c.id : "";
  if (c) ["firstName","lastName","email","phone","address"].forEach(k => form[k].value = safe(c[k]));
  openDialog(dlg); form.firstName.focus();
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const f = Object.fromEntries(new FormData(form));
  const editing = !!f.id;
  const saveBtn = form.querySelector("button.btn:not(.ghost)");
  saveBtn.disabled = true;
  try {
    const res = await postJSON(editing ? "EditContact.php" : "AddContact.php", f);
    if (res.error) { showMsg(fmsg, res.error, "error"); saveBtn.disabled = false; return; }
    saveBtn.disabled = false;
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
