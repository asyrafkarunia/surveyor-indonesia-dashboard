import { NavItem, StatCardData, RevenueData, ProjectData, FeedItemData, DeadlineData, OnlineMember, ActivityItemData, NotificationItemData, ClientData, ProjectHistoryItem, ClientActivityItem, ContractHistoryItem, SphData, SystemUser, PermissionCategory, ActivityLogEntry, KanbanColumn, AudiensiTemplate, AudiensiLetter, MonitoringProjectItem } from './types';

export const SIDEBAR_NAV: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: 'dashboard', href: '#' },
  { id: 'monitoring', label: 'Monitoring Proyek', icon: 'folder', href: '#' },
  { id: 'approval', label: 'Persetujuan Proyek', icon: 'verified', href: '#' },
  { id: 'calendar', label: 'Kalendar Aktivitas', icon: 'calendar_month', href: '#' },
  { id: 'activity', label: 'Activity Feed', icon: 'show_chart', href: '#' },
  { id: 'clients', label: 'Clients', icon: 'groups', href: '#' },
  { id: 'sph', label: 'SPH Management', icon: 'description', href: '#' },
  { id: 'audiensi', label: 'Surat Audiensi', icon: 'mail', href: '#' },
  { id: 'marketing_kanban', label: 'Marketing Plan', icon: 'view_kanban', href: '#' },
  { id: 'essential_docs', label: 'Berkas Dokumen', icon: 'folder_zip', href: '#' },
  { id: 'settings', label: 'Settings', icon: 'settings', href: '#' },
  { id: 'permissions', label: 'Kelola Izin', icon: 'admin_panel_settings', href: '#' },
  { id: 'admin_log', label: 'Log Aktivitas', icon: 'history', href: '#' },
];

export const MARKETING_TEAM = [
  { id: 'm1', name: 'Andi Wijaya', role: 'Head Section Marketing', avatar: 'https://picsum.photos/seed/andi/100/100' },
  { id: 'm2', name: 'Rina Kartika', role: 'Social Media Specialist', avatar: 'https://picsum.photos/seed/rina/100/100' },
  { id: 'm3', name: 'Siti Aminah', role: 'Content Strategist', avatar: 'https://picsum.photos/seed/siti/100/100' },
  { id: 'm4', name: 'Dimas Pratama', role: 'Brand Manager', avatar: 'https://picsum.photos/seed/dimas/100/100' }
];

export const MONITORING_PROJECTS: MonitoringProjectItem[] = [
  {
    id: 'mp1',
    code: 'PROJ-2025-001',
    title: 'Audit Infrastruktur Jembatan Merah',
    startDate: '10 Jan',
    endDate: '28 Feb 2025',
    progress: 65,
    status: 'RUNNING',
    comments: 1,
    picName: 'Andi Saputra',
    picAvatar: '',
    icon: 'engineering',
    iconColor: 'text-blue-600',
    iconBg: 'bg-blue-50',
    recentActivity: 'Finalizing field report'
  },
  {
    id: 'mp2',
    code: 'PROJ-2025-042',
    title: 'Sertifikasi ISO 9001 Pertamina',
    startDate: '15 Jan',
    endDate: '30 Jun 2025',
    progress: 15,
    status: 'PENDING',
    comments: 0,
    picName: 'Maya Wijaya',
    picAvatar: '',
    icon: 'verified',
    iconColor: 'text-orange-600',
    iconBg: 'bg-orange-50',
    recentActivity: 'Waiting for client documents'
  },
  {
    id: 'mp3',
    code: 'PROJ-2025-102',
    title: 'Risk Assessment Gedung PT KAI',
    startDate: '02 Jan',
    endDate: '10 Jan 2025',
    progress: 100,
    status: 'DONE',
    comments: 0,
    picName: 'Budi Santoso',
    picAvatar: '',
    icon: 'security',
    iconColor: 'text-green-600',
    iconBg: 'bg-green-50',
    recentActivity: 'Laporan final diserahkan'
  },
  {
    id: 'mp4',
    code: 'PROJ-2025-089',
    title: 'Technical Audit Power Plant Jabar',
    startDate: 'Delayed',
    endDate: 'Suspended',
    progress: 45,
    status: 'REJECTED',
    comments: 3,
    picName: 'Dewi Lestari',
    picAvatar: '',
    icon: 'bolt',
    iconColor: 'text-red-600',
    iconBg: 'bg-blue-50',
    recentActivity: 'Project scope mismatch'
  }
];

export const KANBAN_DATA: KanbanColumn[] = [
  {
    id: 'ide_baru',
    title: 'Ide Baru',
    color: 'border-blue-500',
    cards: [
      { id: 'k1', title: 'Campaign Digital Pertamina Q4', client: 'PT Pertamina', priority: 'High', date: '12 Nov', assignee: { name: 'Andi', initials: 'AW' } },
      { id: 'k2', title: 'Sponsorship Event BUMN 2024', client: 'Kemen BUMN', priority: 'Medium', date: '20 Nov', assignee: { name: 'Rina', initials: 'RK' } }
    ]
  },
  {
    id: 'review',
    title: 'Dalam Review',
    color: 'border-yellow-500',
    cards: [
      { id: 'k3', title: 'Proposal Kerjasama PLN Jabar', client: 'PT PLN', priority: 'High', date: '05 Nov', assignee: { name: 'Dewi', initials: 'DL' } }
    ]
  },
  {
    id: 'sph',
    title: 'Persiapan SPH',
    color: 'border-orange-500',
    cards: [
      { id: 'k4', title: 'Audit Lingkungan Bio Farma', client: 'PT Bio Farma', priority: 'Medium', date: '08 Nov', assignee: { name: 'Budi', initials: 'BS' } },
      { id: 'k5', title: 'Sertifikasi ISO 14001', client: 'PT Adhi Karya', priority: 'Low', date: '15 Nov', assignee: { name: 'Sarah', initials: 'SW' } }
    ]
  },
  {
    id: 'berjalan',
    title: 'Sedang Berjalan',
    color: 'border-red-500',
    cards: [
      { id: 'k6', title: 'Monitoring Proyek MRT Tahap 2', client: 'MRT Jakarta', priority: 'High', date: 'Ongoing', assignee: { name: 'Dimas', initials: 'DP' } }
    ]
  },
  {
    id: 'selesai',
    title: 'Selesai',
    color: 'border-green-500',
    cards: [
      { id: 'k7', title: 'Exhibition Surveyor Expo 2023', client: 'Internal', priority: 'Medium', date: '20 Oct', assignee: { name: 'Andi', initials: 'AW' } }
    ]
  }
];

export const STATS: StatCardData[] = [
  { 
    title: 'Total Revenue', 
    value: 'Rp 15.5 M', 
    trend: 12, 
    trendLabel: 'vs last month', 
    icon: 'payments', 
    iconColor: 'text-primary' 
  },
  { 
    title: 'SPH Issued', 
    value: '45', 
    trend: 5, 
    trendLabel: 'vs last month', 
    icon: 'description', 
    iconColor: 'text-blue-600' 
  },
  { 
    title: 'Win Rate', 
    value: '68%', 
    trend: 2, 
    trendLabel: 'vs target', 
    icon: 'emoji_events', 
    iconColor: 'text-amber-500',
    isNegative: true
  },
  { 
    title: 'Project Berjalan', 
    value: '12', 
    trend: 1, 
    trendLabel: 'new project', 
    icon: 'engineering', 
    iconColor: 'text-purple-500' 
  },
];

export const REVENUE_CHART_DATA: RevenueData[] = [
  { month: 'Jan', projection: 60, realization: 50 },
  { month: 'Feb', projection: 70, realization: 75 },
  { month: 'Mar', projection: 80, realization: 60 },
  { month: 'Apr', projection: 75, realization: 80 },
  { month: 'May', projection: 85, realization: 90 },
  { month: 'Jun', projection: 90, realization: 85 },
  { month: 'Jul', projection: 70, realization: 65 },
  { month: 'Aug', projection: 80, realization: 82 },
  { month: 'Sep', projection: 85, realization: 100 },
  { month: 'Oct', projection: 90, realization: 0 },
  { month: 'Nov', projection: 95, realization: 0 },
  { month: 'Dec', projection: 100, realization: 0 },
];

export const FEED_ITEMS: FeedItemData[] = [
  {
    id: '1',
    user: { name: 'Budi Santoso', avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuClMJjljnhD2iBCvjqxg4BXa1gTZkFktJFBIqn7KNn_Dn0RX1Rrc4CBYiMNlTrOBalN8m94LKwcescxmCx-bmoj96CjHgg7aNdXJVOdBqJeg6I1Lx0ApwQMhm9eZVErSNGCstFgSA1n6UDz-zq3D0kkcwZZ6T4bV369ADdeHmf3vdt8woONq6XWzxuiia8KUBTVhB7g459RCIczOfbdAGfBW2EqNW3w5UipozT5vTcTJ5zFDDBMNfZQbDfIrIRtUyKcQC3l90CEhw8' },
    timestamp: '2 jam yang lalu',
    type: 'project_update',
    project: 'Project Alpha',
    content: 'Status proyek telah diperbarui menjadi In Progress. Tim lapangan sudah mulai melakukan survei awal di lokasi Jawa Barat. Laporan awal akan tersedia besok sore.',
    likes: 4,
    comments: 0
  },
  {
    id: '2',
    user: { name: 'System Alert', avatar: '' },
    timestamp: '4 jam yang lalu',
    type: 'alert',
    isUrgent: true,
    tags: ['Compliance', 'Urgent'],
    content: 'Dokumen kepatuhan baru untuk Audit Q3 telah diunggah dan membutuhkan tinjauan segera dari manajer departemen.',
    attachment: {
      name: 'Audit_Compliance_Q3_2024.pdf',
      size: '2.4 MB',
      type: 'PDF Document'
    }
  },
  {
    id: '3',
    user: { name: 'Siti Aminah', avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA3h0VmkP0cOd5wWPfI6HfLBXPlwBj6uSszysRJxSOsdbp32DX9f7qo06vaP4-IPPJnwXRuC6702ZhNs2GCtVBNznfZoMig4hA2nlIoIQ0fucC3eFnN7YrzpU2RrQMmL590fnF_IYEAoGJxvG8Neckq3_i-NLU0toGMyZ0YLi2rSVHj9-ckvwU5rEmjxQlyisOzOKzey3lNbpB2T1gwZs_M9B6e453utlinQl4GMXgs4sjpYtOVKO6YeNSwUlNccBenODxDHKGf03E' },
    timestamp: '5 jam yang lalu',
    type: 'meeting',
    tags: ['Rapat Internal'],
    content: 'Reminder: Rapat evaluasi pendapatan Q3 akan diadakan hari Jumat pukul 14:00 WIB. Mohon siapkan laporan masing-masing divisi.',
    likes: 2,
    comments: 1
  }
];

export const NOTIFICATIONS: NotificationItemData[] = [
  {
    id: 'n1',
    user: { name: 'Arif - Marketing', avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA8tZbNeOF-MipUFF1FeBpYfR_Ax2TuRJNfPau3ZHE5EJWu4YRP60OgszbKwvAnYUY06L8nVxHSKB2rUoBZnceQ7kCLldYFGWqUXVJoWPIASH34s1fw3OL_CAH6r6XiLdkfr86x1hHy2bTrsBcgRw6zfV7jjaboIGadGkoiMfPclXEqDymkMtI9ML8S8WTKnnaUbLJ-RSCepY-nHz2OAsV01cpmdWvGchcntfdEg74wodWrplzbxEsKLEkYmf7V5i2pBb_aL4knCL8' },
    type: 'comment',
    projectName: 'PTPN 5 Revitalization',
    content: 'Menambahkan komentar baru: "Mohon segera perbarui laporan keuangan Q3 sebelum rapat direksi besok siang. Terima kasih."',
    timestamp: '10 mnt yang lalu',
    isUnread: true
  },
  {
    id: 'n2',
    user: { name: 'Sistem Admin', avatar: '' },
    type: 'alert',
    content: 'Pemberitahuan pendapatan untuk Proyek ID #402 menunggu persetujuan Anda. Harap tinjau dokumen terkait.',
    timestamp: '2 jam yang lalu',
    isUnread: true,
    tag: 'Pending Approval'
  },
  {
    id: 'n3',
    user: { name: 'Project Manager', avatar: '' },
    type: 'assignment',
    content: 'Anda telah ditugaskan ke "Survey Lapangan - Area Jatim". Deadline tugas ini adalah 25 Oktober 2023.',
    timestamp: '4 jam yang lalu',
    isUnread: false,
    tag: 'Assignment Baru'
  },
  {
    id: 'n4',
    user: { name: 'IT Support', avatar: '' },
    type: 'system',
    content: 'Pemeliharaan server terjadwal telah selesai. Semua layanan dashboard kini berjalan normal.',
    timestamp: 'Kemarin, 16:30',
    isUnread: false,
    tag: 'System Maintenance'
  },
  {
    id: 'n5',
    user: { name: 'Sarah - Finance', avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA-XfaAVfJvILASkPF2AbysJq2-Q5xn_mtCGg3p6QNE7VVd6V-4fJmsB24CuE1HWzdKGwt3-cv9ozX5aCwDNbinUm5Ys2A_HOAo1fu24gvOYXszafyvMOg-xERXbY5JjgIguoDFh8iqedI0_H4gIxdrsnuZJ1d_VVp566JkAZODeLa7r32y4eeJr9rGGPhDt7xVXBjelBbAyJkamdFOs8vo0ejhM4SlZ0HW5qKpRHoGdW9qf5SEt5YOvw2d0vEyUl-CxRd4ff0s6XI' },
    type: 'finance',
    projectName: 'Invoice #9921',
    content: 'Dokumen invoice telah disetujui dan diteruskan ke bagian pembayaran.',
    timestamp: 'Kemarin, 09:15',
    isUnread: false
  }
];

export const DEADLINES: DeadlineData[] = [
  { id: 'd1', title: 'Laporan Akhir Proyek X', team: 'Tim Surveyor A', date: '24', month: 'OKT' },
  { id: 'd2', title: 'Audit ISO 9001', team: 'Divisi Kepatuhan', date: '28', month: 'OKT' }
];

export const ONLINE_MEMBERS: OnlineMember[] = [
  { id: 'm1', name: 'Andi Wijaya', avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCZ2xRFjUlY0Z9Zb25B8R1VnWCbleyBjNBPMUShDNnNjWVlbVjumuaeuPAyfm6E_Gj2woLV0AMYl_RH_NU9-gR7WhIEmG9qDQv0ZpTOpcUkKjaBtrMTqRPfO-mC-X6LWtr9RPfO-mC-X6LWtr9RXKTv6oUHYK0tYNeF7ruDCWFPI41h2cXhuXecNSfPrxAnZkxq7SKsg4s5L1JqFsNdAmnskscDw_MX6jSAmeT_peMWPxEVRYZuWqbd4Xg1MlU6KoUwq-sX5kmSx5qwo3mBXh8PtY2xPY', isOnline: true },
  { id: 'm2', name: 'Rina Kartika', avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAg0Ziw2kRiIpo-_ycjWKV45bmg0_VRw3I3SqX1AaRmIHdrYelO9e3zRZuoYD4qPVOEMgtPcXoEX7Zgg7dRq0j30_kpZZw4gCeGOOlOo2tpw6At-oXKuEQ_BMEvsVuI9QvYGSbmpemCk9o_l1T_Pr6AodFVjK7znZ3YbSwfMuiHmwZRiFgK0eXPbrgQR0w0z969MMUVHzoqzyEge-gkg-HFEkDIitBBYTy4FA8qCXEhD3uDW6PFtiHvdM3uZmjqc5_uOyvanvOBY7w', isOnline: true },
  { id: 'm3', name: 'Dewi Lestari', avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBU7kwH47_i59Ye7RI773zQQx6XVl6y_HQqrV9pCPLip2aaMSixumePgBDgaZHfHGzP5Grs7AQ8dVDQ9SAFU-1-Yso9sbxvkbQP9uBtfqbjN9prj5UlW6pXAvnAXb3jGPC0syyxoJQsgKefuS3n98DuIulbg1-BOJ2WjtUaW8YRHrdnZxpQPtNEuYH1jrvT-kC3oOA31Nnng_UMI2ZzmcovPYa7OLDt5d1XB_jG6XHNnrwUiUxZDtrElxZSIpeSeqSMy9wUHyZjHHs', isOnline: true }
];

export const TOP_PROJECTS: ProjectData[] = [
  { id: '1', name: 'Audit ISO 9001', client: 'PT Pertamina', status: 'In Progress', progress: 75 },
  { id: '2', name: 'Sertifikasi CHSE', client: 'Hotel Indonesia', status: 'Completed', progress: 100 },
  { id: '3', name: 'Inspeksi Teknis', client: 'PLN', status: 'Delayed', progress: 40 },
  { id: '4', name: 'Uji Laboratorium', client: 'Bio Farma', status: 'In Progress', progress: 60 },
  { id: '5', name: 'Verifikasi TKDN', client: 'Wika', status: 'Pending', progress: 10 },
];

export const RECENT_ACTIVITIES: ActivityItemData[] = [
  {
    id: 'a1',
    type: 'update',
    user: 'Andi Wijaya',
    tag: 'PROYEK',
    action: 'memperbarui status',
    target: 'Audit ISO 9001',
    time: '10 menit yang lalu'
  },
  {
    id: 'a2',
    type: 'complete',
    user: 'Rina Kartika',
    tag: 'LAPORAN',
    action: 'menyelesaikan',
    target: 'Laporan Mingguan Q3',
    time: '1 jam yang lalu'
  },
  {
    id: 'a3',
    type: 'alert',
    user: 'System',
    action: 'mendeteksi keterlambatan di',
    target: 'Inspeksi Teknis PLN',
    time: '2 jam yang lalu'
  },
  {
    id: 'a4',
    type: 'create',
    user: 'Dewi Lestari',
    tag: 'DOKUMEN',
    action: 'mengunggah dokumen baru untuk',
    target: 'Sertifikasi CHSE',
    time: '5 jam yang lalu'
  }
];

export const CLIENTS: ClientData[] = [
  {
    id: 'CL-2023-089',
    companyName: 'PT Maju Sejahtera',
    logo: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBMcG5_fCSS_jLEk4kY7cg6UNmicpCHURfOOT1uuWcVaqkGlHz88I2Wd6yeKR-Wtu-uG480gU1VpVbE_gcmCGaJdCf8RaYky5c_nGrNjrba0CDWvyMJ41WJl_3eE76Ka-RPjEKlQMN6wktXhjkUqCVNC5jqZwUrq9FQGOmQdemLMJGZWuDAuhgCojr21AUUovk7lYJta6plVS05X58Icp7Bm4DhcbYVI5ryaJV03SUB77K0e89IXteHULOHl4aEXuBoTkMm2DsLsL8',
    contactPerson: 'Budi Santoso',
    contactRole: 'PIC',
    type: 'Swasta',
    status: 'Aktif',
    email: 'budi.s@majusejahtera.com',
    phone: '0812-3456-7890',
    industry: 'Oil & Gas Industry',
    location: 'Jakarta Selatan'
  },
  {
    id: 'CLI-00124',
    companyName: 'PT Pertamina (Persero)',
    logo: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCKkwYbQx8SftqYyNrsl80NboXyRYPv51-k8lVz4LRJ7wvkrrpCc_9P1jRLYTrHqofDNXBM_A2pe9_43JJNqSOngfMoUXJKifGzgWFLWic1b_XxeAGWjuVitmRtrVSm7yfBtMrS3kmDHwdu4VWUqiAQDfu9DEDT9JjYvyAPsPsowr1PS3v7Iw-7BL5qFaZLJepbWnf6AHmm1okQvlbkqqCHqpCwRnLffZNfyJaLJkpk6XuuwzIoYr6JX3PrRB-SA7wiyG58YFZskdo',
    contactPerson: 'Arif Hidayat',
    contactRole: 'VP Procurement',
    type: 'BUMN',
    status: 'Aktif',
    email: 'arif.h@pertamina.com',
    phone: '0812-3456-7891'
  },
  {
    id: 'CLI-00125',
    companyName: 'PT Telkom Indonesia',
    logo: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCTmA1_v9hjYX3PcmfRwrwg81YNHTsvXHStp8Qj3YhqiI7HLfdJ5GzHMOOEnI_0nsrcMw5-HBBAorzWVEER5ODQqnIEDf4yYaYaiuNnJF2IKltQusTyfb3psKX1RV8l0NRcUlbXIwzHJMAn7abMJ_larIzyEQUrhvWq25NpDUNGTs18QkZ9kDboCL4PuEdQOOeCIDWOOHrs3yDQd4s059QnLolzWjTwHJHg1JQzDbAWAh3qKXqG0MZgbzeWaBXSDEOday7ukGbtNgM',
    contactPerson: 'Sarah Wijaya',
    contactRole: 'Procurement Manager',
    type: 'BUMN',
    status: 'Aktif',
    email: 'procurement@telkom.co.id',
    phone: '021-5215100'
  }
];

export const CLIENT_CONTRACT_HISTORY: ContractHistoryItem[] = [
  { id: 'c1', contractNo: 'CTR-2023-MSA-001', type: 'Master Service Agreement', period: 'Jan 2023 - Jan 2025', value: 'IDR 5.000.000.000', status: 'Active' },
  { id: 'c2', contractNo: 'CTR-2022-ENV-089', type: 'Environmental Audit', period: 'Nov 2022 - Nov 2023', value: 'IDR 1.200.000.000', status: 'Expired' }
];

export const CLIENT_PROJECT_HISTORY: ProjectHistoryItem[] = [
  { id: 'ph1', name: 'Audit ISO 9001:2015', type: 'Certification', status: 'On Progress', value: 'IDR 150.000.000', startedAt: 'Jan 2024' },
  { id: 'ph2', name: 'Environmental Impact Analysis', type: 'Consultancy', status: 'On Progress', value: 'IDR 320.000.000', startedAt: 'Nov 2023' },
  { id: 'ph3', name: 'Safety Equipment Inspection', type: 'Inspection', status: 'Completed', value: 'IDR 85.000.000', startedAt: 'Oct 2023' },
  { id: 'ph4', name: 'Annual Financial Audit', type: 'Finance', status: 'Completed', value: 'IDR 200.000.000', startedAt: 'Aug 2023' }
];

export const CLIENT_RECENT_ACTIVITY: ClientActivityItem[] = [
  { id: 'ca1', title: 'Proposal Sent for New Audit', type: 'mail', by: 'Marketing Team', time: '2 hours ago' },
  { id: 'ca2', title: 'Invoice #INV-2024-001 Paid', type: 'check', by: 'Finance', time: 'Yesterday' },
  { id: 'ca3', title: 'Meeting with Procurement', type: 'groups', by: 'PIC Team', time: '2 days ago', description: '"Discussed timeline for the upcoming Environmental Impact Analysis..." '},
  { id: 'ca4', title: 'Contract Signed', type: 'edit_document', by: 'Legal Team', time: '1 week ago' }
];

export const SPH_LIST: SphData[] = [
  {
    id: 'sph1',
    sphNo: 'SPH-001/PTSI/2023',
    clientName: 'PT Pertamina (Persero)',
    projectName: 'Inspeksi Pipa Wilayah Jabar',
    value: '150.000.000',
    dateCreated: '12 Oct 2023',
    status: 'Approved',
    clientAbbreviation: 'PP'
  },
  {
    id: 'sph2',
    sphNo: 'SPH-002/PTSI/2023',
    clientName: 'PLN (Persero)',
    projectName: 'Audit Energi Gedung Pusat',
    value: '75.000.000',
    dateCreated: '14 Oct 2023',
    status: 'Sent',
    icon: 'bolt',
    iconBg: 'bg-yellow-100',
    iconColor: 'text-yellow-600'
  },
  {
    id: 'sph3',
    sphNo: 'SPH-003/PTSI/2023',
    clientName: 'Waskita Karya',
    projectName: 'Sertifikasi ISO 9001',
    value: '45.000.000',
    dateCreated: '15 Oct 2023',
    status: 'Draft',
    clientAbbreviation: 'WK'
  },
  {
    id: 'sph4',
    sphNo: 'SPH-004/PTSI/2023',
    clientName: 'Adhi Karya',
    projectName: 'Supervisi Konstruksi LRT',
    value: '210.000.000',
    dateCreated: '16 Oct 2023',
    status: 'Rejected',
    clientAbbreviation: 'AD'
  },
  {
    id: 'sph5',
    sphNo: 'SPH-005/PTSI/2023',
    clientName: 'PDAM Jaya',
    projectName: 'Analisis Kualitas Air',
    value: '35.500.000',
    dateCreated: '18 Oct 2023',
    status: 'Sent',
    icon: 'water_drop',
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600'
  }
];

export const SYSTEM_USERS: SystemUser[] = [
  // Administrator (Marketing Team)
  {
    id: 'u1',
    name: 'Budi Santoso',
    email: 'budi.s@ptsi.co.id',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAp6ufr4riUgTiSOj6YtriLFLSyKiB0CHYDbTaQ6y776fU-bXMgQB_XkrL0CLhQyrQJyk2pXJZC3p7PEA_jHcGni5kVQlEO9gJmiATYquxZOWBdNDYsq9k1qH10FKUWs5d_UOehw7_B9uTMOhfIBFnQs7kho3wXoE0NrlfHrMELnhFAO6ETt8PeWLrKvBZwK84n5Zv8guE2Xy-zM00fVxbeuCmLunh60FNGs1TliEOvr3NwGEbotirDgMyozEergttCJkB7S8DGyZw',
    role: 'marketing',
    roleName: 'Head Section Marketing',
    division: 'Marketing',
    status: 'Aktif',
    isCurrentUser: true,
    employeeId: 'SI-2023-001'
  },
  {
    id: 'u2',
    name: 'Andi Wijaya',
    email: 'andi.w@ptsi.co.id',
    role: 'marketing',
    roleName: 'Marketing Staff',
    division: 'Marketing',
    status: 'Aktif',
    employeeId: 'SI-2023-002'
  },
  {
    id: 'u3',
    name: 'Rina Kartika',
    email: 'rina.k@ptsi.co.id',
    role: 'marketing',
    roleName: 'Social Media Specialist',
    division: 'Marketing',
    status: 'Aktif',
    employeeId: 'SI-2023-003'
  },
  {
    id: 'u4',
    name: 'Siti Aminah',
    email: 'siti.a@ptsi.co.id',
    role: 'marketing',
    roleName: 'Content Strategist',
    division: 'Marketing',
    status: 'Aktif',
    employeeId: 'SI-2023-004'
  },
  {
    id: 'u5',
    name: 'Dimas Pratama',
    email: 'dimas.p@ptsi.co.id',
    role: 'marketing',
    roleName: 'Brand Manager',
    division: 'Marketing',
    status: 'Aktif',
    employeeId: 'SI-2023-005'
  },
  // Approver (Senior Manager & General Manager)
  {
    id: 'u6',
    name: 'Ahmad Hidayat',
    email: 'ahmad.h@ptsi.co.id',
    role: 'approver',
    roleName: 'Senior Manager',
    division: 'Manajemen',
    status: 'Aktif',
    employeeId: 'SI-2022-101'
  },
  {
    id: 'u7',
    name: 'Sari Indrawati',
    email: 'sari.i@ptsi.co.id',
    role: 'approver',
    roleName: 'Senior Manager',
    division: 'Manajemen',
    status: 'Aktif',
    employeeId: 'SI-2022-102'
  },
  {
    id: 'u8',
    name: 'Bambang Sutrisno',
    email: 'bambang.s@ptsi.co.id',
    role: 'approver',
    roleName: 'General Manager',
    division: 'Manajemen',
    status: 'Aktif',
    employeeId: 'SI-2021-201'
  },
  {
    id: 'u9',
    name: 'Lina Wati',
    email: 'lina.w@ptsi.co.id',
    role: 'approver',
    roleName: 'General Manager',
    division: 'Manajemen',
    status: 'Aktif',
    employeeId: 'SI-2021-202'
  },
  // Umum - Operasi
  {
    id: 'u10',
    name: 'Dewi Pertiwi',
    email: 'dewi.p@ptsi.co.id',
    role: 'common',
    roleName: 'Senior Surveyor',
    division: 'Operasi',
    status: 'Aktif',
    employeeId: 'SI-2023-301'
  },
  {
    id: 'u11',
    name: 'Eko Prasetyo',
    email: 'eko.p@ptsi.co.id',
    role: 'common',
    roleName: 'Surveyor',
    division: 'Operasi',
    status: 'Aktif',
    employeeId: 'SI-2023-302'
  },
  {
    id: 'u12',
    name: 'Fajar Nugroho',
    email: 'fajar.n@ptsi.co.id',
    role: 'common',
    roleName: 'Field Staff',
    division: 'Operasi',
    status: 'Aktif',
    employeeId: 'SI-2023-303'
  },
  {
    id: 'u13',
    name: 'Gita Sari',
    email: 'gita.s@ptsi.co.id',
    role: 'common',
    roleName: 'Technical Lead',
    division: 'Operasi',
    status: 'Aktif',
    employeeId: 'SI-2023-304'
  },
  {
    id: 'u14',
    name: 'Hendra Kurniawan',
    email: 'hendra.k@ptsi.co.id',
    role: 'common',
    roleName: 'Project Manager',
    division: 'Operasi',
    status: 'Aktif',
    employeeId: 'SI-2023-305'
  },
  {
    id: 'u15',
    name: 'Indra Wijaya',
    email: 'indra.w@ptsi.co.id',
    role: 'common',
    roleName: 'Surveyor',
    division: 'Operasi',
    status: 'Aktif',
    employeeId: 'SI-2023-306'
  },
  // Umum - SDM
  {
    id: 'u16',
    name: 'Joko Susilo',
    email: 'joko.s@ptsi.co.id',
    role: 'common',
    roleName: 'HR Manager',
    division: 'SDM',
    status: 'Aktif',
    employeeId: 'SI-2023-401'
  },
  {
    id: 'u17',
    name: 'Kartika Dewi',
    email: 'kartika.d@ptsi.co.id',
    role: 'common',
    roleName: 'HR Staff',
    division: 'SDM',
    status: 'Aktif',
    employeeId: 'SI-2023-402'
  },
  {
    id: 'u18',
    name: 'Lukman Hakim',
    email: 'lukman.h@ptsi.co.id',
    role: 'common',
    roleName: 'Recruitment Specialist',
    division: 'SDM',
    status: 'Aktif',
    employeeId: 'SI-2023-403'
  },
  {
    id: 'u19',
    name: 'Maya Sari',
    email: 'maya.s@ptsi.co.id',
    role: 'common',
    roleName: 'HR Staff',
    division: 'SDM',
    status: 'Cuti',
    employeeId: 'SI-2023-404'
  },
  // Umum - Keuangan
  {
    id: 'u20',
    name: 'Rudi Hartono',
    email: 'rudi.h@ptsi.co.id',
    role: 'common',
    roleName: 'Finance Manager',
    division: 'Keuangan',
    status: 'Aktif',
    employeeId: 'SI-2023-501'
  },
  {
    id: 'u21',
    name: 'Nina Wulandari',
    email: 'nina.w@ptsi.co.id',
    role: 'common',
    roleName: 'Finance Staff',
    division: 'Keuangan',
    status: 'Aktif',
    employeeId: 'SI-2023-502'
  },
  {
    id: 'u22',
    name: 'Omar Fauzi',
    email: 'omar.f@ptsi.co.id',
    role: 'common',
    roleName: 'Accountant',
    division: 'Keuangan',
    status: 'Aktif',
    employeeId: 'SI-2023-503'
  },
  {
    id: 'u23',
    name: 'Putri Lestari',
    email: 'putri.l@ptsi.co.id',
    role: 'common',
    roleName: 'Accounting Staff',
    division: 'Keuangan',
    status: 'Aktif',
    employeeId: 'SI-2023-504'
  },
  {
    id: 'u24',
    name: 'Qori Sandria',
    email: 'qori.s@ptsi.co.id',
    role: 'common',
    roleName: 'Finance Staff',
    division: 'Keuangan',
    status: 'Nonaktif',
    employeeId: 'SI-2023-505'
  }
];

export const PERMISSION_CATEGORIES: PermissionCategory[] = [
  {
    id: 'sph_management',
    title: 'Manajemen SPH',
    description: 'Izin terkait Surat Penawaran Harga',
    icon: 'description',
    permissions: [
      { id: 'view_sph', name: 'Lihat Daftar SPH', description: 'Mengizinkan pengguna melihat seluruh daftar SPH.', isEnabled: true },
      { id: 'create_sph', name: 'Buat SPH Baru', description: 'Mengizinkan pengguna membuat draft SPH baru.', isEnabled: true },
      { id: 'delete_sph', name: 'Hapus SPH', description: 'Mengizinkan penghapusan data SPH permanen.', isEnabled: false },
      { id: 'approve_sph', name: 'Persetujuan Manajerial', description: 'Mengizinkan pengguna untuk menyetujui (approve) dokumen SPH.', isEnabled: true },
    ]
  },
  {
    id: 'client_data',
    title: 'Data Klien',
    description: 'Akses ke database pelanggan dan kontak',
    icon: 'group',
    permissions: [
      { id: 'view_client_detail', name: 'Lihat Detail Klien', description: 'Akses read-only ke profil lengkap klien.', isEnabled: true },
      { id: 'edit_pic', name: 'Edit Kontak Person', description: 'Mengubah data PIC klien.', isEnabled: false },
    ]
  },
  {
    id: 'reports_analytics',
    title: 'Laporan & Analitik',
    description: 'Akses ke dashboard eksekutif',
    icon: 'bar_chart',
    permissions: [
      { id: 'export_data', name: 'Ekspor Data', description: 'Mengunduh data dalam format CSV/PDF.', isEnabled: true },
    ]
  }
];

export const ADMIN_ACTIVITY_LOGS: ActivityLogEntry[] = [
  {
    id: 'l1',
    date: '24 Oct, 2023',
    time: '10:42 AM',
    adminName: 'Budi Santoso',
    adminId: 'ADM-004',
    adminInitials: 'BS',
    action: 'Approved SPH Document',
    actionTarget: '#SPH-2023-001',
    module: 'SPH Mgmt',
    moduleIcon: 'description',
    moduleColor: 'purple',
    status: 'Success'
  },
  {
    id: 'l2',
    date: '24 Oct, 2023',
    time: '09:15 AM',
    adminName: 'Siti Aminah',
    adminId: 'ADM-012',
    adminAvatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDA6GBYhkN32Jn3E9eaIAArkrHE1VdHbh3kB1zun59ZYqciRZfl6vl1YtJC0YW9t358ldA9l9a7QycTC5RJ5i3TXv8uF0bhxpBxheNtWJ42_6VvfAvSuI_zoUCm4g6pCUAUuPU_sTtflK1LAWGAluaUhfV7hD5QIF04A0OYXF_JS34pkyLET1sKR0HK9z9eCGuru32nX2ne3_RM_I3Tsn-sTq5vGNSOcUYYGIG1ABaDqybLx4WzSxols1DLoPOrkosaDkphJiMkXCA',
    action: 'Updated Client Details for',
    actionTarget: 'PT Pertamina',
    module: 'Clients',
    moduleIcon: 'apartment',
    moduleColor: 'blue',
    status: 'Success'
  },
  {
    id: 'l3',
    date: '23 Oct, 2023',
    time: '16:20 PM',
    adminName: 'System Admin',
    adminId: 'SYS-ROOT',
    adminInitials: 'SYS',
    action: 'Deleted User Account',
    actionTarget: '#ID-992',
    module: 'Users',
    moduleIcon: 'manage_accounts',
    moduleColor: 'orange',
    status: 'Warning'
  },
  {
    id: 'l4',
    date: '23 Oct, 2023',
    time: '14:10 PM',
    adminName: 'Budi Santoso',
    adminId: 'ADM-004',
    adminInitials: 'BS',
    action: 'Exported Activity Log Report (PDF)',
    module: 'Logs',
    moduleIcon: 'history',
    moduleColor: 'slate',
    status: 'Success'
  },
  {
    id: 'l5',
    date: '23 Oct, 2023',
    time: '08:00 AM',
    adminName: 'Unknown User',
    adminId: 'IP: 192.168.1.105',
    adminInitials: '?',
    action: 'Failed Login Attempt (Wrong Password)',
    module: 'Auth',
    moduleIcon: 'lock',
    moduleColor: 'red',
    status: 'Failed'
  }
];

export const AUDIENSI_TEMPLATES: AudiensiTemplate[] = [
  {
    id: 'tpl1',
    name: 'Undangan Audiensi Formal',
    version: '2.1',
    format: 'Docx',
    sector: 'Sektor Migas',
    createdAt: '12 Okt 2023',
    status: 'Aktif',
    icon: 'article',
    iconColor: 'text-blue-600',
    iconBg: 'bg-blue-50'
  },
  {
    id: 'tpl2',
    name: 'Surat Pengantar Proposal',
    version: '1.0',
    format: 'Docx',
    sector: 'Sektor Infrastruktur',
    createdAt: '10 Okt 2023',
    status: 'Aktif',
    icon: 'article',
    iconColor: 'text-indigo-600',
    iconBg: 'bg-indigo-50'
  },
  {
    id: 'tpl3',
    name: 'Follow-up Meeting Client',
    version: 'Draft',
    format: 'Docx',
    sector: 'Umum',
    createdAt: '05 Okt 2023',
    status: 'Draft',
    icon: 'history_edu',
    iconColor: 'text-gray-600',
    iconBg: 'bg-gray-100'
  },
  {
    id: 'tpl4',
    name: 'Surat Penawaran Harga (SPH)',
    version: '4.2',
    format: 'PDF',
    sector: 'Sektor Minerba',
    createdAt: '01 Okt 2023',
    status: 'Aktif',
    icon: 'article',
    iconColor: 'text-teal-600',
    iconBg: 'bg-teal-50'
  }
];

export const AUDIENSI_LETTERS: AudiensiLetter[] = [
  {
    id: 'al1',
    letterNumber: 'AUD/SI/2023/X/0842',
    date: '24 Okt 2023',
    companyName: 'PT Pertamina (Persero)',
    sector: 'Sektor Energi',
    purpose: 'Direktur Utama',
    icon: 'corporate_fare',
    iconColor: 'text-blue-600',
    iconBg: 'bg-blue-50'
  },
  {
    id: 'al2',
    letterNumber: 'AUD/SI/2023/X/0841',
    date: '23 Okt 2023',
    companyName: 'Kementerian ESDM',
    sector: 'Sektor Pemerintahan',
    purpose: 'Kepala Bagian Umum',
    icon: 'account_balance',
    iconColor: 'text-emerald-600',
    iconBg: 'bg-emerald-50'
  },
  {
    id: 'al3',
    letterNumber: 'AUD/SI/2023/X/0839',
    date: '20 Okt 2023',
    companyName: 'PT Wijaya Karya Tbk',
    sector: 'Sektor Infrastruktur',
    purpose: 'Bapak Agung S.',
    icon: 'apartment',
    iconColor: 'text-orange-600',
    iconBg: 'bg-orange-50'
  },
  {
    id: 'al4',
    letterNumber: 'AUD/SI/2023/X/0838',
    date: '19 Okt 2023',
    companyName: 'PT Astra International',
    sector: 'Sektor Swasta',
    purpose: 'Division Head',
    icon: 'domain',
    iconColor: 'text-purple-600',
    iconBg: 'bg-purple-50'
  }
];