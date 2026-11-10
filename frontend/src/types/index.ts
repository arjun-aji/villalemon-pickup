// VillaLemon Pickup - Shared TypeScript Types

export type UserRole = 'admin' | 'driver';

export type TripStatus = 
  | 'upcoming' 
  | 'available_for_enrollment' 
  | 'assigned' 
  | 'in_progress' 
  | 'completed' 
  | 'cancelled';

export type EnrollmentStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

export type SettlementStatus = 
  | 'expense_pending' 
  | 'driver_submitted' 
  | 'pending_verification' 
  | 'settled' 
  | 'difference' 
  | 'excess';

export type EmploymentStatus = 'active' | 'inactive' | 'suspended';

export interface Profile {
  id: string;
  role: UserRole;
  full_name: string;
  email?: string;
  phone?: string;
  avatar_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DriverEmployee {
  id: string;
  user_id?: string;
  employee_id: string;
  full_name: string;
  username: string;
  phone: string;
  email?: string;
  vehicle_number?: string;
  address?: string;
  employment_status: EmploymentStatus;
  is_first_login: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
  // Computed/joined fields
  total_trips?: number;
  completed_trips?: number;
  pending_settlements?: number;
}

export interface Trip {
  id: string;
  trip_number: string;
  customer_name: string;
  customer_phone: string;
  pickup_date: string;
  pickup_time: string;
  pickup_location: string;
  destination: string;
  flight_number?: string;
  num_passengers: number;
  amount_to_collect: number;
  driver_charge: number;
  other_fixed_charges: number;
  placard_text?: string;
  trip_notes?: string;
  assigned_driver_id?: string;
  trip_status: TripStatus;
  is_published_for_enrollment: boolean;
  started_at?: string;
  completed_at?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  // Joined fields
  driver?: DriverEmployee;
  expenses?: TripExpense;
  settlement?: TripSettlement;
}

export interface TripEnrollment {
  id: string;
  trip_id: string;
  driver_id: string;
  status: EnrollmentStatus;
  requested_at: string;
  reviewed_by?: string;
  reviewed_at?: string;
  notes?: string;
  // Joined
  trip?: Trip;
  driver?: DriverEmployee;
}

export interface ExpenseItem {
  id: string;
  category: 'petrol' | 'parking' | 'toll' | 'food' | 'other';
  amount: number;
  description: string;
  receipt_url?: string;
}

export interface TripExpense {
  id: string;
  trip_id: string;
  driver_id?: string;
  petrol_expense: number;
  other_expense: number;
  expense_description?: string;
  expense_items: ExpenseItem[];
  actual_amount_returned: number;
  total_expenses: number;
  expected_return?: number;
  settlement_difference?: number;
  receipt_urls: string[];
  notes?: string;
  submitted_at: string;
  updated_at: string;
}

export interface TripSettlement {
  id: string;
  trip_id: string;
  driver_id?: string;
  customer_collection: number;
  petrol_expense: number;
  driver_charge: number;
  other_expenses: number;
  total_expenses: number;
  net_profit: number;
  expected_return: number;
  actual_return: number;
  settlement_difference: number;
  settlement_status: SettlementStatus;
  verified_by?: string;
  verified_at?: string;
  admin_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface MonthlyReport {
  id: string;
  report_month: number;
  report_year: number;
  report_name: string;
  file_url?: string;
  file_path?: string;
  total_trips: number;
  total_revenue: number;
  total_expenses: number;
  net_profit: number;
  generated_by?: string;
  generated_at: string;
}

export interface DashboardStats {
  total_trips: number;
  upcoming_trips: number;
  completed_trips: number;
  in_progress_trips: number;
  total_collections: number;
  total_petrol: number;
  total_driver_charges: number;
  total_other_expenses: number;
  total_expenses: number;
  net_profit: number;
  pending_settlements: number;
  pending_settlement_amount: number;
}

export interface FinancialCalculation {
  customer_collection: number;
  petrol_expense: number;
  driver_charge: number;
  other_expenses: number;
  total_expenses: number;
  net_profit: number;
  expected_return: number;
  settlement_difference: number;
}

export interface CreateTripInput {
  customer_name: string;
  customer_phone: string;
  pickup_date: string;
  pickup_time: string;
  pickup_location: string;
  destination: string;
  flight_number?: string;
  num_passengers: number;
  amount_to_collect: number;
  driver_charge: number;
  other_fixed_charges?: number;
  placard_text?: string;
  trip_notes?: string;
  assigned_driver_id?: string;
  is_published_for_enrollment?: boolean;
}

export interface CreateDriverInput {
  full_name: string;
  employee_id: string;
  username: string;
  phone: string;
  email?: string;
  vehicle_number?: string;
  address?: string;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}
