
import { Step } from 'react-joyride';

// ─── Dashboard ───────────────────────────────────────────────────────────────
export const DASHBOARD_STEPS: Step[] = [
  {
    target: 'body',
    placement: 'center',
    content: 'Selamat datang di Dashboard MARS! Mari kita pelajari sekilas bagaimana sistem ini bekerja.',
    title: 'Selamat Datang',
    disableBeacon: true,
  },
  {
    target: '#stats-metrics',
    content: 'Di sini Anda dapat melihat ringkasan performa bisnis seperti Nilai Kontrak, Realisasi, hingga Win Rate proyek.',
    title: 'Ringkasan Metrik',
    disableBeacon: true,
    placement: 'bottom',
  },
  {
    target: '#revenue-chart',
    content: 'Grafik ini membandingkan antara target Nilai Kontrak dengan Realisasi aktual yang sudah terserap.',
    title: 'Performa Nilai Kontrak',
    disableBeacon: true,
    placement: 'auto',
  },
  {
    target: '#recent-activities',
    content: 'Pantau aktivitas terbaru dari rekan tim Anda di bagian ini.',
    title: 'Aktivitas Terbaru',
    disableBeacon: true,
  },
  {
    target: '#monitoring-table',
    content: 'Tabel ini menampilkan 5 proyek teratas yang sedang aktif. Klik "See All Projects" untuk melihat semuanya.',
    title: 'Monitoring Proyek',
    disableBeacon: true,
  },
];

// ─── Monitoring Proyek ────────────────────────────────────────────────────────
export const MONITORING_STEPS: Step[] = [
  {
    target: 'body',
    placement: 'center',
    content: 'Halaman ini adalah pusat monitoring seluruh proyek yang berjalan di Surveyor Indonesia Cabang Pekanbaru.',
    title: 'Monitoring Proyek',
    disableBeacon: true,
  },
  {
    target: '#project-filters',
    content: 'Filter proyek berdasarkan tahun atau cari proyek spesifik menggunakan kolom pencarian di sini.',
    title: 'Filter & Pencarian',
    disableBeacon: true,
    placement: 'bottom',
  },
  {
    target: '#add-project-btn',
    content: 'Klik tombol ini untuk mendaftarkan proyek assurance baru ke dalam sistem.',
    title: 'Tambah Proyek Baru',
    disableBeacon: true,
    placement: 'left',
  },
  {
    target: '#project-table-header',
    content: 'Daftar proyek lengkap ditampilkan di sini. Klik pada baris proyek untuk melihat detail lebih lanjut.',
    title: 'Daftar Proyek',
    disableBeacon: true,
    placement: 'bottom',
  },
];

// ─── Project Detail ────────────────────────────────────────────────────────────
export const PROJECT_DETAIL_STEPS: Step[] = [
  {
    target: '#project-header',
    placement: 'bottom',
    content: 'Halaman ini menampilkan informasi lengkap dari satu proyek, termasuk nilai kontrak dan status terkini.',
    title: 'Detail Proyek',
    disableBeacon: true,
  },
  {
    target: '#update-capaian-btn',
    content: 'Perbarui progres realisasi proyek secara berkala dengan menekan tombol ini.',
    title: 'Update Capaian',
    disableBeacon: true,
  },
  {
    target: '#project-tabs',
    content: 'Gunakan tab ini untuk berpindah antara tampilan Dokumen, Riwayat Update, atau Komentar terkait proyek.',
    title: 'Navigasi Detail',
    disableBeacon: true,
  },
];

// ─── Kalender Aktivitas ────────────────────────────────────────────────────────
export const CALENDAR_STEPS: Step[] = [
  {
    target: 'body',
    placement: 'center',
    content: 'Halaman Kalender menampilkan semua rencana kegiatan tim seperti rapat, audiensi, dan deadline proyek.',
    title: 'Kalender Aktivitas',
    disableBeacon: true,
  },
  {
    target: '#calendar-header',
    content: 'Gunakan tombol navigasi terpadu untuk berpindah bulan (panah), kembali ke hari ini (ikon kalender), atau klik pada nama bulan untuk memilih bulan dan tahun spesifik.',
    title: 'Navigasi Kalender',
    disableBeacon: true,
    placement: 'bottom',
  },
  {
    target: '#add-event-btn',
    content: 'Klik tombol ini untuk membuat jadwal kegiatan baru seperti rapat, kunjungan lapangan, atau audiensi.',
    title: 'Tambah Kegiatan',
    disableBeacon: true,
    placement: 'left',
  },
];

// ─── Activity Feed ────────────────────────────────────────────────────────────
export const ACTIVITY_STEPS: Step[] = [
  {
    target: 'body',
    placement: 'center',
    content: 'Activity Feed mencatat semua aktivitas penting yang terjadi di dalam sistem, seperti update proyek, persetujuan, dan login.',
    title: 'Log Aktivitas',
    disableBeacon: true,
  },
  {
    target: '#post-input',
    content: 'Buat postingan baru di sini. Anda bisa mengetik pesan, melampirkan file, dan membagikannya kepada seluruh tim.',
    title: 'Buat Postingan',
    disableBeacon: true,
    placement: 'bottom',
  },
];

// ─── Clients ─────────────────────────────────────────────────────────────────
export const CLIENTS_STEPS: Step[] = [
  {
    target: 'body',
    placement: 'center',
    content: 'Halaman Clients mengelola semua data perusahaan klien yang pernah atau sedang bekerjasama dengan Surveyor Indonesia.',
    title: 'Manajemen Klien',
    disableBeacon: true,
  },
  {
    target: '#client-stats',
    content: 'Lihat statistik klien secara ringkas: total terdaftar, aktif, dan non-aktif beserta trennya.',
    title: 'Statistik Klien',
    disableBeacon: true,
    placement: 'bottom',
  },
  {
    target: '#add-client-btn',
    content: 'Klik tombol ini untuk mendaftarkan perusahaan klien baru ke dalam sistem.',
    title: 'Tambah Klien',
    disableBeacon: true,
    placement: 'left',
  },
];

// ─── SPH Management ───────────────────────────────────────────────────────────
export const SPH_STEPS: Step[] = [
  {
    target: 'body',
    placement: 'center',
    content: 'Halaman ini mengelola Surat Penawaran Harga (SPH) yang dikirimkan kepada calon klien.',
    title: 'SPH Management',
    disableBeacon: true,
  },
  {
    target: '#create-sph-btn',
    content: 'Klik tombol ini untuk membuat Surat Penawaran Harga baru dan mengirimkannya ke klien potensial.',
    title: 'Buat SPH Baru',
    disableBeacon: true,
    placement: 'left',
  },
  {
    target: '#sph-filters',
    content: 'Gunakan pencarian, filter status, dan rentang tanggal untuk menemukan SPH yang Anda cari.',
    title: 'Filter SPH',
    disableBeacon: true,
    placement: 'bottom',
  },
];

// ─── Audiensi ─────────────────────────────────────────────────────────────────
export const AUDIENSI_STEPS: Step[] = [
  {
    target: 'body',
    placement: 'center',
    content: 'Halaman Audiensi mengelola surat dan jadwal pertemuan formal dengan instansi atau klien potensial.',
    title: 'Manajemen Audiensi',
    disableBeacon: true,
  },
  {
    target: '#create-audiensi-btn',
    content: 'Klik tombol ini untuk membuat surat audiensi baru menggunakan template yang sudah tersedia.',
    title: 'Buat Surat Audiensi',
    disableBeacon: true,
    placement: 'left',
  },
  {
    target: '#audiensi-search',
    content: 'Cari surat audiensi berdasarkan nomor surat, perusahaan, atau tujuan di sini.',
    title: 'Cari Surat',
    disableBeacon: true,
    placement: 'bottom',
  },
];

// ─── Marketing Kanban ────────────────────────────────────────────────────────
export const KANBAN_STEPS: Step[] = [
  {
    target: 'body',
    placement: 'center',
    content: 'Marketing Plan menggunakan tampilan Kanban untuk memudahkan tracking kegiatan marketing dari awal hingga selesai.',
    title: 'Marketing Plan (Kanban)',
    disableBeacon: true,
  },
  {
    target: '#kanban-board',
    content: 'Setiap kartu mewakili satu kegiatan marketing. Geser (drag & drop) kartu antar kolom untuk memperbarui statusnya.',
    title: 'Board Kanban',
    disableBeacon: true,
    placement: 'auto',
  },
  {
    target: '#kanban-add-btn',
    content: 'Klik tombol ini untuk menambahkan kegiatan marketing baru seperti kunjungan klien, presentasi, atau follow-up kontrak.',
    title: 'Tambah Kegiatan',
    disableBeacon: true,
    placement: 'left',
  },
];

// ─── Berkas Dokumen ──────────────────────────────────────────────────────────
export const DOKUMEN_STEPS: Step[] = [
  {
    target: 'body',
    placement: 'center',
    content: 'Halaman Berkas Dokumen menyimpan dokumen-dokumen PDF esensial perusahaan yang bisa diunduh oleh seluruh anggota tim.',
    title: 'Berkas Dokumen',
    disableBeacon: true,
  },
  {
    target: '#upload-form',
    content: 'Isi judul, keterangan (opsional), pilih file PDF, lalu klik "Simpan Dokumen" untuk mengunggah dokumen baru.',
    title: 'Unggah Dokumen',
    disableBeacon: true,
    placement: 'bottom',
  },
  {
    target: '#doc-list',
    content: 'Daftar semua dokumen ditampilkan di sini. Gunakan pencarian untuk menemukan file, lalu Preview atau Download sesuai kebutuhan.',
    title: 'Daftar Dokumen',
    disableBeacon: true,
    placement: 'top',
  },
];

// ─── Settings ────────────────────────────────────────────────────────────────
export const SETTINGS_STEPS: Step[] = [
  {
    target: 'body',
    placement: 'center',
    content: 'Halaman Pengaturan memungkinkan Anda mengelola profil akun, keamanan, dan preferensi notifikasi.',
    title: 'Pengaturan Akun',
    disableBeacon: true,
  },
  {
    target: 'body',
    placement: 'center',
    content: 'Perbarui foto profil, nama, dan informasi divisi Anda di bagian Profil. Gunakan tab lain untuk mengubah kata sandi atau mengelola pengguna.',
    title: 'Navigasi Pengaturan',
    disableBeacon: true,
  },
];

// ─── Persetujuan Proyek ───────────────────────────────────────────────────────
export const APPROVAL_STEPS: Step[] = [
  {
    target: 'body',
    placement: 'center',
    content: 'Halaman Persetujuan adalah tempat bagi para pejabat berwenang untuk meninjau dan menandatangani dokumen SPH atau Surat Audiensi.',
    title: 'Persetujuan Dokumen',
    disableBeacon: true,
  },
  {
    target: '#approval-tabs',
    content: 'Pilih antara dokumen SPH atau Surat Audiensi yang memerlukan persetujuan Anda melalui tab ini.',
    title: 'Pilihan Dokumen',
    disableBeacon: true,
    placement: 'bottom',
  },
  {
    target: '#approval-list',
    content: 'Daftar antrian dokumen yang menunggu persetujuan Anda akan muncul di kolom ini.',
    title: 'Daftar Antrian',
    disableBeacon: true,
    placement: 'right',
  },
  {
    target: '#approval-detail',
    content: 'Detail lengkap dokumen, termasuk konten surat dan informasi PIC, dapat Anda tinjau di sini sebelum memberikan keputusan.',
    title: 'Review Detail',
    disableBeacon: true,
    placement: 'left',
  },
  {
    target: '#approval-actions',
    content: 'Setelah meninjau, Anda bisa menyetujui (Approve & Sign) atau menolak (Reject) dokumen tersebut di bagian sini.',
    title: 'Aksi Keputusan',
    disableBeacon: true,
    placement: 'top',
  },
];

// ─── Log Aktivitas Sistem ───────────────────────────────────────────────────
export const ADMIN_LOG_STEPS: Step[] = [
  {
    target: 'body',
    placement: 'center',
    content: 'Halaman ini mencatat setiap histori perubahan dan aksi penting yang dilakukan seluruh pengguna di dalam sistem.',
    title: 'Log Aktivitas Sistem',
    disableBeacon: true,
  },
  {
    target: '#activity-filters',
    content: 'Gunakan filter ini untuk menyaring log berdasarkan kata kunci, pengguna spesifik, rentang tanggal, atau kategori aksi tertentu.',
    title: 'Filter Lanjutan',
    disableBeacon: true,
    placement: 'bottom',
  },
  {
    target: '#activity-export-btn',
    content: 'Anda dapat mengunduh seluruh data log yang sudah difilter ke dalam format CSV melalui tombol ini untuk pelaporan.',
    title: 'Ekspor Data',
    disableBeacon: true,
    placement: 'left',
  },
  {
    target: '#activity-table',
    content: 'Data log ditampilkan secara kronologis mulai dari aksi terbaru. Anda dapat melihat detail metadata pada setiap baris log.',
    title: 'Tabel Riwayat',
    disableBeacon: true,
    placement: 'top',
    scrollOffset: 150,
  },
  {
    target: '#activity-pagination',
    content: 'Navigasi antar halaman log menggunakan kontrol paginasi di bagian bawah tabel ini.',
    title: 'Navigasi Halaman',
    disableBeacon: true,
    placement: 'top',
    scrollOffset: 200,
  },
];

// ─── Header Help Button ───────────────────────────────────────────────────────
export const HEADER_STEPS: Step[] = [
  {
    target: '#help-button',
    content: 'Bingung? Klik tombol bantuan ini kapan saja untuk mengulang tutorial pada halaman yang sedang Anda lihat.',
    title: 'Pusat Bantuan',
    disableBeacon: true,
  },
];

// ─── Shared Joyride Config ────────────────────────────────────────────────────
export const JOYRIDE_LOCALE = {
  back: 'Kembali',
  close: 'Tutup',
  last: 'Selesai',
  next: 'Lanjut',
  skip: 'Lewati',
};

export const JOYRIDE_STYLES = {
  options: {
    arrowColor: '#fff',
    backgroundColor: '#fff',
    overlayColor: 'rgba(0, 0, 0, 0.5)',
    primaryColor: '#00B4AE',
    textColor: '#334155',
    zIndex: 10000,
  },
  tooltip: {
    borderRadius: '12px',
    boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
  },
  tooltipTitle: {
    fontWeight: 'bold' as const,
    fontSize: '16px',
    color: '#0f172a',
    marginBottom: '6px',
  },
  tooltipContent: {
    fontSize: '14px',
    color: '#475569',
    lineHeight: '1.6',
  },
  buttonNext: {
    backgroundColor: '#00B4AE',
    borderRadius: '8px',
    padding: '8px 18px',
    fontSize: '14px',
    fontWeight: 'bold' as const,
  },
  buttonBack: {
    marginRight: '10px',
    color: '#64748b',
    fontSize: '14px',
  },
  buttonSkip: {
    color: '#94a3b8',
    fontSize: '13px',
  },
};
