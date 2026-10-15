function goToDashboard(role) {
  if (role === "admin") {
    window.location.href = "admin.html";
  } else if (role === "librarian") {
    window.location.href = "librarian.html";
  } else if (role === "student") {
    window.location.href = "student.html";
  }
}

// Redirect logged in user opening index.html straight to their dashboard
var path = window.location.pathname;
var isIndex = path.indexOf("index.html") !== -1 || path.slice(-1) === "/" || path === "";
var savedUser = localStorage.getItem("user");

if (isIndex && savedUser && window.location.search.indexOf("home") === -1) {
  try {
    var logged = JSON.parse(savedUser);
    if (logged && logged.role) {
      goToDashboard(logged.role);
    }
  } catch (err) {
    localStorage.removeItem("user");
  }
}

function handleGoogleSuccess(googleUser) {
  var email = (googleUser.email || "").toLowerCase();
  var name = googleUser.displayName || email.split("@")[0] || "Student";
  var allUsers = getData("users");

  var match = null;
  for (var i = 0; i < allUsers.length; i++) {
    if (allUsers[i].email.toLowerCase() === email) {
      match = allUsers[i];
      break;
    }
  }

  if (!match) {
    match = {
      id: allUsers.length + 1,
      name: name,
      email: email,
      password: "",
      role: "student"
    };
    allUsers.push(match);
    saveData("users", allUsers);
  }

  localStorage.setItem("user", JSON.stringify(match));
  goToDashboard(match.role);
}

function loginWithGoogle() {
  var gName = prompt("Enter Google Account Name (e.g. Gopal Krishna):", "Gopal Krishna");
  if (gName === null) return;
  var gEmail = prompt("Enter Google Account Email:", "gopal@lib.com");
  if (!gEmail) return;

  handleGoogleSuccess({
    displayName: gName.trim(),
    email: gEmail.trim()
  });
}

// Password eye toggle
function togglePassword(inputId, iconId) {
  var input = document.getElementById(inputId);
  var icon = document.getElementById(iconId);
  if (!input) return;
  if (input.type === "password") {
    input.type = "text";
    if (icon) icon.textContent = "👁️‍🗨️";
  } else {
    input.type = "password";
    if (icon) icon.textContent = "👁️";
  }
}

// Login form handler
var loginForm = document.getElementById("loginForm");
if (loginForm) {
  // auto-fill remembered email
  var remembered = localStorage.getItem("lib_remember_email");
  if (remembered) {
    var emailInput = document.getElementById("email");
    if (emailInput) emailInput.value = remembered;
    var remCheck = document.getElementById("remember");
    if (remCheck) remCheck.checked = true;
  }

  loginForm.addEventListener("submit", function(e) {
    e.preventDefault();

    var email = document.getElementById("email").value;
    var password = document.getElementById("password").value;
    var error = document.getElementById("error");
    var remCheck = document.getElementById("remember");

    if (remCheck && remCheck.checked) {
      localStorage.setItem("lib_remember_email", email.trim());
    } else {
      localStorage.removeItem("lib_remember_email");
    }

    var allUsers = getData("users");
    var match = null;
    for (var i = 0; i < allUsers.length; i++) {
      if (allUsers[i].email.toLowerCase() === email.trim().toLowerCase() && allUsers[i].password === password) {
        match = allUsers[i];
        break;
      }
    }

    if (match) {
      localStorage.setItem("user", JSON.stringify(match));
      goToDashboard(match.role);
    } else {
      if (error) {
        error.textContent = "Wrong email or password";
      }
    }
  });
}