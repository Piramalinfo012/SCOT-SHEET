
export enum UserRole {
  ADMIN = 'ADMIN',
  CRM_EXECUTIVE = 'CRM_EXECUTIVE'
}

export interface OrderLog {
  timestamp: string;
  id: string;
  crmName: string;
  clientName: string;
  orderStatus: string;
  remark: string;
  nextFollowUpDate: string;
}

export interface Client {
  id: string;
  rowIndex?: number;
  crmName: string;
  clientName: string;
  number: string;
  contactPerson: string;
  productName: string;
  averageOrderSize: string;
  orderFrequency: string;
  lastOrderDate: string;
  dateForCalling: string;
  frequencyOfCalling: number;
  update: string;
  lastCallingDate: string;
  nextFollowUpDate: string;
  remark: string;
  orderStatus?: string;
  emailAddress?: string;
}

export interface DashboardStats {
  totalClients: number;
  overdue: number;
  plannedToday: number;
  completedToday: number;
  upcoming7Days: number;
  totalOrdersReceived: number;
  totalCalls: number;
  conversionRate: number;
}

export interface User {
  name: string;
  username: string;
  role: string;
}

export type Tab = 'dashboard' | 'clients';
