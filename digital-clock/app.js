let selectedTimezones = JSON.parse(localStorage.getItem('selectedTimezones')) || ['Asia/Jakarta', 'Europe/London', 'America/New_York', 'Australia/Sydney'];
let darkMode = localStorage.getItem('darkMode') === 'true';
let updateInterval;

// Cache for DOM elements
const domCache = {
    clocksContainer: null,
    searchTimezone: null,
    timezoneList: null,
    toast: null,
    addTimezoneModal: null
};

// Cache for timezone offsets
const timezoneOffsetCache = new Map();

// Cache for clock cards
const clockCardCache = new Map();

// Debounce helper
function debounce(func, delay) {
    let timeoutId;
    return function(...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func(...args), delay);
    };
}

// Debounced timezone list render flag
let timezoneListRendered = false;

document.addEventListener('DOMContentLoaded', () => {
    // Cache DOM elements
    domCache.clocksContainer = document.getElementById('clocksContainer');
    domCache.searchTimezone = document.getElementById('searchTimezone');
    domCache.timezoneList = document.getElementById('timezoneList');
    domCache.toast = document.getElementById('toast');
    domCache.addTimezoneModal = document.getElementById('addTimezoneModal');
    
    if (darkMode) document.body.classList.add('dark-mode');
    setupEventListeners();
    updateAllClocks();
    updateInterval = setInterval(updateAllClocks, 1000);
});

function setupEventListeners() {
    document.getElementById('darkModeBtn').addEventListener('click', toggleDarkMode);
    document.getElementById('addTimezoneBtn').addEventListener('click', () => openModal('addTimezoneModal'));
    document.getElementById('timezoneSearch').addEventListener('input', debounce(filterTimezones, 200));
    document.querySelectorAll('.modal-close').forEach(btn => btn.addEventListener('click', closeModal));
    
    // Debounce search for clock cards
    domCache.searchTimezone.addEventListener('input', debounce((e) => {
        const query = e.target.value.toLowerCase();
        domCache.clocksContainer.querySelectorAll('.clock-card').forEach(card => {
            const text = card.textContent.toLowerCase();
            card.style.display = text.includes(query) ? '' : 'none';
        });
    }, 150));
}

function updateAllClocks() {
    if (domCache.clocksContainer.children.length !== selectedTimezones.length) {
        renderClocks();
    }
    
    selectedTimezones.forEach(timezone => {
        const card = clockCardCache.get(timezone);
        if (card) updateClockDisplay(card, timezone);
    });
}

function renderClocks() {
    domCache.clocksContainer.innerHTML = '';
    clockCardCache.clear();
    
    selectedTimezones.forEach(timezone => {
        const timezoneData = allTimezones.find(t => t.timezone === timezone);
        const card = createClockCard(timezone, timezoneData);
        domCache.clocksContainer.appendChild(card);
        clockCardCache.set(timezone, card);
    });
    
    // Event delegation for buttons
    domCache.clocksContainer.addEventListener('click', handleClockAction);
}

function createClockCard(timezone, timezoneData) {
    const card = document.createElement('div');
    card.className = 'clock-card';
    card.setAttribute('data-timezone', timezone);
    
    const offset = getTimezoneOffset(timezone);
    const city = timezoneData ? timezoneData.city : timezone;
    
    card.innerHTML = `
        <div>
            <h3>${city}</h3>
            <p>${timezone}</p>
        </div>
        <div class="digital-time" data-timezone-time="">--:--:--</div>
        <div class="clock-footer">
            <div class="offset">UTC ${offset}</div>
            <div class="clock-actions">
                <button class="btn-small" title="Copy" data-action="copy" data-timezone="${timezone}">
                    <i class="fas fa-copy"></i>
                </button>
                <button class="btn-small" title="Remove" data-action="remove" data-timezone="${timezone}">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `;
    
    return card;
}

function updateClockDisplay(card, timezone) {
    const time = new Date();
    const formatter = new Intl.DateTimeFormat('id-ID', {
        timeZone: timezone,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    });
    
    const timeString = formatter.format(time);
    const timeElement = card.querySelector('[data-timezone-time]');
    if (timeElement) timeElement.textContent = timeString;
}

function renderTimezoneList() {
    // Only render if not already rendered
    if (timezoneListRendered && domCache.timezoneList.children.length > 0) {
        return;
    }
    
    const fragment = document.createDocumentFragment();
    
    allTimezones.forEach(tz => {
        const isSelected = selectedTimezones.includes(tz.timezone);
        const item = document.createElement('div');
        item.className = 'timezone-item';
        
        const offset = getTimezoneOffset(tz.timezone);
        item.innerHTML = `
            <div class="timezone-info">
                <h4>${tz.city}</h4>
                <p>${tz.timezone}</p>
            </div>
            <div>${offset}</div>
        `;
        
        if (isSelected) {
            item.style.opacity = '0.5';
            item.style.pointerEvents = 'none';
        } else {
            item.setAttribute('data-timezone', tz.timezone);
            item.style.cursor = 'pointer';
        }
        
        fragment.appendChild(item);
    });
    
    domCache.timezoneList.innerHTML = '';
    domCache.timezoneList.appendChild(fragment);
    timezoneListRendered = true;
    
    // Event delegation for timezone items
    domCache.timezoneList.addEventListener('click', (e) => {
        const item = e.target.closest('.timezone-item');
        if (item && item.getAttribute('data-timezone')) {
            addTimezone(item.getAttribute('data-timezone'));
            timezoneListRendered = false; // Reset for next modal open
        }
    });
}

function filterTimezones() {
    const query = document.getElementById('timezoneSearch').value.toLowerCase();
    domCache.timezoneList.querySelectorAll('.timezone-item').forEach(item => {
        const text = item.textContent.toLowerCase();
        item.style.display = text.includes(query) ? '' : 'none';
    });
}

function addTimezone(timezone) {
    if (!selectedTimezones.includes(timezone)) {
        selectedTimezones.push(timezone);
        localStorage.setItem('selectedTimezones', JSON.stringify(selectedTimezones));
        updateAllClocks();
        showToast(`${timezone} ditambahkan`, 'success');
        closeModal();
        timezoneListRendered = false; // Reset for next modal open
    }
}

function removeTimezone(timezone) {
    selectedTimezones = selectedTimezones.filter(tz => tz !== timezone);
    localStorage.setItem('selectedTimezones', JSON.stringify(selectedTimezones));
    clockCardCache.delete(timezone);
    updateAllClocks();
    showToast(`${timezone} dihapus`, 'info');
    timezoneListRendered = false; // Reset for next modal open
}

function getTimezoneOffset(timezone) {
    // Check cache first
    if (timezoneOffsetCache.has(timezone)) {
        return timezoneOffsetCache.get(timezone);
    }
    
    const now = new Date();
    const utcTime = new Date(now.toLocaleString('en-US', { timeZone: 'UTC' }));
    const tzTime = new Date(now.toLocaleString('en-US', { timeZone: timezone }));
    const offset = (tzTime - utcTime) / (1000 * 60 * 60);
    
    const sign = offset >= 0 ? '+' : '';
    const hours = Math.floor(Math.abs(offset));
    const minutes = Math.round((Math.abs(offset) % 1) * 60);
    
    const offsetStr = `${sign}${hours}:${minutes.toString().padStart(2, '0')}`;
    
    // Cache for 1 hour to avoid recalculation
    timezoneOffsetCache.set(timezone, offsetStr);
    setTimeout(() => timezoneOffsetCache.delete(timezone), 3600000);
    
    return offsetStr;
}

function openModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.classList.add('active');
    if (modalId === 'addTimezoneModal') {
        renderTimezoneList();
    }
}

function closeModal() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.classList.remove('active');
    });
}

function handleClockAction(e) {
    const button = e.target.closest('.btn-small');
    if (!button) return;
    
    const action = button.getAttribute('data-action');
    const timezone = button.getAttribute('data-timezone');
    
    if (action === 'remove') {
        removeTimezone(timezone);
    } else if (action === 'copy') {
        const card = button.closest('.clock-card');
        const time = card.querySelector('[data-timezone-time]').textContent;
        const city = card.querySelector('h3').textContent;
        navigator.clipboard.writeText(`${city}: ${time}`);
        showToast('Waktu disalin', 'success');
    }
}

function toggleDarkMode() {
    darkMode = !darkMode;
    localStorage.setItem('darkMode', darkMode);
    document.body.classList.toggle('dark-mode');
    showToast(darkMode ? 'Dark Mode Aktif' : 'Light Mode Aktif', 'info');
}

function showToast(message, type = 'success') {
    domCache.toast.textContent = message;
    domCache.toast.className = `toast active ${type}`;
    setTimeout(() => domCache.toast.classList.remove('active'), 3000);
}
