const form = document.getElementById("auth-form");
const msg = document.getElementById("msg");
const isRegister = form.dataset.mode === "register";
if (getUser()) location.href = "contacts.html";

if (!isRegister && new URLSearchParams(location.search).get("expired")) {
  showMsg(msg, "You were signed out after being inactive. Please sign in again.", "error");
}

// Mirrors the backend's password rule: 8+ chars, one uppercase, one number, one special character.
function passwordProblem(pw){
  if (pw.length < 8) return "Password must be at least 8 characters.";
  if (!/[A-Z]/.test(pw)) return "Password needs at least one uppercase letter.";
  if (!/[0-9]/.test(pw)) return "Password needs at least one number.";
  if (!/[^A-Za-z0-9]/.test(pw)) return "Password needs at least one special character.";
  return "";
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const f = Object.fromEntries(new FormData(form));
  const btn = form.querySelector("button");

  if (isRegister) {
    const problem = passwordProblem(f.password);
    if (problem) return showMsg(msg, problem, "error");
  }

  btn.disabled = true;
  showMsg(msg, isRegister ? "Creating account..." : "Signing in...");
  try {
    const res = await postJSON(isRegister ? "Register.php" : "Login.php", f);
    if (res.error) {
      showMsg(msg, res.error === "No Records Found" ? "Wrong username or password." : res.error, "error");
    } else {
      setUser({id: res.id, firstName: res.firstName, lastName: res.lastName});
      location.href = "contacts.html";
      return;
    }
  } catch (err) {
    console.error("Auth error:", err);
    showMsg(msg, "Could not reach the server. Try again.", "error");
  }
  btn.disabled = false;
});
