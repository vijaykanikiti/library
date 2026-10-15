function getUser() {
  var raw = localStorage.getItem("user");
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

function getLoginUrl() {
  if (window.location.port === "5173" || window.location.pathname.indexOf(".html") === -1) {
    return "/login";
  }
  return "index.html";
}

function checkRole(allowed) {
  var user = getUser();
  var loginUrl = getLoginUrl();
  if (!user) {
    window.location.href = loginUrl;
    return null;
  }
  var ok = false;
  for (var i = 0; i < allowed.length; i++) {
    if (allowed[i] === user.role) {
      ok = true;
      break;
    }
  }
  if (!ok) {
    window.location.href = loginUrl;
    return null;
  }
  return user;
}

var checkAuth = checkRole;

function logout() {
  localStorage.removeItem("user");
  window.location.href = getLoginUrl();
}

function getToday() {
  var d = new Date();
  var month = "" + (d.getMonth() + 1);
  var day = "" + d.getDate();
  var year = d.getFullYear();
  if (month.length < 2) month = "0" + month;
  if (day.length < 2) day = "0" + day;
  return [year, month, day].join("-");
}

function addDays(dateStr, days) {
  var d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  var month = "" + (d.getMonth() + 1);
  var day = "" + d.getDate();
  var year = d.getFullYear();
  if (month.length < 2) month = "0" + month;
  if (day.length < 2) day = "0" + day;
  return [year, month, day].join("-");
}

function calcFine(dueDate, returnDate) {
  var end = returnDate ? new Date(returnDate) : new Date(getToday());
  var due = new Date(dueDate);
  var diffTime = end.getTime() - due.getTime();
  var diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  var rate = 5;
  if (diffDays > 0) {
    return diffDays * rate;
  }
  return 0;
}

function issueBook(bookId, memberId, days) {
  days = days || 14;
  var allBooks = getData("books");
  var allMembers = getData("members");
  var allIssues = getData("issues");

  var book = null;
  for (var i = 0; i < allBooks.length; i++) {
    if (allBooks[i].id == bookId) {
      book = allBooks[i];
      break;
    }
  }

  var member = null;
  for (var j = 0; j < allMembers.length; j++) {
    if (allMembers[j].id == memberId) {
      member = allMembers[j];
      break;
    }
  }

  if (!book) return { ok: false, msg: "Book not found" };
  if (!member) return { ok: false, msg: "Member not found" };
  if (book.available <= 0) return { ok: false, msg: "Book is currently out of stock" };

  book.available -= 1;
  saveData("books", allBooks);

  var issueDate = getToday();
  var dueDate = addDays(issueDate, days);

  var newIssue = {
    id: Date.now(),
    bookId: book.id,
    bookTitle: book.title,
    memberId: member.id,
    memberName: member.name,
    issueDate: issueDate,
    dueDate: dueDate,
    returnDate: "",
    status: "Issued",
    renewals: 0
  };

  allIssues.unshift(newIssue);
  saveData("issues", allIssues);

  var allActivities = getData("activities");
  allActivities.unshift({
    id: Date.now(),
    text: "Book issued: " + book.title + " to " + member.name,
    time: "Just now"
  });
  saveData("activities", allActivities);

  return { ok: true, issue: newIssue };
}

function returnBook(issueId) {
  var allIssues = getData("issues");
  var allBooks = getData("books");

  var issue = null;
  for (var i = 0; i < allIssues.length; i++) {
    if (allIssues[i].id == issueId) {
      issue = allIssues[i];
      break;
    }
  }

  if (!issue) return { ok: false, msg: "Issue record not found" };
  if (issue.status === "Returned") return { ok: false, msg: "Book already returned" };

  issue.status = "Returned";
  issue.returnDate = getToday();

  for (var j = 0; j < allBooks.length; j++) {
    if (allBooks[j].id == issue.bookId) {
      allBooks[j].available += 1;
      break;
    }
  }

  saveData("issues", allIssues);
  saveData("books", allBooks);

  var fine = calcFine(issue.dueDate, issue.returnDate);

  var allActivities = getData("activities");
  allActivities.unshift({
    id: Date.now(),
    text: "Book returned: " + issue.bookTitle + " by " + issue.memberName,
    time: "Just now"
  });
  saveData("activities", allActivities);

  return { ok: true, fine: fine };
}

function renewBook(issueId) {
  var allIssues = getData("issues");
  var issue = null;
  for (var i = 0; i < allIssues.length; i++) {
    if (allIssues[i].id == issueId) {
      issue = allIssues[i];
      break;
    }
  }

  if (!issue) return { ok: false, msg: "Record not found" };
  if (issue.status === "Returned") return { ok: false, msg: "Book already returned" };
  if (issue.renewals >= 2) return { ok: false, msg: "Maximum renewal limit reached (2)" };

  issue.dueDate = addDays(issue.dueDate, 14);
  issue.renewals = (issue.renewals || 0) + 1;
  saveData("issues", allIssues);

  return { ok: true, dueDate: issue.dueDate };
}

function reserveBook(bookId, memberId) {
  var allBooks = getData("books");
  var allMembers = getData("members");
  var allReservations = getData("reservations");

  var book = null;
  for (var i = 0; i < allBooks.length; i++) {
    if (allBooks[i].id == bookId) {
      book = allBooks[i];
      break;
    }
  }

  var member = null;
  for (var j = 0; j < allMembers.length; j++) {
    if (allMembers[j].id == memberId) {
      member = allMembers[j];
      break;
    }
  }

  if (!book || !member) return { ok: false, msg: "Invalid book or member" };

  var newRes = {
    id: Date.now(),
    bookId: book.id,
    bookTitle: book.title,
    memberId: member.id,
    memberName: member.name,
    date: getToday(),
    status: "Waiting"
  };

  allReservations.push(newRes);
  saveData("reservations", allReservations);

  return { ok: true, reservation: newRes };
}

function addReview(bookId, userName, rating, comment) {
  var allReviews = getData("reviews");
  var newReview = {
    id: Date.now(),
    bookId: parseInt(bookId),
    userName: userName,
    rating: parseInt(rating),
    comment: comment,
    date: getToday()
  };
  allReviews.unshift(newReview);
  saveData("reviews", allReviews);
  return { ok: true, review: newReview };
}

function searchBooks(query, category) {
  var allBooks = getData("books");
  query = (query || "").toLowerCase().trim();
  category = category || "All";

  var results = [];
  for (var i = 0; i < allBooks.length; i++) {
    var b = allBooks[i];
    var matchCat = (category === "All" || b.category.toLowerCase() === category.toLowerCase());
    var matchQuery = (!query ||
      b.title.toLowerCase().indexOf(query) !== -1 ||
      b.author.toLowerCase().indexOf(query) !== -1 ||
      b.isbn.toLowerCase().indexOf(query) !== -1 ||
      b.category.toLowerCase().indexOf(query) !== -1
    );

    if (matchCat && matchQuery) {
      results.push(b);
    }
  }
  return results;
}

// Layout helper for dashboard pages
function renderSidebar(activeKey) {
  var user = getUser();
  if (!user) return;

  var sideEl = document.getElementById("sidebar");
  if (!sideEl) return;

  var items = [];

  if (user.role === "admin") {
    items = [
      { key: "dashboard", label: "Dashboard", href: "admin.html", icon: "📊" },
      { key: "books", label: "Books", href: "books.html", icon: "📚" },
      { key: "members", label: "Members", href: "members.html", icon: "👥" },
      { key: "issue", label: "Issue / Return", href: "issue.html", icon: "🔄" },
      { key: "history", label: "Issue History", href: "history.html", icon: "📜" },
      { key: "reservations", label: "Reservations", href: "reservations.html", icon: "🔖" },
      { key: "fines", label: "Fines", href: "fines.html", icon: "💰" },
      { key: "reports", label: "Reports", href: "reports.html", icon: "📈" },
      { key: "users", label: "User Management", href: "users.html", icon: "⚙️" }
    ];
  } else if (user.role === "librarian") {
    items = [
      { key: "dashboard", label: "Dashboard", href: "librarian.html", icon: "📊" },
      { key: "books", label: "Books", href: "books.html", icon: "📚" },
      { key: "members", label: "Members", href: "members.html", icon: "👥" },
      { key: "issue", label: "Issue / Return", href: "issue.html", icon: "🔄" },
      { key: "history", label: "Issue History", href: "history.html", icon: "📜" },
      { key: "reservations", label: "Reservations", href: "reservations.html", icon: "🔖" },
      { key: "fines", label: "Fines", href: "fines.html", icon: "💰" },
      { key: "reports", label: "Reports", href: "reports.html", icon: "📈" }
    ];
  } else {
    // Student
    items = [
      { key: "dashboard", label: "Dashboard", href: "student.html", icon: "📊" },
      { key: "books", label: "Browse Books", href: "books.html", icon: "📚" },
      { key: "reservations", label: "My Reservations", href: "reservations.html", icon: "🔖" },
      { key: "history", label: "My History", href: "history.html", icon: "📜" },
      { key: "fines", label: "My Fines", href: "fines.html", icon: "💰" }
    ];
  }

  var html = '<div class="side-brand">Library<span>MS</span></div><ul class="menu">';
  for (var i = 0; i < items.length; i++) {
    var it = items[i];
    var activeClass = (it.key === activeKey) ? ' class="active"' : '';
    html += '<li' + activeClass + '><a href="' + it.href + '">' + it.icon + ' ' + it.label + '</a></li>';
  }
  html += '</ul>';
  html += '<div class="side-foot"><button class="btn outline sm" style="width:100%" onclick="logout()">Logout</button></div>';

  sideEl.innerHTML = html;
}

function renderTopbar(titleText, subtitleText) {
  var user = getUser();
  if (!user) return;

  var topEl = document.getElementById("topbar");
  if (topEl) {
    var initials = user.name.split(" ").map(function(n) { return n[0]; }).join("").substring(0, 2);
    topEl.innerHTML =
      '<div class="topbar-left">' +
        '<button class="btn menu-toggle" id="menuToggle" type="button" aria-label="Toggle menu">&#9776;</button>' +
        '<div class="search">' +
          '<span class="search-icon">🔍</span>' +
          '<input type="text" id="topSearch" placeholder="Search books, members, ISBN..." onkeydown="handleTopSearch(event)">' +
        '</div>' +
      '</div>' +
      '<div class="topbar-right">' +
        '<div class="user-pill">' +
          '<div class="avatar">' + initials + '</div>' +
          '<div class="user-info">' +
            '<div class="user-name" id="username">' + user.name + '</div>' +
            '<div class="user-role">' + user.role + '</div>' +
          '</div>' +
        '</div>' +
        '<button class="btn sm outline" onclick="logout()">Logout</button>' +
      '</div>';

    var toggle = document.getElementById("menuToggle");
    if (toggle) {
      toggle.onclick = function() {
        var sidebar = document.getElementById("sidebar");
        if (sidebar) sidebar.classList.toggle("open");
      };
    }
  }

  var headEl = document.getElementById("pageHeader");
  if (headEl && titleText) {
    headEl.innerHTML =
      '<div>' +
        '<h2>' + titleText + '</h2>' +
        '<p>' + (subtitleText || "") + '</p>' +
      '</div>' +
      '<div class="head-date">' + new Date().toLocaleDateString("en-US", { weekday: "short", year: "numeric", month: "short", day: "numeric" }) + '</div>';
  }
}

function handleTopSearch(e) {
  if (e.key === "Enter") {
    var query = document.getElementById("topSearch").value;
    window.location.href = "books.html?q=" + encodeURIComponent(query);
  }
}