//Getting student from storage:
function getProfile() {
  const raw = localStorage.getItem("studentProfile");
  return raw ? JSON.parse(raw) : null; //convert string into js object
}

//Saving details in sorage:
function setProfile(profile) {
  localStorage.setItem("studentProfile", JSON.stringify(profile));
}

//LOGIN 
function handleLoginSubmit(e) {
  e.preventDefault();

  const erpId = document.querySelector('input[name="erpId"]').value.trim();
  const password = document.querySelector('input[name="password"]').value;

  const profile = getProfile();

  if (!profile) {
    alert("No account found. Please register first.");
    window.location.href = "register.html";
    return;
  }

  if (erpId !== profile.erp) {
    alert("Invalid ERP ID.");
    return;
  }

  if (password !== profile.password) {
    alert("Invalid password.");
    return;
  }

  localStorage.setItem("isLoggedIn", "true");
  window.location.href = "../dashboard/dashboard.html";
}

//REGISTER
function handleRegisterSubmit(e) {
  e.preventDefault();

  const name = document.getElementById("name").value.trim();
  const erp = document.getElementById("erp").value.trim();
  const course = document.getElementById("course").value.trim();
  const semesterInput = document.getElementById("semester").value.trim();
  const password = document.getElementById("password").value;
  const confirm = document.getElementById("confirmPassword").value;

  //check semester
  if (semesterInput < 1 || semesterInput > 8) {
    alert("Semester must be between 1 and 8.");
    return;
  }

  if (password.length < 4) {
    alert("Password must be at least 4 characters.");
    return;
  } //pass length

  if (password !== confirm) {
    alert("Passwords do not match.");
    return;
  } //pass match

  const studentProfile = {
    name,
    erp,
    course,
    semester: semesterInput,
    password
  }; //created an object 

  setProfile(studentProfile);//Saved object in local storage

  localStorage.setItem("isLoggedIn", "true");
  window.location.href = "../dashboard/dashboard.html";
}

//Bind form events
(function bindAuthForms() {
  const form = document.querySelector("form[data-page]");
  if (!form) return;

  const page = form.getAttribute("data-page");

  if (page === "login") {
    form.addEventListener("submit", handleLoginSubmit);
  } else if (page === "register") {
    form.addEventListener("submit", handleRegisterSubmit);
  }
})();
