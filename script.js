/* ===========================
   TASKFLOW — script.js
   =========================== */

// ---- State ----
let tasks = JSON.parse(localStorage.getItem('taskflow_tasks')) || [];
let currentFilter = 'all';

// ---- DOM References ----
const taskInput      = document.getElementById('taskInput');
const prioritySelect = document.getElementById('prioritySelect');
const addTaskBtn     = document.getElementById('addTaskBtn');
const taskList       = document.getElementById('taskList');
const emptyState     = document.getElementById('emptyState');
const clearCompleted = document.getElementById('clearCompletedBtn');
const filterTabs     = document.querySelectorAll('.filter-tab');
const totalCountEl   = document.getElementById('totalCount');
const doneCountEl    = document.getElementById('doneCount');
const pendingCountEl = document.getElementById('pendingCount');

// ---- Helpers ----
function generateId() {
  return '_' + Math.random().toString(36).substr(2, 9);
}

function saveToStorage() {
  localStorage.setItem('taskflow_tasks', JSON.stringify(tasks));
}

function formatTime(dateStr) {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now - d) / 1000);

  if (diff < 60)  return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ---- Core Functions ----
function addTask() {
  const text = taskInput.value.trim();
  if (!text) {
    taskInput.focus();
    taskInput.classList.add('shake');
    setTimeout(() => taskInput.classList.remove('shake'), 400);
    return;
  }

  const task = {
    id:        generateId(),
    text:      text,
    priority:  prioritySelect.value,
    completed: false,
    createdAt: new Date().toISOString()
  };

  tasks.unshift(task);
  saveToStorage();
  taskInput.value = '';
  taskInput.focus();
  render();
}

function toggleTask(id) {
  const task = tasks.find(t => t.id === id);
  if (task) {
    task.completed = !task.completed;
    saveToStorage();
    render();
  }
}

function deleteTask(id) {
  const item = document.querySelector(`[data-id="${id}"]`);
  if (item) {
    item.style.transition = 'all 0.25s ease';
    item.style.opacity = '0';
    item.style.transform = 'translateX(20px)';
    setTimeout(() => {
      tasks = tasks.filter(t => t.id !== id);
      saveToStorage();
      render();
    }, 250);
  }
}

function clearCompletedTasks() {
  tasks = tasks.filter(t => !t.completed);
  saveToStorage();
  render();
}

// ---- Render ----
function getFilteredTasks() {
  switch (currentFilter) {
    case 'pending':   return tasks.filter(t => !t.completed);
    case 'completed': return tasks.filter(t => t.completed);
    default:          return tasks;
  }
}

function updateStats() {
  const total   = tasks.length;
  const done    = tasks.filter(t => t.completed).length;
  const pending = total - done;

  totalCountEl.textContent   = total;
  doneCountEl.textContent    = done;
  pendingCountEl.textContent = pending;
}

function createTaskElement(task) {
  const li = document.createElement('li');
  li.className = `task-item priority-${task.priority}${task.completed ? ' completed' : ''}`;
  li.setAttribute('data-id', task.id);

  li.innerHTML = `
    <button
      class="task-check${task.completed ? ' checked' : ''}"
      aria-label="Mark task as ${task.completed ? 'incomplete' : 'complete'}"
      title="Toggle complete"
    >
      <span class="check-icon">✓</span>
    </button>

    <div class="task-body">
      <p class="task-text">${escapeHTML(task.text)}</p>
      <div class="task-meta">
        <span class="priority-badge ${task.priority}">${task.priority}</span>
        <span class="task-time">${formatTime(task.createdAt)}</span>
      </div>
    </div>

    <div class="task-actions">
      <button class="action-btn delete-btn" aria-label="Delete task" title="Delete">
        ✕
      </button>
    </div>
  `;

  // Events
  li.querySelector('.task-check').addEventListener('click', () => toggleTask(task.id));
  li.querySelector('.delete-btn').addEventListener('click', () => deleteTask(task.id));

  return li;
}

function escapeHTML(str) {
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}

function render() {
  const filtered = getFilteredTasks();
  taskList.innerHTML = '';

  if (filtered.length === 0) {
    emptyState.classList.add('visible');
  } else {
    emptyState.classList.remove('visible');
    filtered.forEach(task => taskList.appendChild(createTaskElement(task)));
  }

  updateStats();
}

// ---- Event Listeners ----
addTaskBtn.addEventListener('click', addTask);

taskInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') addTask();
});

clearCompleted.addEventListener('click', clearCompletedTasks);

filterTabs.forEach(tab => {
  tab.addEventListener('click', () => {
    filterTabs.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    currentFilter = tab.dataset.filter;
    render();
  });
});

// ---- Shake animation style (added dynamically) ----
const style = document.createElement('style');
style.textContent = `
  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    20%, 60% { transform: translateX(-6px); }
    40%, 80% { transform: translateX(6px); }
  }
  .shake { animation: shake 0.35s ease; border-color: var(--danger) !important; }
`;
document.head.appendChild(style);

// ---- Init ----
render();