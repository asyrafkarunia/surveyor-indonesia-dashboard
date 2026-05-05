export interface NavItem {
  label: string;
  icon: string;
  href: string;
  id: string;
  active?: boolean;
  /** 'header' = this item is a group label/separator; string = this item belongs to that group; null = ungrouped */
  group?: 'header' | string | null;
}

export interface StatCardData {
  title: string;
  value: string;
  rawValue?: number;
  trend: number;
  trendLabel: string;
  icon: string;
  iconColor: string;
  isNegative?: boolean;
  subValue?: string;
  subValueColor?: string;
}

export interface ProjectData {
  id: string;
  name: string;
  client: string;
  status: 'In Progress' | 'Completed' | 'Delayed' | 'Pending';
  progress: number;
}

export interface FeedItemData {
  id: string;
  user: {
    name: string;
    avatar: string;
    role?: string;
  };
  timestamp: string;
  type: 'project_update' | 'alert' | 'meeting' | 'post';
  content: string;
  tags?: string[];
  project?: string;
  likes?: number;
  comments?: number;
  attachment?: {
    name: string;
    size: string;
    type: string;
  };
  isUrgent?: boolean;
}

export interface NotificationItemData {
  id: string;
  user: {
    name: string;
    avatar: string;
    role?: string;
  };
  type: 'comment' | 'alert' | 'assignment' | 'system' | 'finance';
  projectName?: string;
  content: string;
  timestamp: string;
  isUnread: boolean;
  tag?: string;
}

export interface DeadlineData {
  id: string;
  title: string;
  team: string;
  date: string;
  month: string;
}

export interface OnlineMember {
  id: string;
  name: string;
  avatar: string;
  isOnline: boolean;
}

export interface RevenueData {
  month: string;
  projection: number;
  realization: number;
}

export interface ActivityItemData {
  id: string;
  type: 'update' | 'complete' | 'alert' | 'create';
  user: string;
  tag?: string;
  action: string;
  target: string;
  time: string;
}

export interface ClientData {
  id: string;
  companyName: string;
  logo: string;
  contactPerson: string;
  contactRole: string;
  type: 'BUMN' | 'Swasta' | 'Pemerintah';
  status: 'Aktif' | 'Non-Aktif' | 'Suspended';
  email: string;
  phone: string;
  industry?: string;
  location?: string;
}

export interface ProjectHistoryItem {
  id: string;
  name: string;
  type: string;
  status: 'On Progress' | 'Completed' | 'Delayed';
  value: string;
  startedAt: string;
}

export interface ContractHistoryItem {
  id: string;
  contractNo: string;
  type: string;
  period: string;
  value: string;
  status: 'Active' | 'Expired' | 'Terminated';
}

export interface ClientActivityItem {
  id: string;
  title: string;
  type: 'mail' | 'check' | 'groups' | 'edit_document';
  by: string;
  time: string;
  description?: string;
}

export interface SphData {
  id: string;
  sphNo: string;
  clientName: string;
  projectName: string;
  value: string;
  dateCreated: string;
  status: 'Approved' | 'Sent' | 'Draft' | 'Rejected';
  clientAbbreviation?: string;
  icon?: string;
  iconBg?: string;
  iconColor?: string;
}

export type UserRoleType = 'super_admin' | 'marketing' | 'approver' | 'common' | 'head_section' | 'senior_manager' | 'general_manager';
export type UserRoleName = 
  // Super Admin (IT)
  | 'Super Admin'
  // Administrator (Marketing)
  | 'Marketing Lead' | 'Head Section Marketing' | 'Social Media Specialist' | 'Content Strategist' | 'Brand Manager' | 'Marketing Staff'
  // Approver
  | 'Approver' | 'Senior Manager' | 'General Manager'
  // Umum - Operasi
  | 'Senior Surveyor' | 'Surveyor' | 'Field Staff' | 'Technical Lead' | 'Project Manager'
  // Umum - SDM
  | 'HR Manager' | 'HR Staff' | 'Recruitment Specialist'
  // Umum - Keuangan
  | 'Finance Manager' | 'Finance Staff' | 'Accountant' | 'Accounting Staff';

export interface SystemUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: UserRoleType; // 'marketing' | 'approver' | 'common'
  roleName: UserRoleName; // Nama role detail
  division: string;
  status: 'Aktif' | 'Cuti' | 'Nonaktif';
  isCurrentUser?: boolean;
  employeeId?: string;
}


export interface ActivityLogEntry {
  id: string;
  date: string;
  time: string;
  adminName: string;
  adminId: string;
  adminEmail?: string;
  adminAvatar?: string;
  adminInitials?: string;
  action: string;
  actionTarget?: string;
  module: string;
  moduleIcon: string;
  moduleColor: 'purple' | 'blue' | 'orange' | 'slate' | 'red';
  status: 'Success' | 'Warning' | 'Failed';
  metadata?: any;
}

export interface KanbanCard {
  id: string;
  title: string;
  client: string;
  priority: 'High' | 'Medium' | 'Low';
  date: string;
  assignee: {
    name: string;
    avatar?: string;
    initials: string;
  };
  description?: string;
  status?: 'ide_baru' | 'review' | 'sph' | 'berjalan' | 'selesai';
  tags?: string[];
}

export interface KanbanColumn {
  id: string;
  title: string;
  color: string;
  cards: KanbanCard[];
}

export interface AudiensiTemplate {
  id: string;
  name: string;
  version: string;
  format: string;
  sector: string;
  createdAt: string;
  status: 'Aktif' | 'Draft';
  icon: string;
  iconColor: string;
  iconBg: string;
}

export interface AudiensiLetter {
  id: string;
  letterNumber: string;
  date: string;
  companyName: string;
  sector: string;
  purpose: string;
  icon: string;
  iconColor: string;
  iconBg: string;
}

export interface MonitoringProjectItem {
  id: string;
  code: string;
  title: string;
  startDate: string;
  endDate: string;
  progress: number;
  status: 'RUNNING' | 'PENDING' | 'DONE' | 'REJECTED';
  comments: number;
  picAvatar: string;
  picName: string;
  icon: string;
  iconColor: string;
  iconBg: string;
  recentActivity?: string;
}