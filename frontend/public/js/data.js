var defaultUsers = [
  { id: 1, name: "Gopal Krishna", email: "admin@libraspace.com", password: "krish4318", role: "admin", phone: "9876543210" },
  { id: 2, name: "Gopal Krishna", email: "gopalkrishnagopal6363@gmail.com", password: "krish4318", role: "student", phone: "9876543211" },
  { id: 3, name: "Gopal Krishna", email: "ckrishna2354@gmail.com", password: "krish4318", role: "student", phone: "9876543212" }
];

var defaultMembers = [
  { id: 1, code: "M1001", name: "Gopal Krishna", email: "admin@libraspace.com", phone: "9876543210", role: "Administrator", joinDate: "2026-01-15", status: "Active" },
  { id: 2, code: "M1002", name: "Gopal Krishna", email: "gopalkrishnagopal6363@gmail.com", phone: "9876543211", role: "Student", joinDate: "2026-02-10", status: "Active" },
  { id: 3, code: "M1003", name: "Gopal Krishna", email: "ckrishna2354@gmail.com", phone: "9876543212", role: "Student", joinDate: "2026-03-05", status: "Active" }
];

var defaultBooks = [];

var defaultIssues = [];

var defaultReservations = [];

var defaultReviews = [];

var defaultActivities = [];

function initData() {
  if (!localStorage.getItem("users")) {
    localStorage.setItem("users", JSON.stringify(defaultUsers));
  }
  if (!localStorage.getItem("members")) {
    localStorage.setItem("members", JSON.stringify(defaultMembers));
  }
  if (!localStorage.getItem("books")) {
    localStorage.setItem("books", JSON.stringify(defaultBooks));
  }
  if (!localStorage.getItem("issues")) {
    localStorage.setItem("issues", JSON.stringify(defaultIssues));
  }
  if (!localStorage.getItem("reservations")) {
    localStorage.setItem("reservations", JSON.stringify(defaultReservations));
  }
  if (!localStorage.getItem("reviews")) {
    localStorage.setItem("reviews", JSON.stringify(defaultReviews));
  }
  if (!localStorage.getItem("activities")) {
    localStorage.setItem("activities", JSON.stringify(defaultActivities));
  }
}

function getData(key) {
  var item = localStorage.getItem(key);
  if (item) {
    try {
      return JSON.parse(item);
    } catch (e) {
      // fallback
    }
  }
  if (key === "users") return defaultUsers;
  if (key === "members") return defaultMembers;
  if (key === "books") return defaultBooks;
  if (key === "issues") return defaultIssues;
  if (key === "loans") return defaultIssues;
  if (key === "reservations") return defaultReservations;
  if (key === "reviews") return defaultReviews;
  if (key === "activities") return defaultActivities;
  return [];
}

function saveData(key, val) {
  localStorage.setItem(key, JSON.stringify(val));
}

initData();

var users = getData("users");
var books = getData("books");
var members = getData("members");
var issues = getData("issues");
var reservations = getData("reservations");
var reviews = getData("reviews");
var activities = getData("activities");