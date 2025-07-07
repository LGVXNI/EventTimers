const fixedEvents = [
  "Server 1 Nars", "Server 1 Medusa", "Server 1 Kundun", "Server 1 Selupant", "Server 1 Ferea", "Server 1 Nixie",
  "Server 2 Nars", "Server 2 Medusa", "Server 2 Kundun", "Server 2 Selupant", "Server 2 Ferea", "Server 2 Nixie",
  "Server 3 Nars", "Server 3 Medusa", "Server 3 Kundun", "Server 3 Selupant", "Server 3 Ferea", "Server 3 Nixie",
  "Server 4 Nars", "Server 4 Medusa", "Server 4 Kundun", "Server 4 Selupant", "Server 4 Ferea", "Server 4 Nixie"
];

const timers = {};

function formatTime(ms) {
  if (ms <= 0) return "00:00";
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function startTimer(eventName, durationMs) {
  if (timers[eventName]) {
    clearInterval(timers[eventName].intervalId);
  }
  const endTime = Date.now() + durationMs;
  timers[eventName] = { endTime };

  const displayEl = document.getElementById(`timer-${eventName}`);
  if (!displayEl) return;

  function update() {
    const timeLeft = timers[eventName].endTime - Date.now();
    if (timeLeft <= 0) {
      displayEl.textContent = "Time's up!";
      clearInterval(timers[eventName].intervalId);
    } else {
      displayEl.textContent = formatTime(timeLeft);
    }
  }

  update();
  timers[eventName].intervalId = setInterval(update, 1000);
}

function onResetClick(e) {
  const eventName = e.target.getAttribute("data-event");
  if (!eventName) return;

  const box = e.target.closest(".timer-box");
  const durInput = box.querySelector(".duration-input");
  const durMin = parseInt(durInput.value);

  if (isNaN(durMin) || durMin <= 0) {
    alert("Please enter a valid duration to reset/start.");
    return;
  }
  startTimer(eventName, durMin * 60 * 1000);
}

function addUserEvent(name, duration) {
  const container = document.getElementById("user-events-column");

  const box = document.createElement("div");
  box.className = "timer-box";
  box.setAttribute("data-event", name);

  const nameInput = document.createElement("input");
  nameInput.type = "text";
  nameInput.value = name;
  nameInput.className = "user-name-input";
  nameInput.style.fontWeight = "bold";
  nameInput.style.marginBottom = "8px";
  box.appendChild(nameInput);

  const durationInput = document.createElement("input");
  durationInput.type = "number";
  durationInput.min = "1";
  durationInput.value = duration;
  durationInput.className = "duration-input";
  durationInput.style.marginBottom = "8px";
  box.appendChild(durationInput);

  const timerDisplay = document.createElement("div");
  timerDisplay.className = "timer-display";
  timerDisplay.id = `timer-${name}`;
  timerDisplay.textContent = "--:--";
  box.appendChild(timerDisplay);

  const resetBtn = document.createElement("button");
  resetBtn.className = "reset-btn";
  resetBtn.textContent = "Start/Reset";
  resetBtn.setAttribute("data-event", name);
  resetBtn.addEventListener("click", onResetClick);
  box.appendChild(resetBtn);

  const deleteBtn = document.createElement("button");
  deleteBtn.textContent = "Delete";
  deleteBtn.style.marginTop = "6px";
  deleteBtn.addEventListener("click", () => {
    clearInterval(timers[name]?.intervalId);
    delete timers[name];
    container.removeChild(box);
  });
  box.appendChild(deleteBtn);

  container.appendChild(box);

  // No automatic timer start - user must input duration and press Start/Reset
  nameInput.addEventListener("change", () => {
    const oldName = name;
    const newName = nameInput.value.trim();
    if (!newName) {
      alert("Event name cannot be empty.");
      nameInput.value = oldName;
      return;
    }
    if (timers[oldName]) {
      clearInterval(timers[oldName].intervalId);
      timers[newName] = timers[oldName];
      delete timers[oldName];
    }
    box.setAttribute("data-event", newName);
    timerDisplay.id = `timer-${newName}`;
    resetBtn.setAttribute("data-event", newName);
    name = newName;
  });
}

document.getElementById("addUserEventForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const nameInput = document.getElementById("userEventName");
  const durInput = document.getElementById("userEventDuration");

  const name = nameInput.value.trim();
  const duration = parseInt(durInput.value);

  if (!name) {
    alert("Please enter an event name.");
    return;
  }
  if (isNaN(duration) || duration <= 0) {
    alert("Please enter a valid duration (minutes).");
    return;
  }
  if (timers[name]) {
    alert("An event with this name already exists.");
    return;
  }

  addUserEvent(name, duration);

  nameInput.value = "";
  durInput.value = "";
});

// Initialize fixed events: just create boxes with empty timers and inputs
window.addEventListener("DOMContentLoaded", () => {
  fixedEvents.forEach(eventName => {
    const container = document.getElementById("fixed-events-column");

    const box = document.createElement("div");
    box.className = "timer-box";
    box.setAttribute("data-event", eventName);

    const label = document.createElement("label");
    label.textContent = eventName;
    label.style.fontWeight = "bold";
    box.appendChild(label);

    const durationInput = document.createElement("input");
    durationInput.type = "number";
    durationInput.min = "1";
    durationInput.placeholder = "Minutes";
    durationInput.className = "duration-input";
    durationInput.style.marginLeft = "8px";
    box.appendChild(durationInput);

    const timerDisplay = document.createElement("div");
    timerDisplay.className = "timer-display";
    timerDisplay.id = `timer-${eventName}`;
    timerDisplay.textContent = "--:--";
    timerDisplay.style.marginLeft = "8px";
    box.appendChild(timerDisplay);

    const resetBtn = document.createElement("button");
    resetBtn.className = "reset-btn";
    resetBtn.textContent = "Start/Reset";
    resetBtn.setAttribute("data-event", eventName);
    resetBtn.style.marginLeft = "8px";
    resetBtn.addEventListener("click", onResetClick);
    box.appendChild(resetBtn);

    container.appendChild(box);
  });
});
