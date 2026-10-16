(() => {
  "use strict";
  const STORAGE_KEY = "jtronix-task-tracker-v1";
  const form = document.getElementById("task-form");
  const input = document.getElementById("task-input");
  const message = document.getElementById("form-message");
  const list = document.getElementById("task-list");
  const emptyState = document.getElementById("empty-state");
  const emptyTitle = document.getElementById("empty-title");
  const emptyDescription = document.getElementById("empty-description");
  const totalCount = document.getElementById("total-count");
  const completedCount = document.getElementById("completed-count");
  const pendingCount = document.getElementById("pending-count");
  const visibleCount = document.getElementById("visible-count");
  const clearCompletedButton = document.getElementById("clear-completed");
  const filterButtons = [...document.querySelectorAll("[data-filter]")];
  const todayLabel = document.getElementById("today-label");

  todayLabel.textContent = new Intl.DateTimeFormat(undefined, {
    weekday: "short", month: "short", day: "numeric", year: "numeric"
  }).format(new Date());

  let tasks = loadTasks();
  let currentFilter = "all";

  function loadTasks() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      if (!Array.isArray(parsed)) return [];
      return parsed.filter(task =>
        task && typeof task.id === "string" &&
        typeof task.title === "string" &&
        typeof task.completed === "boolean"
      );
    } catch (error) {
      console.warn("Could not load saved tasks:", error);
      return [];
    }
  }

  function saveTasks() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
      return true;
    } catch (error) {
      console.error("Could not save tasks:", error);
      message.textContent = "Unable to save tasks in this browser. Check your browser storage settings.";
      return false;
    }
  }

  function createId() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
      return window.crypto.randomUUID();
    }
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  function addTask(title) {
    tasks.unshift({ id: createId(), title, completed: false, createdAt: new Date().toISOString() });
    saveTasks();
    render();
  }

  function toggleTask(id, completed) {
    tasks = tasks.map(task => task.id === id ? { ...task, completed } : task);
    saveTasks();
    render();
  }

  function deleteTask(id) {
    tasks = tasks.filter(task => task.id !== id);
    saveTasks();
    render();
  }

  function getVisibleTasks() {
    if (currentFilter === "pending") return tasks.filter(task => !task.completed);
    if (currentFilter === "completed") return tasks.filter(task => task.completed);
    return tasks;
  }

  function render() {
    const completed = tasks.filter(task => task.completed).length;
    totalCount.textContent = String(tasks.length);
    completedCount.textContent = String(completed);
    pendingCount.textContent = String(tasks.length - completed);

    const visibleTasks = getVisibleTasks();
    visibleCount.textContent = String(visibleTasks.length);
    list.replaceChildren();

    visibleTasks.forEach(task => {
      const item = document.createElement("li");
      item.className = `task-item${task.completed ? " is-completed" : ""}`;

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.className = "task-checkbox";
      checkbox.checked = task.completed;
      checkbox.setAttribute("aria-label", `Mark "${task.title}" as ${task.completed ? "pending" : "completed"}`);
      checkbox.addEventListener("change", () => toggleTask(task.id, checkbox.checked));

      const title = document.createElement("span");
      title.className = "task-title";
      title.textContent = task.title;

      const badge = document.createElement("span");
      badge.className = `status-badge ${task.completed ? "completed" : "pending"}`;
      badge.textContent = task.completed ? "Completed" : "Pending";

      const deleteButton = document.createElement("button");
      deleteButton.type = "button";
      deleteButton.className = "delete-button";
      deleteButton.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M4 7h16M9 7V4h6v3m-9 0 1 13h10l1-13M10 11v5m4-5v5" /></svg>';
      deleteButton.setAttribute("aria-label", `Delete task: ${task.title}`);
      deleteButton.title = "Delete task";
      deleteButton.addEventListener("click", () => deleteTask(task.id));

      item.append(checkbox, title, badge, deleteButton);
      list.append(item);
    });

    const hasVisibleTasks = visibleTasks.length > 0;
    emptyState.hidden = hasVisibleTasks;
    if (!hasVisibleTasks) {
      if (tasks.length === 0) {
        emptyTitle.textContent = "A fresh start!";
        emptyDescription.textContent = "Add your first task above and it will appear here.";
      } else if (currentFilter === "completed") {
        emptyTitle.textContent = "No completed tasks yet";
        emptyDescription.textContent = "Completed tasks will appear here.";
      } else if (currentFilter === "pending") {
        emptyTitle.textContent = "All caught up!";
        emptyDescription.textContent = "You don't have any pending tasks.";
      }
    }

    filterButtons.forEach(button => {
      const isActive = button.dataset.filter === currentFilter;
      button.classList.toggle("active", isActive);
      button.setAttribute("aria-pressed", String(isActive));
    });
    clearCompletedButton.disabled = completed === 0;
    clearCompletedButton.style.opacity = completed === 0 ? ".45" : "1";
    clearCompletedButton.style.cursor = completed === 0 ? "not-allowed" : "pointer";
  }

  form.addEventListener("submit", event => {
    event.preventDefault();
    const title = input.value.trim();
    if (!title) {
      message.textContent = "Please enter a task before clicking Add task.";
      input.focus();
      return;
    }
    message.textContent = "";
    addTask(title);
    input.value = "";
    input.focus();
  });

  input.addEventListener("input", () => {
    if (input.value.trim()) message.textContent = "";
  });

  filterButtons.forEach(button => {
    button.addEventListener("click", () => {
      currentFilter = button.dataset.filter;
      render();
    });
  });

  clearCompletedButton.addEventListener("click", () => {
    if (!tasks.some(task => task.completed)) return;
    tasks = tasks.filter(task => !task.completed);
    saveTasks();
    render();
  });

  render();
})();
