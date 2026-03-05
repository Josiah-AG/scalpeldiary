export enum UserRole {
  RESIDENT = 'RESIDENT',
  SUPERVISOR = 'SUPERVISOR',
  MANAGEMENT = 'MANAGEMENT',
  MASTER = 'MASTER'
}

export enum ProcedureType {
  ELECTIVE = 'ELECTIVE',
  SEMI_ELECTIVE = 'SEMI_ELECTIVE',
  EMERGENCY = 'EMERGENCY'
}

export enum SurgeryRole {
  PRIMARY_SURGEON = 'PRIMARY_SURGEON',
  PRIMARY_SURGEON_ASSISTED = 'PRIMARY_SURGEON_ASSISTED',
  FIRST_ASSISTANT = 'FIRST_ASSISTANT',
  SECOND_ASSISTANT = 'SECOND_ASSISTANT',
  OBSERVER = 'OBSERVER'
}

export enum PlaceOfPractice {
  Y12HMC = 'Y12HMC',
  ALERT = 'ALERT',
  ABEBECH_GOBENA = 'ABEBECH_GOBENA'
}

export enum LogStatus {
  PENDING = 'PENDING',
  RATED = 'RATED',
  COMMENTED = 'COMMENTED'
}

export enum PresentationType {
  MORNING_PRESENTATION = 'MORNING_PRESENTATION',
  SEMINAR = 'SEMINAR',
  SHORT_PRESENTATION = 'SHORT_PRESENTATION',
  MDT = 'MDT',
  OTHER = 'OTHER'
}

export enum ProcedureCategory {
  GENERAL_SURGERY = 'GENERAL_SURGERY',
  PEDIATRIC_SURGERY = 'PEDIATRIC_SURGERY',
  ORTHOPEDIC_SURGERY = 'ORTHOPEDIC_SURGERY',
  UROLOGY = 'UROLOGY',
  HEPATOBILIARY_SURGERY = 'HEPATOBILIARY_SURGERY',
  CARDIOTHORACIC_SURGERY = 'CARDIOTHORACIC_SURGERY',
  OBGYN_SURGERY = 'OBGYN_SURGERY',
  PLASTIC_SURGERY = 'PLASTIC_SURGERY',
  MINOR_SURGERY = 'MINOR_SURGERY'
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  has_management_access?: boolean;
  is_chief_resident?: boolean;
  institution?: string;
  specialty?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ResidentYear {
  id: string;
  residentId: string;
  year: number;
  createdAt: Date;
}

export interface SurgicalLog {
  id: string;
  residentId: string;
  yearId: string;
  date: Date;
  mrn: string;
  age: number;
  sex: 'MALE' | 'FEMALE';
  diagnosis: string;
  procedure: string;
  procedureType: ProcedureType;
  procedureCategory?: string;
  placeOfPractice: PlaceOfPractice;
  surgeryRole: SurgeryRole;
  supervisorId: string;
  status: LogStatus;
  rating?: number;
  comment?: string;
  ratedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Notification {
  id: string;
  userId: string;
  message: string;
  read: boolean;
  logId?: string;
  createdAt: Date;
}

export interface DashboardMetrics {
  totalSurgeries: number;
  averageRating: number;
  roleDistribution: Record<SurgeryRole, number>;
  surgeryCalendar: Record<string, number>;
  recentSurgeries: SurgicalLog[];
}

export interface AnalyticsData {
  totalSurgeries: number;
  monthSurgeries: number;
  roleDistribution: Record<SurgeryRole, number>;
  procedureTypeDistribution: Record<ProcedureType, number>;
  topProcedures: Array<{ procedure: string; count: number }>;
  averageRating: number;
  seniorSupervisorRating: number;
  comments: Array<{ supervisor: string; comment: string; rating: number; date: Date }>;
}

export interface Presentation {
  id: string;
  residentId: string;
  yearId: string;
  date: Date;
  title: string;
  venue: string;
  presentationType: PresentationType;
  description?: string;
  supervisorId?: string;
  rating?: number;
  status: LogStatus;
  ratedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Chief Resident System Types

export interface RotationCategory {
  id: string;
  name: string;
  display_order: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface AcademicYear {
  id: string;
  year_name: string;
  start_month: number;
  start_year: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface YearlyRotation {
  id: string;
  academic_year_id: string;
  resident_id: string;
  month_number: number;
  rotation_category_id: string;
  notes?: string;
  created_at: Date;
  updated_at: Date;
  // Joined fields
  rotation_category_name?: string;
  resident_name?: string;
}

export interface DutyCategory {
  id: string;
  name: string;
  display_order: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface MonthlyDuty {
  id: string;
  resident_id: string;
  duty_date: Date;
  duty_category_id: string;
  notes?: string;
  created_at: Date;
  updated_at: Date;
  // Joined fields
  duty_category_name?: string;
  resident_name?: string;
}

export interface ActivityCategory {
  id: string;
  name: string;
  display_order: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface DailyActivity {
  id: string;
  resident_id: string;
  activity_date: Date;
  activity_category_id: string;
  notes?: string;
  created_at: Date;
  updated_at: Date;
  // Joined fields
  activity_category_name?: string;
  resident_name?: string;
}

export enum PresentationAssignmentStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  RATED = 'RATED'
}

export interface PresentationAssignment {
  id: string;
  title: string;
  presentation_type: string;
  presenter_id: string;
  moderator_id: string;
  assigned_by: string;
  scheduled_date?: Date;
  venue?: string;
  description?: string;
  status: PresentationAssignmentStatus;
  presentation_id?: string;
  created_at: Date;
  updated_at: Date;
  // Joined fields
  presenter_name?: string;
  moderator_name?: string;
  assigned_by_name?: string;
}

export interface TodayOverview {
  current_rotation?: string;
  current_rotation_category?: string;
  today_duty?: string;
  today_duty_category?: string;
  today_activities: Array<{
    id: string;
    category: string;
  }>;
  pending_presentations: number;
}

export interface DailyOverviewItem {
  resident_id: string;
  resident_name: string;
  current_rotation?: string;
  today_duty?: string;
  today_activities: string[];
  is_on_duty: boolean;
}
