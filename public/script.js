const API_URL = '/api/timers'; // ✅ Use relative URL for compatibility on Render

document.addEventListener('DOMContentLoaded', () => {
    loadTimers();
});

document.getElementById('timerForm').addEventListener('submit', function (e) {
    e.preventDefault();

    const name = document.getElementById('name').value;
    const duration = parseInt(document.getElementById('duration').value);

    fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, duration })
    })
    .then(res => res.json())
    .then(() => {
        loadTimers();
        document.getElementById('name').value = '';
        document.getElementById('duration').value = '';
    })
    .catch(err => {
        console.error('Error creating timer:', err);
    });
});

function loadTimers() {
    fetch(API_URL)
        .then(res => res.json())
        .then(timers => {
            const display = document.getElementById('timerDisplay');
            display.innerHTML = '';

            timers.forEach(timer => {
                const wrapper = document.createElement('div');
                wrapper.className = 'timer-box';
                wrapper.setAttribute('data-id', timer.id);

                const label = document.createElement('span');
                wrapper.appendChild(label);

                const delBtn = document.createElement('button');
                delBtn.textContent = 'Delete';
                delBtn.onclick = () => deleteTimer(timer.id);

                const resetBtn = document.createElement('button');
                resetBtn.textContent = 'Reset';
                resetBtn.onclick = () => resetTimer(timer.id);

                wrapper.appendChild(resetBtn);
                wrapper.appendChild(delBtn);
                display.appendChild(wrapper);

                updateTimerDisplay(label, timer.name, timer.timeLeft);

                const interval = setInterval(() => {
                    timer.timeLeft -= 1000;
                    if (timer.timeLeft <= 0) {
                        clearInterval(interval);
                        label.textContent = `${timer.name}: Time's up!`;
                    } else {
                        updateTimerDisplay(label, timer.name, timer.timeLeft);
                    }
                }, 1000);
            });
        })
        .catch(err => {
            console.error('Error loading timers:', err);
        });
}

function updateTimerDisplay(element, name, ms) {
    const mins = Math.floor(ms / 60000);
    const secs = Math.floor((ms % 60000) / 1000);
    element.textContent = `${name}: ${mins}m ${secs}s remaining`;
}

function deleteTimer(id) {
    fetch(`${API_URL}/${id}`, {
        method: 'DELETE'
    })
    .then(() => loadTimers())
    .catch(err => {
        console.error('Error deleting timer:', err);
    });
}

function resetTimer(id) {
    fetch(`${API_URL}/${id}/reset`, {
        method: 'PUT'
    })
    .then(() => loadTimers(
