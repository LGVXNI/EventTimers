const API_URL = '/api/timers';

document.addEventListener('DOMContentLoaded', () => {
  const timers = new Map(); // Store interval IDs per timer id

  const FLASH_THRESHOLD = 3 * 60 * 1000; // 3 minutes in ms

  // Format ms to MM:SS
  function formatTime(ms) {
    const totalSeconds = Math.max(0, Math.floor(ms / 1000));
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2,'0')}:${secs.toString().padStart(2,'0')}`;
  }

  // Load timers from backend
  function loadTimers() {
    fetch(API_URL)
      .then(res => res.json())
      .then(data => {
        const container = document.getElementById('timerContainer');
        container.innerHTML = '';

        data.forEach(timer => {
          // Create timer elements
          const box = document.createElement('div');
          box.className = 'timer-box';
          box.dataset.id = timer.id;

          const nameEl = document.createElement('div');
          nameEl.textContent = timer.name;
          nameEl.style.fontWeight = 'bold';

          const timeEl = document.createElement('div');
          timeEl.className = 'timer-display';
          timeEl.textContent = formatTime(timer.timeLeft);

          const startBtn = document.createElement('button');
          startBtn.textContent = 'Start';

          const pauseBtn = document.createElement('button');
          pauseBtn.textContent = 'Pause';

          const resetBtn = document.createElement('button');
          resetBtn.textContent = 'Reset';

          box.appendChild(nameEl);
          box.appendChild(timeEl);
          box.appendChild(startBtn);
          box.appendChild(pauseBtn);
          box.appendChild(resetBtn);
          container.appendChild(box);

          // Clear existing interval if any
          if (timers.has(timer.id)) {
            clearInterval(timers.get(timer.id));
            timers.delete(timer.id);
          }

          let remaining = timer.timeLeft;
          let running = remaining > 0;

          function updateUI() {
            timeEl.textContent = formatTime(remaining);
            if (remaining <= FLASH_THRESHOLD && remaining > 0) {
              timeEl.classList.add('flashing');
            } else {
              timeEl.classList.remove('flashing');
            }
          }

          function tick() {
            if (running && remaining > 0) {
              remaining -= 1000;
              if (remaining <= 0) {
                remaining = 0;
                running = false;
                clearInterval(timers.get(timer.id));
                timers.delete(timer.id);
                updateUI();
                // Optional: alert("Time's up!");
              } else {
                updateUI();
              }
            }
          }

          if (running) {
            timers.set(timer.id, setInterval(tick, 1000));
          }

          updateUI();

          startBtn.addEventListener('click', () => {
            if (!running && remaining > 0) {
              running = true;
              timers.set(timer.id, setInterval(tick, 1000));
            }
          });

          pauseBtn.addEventListener('click', () => {
            running = false;
            if (timers.has(timer.id)) {
              clearInterval(timers.get(timer.id));
              timers.delete(timer.id);
            }
          });

          resetBtn.addEventListener('click', () => {
            fetch(`${API_URL}/${timer.id}/reset`, { method: 'PUT' })
              .then(() => loadTimers()) // reload timers after reset
              .catch(console.error);
          });
        });
      })
      .catch(console.error);
  }

  loadTimers();
});
