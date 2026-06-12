export type PermitStatus = 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';

export type PermitType =
  | 'vehicle-inspection'
  | 'tools-ppe'
  | 'shift-dispatch'
  | 'site-tbt'
  | 'fault-excavation'
  | 'line-isolation'
  | 'excavation'
  | 'confined-space'
  | 'heat-shrink';

export interface Permit {
  id: string;
  type: PermitType;
  title: string;
  status: PermitStatus;
  createdAt: string;
  submittedBy: string;
  approvedBy?: string;
  approvedAt?: string;
  formData: any;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  type: 'info' | 'warning' | 'alert';
  read: boolean;
}

export interface UserProfile {
  username: string;
  name: string;
  role: string;
  badgeId: string;
  label: 'admin' | 'employee';
  avatarUrl?: string;
}
