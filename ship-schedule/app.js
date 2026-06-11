let allShips = [];
let filteredShips = [];
let currentPage = 1;
let itemsPerPage = 10;
let sortConfig = { key: 'no', direction: 'asc' };
let darkMode = localStorage.getItem('darkMode') === 'true';
let hasSearchChanged = false;

// Cache for DOM elements
const shipDomCache = {
    tableView: null,
    cardView: null,
    tableBody: null,
    cardContainer: null,
    noResults: null,
    toast: null,
    shipName: null,
    origin: null,
    destination: null,
    status: null
};

// Debounce helper
function debounce(func, delay) {
    let timeoutId;
    return function(...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func(...args), delay);
    };
}

// Debounced search handler
const debouncedHandleSearch = debounce(() => {
    const shipName = shipDomCache.shipName.value.toLowerCase();
    const origin = shipDomCache.origin.value.toLowerCase();
    const destination = shipDomCache.destination.value.toLowerCase();
    const status = shipDomCache.status.value.toLowerCase();
    
    filteredShips = allShips.filter(ship => {
        const matchName = !shipName || ship.nama.toLowerCase().includes(shipName) || ship.imo.includes(shipName);
        const matchOrigin = !origin || ship.origin.toLowerCase().includes(origin);
        const matchDest = !destination || ship.destination.toLowerCase().includes(destination);
        const matchStatus = !status || ship.status === status;
        
        return matchName && matchOrigin && matchDest && matchStatus;
    });
    
    currentPage = 1;
    hasSearchChanged = true;
    renderTable();
    updateStats();
    showToast(`Ditemukan ${filteredShips.length} kapal`, 'info');
}, 300);

document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

function initializeApp() {
    allShips = [...shipScheduleData];
    filteredShips = [...allShips];
    
    // Cache DOM elements
    shipDomCache.tableView = document.getElementById('tableView');
    shipDomCache.cardView = document.getElementById('cardView');
    shipDomCache.tableBody = document.getElementById('tableBody');
    shipDomCache.cardContainer = document.getElementById('cardContainer');
    shipDomCache.noResults = document.getElementById('noResults');
    shipDomCache.toast = document.getElementById('toast');
    shipDomCache.shipName = document.getElementById('shipName');
    shipDomCache.origin = document.getElementById('origin');
    shipDomCache.destination = document.getElementById('destination');
    shipDomCache.status = document.getElementById('status');
    
    if (darkMode) {
        document.body.classList.add('dark-mode');
    }
    
    setupEventListeners();
    updateStats();
    renderTable();
    updateLastModified();
}

function setupEventListeners() {
    document.getElementById('searchForm').addEventListener('submit', (e) => {
        e.preventDefault();
        debouncedHandleSearch();
    });
    
    document.getElementById('searchForm').addEventListener('reset', handleReset);
    document.getElementById('viewMode').addEventListener('change', handleViewChange);
    document.getElementById('darkModeBtn').addEventListener('click', toggleDarkMode);
    document.getElementById('refreshBtn').addEventListener('click', handleRefresh);
    document.getElementById('exportBtn').addEventListener('click', exportToCSV);
    document.getElementById('selectAll').addEventListener('change', handleSelectAll);
    
    document.querySelectorAll('.modal-close').forEach(btn => {
        btn.addEventListener('click', closeModal);
    });
    
    document.getElementById('detailModal').addEventListener('click', (e) => {
        if (e.target.id === 'detailModal') closeModal();
    });
    
    // Add input listeners for search debouncing
    [shipDomCache.shipName, shipDomCache.origin, shipDomCache.destination, shipDomCache.status]
        .forEach(el => el.addEventListener('input', debouncedHandleSearch));
}

function handleReset() {
    filteredShips = [...allShips];
    currentPage = 1;
    hasSearchChanged = true;
    renderTable();
    updateStats();
    showToast('Filter direset', 'info');
}

function sortTable(key) {
    // Only re-sort if sort key changed
    if (sortConfig.key === key) {
        sortConfig.direction = sortConfig.direction === 'asc' ? 'desc' : 'asc';
    } else {
        sortConfig = { key, direction: 'asc' };
    }
    
    filteredShips.sort((a, b) => {
        let aVal = a[key];
        let bVal = b[key];
        
        if (key === 'no' || key === 'imo') {
            aVal = parseInt(aVal) || aVal;
            bVal = parseInt(bVal) || bVal;
        }
        
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
    });
    
    currentPage = 1;
    renderTable();
}

function renderTable() {
    const viewMode = document.getElementById('viewMode').value;
    
    if (viewMode === 'table') {
        renderTableView();
    } else {
        renderCardView();
    }
}

function renderTableView() {
    shipDomCache.tableView.classList.add('active');
    shipDomCache.cardView.classList.remove('active');
    
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const paginatedShips = filteredShips.slice(start, end);
    
    if (paginatedShips.length === 0) {
        shipDomCache.tableBody.innerHTML = '';
        shipDomCache.noResults.style.display = 'flex';
        return;
    }
    
    shipDomCache.noResults.style.display = 'none';
    
    // Use DocumentFragment for efficient DOM updates
    const fragment = document.createDocumentFragment();
    
    paginatedShips.forEach((ship, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><input type="checkbox" class="ship-checkbox" value="${ship.id}"></td>
            <td>${start + index + 1}</td>
            <td><strong>${escapeHtml(ship.nama)}</strong></td>
            <td>${escapeHtml(ship.imo)}</td>
            <td>${escapeHtml(ship.origin)}</td>
            <td>${escapeHtml(ship.destination)}</td>
            <td>${escapeHtml(ship.tiba)}</td>
            <td>${escapeHtml(ship.bangkit)}</td>
            <td>${escapeHtml(ship.berth)}</td>
            <td><span class="status ${ship.status}">${capitalizeStatus(ship.status)}</span></td>
            <td><button class="btn-action btn-view" data-ship-id="${ship.id}">
                <i class="fas fa-eye"></i> Lihat
            </button></td>
        `;
        fragment.appendChild(row);
    });
    
    shipDomCache.tableBody.innerHTML = '';
    shipDomCache.tableBody.appendChild(fragment);
    
    // Event delegation for view buttons
    shipDomCache.tableBody.addEventListener('click', (e) => {
        const button = e.target.closest('.btn-view');
        if (button) {
            showDetail(button.getAttribute('data-ship-id'));
        }
    });
}

function renderCardView() {
    shipDomCache.tableView.classList.remove('active');
    shipDomCache.cardView.classList.add('active');
    
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const paginatedShips = filteredShips.slice(start, end);
    
    if (paginatedShips.length === 0) {
        shipDomCache.cardContainer.innerHTML = '<div class="no-results"><i class="fas fa-search"></i><p>Tidak ada data kapal</p></div>';
        return;
    }
    
    const fragment = document.createDocumentFragment();
    
    paginatedShips.forEach(ship => {
        const card = document.createElement('div');
        card.className = 'ship-card';
        card.innerHTML = `
            <h3>${escapeHtml(ship.nama)}</h3>
            <p><span class="label">IMO:</span> ${escapeHtml(ship.imo)}</p>
            <p><span class="label">Asal:</span> ${escapeHtml(ship.origin)}</p>
            <p><span class="label">Tujuan:</span> ${escapeHtml(ship.destination)}</p>
            <p><span class="label">Jadwal Tiba:</span> ${escapeHtml(ship.tiba)}</p>
            <span class="status ${ship.status}">${capitalizeStatus(ship.status)}</span>
            <div class="action-buttons" style="margin-top: 15px;">
                <button class="btn-action btn-view" data-ship-id="${ship.id}">
                    <i class="fas fa-eye"></i> Detail
                </button>
            </div>
        `;
        fragment.appendChild(card);
    });
    
    shipDomCache.cardContainer.innerHTML = '';
    shipDomCache.cardContainer.appendChild(fragment);
    
    // Event delegation for view buttons
    shipDomCache.cardContainer.addEventListener('click', (e) => {
        const button = e.target.closest('.btn-view');
        if (button) {
            showDetail(button.getAttribute('data-ship-id'));
        }
    });
}

function showDetail(shipId) {
    const ship = allShips.find(s => s.id === shipId);
    if (!ship) return;
    
    document.getElementById('modalTitle').textContent = `Detail Kapal: ${ship.nama}`;
    const modalBody = document.getElementById('modalBody');
    
    const details = [
        { label: 'Nama Kapal', value: ship.nama },
        { label: 'IMO', value: ship.imo },
        { label: 'Origin', value: ship.origin },
        { label: 'Destination', value: ship.destination },
        { label: 'Status', value: capitalizeStatus(ship.status) }
    ];
    
    let html = '';
    details.forEach(detail => {
        html += `
            <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #ddd;">
                <label>${detail.label}:</label>
                <span>${detail.label === 'Status' ? `<span class="status ${ship.status}">${detail.value}</span>` : escapeHtml(detail.value)}</span>
            </div>
        `;
    });
    
    modalBody.innerHTML = html;
    document.getElementById('detailModal').classList.add('active');
}

function closeModal() {
    document.getElementById('detailModal').classList.remove('active');
}

function updateStats() {
    const stats = {
        berlayar: filteredShips.filter(s => s.status === 'berlayar').length,
        menunggu: filteredShips.filter(s => s.status === 'menunggu').length,
        tiba: filteredShips.filter(s => s.status === 'tiba').length,
        ditarik: filteredShips.filter(s => s.status === 'ditarik').length
    };
    
    document.getElementById('stat-berlayar').textContent = stats.berlayar;
    document.getElementById('stat-menunggu').textContent = stats.menunggu;
    document.getElementById('stat-tiba').textContent = stats.tiba;
    document.getElementById('stat-ditarik').textContent = stats.ditarik;
    document.getElementById('totalShips').textContent = `Total Ships: ${filteredShips.length}`;
}

function updateLastModified() {
    const now = new Date();
    const timeString = now.toLocaleString('id-ID');
    document.getElementById('lastUpdate').textContent = `Last Updated: ${timeString}`;
    document.getElementById('footerTime').textContent = timeString;
}

function handleSelectAll(e) {
    document.querySelectorAll('.ship-checkbox').forEach(checkbox => {
        checkbox.checked = e.target.checked;
    });
}

function exportToCSV() {
    if (filteredShips.length === 0) {
        showToast('Tidak ada data untuk diekspor', 'warning');
        return;
    }
    
    const headers = ['No', 'Nama Kapal', 'IMO', 'Origin', 'Destination', 'Jadwal Tiba', 'Status'];
    const rows = filteredShips.map((ship, index) => [
        index + 1, ship.nama, ship.imo, ship.origin, ship.destination, ship.tiba, capitalizeStatus(ship.status)
    ]);
    
    let csv = headers.join(',') + '\n';
    rows.forEach(row => {
        csv += row.map(cell => `"${cell}"`).join(',') + '\n';
    });
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `jadwal-kapal-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    
    showToast('Data berhasil diekspor', 'success');
}

function handleViewChange() {
    currentPage = 1;
    renderTable();
}

function toggleDarkMode() {
    darkMode = !darkMode;
    localStorage.setItem('darkMode', darkMode);
    document.body.classList.toggle('dark-mode');
    showToast(darkMode ? 'Dark Mode Aktif' : 'Light Mode Aktif', 'info');
}

function handleRefresh() {
    updateStats();
    updateLastModified();
    renderTable();
    showToast('Data diperbarui', 'success');
}

function capitalizeStatus(status) {
    const map = { 'berlayar': 'Berlayar', 'menunggu': 'Menunggu', 'tiba': 'Tiba', 'ditarik': 'Ditarik' };
    return map[status] || status;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showToast(message, type = 'success') {
    shipDomCache.toast.textContent = message;
    shipDomCache.toast.className = `toast active ${type}`;
    setTimeout(() => shipDomCache.toast.classList.remove('active'), 3000);
}
