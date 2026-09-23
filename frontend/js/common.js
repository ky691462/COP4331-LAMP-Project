const API = "/api/";
function getUser(){ try { return JSON.parse(localStorage.getItem("user")); } catch(e){ return null; } }
function setUser(u){ localStorage.setItem("user", JSON.stringify(u)); }
function logout(){ localStorage.removeItem("user"); location.href = "index.html"; }
function showMsg(el, text, type){ el.textContent = text; el.className = "msg " + (type || ""); }
async function postJSON(endpoint, body){
  const r = await fetch(API + endpoint, {method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(body)});
  return r.json();
}
async function getJSON(endpoint, params, signal){
  const r = await fetch(API + endpoint + "?" + new URLSearchParams(params), {signal});
  return r.json();
}
