const STORAGE_KEY = "kalaimathi-course-hub-v2";
const ADMIN_EMAIL = "kalaimathisethu610@gmail.com";
const ADMIN_PASSWORD = "professor123";

const lecturerProfile = {
  name: "KALAIMATHI S",
  role: "Assistant Professor",
  institution: "SSMRV Degree College, Bangalore",
  email: "kalaimathisethu610@gmail.com"
};

const seedCourses = [
  {
    id: "eng101",
    code: "ENG101",
    title: "Technical English",
    department: "English",
    semester: "Semester 1",
    level: "Undergraduate",
    summary:
      "Foundation course focused on academic communication, technical vocabulary, reading comprehension, writing practice, and confident classroom participation.",
    topics: [
      "Technical vocabulary and usage",
      "Reading comprehension strategies",
      "Paragraph and essay writing",
      "Presentation basics",
      "Listening and note-taking"
    ],
    fileName: "",
    fileType: "",
    fileData: "",
    updatedAt: "2026-05-17T00:00:00.000Z"
  },
  {
    id: "sk201",
    code: "SK201",
    title: "Soft Skills and Employability",
    department: "English",
    semester: "Career Skills Module",
    level: "Certificate",
    summary:
      "Skill-building module for communication confidence, interview readiness, workplace etiquette, teamwork, and employability preparation.",
    topics: [
      "Communication and active listening",
      "Resume and interview preparation",
      "Group discussion practice",
      "Workplace etiquette",
      "Career readiness activities"
    ],
    fileName: "",
    fileType: "",
    fileData: "",
    updatedAt: "2026-05-17T00:00:00.000Z"
  },
  {
    id: "rw110",
    code: "RW110",
    title: "Reading and Writing Skills",
    department: "English",
    semester: "Bridge Course",
    level: "Undergraduate",
    summary:
      "Practice-led course that strengthens reading habits, composition writing, vocabulary development, and structured academic expression.",
    topics: [
      "Reading habits and comprehension",
      "Composition writing",
      "Grammar in context",
      "Vocabulary development",
      "Peer review and revision"
    ],
    fileName: "",
    fileType: "",
    fileData: "",
    updatedAt: "2026-05-17T00:00:00.000Z"
  }
];

const state = {
  courses: loadCourses(),
  selectedId: "",
  isAdmin: false,
  search: "",
  level: "all"
};

const els = {
  courseList: document.querySelector("#courseList"),
  courseDetail: document.querySelector("#courseDetail"),
  courseCount: document.querySelector("#courseCount"),
  adminCourseCount: document.querySelector("#adminCourseCount"),
  courseSearch: document.querySelector("#courseSearch"),
  levelFilter: document.querySelector("#levelFilter"),
  downloadAllBtn: document.querySelector("#downloadAllBtn"),
  adminOpenBtn: document.querySelector("#adminOpenBtn"),
  adminCloseBtn: document.querySelector("#adminCloseBtn"),
  adminDialog: document.querySelector("#adminDialog"),
  adminTitle: document.querySelector("#adminTitle"),
  loginForm: document.querySelector("#loginForm"),
  adminWorkspace: document.querySelector("#adminWorkspace"),
  adminCourseList: document.querySelector("#adminCourseList"),
  courseForm: document.querySelector("#courseForm"),
  clearFormBtn: document.querySelector("#clearFormBtn"),
  toast: document.querySelector("#toast"),
  fields: {
    id: document.querySelector("#courseId"),
    code: document.querySelector("#courseCode"),
    title: document.querySelector("#courseTitle"),
    department: document.querySelector("#courseDepartment"),
    semester: document.querySelector("#courseSemester"),
    level: document.querySelector("#courseLevel"),
    summary: document.querySelector("#courseSummary"),
    topics: document.querySelector("#courseTopics"),
    file: document.querySelector("#courseFile")
  }
};

init();

function init() {
  state.selectedId = state.courses[0]?.id || "";
  bindEvents();
  render();
}

function bindEvents() {
  els.courseSearch.addEventListener("input", (event) => {
    state.search = event.target.value.trim().toLowerCase();
    ensureVisibleSelection();
    render();
  });

  els.levelFilter.addEventListener("change", (event) => {
    state.level = event.target.value;
    ensureVisibleSelection();
    render();
  });

  els.downloadAllBtn.addEventListener("click", () => {
    if (!state.courses.length) {
      showToast("No courses available to download.");
      return;
    }
    downloadFile("course-catalog.csv", toCsv(state.courses), "text/csv");
  });

  els.adminOpenBtn.addEventListener("click", () => {
    openAdmin();
  });

  els.adminCloseBtn.addEventListener("click", () => {
    els.adminDialog.close();
  });

  els.loginForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const email = document.querySelector("#adminEmail").value.trim().toLowerCase();
    const password = document.querySelector("#adminPassword").value;

    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      state.isAdmin = true;
      renderAdminShell();
      showToast("Admin signed in.");
      return;
    }

    showToast("Invalid admin login.");
  });

  els.courseForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const course = await readCourseForm();
    saveCourse(course);
    clearCourseForm();
    render();
    showToast("Course published.");
  });

  els.clearFormBtn.addEventListener("click", clearCourseForm);
}

function loadCourses() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return seedCourses;

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : seedCourses;
  } catch {
    return seedCourses;
  }
}

function persistCourses() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.courses));
}

function getFilteredCourses() {
  return state.courses.filter((course) => {
    const matchesLevel = state.level === "all" || course.level === state.level;
    const haystack = [
      course.code,
      course.title,
      course.department,
      course.semester,
      course.summary,
      course.topics.join(" ")
    ]
      .join(" ")
      .toLowerCase();
    return matchesLevel && haystack.includes(state.search);
  });
}

function ensureVisibleSelection() {
  const visible = getFilteredCourses();
  if (!visible.some((course) => course.id === state.selectedId)) {
    state.selectedId = visible[0]?.id || "";
  }
}

function render() {
  const courses = getFilteredCourses();
  els.courseCount.textContent = String(courses.length);
  els.adminCourseCount.textContent = String(state.courses.length);
  renderCourseList(courses);
  renderCourseDetail();
  renderAdminList();
}

function renderCourseList(courses) {
  if (!courses.length) {
    els.courseList.innerHTML = `<div class="empty-state">No courses match this view.</div>`;
    return;
  }

  els.courseList.innerHTML = courses
    .map(
      (course) => `
        <button class="course-card ${course.id === state.selectedId ? "active" : ""}" type="button" data-course-id="${escapeHtml(course.id)}">
          <span class="meta-row">
            <span class="chip blue">${escapeHtml(course.code)}</span>
            <span class="chip">${escapeHtml(course.level)}</span>
          </span>
          <strong>${escapeHtml(course.title)}</strong>
          <p>${escapeHtml(course.department)} · ${escapeHtml(course.semester)}</p>
        </button>
      `
    )
    .join("");

  els.courseList.querySelectorAll("[data-course-id]").forEach((button) => {
    button.addEventListener("click", () => {
      state.selectedId = button.dataset.courseId;
      render();
    });
  });
}

function renderCourseDetail() {
  const course = state.courses.find((item) => item.id === state.selectedId);
  if (!course) {
    els.courseDetail.innerHTML = `<div class="empty-state">Select a course to view student downloads.</div>`;
    return;
  }

  const topics = course.topics
    .map((topic) => `<li>${escapeHtml(topic)}</li>`)
    .join("");

  els.courseDetail.innerHTML = `
    <div class="detail-kicker">
      <span class="detail-code">${escapeHtml(course.code)}</span>
      <span class="chip gold">${formatDate(course.updatedAt)}</span>
    </div>
    <h2>${escapeHtml(course.title)}</h2>
    <div class="detail-meta">
      <span class="chip blue">${escapeHtml(course.department)}</span>
      <span class="chip">${escapeHtml(course.level)}</span>
      <span class="chip">${escapeHtml(course.semester)}</span>
    </div>
    <p class="summary">${escapeHtml(course.summary)}</p>
    <div class="detail-block">
      <h3>Topics</h3>
      <ul class="topic-list">${topics}</ul>
    </div>
    <div class="download-row">
      <button class="icon-text primary" type="button" id="downloadDetailsBtn">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 3v12m0 0 4-4m-4 4-4-4M4 19h16"/>
        </svg>
        Download Details
      </button>
      ${
        course.fileData
          ? `<button class="icon-text ghost" type="button" id="downloadUploadBtn">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/>
                <path d="M14 2v6h6M12 18v-6m0 6-3-3m3 3 3-3"/>
              </svg>
              Download File
            </button>`
          : ""
      }
    </div>
  `;

  document.querySelector("#downloadDetailsBtn").addEventListener("click", () => {
    downloadFile(`${safeFileName(course.code)}-details.txt`, toPlainText(course), "text/plain");
  });

  const uploadButton = document.querySelector("#downloadUploadBtn");
  if (uploadButton) {
    uploadButton.addEventListener("click", () => {
      downloadDataUrl(course.fileName || `${safeFileName(course.code)}-material`, course.fileData);
    });
  }
}

function openAdmin() {
  renderAdminShell();
  if (typeof els.adminDialog.showModal === "function") {
    els.adminDialog.showModal();
  } else {
    els.adminDialog.setAttribute("open", "");
  }
}

function renderAdminShell() {
  els.adminTitle.textContent = state.isAdmin ? "Manage Courses" : "Login";
  els.loginForm.classList.toggle("hidden", state.isAdmin);
  els.adminWorkspace.classList.toggle("hidden", !state.isAdmin);
}

function renderAdminList() {
  if (!els.adminCourseList) return;

  if (!state.courses.length) {
    els.adminCourseList.innerHTML = `<div class="empty-state">No published courses.</div>`;
    return;
  }

  els.adminCourseList.innerHTML = state.courses
    .map(
      (course) => `
        <article class="admin-item">
          <div>
            <strong>${escapeHtml(course.code)} · ${escapeHtml(course.title)}</strong>
            <small>${escapeHtml(course.department)} · ${escapeHtml(course.semester)}</small>
          </div>
          <div class="admin-item-actions">
            <button class="mini-button" type="button" data-edit-id="${escapeHtml(course.id)}">Edit</button>
            <button class="mini-button danger" type="button" data-delete-id="${escapeHtml(course.id)}">Delete</button>
          </div>
        </article>
      `
    )
    .join("");

  els.adminCourseList.querySelectorAll("[data-edit-id]").forEach((button) => {
    button.addEventListener("click", () => fillCourseForm(button.dataset.editId));
  });

  els.adminCourseList.querySelectorAll("[data-delete-id]").forEach((button) => {
    button.addEventListener("click", () => deleteCourse(button.dataset.deleteId));
  });
}

async function readCourseForm() {
  const existing = state.courses.find((course) => course.id === els.fields.id.value);
  const file = els.fields.file.files[0];
  const filePayload = file
    ? {
        fileName: file.name,
        fileType: file.type,
        fileData: await readFileAsDataUrl(file)
      }
    : {
        fileName: existing?.fileName || "",
        fileType: existing?.fileType || "",
        fileData: existing?.fileData || ""
      };

  return {
    id: existing?.id || crypto.randomUUID(),
    code: els.fields.code.value.trim(),
    title: els.fields.title.value.trim(),
    department: els.fields.department.value.trim(),
    semester: els.fields.semester.value.trim(),
    level: els.fields.level.value,
    summary: els.fields.summary.value.trim(),
    topics: els.fields.topics.value
      .split("\n")
      .map((topic) => topic.trim())
      .filter(Boolean),
    ...filePayload,
    updatedAt: new Date().toISOString()
  };
}

function saveCourse(course) {
  const index = state.courses.findIndex((item) => item.id === course.id);
  if (index >= 0) {
    state.courses[index] = course;
  } else {
    state.courses.unshift(course);
  }
  state.selectedId = course.id;
  persistCourses();
}

function fillCourseForm(id) {
  const course = state.courses.find((item) => item.id === id);
  if (!course) return;

  els.fields.id.value = course.id;
  els.fields.code.value = course.code;
  els.fields.title.value = course.title;
  els.fields.department.value = course.department;
  els.fields.semester.value = course.semester;
  els.fields.level.value = course.level;
  els.fields.summary.value = course.summary;
  els.fields.topics.value = course.topics.join("\n");
  els.fields.file.value = "";
  showToast("Course loaded for editing.");
}

function clearCourseForm() {
  els.courseForm.reset();
  els.fields.id.value = "";
  els.fields.level.value = "Undergraduate";
}

function deleteCourse(id) {
  const course = state.courses.find((item) => item.id === id);
  if (!course) return;

  const confirmed = window.confirm(`Delete ${course.code} from the public site?`);
  if (!confirmed) return;

  state.courses = state.courses.filter((item) => item.id !== id);
  if (state.selectedId === id) {
    state.selectedId = state.courses[0]?.id || "";
  }
  persistCourses();
  render();
  showToast("Course deleted.");
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function toPlainText(course) {
  return [
    `${course.code}: ${course.title}`,
    `Instructor: ${lecturerProfile.name}`,
    `Role: ${lecturerProfile.role}, ${lecturerProfile.institution}`,
    `Email: ${lecturerProfile.email}`,
    `Department: ${course.department}`,
    `Level: ${course.level}`,
    `Semester: ${course.semester}`,
    `Updated: ${formatDate(course.updatedAt)}`,
    "",
    "Summary",
    course.summary,
    "",
    "Topics",
    ...course.topics.map((topic) => `- ${topic}`)
  ].join("\n");
}

function toCsv(courses) {
  const rows = [
    ["Instructor", "Code", "Title", "Department", "Level", "Semester", "Summary", "Topics", "Updated"],
    ...courses.map((course) => [
      lecturerProfile.name,
      course.code,
      course.title,
      course.department,
      course.level,
      course.semester,
      course.summary,
      course.topics.join("; "),
      formatDate(course.updatedAt)
    ])
  ];

  return rows.map((row) => row.map(csvEscape).join(",")).join("\n");
}

function csvEscape(value) {
  const normalized = String(value ?? "");
  return `"${normalized.replaceAll('"', '""')}"`;
}

function downloadFile(fileName, contents, type) {
  const blob = new Blob([contents], { type });
  const url = URL.createObjectURL(blob);
  triggerDownload(fileName, url);
  URL.revokeObjectURL(url);
}

function downloadDataUrl(fileName, dataUrl) {
  triggerDownload(fileName, dataUrl);
}

function triggerDownload(fileName, url) {
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.append(link);
  link.click();
  link.remove();
}

function formatDate(value) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date(value));
}

function safeFileName(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function showToast(message) {
  els.toast.textContent = message;
  els.toast.classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => {
    els.toast.classList.remove("show");
  }, 2200);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
