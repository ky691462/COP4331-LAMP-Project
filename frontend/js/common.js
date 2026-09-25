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

// If the server says the session is gone (expired or never logged in),
// send the person back to login instead of showing a confusing error.
function handleAuthFailure(){
  clearUser();
  location.href = "login.html?expired=1";
}

async function postJSON(endpoint, body){
  const r = await fetch(API + endpoint, {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    credentials: "same-origin",
    body: JSON.stringify(body)
  });
  if (r.status === 401 || r.status === 403) { handleAuthFailure(); throw new Error("session expired"); }
  return r.json();
}

async function getJSON(endpoint, params, signal){
  const r = await fetch(API + endpoint + "?" + new URLSearchParams(params), {credentials: "same-origin", signal});
  if (r.status === 401 || r.status === 403) { handleAuthFailure(); throw new Error("session expired"); }
  return r.json();
}

function showMsg(el, text, type){ el.textContent = text; el.className = "msg " + (type || ""); }
