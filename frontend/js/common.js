const API = "/api/";
function getUser(){ try { return JSON.parse(localStorage.getItem("user")); } catch(e){ return null; } }
function setUser(u){ localStorage.setItem("user", JSON.stringify(u)); }
function clearUser(){ localStorage.removeItem("user"); }
function safe(v){ return v === null || v === undefined ? "" : v; }

async function logout(){
  try { await postJSON("Logout.php", {}); } catch(e) { /* still log out locally even if this fails */ }
  clearUser();
  location.href = "index.html";
}

// The backend always answers 200 OK, even when the session is missing or timed out —
// it signals that through the JSON body instead of an HTTP status code.
function isAuthError(data){
  return data && (data.error === "Not logged in" || data.error === "Session expired");
}
function handleAuthFailure(){
  clearUser();
  location.href = "index.html?expired=1";
}

async function postJSON(endpoint, body){
  const r = await fetch(API + endpoint, {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    credentials: "same-origin",
    body: JSON.stringify(body)
  });
  const data = await r.json();
  if (isAuthError(data)) { handleAuthFailure(); throw new Error(data.error); }
  return data;
}

async function getJSON(endpoint, params, signal){
  const r = await fetch(API + endpoint + "?" + new URLSearchParams(params), {credentials: "same-origin", signal});
  const data = await r.json();
  if (isAuthError(data)) { handleAuthFailure(); throw new Error(data.error); }
  return data;
}

function showMsg(el, text, type){ el.textContent = text; el.className = "msg " + (type || ""); }

// Re-triggers the CSS page-flip animation every time a dialog opens (classes only
// animate on a fresh add, so we remove + force reflow + re-add before showModal()).
function openDialog(dlg){
  dlg.classList.remove("flip-in");
  void dlg.offsetWidth;
  dlg.classList.add("flip-in");
  dlg.showModal();
}
