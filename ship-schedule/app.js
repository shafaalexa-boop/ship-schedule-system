let allShips = [];
let filteredShips = [];
let currentPage = 1;
let itemsPerPage = 10;
let sortConfig = { key: 'no', direction: 'asc' };
let darkMode = localStorage.getItem('darkMode') === 'true';

document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

function initializeApp() {
    allShips = [...shipScheduleData];
    filteredShips = [...allShips];
    
    if (darkMode) {
        document.body.classList.add('dark-mode');
    }
    
    setupEventListeners();
    updateStats();
    renderTable();
    updateLastModified();
}

function setupEventListeners() {
    document.getElementById('searchForm').addEventListener('submit', handleSearch);
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
}

function handleSearch(e) {
    e.preventDefault();
    
    const shipName = document.getElementById('shipName').value.toLowerCase();
    const origin = document.getElementById('origin').value.toLowerCase();
    const destination = document.getElementById('destination').value.toLowerCase();
    const status = document.getElementById('status').value.toLowerCase();
    
    filteredShips = allShips.filter(ship => {
        const matchName = !shipName || ship.nama.toLowerCase().includes(shipName) || ship.imo.includes(shipName);
        const matchOrigin = !origin || ship.origin.toLowerCase().includes(origin);
        const matchDest = !destination || ship.destination.toLowerCase().includes(destination);
        const matchStatus = !status || ship.status === status;
        
        return matchName && matchOrigin && matchDest && matchStatus;
    });
    
    currentPage = 1;
    renderTable();
    showToast(`Ditemukan ${filteredShips.length} kapal`, 'info');
}

function handleReset() {
    filteredShips = [...allShips];
    currentPage = 1;
    renderTable();
    showToast('Filter direset', 'info');
}

function sortTable(key) {
    const direction = sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc';
    sortConfig = { key, direction };
    
    filteredShips.sort((a, b) => {
        let aVal = a[key];
        let bVal = b[key];
        
        if (key === 'no' || key === 'imo') {
            aVal = parseInt(aVal) || aVal;
            bVal = parseInt(bVal) || bVal;
        }
        
        if (aVal < bVal) return direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return direction === 'asc' ? 1 : -1;
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
    document.getElementById('tableView').classList.add('active');
    document.getElementById('cardView').classList.remove('active');
    
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const paginatedShips = filteredShips.slice(start, end);
    
    const tbody = document.getElementById('tableBody');
    const noResults = document.getElementById('noResults');
    
    if (paginatedShips.length === 0) {
        tbody.innerHTML = '';
        noResults.style.display = 'flex';
        return;
    }
    
    noResults.style.display = 'none';
    
    tbody.innerHTML = paginatedShips.map((ship, index) => `
        <tr>
            <td><input type="checkbox" class="ship-checkbox" value="${ship.id}"></td>
            <td>${start + index + 1}</td>
            <td><strong>${ship.nama}</strong></td>
            <td>${ship.imo}</td>
            <td>${ship.origin}</td>
            <td>${ship.destination}</td>
            <td>${ship.tiba}</td>
            <td>${ship.bangkit}</td>
            <td>${ship.berth}</td>
            <td><span class="status ${ship.status}">${capitalizeStatus(ship.status)}</span></td>
            <td><button class="btn-action btn-view" onclick="showDetail('${ship.id}')">
                <i class="fas fa-eye"></i> Lihat
            </button></td>
        </tr>
    `).join('');
}

function renderCardView() {
    document.getElementById('tableView').classList.remove('active');
    document.getElementById('cardView').classList.add('active');
    
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const paginatedShips = filteredShips.slice(start, end);
    
    const cardContainer = document.getElementById('cardContainer');
    
    if (paginatedShips.length === 0) {
        cardContainer.innerHTML = '<div class="no-results"><i class="fas fa-search"></i><p>Tidak ada data kapal</p></div>';
        return;
    }
    
    cardContainer.innerHTML = paginatedShips.map(ship => `
        <div class="ship-card">
            <h3>${ship.nama}</h3>
            <p><span class="label">IMO:</span> ${ship.imo}</p>
            <p><span class="label">Asal:</span> ${ship.origin}</p>
            <p><span class="label">Tujuan:</span> ${ship.destination}</p>
            <p><span class="label">Jadwal Tiba:</span> ${ship.tiba}</p>
            <span class="status ${ship.status}">${capitalizeStatus(ship.status)}</span>
            <div class="action-buttons" style="margin-top: 15px;">
                <button class="btn-action btn-view" onclick="showDetail('${ship.id}')">
                    <i class="fas fa-eye"></i> Detail
                </button>
            </div>
        </div>
    `).join('');
}

function showDetail(shipId) {
    const ship = allShips.find(s => s.id === shipId);
    if (!ship) return;
    
    document.getElementById('modalTitle').textContent = `Detail Kapal: ${ship.nama}`;
    document.getElementById('modalBody').innerHTML = `
        <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #ddd;">
            <label>Nama Kapal:</label>
            <span>${ship.nama}</span>
        </div>
        <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #ddd;">
            <label>IMO:</label>
            <span>${ship.imo}</span>
        </div>
        <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #ddd;">
            <label>Origin:</label>
            <span>${ship.origin}</span>
        </div>
        <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #ddd;">
            <label>Destination:</label>
            <span>${ship.destination}</span>
        </div>
        <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #ddd;">
            <label>Status:</label>
            <span><span class="status ${ship.status}">${capitalizeStatus(ship.status)}</span></span>
        </div>
    `;
    
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

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast active ${type}`;
    setTimeout(() => toast.classList.remove('active'), 3000);
}