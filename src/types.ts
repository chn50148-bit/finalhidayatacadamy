export type AccessStatus = 'trial' | 'locked' | 'active';
export type PaymentMethod =
  | 'paypal'
  | 'easypaisa'
  | 'jazzcash'
  | 'card'
  | 'bank_transfer';

export interface Teacher {
  id: string;
  slug: string;
  name: string;
  title: string;
  photoUrl: string;
  qualifications: string;
  experienceYears: number;
  languages: string[];
  specialty: string;
  bio: string;
  availability: string;
}

export interface CoursePlan {
  id: string;
  name: string;
  audience: string;
  priceUsd: number;
  billingCycle: string;
  sessionsPerWeek: number;
  durationMinutes: number;
  features: string[];
}

export interface StudentUser {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'admin';
  trialStartDate: string;
  trialEndsAt: string;
  trialRemainingMs: number;
  accessStatus: AccessStatus;
  enrolledPlan: string | null;
  preferredCourse: string;
  assignedTeacherId: string;
}

export interface PaymentRecord {
  id: string;
  studentId: string;
  planId: string;
  planName: string;
  amountUsd: number;
  paymentMethod: PaymentMethod;
  transactionRef: string;
  accountLabel: string;
  status: 'pending' | 'paid';
  paidAt: string;
}

export interface ClassSession {
  id: string;
  studentId: string;
  teacherId: string;
  teacherName: string;
  courseTitle: string;
  scheduleLabel: string;
  scheduledAt: string;
  durationMinutes: number;
  meetingUrl: string;
  sessionType: 'trial' | 'enrolled';
  status: 'upcoming' | 'completed';
}

export interface DashboardPayload {
  user: StudentUser;
  assignedTeacher: Teacher | null;
  payments: PaymentRecord[];
  classes: ClassSession[];
  plans: CoursePlan[];
}
