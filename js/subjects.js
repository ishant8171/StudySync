// frontend/js/subjects.js

// ========== Auth Guard ==========
(function authGuard() {
  const loggedIn = localStorage.getItem("isLoggedIn");
  if (loggedIn !== "true") {
    window.location.href = "../auth/login.html";
  }
})();

// ========== Semester -> Subjects Map ==========
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
    { slug: "dm", name: "Data Mining" },
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

// ========== Helpers ==========
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

function progressKey(semester) {
  return `progress_sem_${semester}`;
}

function subjectPercent(units) {
  const done = units.filter(Boolean).length;
  return Math.round((done / units.length) * 100);
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function safeSemesterFromProfile() {
  const profile = loadJSON("studentProfile", null);
  const sem = profile?.semester ? String(profile.semester) : "1";
  return /^[1-6]$/.test(sem) ? sem : "1";
}

// ========== Navbar Toggle + Logout ==========
function bindNav() {
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

  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      localStorage.setItem("isLoggedIn", "false");
      window.location.href = "../auth/login.html";
    });
  }
}

// ========== Core: Build Subjects Page ==========
function ensureProgressData(semester, semesterSubjects) {
  const key = progressKey(semester);
  let data = loadJSON(key, null);

  if (!data) {
    // Create fresh progress data: 5 units all false
    data = semesterSubjects.map(s => ({
      slug: s.slug,
      name: s.name,
      units: [false, false, false, false, false]
    }));
    saveJSON(key, data);
    return data;
  }

  // If map changed later, ensure subjects exist (merge-safe)
  const existingSlugs = new Set(data.map(x => x.slug));
  semesterSubjects.forEach(s => {
    if (!existingSlugs.has(s.slug)) {
      data.push({ slug: s.slug, name: s.name, units: [false, false, false, false, false] });
    }
  });

  // Keep names updated
  data.forEach(item => {
    const match = semesterSubjects.find(s => s.slug === item.slug);
    if (match) item.name = match.name;
    if (!Array.isArray(item.units) || item.units.length !== 5) {
      item.units = [false, false, false, false, false];
    }
  });

  saveJSON(key, data);
  return data;
}

function linkFor(subjectSlug, type) {
  // Your folder structure expects: pages/subjects/<subjectSlug>/<subjectSlug>-syllabus.html
  // Example: ./cn/cn-syllabus.html
  // If you haven't created pages yet, link will 404, but that's fine for now.
  if (type === "syllabus") return `./${subjectSlug}/${subjectSlug}-syllabus.html`;
  return `./${subjectSlug}/${subjectSlug}-questionbank.html`;
}

function renderSubjects() {
  const semester = safeSemesterFromProfile();
  $("semText").textContent = semester;

  const semesterSubjects = SEMESTER_SUBJECTS[semester] || [];
  $("subjectCount").textContent = `${semesterSubjects.length} subject${semesterSubjects.length === 1 ? "" : "s"}`;

  const data = ensureProgressData(semester, semesterSubjects);

  const grid = $("subjectsGrid");
  grid.innerHTML = "";

  data.forEach((subj, idx) => {
    const percent = subjectPercent(subj.units);
    const doneUnits = subj.units.filter(Boolean).length;

    const card = document.createElement("div");
    card.className = "card subject-card";

    card.innerHTML = `
      <div class="subject-top">
        <h3 class="subject-name">${subj.name}</h3>
        <span class="percent">${percent}%</span>
      </div>

      <div class="progress-bar">
        <div class="fill" style="width:${clamp(percent,0,100)}%"></div>
      </div>

      <div class="units" data-index="${idx}">
        ${[1,2,3,4,5].map((u, uIdx) => `
          <label class="unit">
            <input type="checkbox" data-unit="${uIdx}" ${subj.units[uIdx] ? "checked" : ""}>
            Unit ${u}
          </label>
        `).join("")}
      </div>

      <div class="btn-row">
        <a class="btn ghost" href="${linkFor(subj.slug, "syllabus")}">Syllabus</a>
        <a class="btn primary" href="${linkFor(subj.slug, "qbank")}">Question Bank</a>
      </div>

      <p class="muted" style="margin:10px 0 0;">${doneUnits}/5 units completed</p>
    `;

    grid.appendChild(card);
  });

  // Attach checkbox listeners after render
  grid.querySelectorAll(".units").forEach((unitsEl) => {
    unitsEl.addEventListener("change", (e) => {
      if (e.target && e.target.matches('input[type="checkbox"]')) {
        const subjectIndex = Number(unitsEl.getAttribute("data-index"));
        const unitIndex = Number(e.target.getAttribute("data-unit"));

        const key = progressKey(semester);
        const progressData = loadJSON(key, []);

        if (!progressData[subjectIndex]) return;

        progressData[subjectIndex].units[unitIndex] = e.target.checked;
        saveJSON(key, progressData);

        // Re-render just to update % and progress bar cleanly
        renderSubjects();
      }
    });
  });
}

// ========== Init ==========
(function init() {
  bindNav();
  renderSubjects();
})();