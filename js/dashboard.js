// Check Login
(function authGuard() {
  const loggedIn = localStorage.getItem("isLoggedIn");
  if (loggedIn !== "true") {
    window.location.href = "../auth/login.html";
  }
})();

// ================== SEMESTER -> SUBJECTS MAP ==================
const SEMESTER_SUBJECTS = {
  "1": [
    { slug: "pf", name: "Programming Fundamentals" },
    { slug: "math1", name: "Mathematics-I" },
    { slug: "de", name: "Digital Electronics" },
    { slug: "cs", name: "Communication Skills" },
    { slug: "pc", name: "PC Software" }
  ],
  "2": [
    { slug: "c", name: "C Programming" },
    { slug: "math2", name: "Mathematics-II" },
    { slug: "ds", name: "Data Structures" },
    { slug: "co", name: "Computer Organization" },
    { slug: "evs", name: "EVS" }
  ],
  "3": [
    { slug: "java", name: "Java" },
    { slug: "dbms", name: "DBMS" },
    { slug: "os", name: "Operating Systems" },
    { slug: "dm", name: "Discrete Mathematics" },
    { slug: "web", name: "Web Technologies" }
  ],
  "4": [
    { slug: "cn", name: "Computer Networks" },
    { slug: "se", name: "Software Engineering" },
    { slug: "cbnst", name: "CBNST" },
    { slug: "ob", name: "Organizational Behavior" },
    { slug: "ai", name: "AI Basics" }
  ],
  "5": [
    { slug: "python", name: "Python" },
    { slug: "cloud", name: "Cloud Computing" },
    { slug: "cyber", name: "Cyber Security" },
    { slug: "dm2", name: "Data Mining" },
    { slug: "mobile", name: "Mobile Computing" }
  ],
  "6": [
    { slug: "ml", name: "Machine Learning" },
    { slug: "bigdata", name: "Big Data" },
    { slug: "project", name: "Project" },
    { slug: "intern", name: "Internship" },
    { slug: "elective", name: "Elective" }
  ]
};

// ================== HELPERS ==================
function $(id) {
  return document.getElementById(id);
}

function loadJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function todayISO() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function addDaysISO(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function formatDateParts(dateObj) {
  const dayName = dateObj.toLocaleDateString("en-IN", { weekday: "long" });
  const dayNum = dateObj.toLocaleDateString("en-IN", { day: "2-digit" });
  const monthYear = dateObj.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
  return { dayName, dayNum, monthYear };
}

function subjectPercent(units) {
  const done = units.filter(Boolean).length;
  return Math.round((done / units.length) * 100);
}

function overallPercent(progressArr) {
  let done = 0;
  let total = 0;

  for (const s of progressArr) {
    total += s.units.length;
    done += s.units.filter(Boolean).length;
  }

  return total === 0 ? 0 : Math.round((done / total) * 100);
}

function statusFromPercent(p) {
  if (p >= 70) return { label: "Good", hint: "Great work — keep the momentum!" };
  if (p >= 40) return { label: "Average", hint: "You’re on track. Try completing 1 more unit this week." };
  return { label: "Needs Improvement", hint: "Start with small targets: complete 1 unit in 2 days." };
}

function progressKey(semester) {
  return `progress_sem_${semester}`;
}

function safeSemesterFromProfile() {
  const profile = loadJSON("studentProfile", null);
  const sem = profile?.semester ? String(profile.semester) : "1";
  return /^[1-6]$/.test(sem) ? sem : "1";
}

// ================== DEFAULT DATA (TODOS/DEADLINES) ==================
const DEFAULT_TODOS = [
  { id: "t1", subject: "CN", type: "Revision", unit: 2, duration: 30, isDone: false, date: todayISO() },
  { id: "t2", subject: "Java", type: "Practice", unit: 1, duration: 20, isDone: false, date: todayISO() },
];

const DEFAULT_DEADLINES = [
  { id: "d1", type: "Mid-sem", subject: "CN", date: addDaysISO(5), notes: "" },
  { id: "d2", type: "Assignment", subject: "Java", date: addDaysISO(7), notes: "Unit 2 questions" }
];

// ================== RENDER: STUDENT ==================
function renderStudent() {
  const profile = loadJSON("studentProfile", null);

  $("studentName").textContent = profile?.name || "—";
  $("studentCourse").textContent = profile?.course || "—";
  $("studentErp").textContent = profile?.erp || "—";
  $("studentSemester").textContent = profile?.semester || "—";
}

// ================== RENDER: TODAY ==================
function renderToday() {
  const { dayName, dayNum, monthYear } = formatDateParts(new Date());
  $("todayDay").textContent = dayName;
  $("todayDate").textContent = dayNum;
  $("todayMonthYear").textContent = monthYear;
}

// ================== PROGRESS DATA (SYNC WITH SUBJECTS PAGE) ==================
function ensureProgressData(semester) {
  const key = progressKey(semester);
  let data = loadJSON(key, null);

  if (!data) {
    const subjects = SEMESTER_SUBJECTS[semester] || [];
    data = subjects.map(s => ({
      slug: s.slug,
      name: s.name,
      units: [false, false, false, false, false]
    }));
    saveJSON(key, data);
  }

  return data;
}

// ================== RENDER: SUBJECTS + OVERALL ==================
function renderSubjectsAndOverall() {
  const semester = safeSemesterFromProfile();
  const progress = ensureProgressData(semester);

  const grid = $("subjectGrid");
  grid.innerHTML = "";

  progress.forEach((subj) => {
    const percent = subjectPercent(subj.units);
    const doneUnits = subj.units.filter(Boolean).length;

    const card = document.createElement("div");
    card.className = "card subject-card";

    card.innerHTML = `
      <div class="subject-top">
        <h3>${subj.name}</h3>
        <span><strong>${percent}%</strong></span>
      </div>
      <div class="progress-bar">
        <div class="fill" style="width:${clamp(percent,0,100)}%"></div>
      </div>
      <p class="muted">${doneUnits}/5 units completed</p>
    `;

    grid.appendChild(card);
  });

  // Overall
  const overall = overallPercent(progress);
  $("overallPercent").textContent = `${overall}%`;
  $("overallFill").style.width = `${clamp(overall, 0, 100)}%`;

  const status = statusFromPercent(overall);
  $("overallStatus").textContent = status.label;
  $("overallHint").textContent = status.hint;
}

// ================== RENDER: TODOS ==================
function renderTodos() {
  let todos = loadJSON("todos", null);
  if (!todos) {
    todos = DEFAULT_TODOS;
    saveJSON("todos", todos);
  }

  const today = todayISO();
  const todayTodos = todos.filter(t => (t.date || today) === today);

  $("todoCount").textContent = `${todayTodos.length} task${todayTodos.length === 1 ? "" : "s"}`;

  const list = $("todoList");
  list.innerHTML = "";

  if (todayTodos.length === 0) {
    const li = document.createElement("li");
    li.className = "muted";
    li.textContent = "No tasks for today. Add tasks from Planner.";
    list.appendChild(li);
    return;
  }

  todayTodos.forEach(t => {
    const li = document.createElement("li");
    const unitText = t.unit ? `Unit ${t.unit}` : "";
    const durText = t.duration ? `${t.duration} min` : "";

    li.innerHTML = `
      <span>
        <strong>${t.subject}</strong> • ${t.type}
        ${unitText ? ` • ${unitText}` : ""}
        ${durText ? ` • ${durText}` : ""}
      </span>
      <span class="muted">${t.isDone ? "Done ✅" : "Pending"}</span>
    `;
    list.appendChild(li);
  });
}

// ================== RENDER: DEADLINES ==================
function renderDeadlines() {
  let deadlines = loadJSON("deadlines", null);
  if (!deadlines) {
    deadlines = DEFAULT_DEADLINES;
    saveJSON("deadlines", deadlines);
  }

  deadlines.sort((a, b) => (a.date || "").localeCompare(b.date || ""));
  $("deadlineCount").textContent = `${deadlines.length} item${deadlines.length === 1 ? "" : "s"}`;

  const list = $("deadlineList");
  list.innerHTML = "";

  if (deadlines.length === 0) {
    const li = document.createElement("li");
    li.className = "muted";
    li.textContent = "No deadlines added. Add deadlines from Planner.";
    list.appendChild(li);
    return;
  }

  deadlines.slice(0, 6).forEach(d => {
    const li = document.createElement("li");

    const datePretty = new Date(d.date + "T00:00:00").toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });

    li.innerHTML = `
      <span><strong>${d.type}</strong> • ${d.subject}</span>
      <span class="muted">${datePretty}</span>
    `;
    list.appendChild(li);
  });
}

// ================== STREAK ==================
function getStreak() {
  return loadJSON("streakData", { streak: 0, lastStudied: null });
}

function setStreak(data) {
  saveJSON("streakData", data);
}

function renderStreak() {
  const s = getStreak();
  $("streakCount").textContent = s.streak || 0;
  $("lastStudied").textContent = s.lastStudied ? s.lastStudied : "—";
}

function markTodayStudied() {
  const today = todayISO();
  const s = getStreak();

  if (!s.lastStudied) {
    s.streak = 1;
    s.lastStudied = today;
    setStreak(s);
    return;
  }

  if (s.lastStudied === today) return;

  const last = new Date(s.lastStudied + "T00:00:00");
  const now = new Date(today + "T00:00:00");
  const diffDays = Math.round((now - last) / (1000 * 60 * 60 * 24));

  if (diffDays === 1) s.streak = (s.streak || 0) + 1;
  else s.streak = 1;

  s.lastStudied = today;
  setStreak(s);
}

// ================== EVENTS: NAV TOGGLE + LOGOUT + BUTTONS ==================
function bindEvents() {
  // Mobile nav toggle
  const navToggle = document.getElementById("navToggle");
  const navMenu = document.getElementById("navMenu");

  if (navToggle && navMenu) {
    navToggle.addEventListener("click", () => {
      const isOpen = navMenu.classList.toggle("open");
      navToggle.setAttribute("aria-expanded", String(isOpen));
    });

    navMenu.addEventListener("click", (e) => {
      if (e.target.classList.contains("nav-link")) {
        navMenu.classList.remove("open");
        navToggle.setAttribute("aria-expanded", "false");
      }
    });

    document.addEventListener("click", (e) => {
      const clickedInside = navMenu.contains(e.target) || navToggle.contains(e.target);
      if (!clickedInside) {
        navMenu.classList.remove("open");
        navToggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  // Logout
  const logoutBtn = $("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      localStorage.setItem("isLoggedIn", "false");
      window.location.href = "../auth/login.html";
    });
  }

  // Mark studied
  const markBtn = $("markStudiedBtn");
  if (markBtn) {
    markBtn.addEventListener("click", () => {
      markTodayStudied();
      renderStreak();
      alert("Marked as studied for today ✅");
    });
  } 

  // Reminder (prototype)
  const reminderBtn = $("setReminderBtn");
  if (reminderBtn) {
    reminderBtn.addEventListener("click", () => {
      alert("Reminder settings will be added in Planner (prototype).");
    });
  }
}

// ================== INIT ==================
(function init() {
  renderStudent();
  renderToday();
  renderSubjectsAndOverall();
  renderTodos();
  renderDeadlines();
  renderStreak();
  bindEvents();
})();