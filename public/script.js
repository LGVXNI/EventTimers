document.addEventListener('DOMContentLoaded', () => {
  // Store interval IDs for each timer box to control individually
  const timers = new Map();

  // Helper to format milliseconds to "MM:SS"
  function formatTime(ms) {
    const totalSeconds = Math.max(0, Math.floor(ms / 1000));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  // Flash threshold in ms (3 minutes)
  const FLASH_THRESHOLD = 3 * 60 * 1000;

  // Select all timer boxes
  document.querySelectorAll('.timer-box').forEach(box => {
    const input = box.querySelector('.input-time');
    const timeDisplay = box.querySelector('.time');
    const startBtn = box.querySelector('.start');
    const pauseBtn = box.querySelector('.pause');
    const resetBtn = box.querySelector('.reset');

    let remainingTime = 0;
    let intervalId = null;
    let isPaused = true;

    function updateDisplay() {
      timeDisplay.textContent = formatTime(remainingTime);
      // Handle flashing effect
      if (remainingTime <= FLASH_THRESHOLD && remainingTime > 0) {
        timeDisplay.classList.add('flashing');
      } else {
        timeDisplay.classList.remove('flashing');
      }
    }

    function tick() {
      if (!isPaused) {
        remainingTime -= 1000;
        if (remainingTime <= 0) {
          remainingTime = 0;
          clearInterval(intervalId);
          intervalId = null;
          isPaused = true;
          updateDisplay();
          // Optional: alert or notify timer ended here
        } else {
          updateDisplay();
        }
      }
    }

    startBtn.addEventListener('click', () => {
      // If timer not running, start it
      if (intervalId === null) {
        // If first start or after reset, get value from input
        if (remainingTime <= 0) {
          const minutes = parseInt(input.value);
          if (isNaN(minutes) || minutes <= 0) {
            alert('Please enter a positive number of minutes');
            return;
          }
          remainingTime = minutes * 60 * 1000;
          updateDisplay();
        }
        isPaused = false;
        intervalId = setInterval(tick, 1000);
      } else {
        // Resume if paused
        if (isPaused) {
          isPaused = false;
        }
      }
    });

    pauseBtn.addEventListener('click', () => {
      isPaused = true;
    });

    resetBtn.addEventListener('click', () => {
      isPaused = true;
      clearInterval(intervalId);
      intervalId = null;
      remainingTime = 0;
      updateDisplay();
      input.value = '';
    });

    // Initialize display as 00:00
    updateDisplay();
  });
});
