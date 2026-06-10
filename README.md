# 🚢 Sistem Informasi Jadwal Kapal & 🕐 Digital Clock

Dua aplikasi web modern dalam satu repository:
1. **Sistem Informasi Jadwal Kapal** - Port Management Information System
2. **Digital Clock** - Multi Timezone Digital Clock

## 📁 Struktur Project

```
ship-schedule-system/
├── ship-schedule/          # Aplikasi Jadwal Kapal
│   ├── index.html
│   ├── styles.css
│   ├── app.js
│   └── data.js
├── digital-clock/          # Aplikasi Digital Clock
│   ├── index.html
│   ├── styles.css
│   ├── app.js
│   └── timezones.js
└── README.md
```

## 🚀 Cara Menjalankan

### Opsi 1: Live Server (VS Code)
1. Install extension "Live Server"
2. Klik kanan file `index.html` → "Open with Live Server"

### Opsi 2: Python
```bash
cd ship-schedule  # atau digital-clock
python -m http.server 8000
```

### Opsi 3: Node.js
```bash
npm install -g http-server
http-server
```

## 📋 Fitur Jadwal Kapal
- ✅ Search & Filter
- ✅ Sorting
- ✅ Export CSV
- ✅ Dark Mode
- ✅ Multiple Views (Table/Card)
- ✅ Real-time Statistics
- ✅ Detail Modal
- ✅ Pagination

## 🕐 Fitur Digital Clock
- ✅ Multi Timezone Support
- ✅ 60+ Timezone Options
- ✅ Dark Mode
- ✅ Salin Waktu ke Clipboard
- ✅ Add/Remove Timezone
- ✅ Search Timezone
- ✅ Local Storage
- ✅ Responsive Design

## 📱 Browser Support
- Chrome/Edge ✅
- Firefox ✅
- Safari ✅

## 🔗 Links
- **Jadwal Kapal**: `/ship-schedule/index.html`
- **Digital Clock**: `/digital-clock/index.html`

---

**Dibuat dengan ❤️ untuk memudahkan manajemen waktu dan jadwal global**
