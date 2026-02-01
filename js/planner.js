// planner.js (simple, readable)

// ===== Auth Guard =====
if (localStorage.getItem("isLoggedIn") !== "true") {
  window.location.href = "../auth/login.html";
}

// ===== Navbar Toggle + Logout =====
const navToggle = document.getElementById("navToggle");
const navMenu = document.getElementById("navMenu");
if (navToggle && navMenu) {
  navToggle.addEventListener("click", function () {
    navMenu.classList.toggle("open");
  });
}

const logoutBtn = document.getElementById("logoutBtn");
if (logoutBtn) {
  logoutBtn.addEventListener("click", function () {
    localStorage.setItem("isLoggedIn", "false");
    window.location.href = "../auth/login.html";
  });
}

// ===== Header Info (date + semester) =====
const today = new Date();
document.getElementById("todayText").innerText = today.toLocaleDateString("en-IN", {
  day: "2-digit", month: "short", year: "numeric"
});

const profile = JSON.parse(localStorage.getItem("studentProfile")) || {};
document.getElementById("semText").innerText = profile.semester || "—";

// ===== Utility =====
function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function load(key) {
  return JSON.parse(localStorage.getItem(key)) || [];
}

function save(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

function uid(prefix) {
  return prefix + "_" + Date.now() + "_" + Math.floor(Math.random() * 1000);
}

// ===== TODOS =====
const todoForm = document.getElementById("todoForm");
const todoListEl = document.getElementById("todoList");
const todoBadge = document.getElementById("todoBadge");
const clearTodoBtn = document.getElementById("clearTodoBtn");

// default date = today
document.getElementById("todoDate").value = todayISO();

function renderTodos() {
  const todos = load("todos");
  todoBadge.innerText = String(todos.length);

  todoListEl.innerHTML = "";

  if (todos.length === 0) {
    todoListEl.innerHTML = `<li class="empty">No tasks added yet.</li>`;
    return;
  }

  // show latest first
  const sorted = [...todos].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

  for (let i = 0; i < sorted.length; i++) {
    const t = sorted[i];

    const li = document.createElement("li");
    li.className = "item";

    const unitText = t.unit ? `Unit ${t.unit}` : "Unit —";
    const durText = t.duration ? `${t.duration} min` : "—";
    const dateText = t.date || "—";

    li.innerHTML = `
      <div class="item-top">
        <div>
          <p class="item-title">${t.subject} • ${t.type}</p>
          <p class="item-meta">${unitText} • ${durText} • ${dateText}</p>
        </div>
        <span class="item-meta">${t.isDone ? "Done ✅" : "Pending"}</span>
      </div>

      <div class="item-actions">
        <button class="small-btn done" data-action="toggle" data-id="${t.id}">
          ${t.isDone ? "Mark Pending" : "Mark Done"}
        </button>
        <button class="small-btn danger" data-action="delete" data-id="${t.id}">
          Delete
        </button>
      </div>
    `;

    todoListEl.appendChild(li);
  }
}

todoForm.addEventListener("submit", function (e) {
  e.preventDefault();

  const subject = document.getElementById("todoSubject").value.trim();
  const type = document.getElementById("todoType").value;
  const unitVal = document.getElementById("todoUnit").value;
  const durationVal = document.getElementById("todoDuration").value;
  const date = document.getElementById("todoDate").value || todayISO();

  if (!subject) {
    alert("Please enter a subject.");
    return;
  }

  // unit optional but if provided, keep in 1-5
  let unit = "";
  if (unitVal) {
    const n = Number(unitVal);
    if (n < 1 || n > 5) {
      alert("Unit must be between 1 and 5.");
      return;
    }
    unit = n;
  }

  // duration optional but if provided, should be positive
  let duration = "";
  if (durationVal) {
    const d = Number(durationVal);
    if (d < 5 || d > 600) {
      alert("Duration should be between 5 and 600 minutes.");
      return;
    }
    duration = d;
  }

  const todos = load("todos");
  todos.push({
    id: uid("t"),
    subject,
    type,
    unit,
    duration,
    date,
    isDone: false,
    createdAt: Date.now()
  });

  save("todos", todos);

  todoForm.reset();
  document.getElementById("todoType").value = "Revision";
  document.getElementById("todoDate").value = todayISO();

  renderTodos();
});

todoListEl.addEventListener("click", function (e) {
  const btn = e.target.closest("button");
  if (!btn) return;

  const action = btn.getAttribute("data-action");
  const id = btn.getAttribute("data-id");

  let todos = load("todos");

  if (action === "delete") {
    todos = todos.filter(t => t.id !== id);
    save("todos", todos);
    renderTodos();
  }

  if (action === "toggle") {
    for (let i = 0; i < todos.length; i++) {
      if (todos[i].id === id) {
        todos[i].isDone = !todos[i].isDone;
        break;
      }
    }
    save("todos", todos);
    renderTodos();
  }
});

clearTodoBtn.addEventListener("click", function () {
  const ok = confirm("Clear all tasks? This cannot be undone.");
  if (!ok) return;
  localStorage.removeItem("todos");
  renderTodos();
});

// ===== DEADLINES =====
const deadlineForm = document.getElementById("deadlineForm");
const deadlineListEl = document.getElementById("deadlineList");
const deadlineBadge = document.getElementById("deadlineBadge");
const clearDeadlineBtn = document.getElementById("clearDeadlineBtn");

function renderDeadlines() {
  const deadlines = load("deadlines");
  deadlineBadge.innerText = String(deadlines.length);

  deadlineListEl.innerHTML = "";

  if (deadlines.length === 0) {
    deadlineListEl.innerHTML = `<li class="empty">No deadlines added yet.</li>`;
    return;
  }

  const sorted = [...deadlines].sort((a, b) => (a.date || "").localeCompare(b.date || ""));

  for (let i = 0; i < sorted.length; i++) {
    const d = sorted[i];

    const li = document.createElement("li");
    li.className = "item";

    li.innerHTML = `
      <div class="item-top">
        <div>
          <p class="item-title">${d.type} • ${d.subject}</p>
          <p class="item-meta">${d.date} ${d.notes ? "• " + d.notes : ""}</p>
        </div>
        <button class="small-btn danger" data-action="delete" data-id="${d.id}">Delete</button>
      </div>
    `;

    deadlineListEl.appendChild(li);
  }
}

deadlineForm.addEventListener("submit", function (e) {
  e.preventDefault();

  const type = document.getElementById("deadlineType").value;
  const subject = document.getElementById("deadlineSubject").value.trim();
  const date = document.getElementById("deadlineDate").value;
  const notes = document.getElementById("deadlineNotes").value.trim();

  if (!subject) {
    alert("Please enter a subject.");
    return;
  }
  if (!date) {
    alert("Please select a date.");
    return;
  }

  const deadlines = load("deadlines");
  deadlines.push({
    id: uid("d"),
    type,
    subject,
    date,
    notes,
    createdAt: Date.now()
  });

  save("deadlines", deadlines);

  deadlineForm.reset();
  renderDeadlines();
});

deadlineListEl.addEventListener("click", function (e) {
  const btn = e.target.closest("button");
  if (!btn) return;

  const action = btn.getAttribute("data-action");
  const id = btn.getAttribute("data-id");

  if (action === "delete") {
    let deadlines = load("deadlines");
    deadlines = deadlines.filter(d => d.id !== id);
    save("deadlines", deadlines);
    renderDeadlines();
  }
});

clearDeadlineBtn.addEventListener("click", function () {
  const ok = confirm("Clear all deadlines? This cannot be undone.");
  if (!ok) return;
  localStorage.removeItem("deadlines");
  renderDeadlines();
});

// ===== Init =====
renderTodos();
renderDeadlines();