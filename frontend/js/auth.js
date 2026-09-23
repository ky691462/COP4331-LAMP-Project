const form = document.getElementById("auth-form");
const msg = document.getElementById("msg");
const isRegister = form.dataset.mode === "register";
if (getUser()) location.href = "contacts.html";
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const f = Object.fromEntries(new FormData(form));
  const btn = form.querySelector("button");
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
    showMsg(msg, "Could not reach the server. Try again.", "error");
  }
  btn.disabled = false;
});
