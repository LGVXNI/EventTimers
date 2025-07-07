const API_BASE = '/api/timers';

document.addEventListener('DOMContentLoaded', () => {
  const timerBoxes = document.querySelectorAll('.timer-box');
  const timers = {}; // store intervals by key

  function formatTime(ms) {
    const mins = Math.floor(ms / 60000);
    const secs = Math.floor((ms % 60000) / 1000);
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  function updateDisplay(box, remaining) {
    const timeDisplay = box.querySelector('.time');
    timeDisplay.textContent = formatTime(remaining);
    if (remaining <= 3 * 60000 && remaining > 0) {
      timeDisplay.classList.add('flash');
    } else {
      timeDisplay.classList.remove('flash');
    }
  }

  function clearTimer(box) {
    const key = boxKey(box);
    if (timers[key]) {
      clearInterval(timers[key]);
      delete timers[key];
    }
  }

  function boxKey(box) {
    return `${box.dataset.server}_${box.dataset.event}`;
  }

  // Load all timers and update UI
  function loadTimers() {
    fetch(API_BASE)
      .then(res => res.json())
      .then(data => {
        timerBoxes.forEach(box => {
          const server = box.dataset.server;
          const event = box.dataset.event;
          const timerData = data.find(t => t.server == server && t.event === event);
          const input = box.querySelector('.input-time');

          if (timerData) {
            const { status, remaining } = timerData;

            updateDisplay(box, remaining);
            input.value = Math.ceil(remaining / 60000);

            clearTimer(box);

            if (status === 'running' && remaining > 0) {
              const key = boxKey(box);
              timers[key] = setInterval(() => {
                fetch(API_BASE)
                  .then(res => res.json())
                  .then(allTimers => {
                    const updatedTimer = allTimers.find(t => t.server == server && t.event === event);
                    if (!updatedTimer || updatedTimer.remaining <= 0 || updatedTimer.status !== 'running') {
                      clearTimer(box);
                      updateDisplay(box, 0);
                    } else {
                      updateDisplay(box, updatedTimer.remaining);
                      input.value = Math.ceil(updatedTimer.remaining / 60000);
                    }
                  });
              }, 1000);
            }
          } else {
            updateDisplay(box, 0);
            input.value = '';
            clearTimer(box);
          }
        });
      })
      .catch(e => console.error("Failed to load timers", e));
  }

  function startTimer(box, durationMs) {
    fetch(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        server: parseInt(box.dataset.server),
        event: box.dataset.event,
        duration: durationMs
      })
    })
      .then(res => {
        if (!res.ok) throw new Error("Failed to start timer");
        return res.json();
      })
      .then(() => loadTimers())
      .catch(e => alert(e.message));
  }

  function pauseTimer(box) {
    fetch(`${API_BASE}/${box.dataset.server}/${box.dataset.event}/pause`, {
      method: 'PUT'
    })
      .then(res => {
        if (!res.ok) throw new Error("Failed to pause timer");
        return res.json();
      })
      .then(() => loadTimers())
      .catch(e => alert(e.message));
  }

  function resetTimer(box) {
    fetch(`${API_BASE}/${box.dataset.server}/${box.dataset.event}/reset`, {
      method: 'PUT'
    })
      .then(res => {
        if (!res.ok) throw new Error("Failed to reset timer");
        return res.json();
      })
      .then(() => loadTimers())
      .catch(e => alert(e.message));
  }

  function resumeTimer(box) {
    fetch(`${API_BASE}/${box.dataset.server}/${box.dataset.event}/start`, {
      method: 'PUT'
    })
      .then(res => {
        if (!res.ok) throw new Error("Failed to resume timer");
        return res.json();
      })
      .then(() => loadTimers())
      .catch(e => alert(e.message));
  }

  timerBoxes.forEach(box => {
    const startBtn = box.querySelector('button.start');
    const pauseBtn = box.querySelector('button.pause');
    const resetBtn = box.querySelector('button.reset');
    const input = box.querySelector('.input-time');

    startBtn.addEventListener('click', () => {
      const durationMin = parseInt(input.value);
      if (isNaN(durationMin) || durationMin <= 0) {
        alert("Please enter a valid positive number of minutes");
        return;
      }
      startTimer(box, durationMin * 60000);
    });

    pauseBtn.addEventListener('click', () => pauseTimer(box));
    resetBtn.addEventListener('click', () => resetTimer(box));
  });

  // Load timers on start
  loadTimers();

  // Poll every 10 seconds to refresh timers
  setInterval(loadTimers, 10000);
});
