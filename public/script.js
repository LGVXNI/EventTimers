const API_URL = '/api/timers'; // relative URL for local and deployed usage

document.addEventListener('DOMContentLoaded', () => {
    // Attach submit event listener inside DOMContentLoaded
    const form = document.getElementById('timerForm');
    form.addEventListener('submit', function (e) {
        e.preventDefault();

        const name = document.getElementById('name').value.trim();
        const duration = parseInt(document.getElementById('duration').value);

        if (!name || isNaN(duration) || duration <= 0) {
            alert('Please enter a valid timer name and a positive duration.');
            return;
        }

        fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, duration })
        })
        .then(res => res.json())
        .then(() => {
            loadTimers();
            form.reset(); // Clear form fields
        })
        .catch(err => {
            console.error('Error creating timer:', err);
            alert('Failed to create timer. Please try again.');
        });
    });

    loadTimers();
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

                const resetBtn = document.createElement('button');
                resetBtn.textContent = 'Reset';
                resetBtn.onclick = () => resetTimer(timer.id);

                const delBtn = document.createElement('button');
                delBtn.textContent = 'Delete';
                delBtn.onclick = () => deleteTimer(timer.id);

                wrapper.appendChild(resetBtn);
                wrapper.appendChild(delBtn);
                display.appendChild(wrapper);

                updateTimerDisplay(label, timer.name, timer.timeLeft);

                // Update every second
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
            const display = document.getElementById('timerDisplay');
            display.innerHTML = '<p style="color:red;">Failed to load timers.</p>';
        });
}

function updateTimerDisplay(element, name, ms) {
    const mins = Math.floor(ms / 60000);
    const secs = Math.floor((ms % 60000) / 1000);
    element.textContent = `${name}: ${mins}m ${secs}s remaining`;
}

function deleteTimer(id) {
    fetch(`${API_URL}/${id}`, { method: 'DELETE' })
        .then(() => loadTimers())
        .catch(err => {
            console.error('Error deleting timer:', err);
            alert('Failed to delete timer.');
        });
}

function resetTimer(id) {
    fetch(`${API_URL}/${id}/reset`, { method: 'PUT' })
        .then(() => loadTimers())
        .catch(err => {
            console.error('Error resetting timer:', err);
            alert('Failed to reset timer.');
        });
}
