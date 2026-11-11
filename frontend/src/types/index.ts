// VillaLemon Pickup - Complete Domain TypeScript Types (Matching Varkala Holidays Schema)

export type UserRole = 'super_admin' | 'admin' | 'driver' | 'organization';

export type OrganizationType =
  | 'Travel agency'
  | 'Tour operator'
  | 'Hotel / Homestay'
  | 'Corporate'
  | 'Individual'
  | 'Other';

export type PaymentTerms =
  | 'Pay after each trip'
  | 'Weekly settlement'
  | 'Monthly settlement';

export type DriverEmploymentType = 'Salaried (monthly)' | 'Per-trip payment';

export type DriverStatus = 'Active' | 'Inactive';

export type VehicleType =
  | 'Sedan'
  | 'SUV'
  | 'Innova'
  | 'Ertiga'
  | 'Tempo Traveller 17-seater'
  | 'Tempo Traveller 26-seater'
  | 'Other';

export type VehicleOwnership = 'Own' | 'Hired';

export type VehicleStatus = 'Available' | 'On trip' | 'Under repair' | 'Inactive';

export type TripCategory =
  | 'Airport Pick-up'
  | 'Airport Drop'
  | 'Sightseeing'
  | 'Drop Only at Location'
  | 'Pick-up from Location';

export type TripStatus =
  | 'Pending Approval'
  | 'Confirmed'
  | 'Assigned'
  | 'In Progress'
  | 'Completed'
  | 'Cancelled'
  | 'pending'
  | 'confirmed'
  | 'assigned'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'upcoming'
  | 'available_for_enrollment';

export interface CreateTripInput {
  customer_name?: string;
  customer_phone?: string;
  guest_names?: string;
  guest_contact_number?: string;
  ordered_by?: string;
  trip_category?: TripCategory;
  pickup_date?: string;
  trip_date?: string;
  pickup_time?: string;
  pickup_location?: string;
  destination?: string;
  dropoff_location?: string;
  flight_number?: string;
  flight_number_and_time?: string;
  airport_terminal?: AirportTerminal;
  num_passengers?: number;
  total_people?: number;
  amount_to_collect?: number;
  amount_driver_must_collect?: number;
  driver_charge?: number;
  driver_trip_pay_override?: number;
  other_fixed_charges?: number;
  trip_selling_price?: number;
  assigned_driver_id?: string;
  assigned_vehicle_id?: string;
  placard_text?: string;
  trip_notes?: string;
  special_instructions?: string;
  required_cab_type?: VehicleType;
  organization_id?: string;
  collection_rule?: CollectionRule;
  is_published_for_enrollment?: boolean;
  [key: string]: any;
}

export interface CreateDriverInput {
  employee_id: string;
  full_name: string;
  username: string;
  phone: string;
  email?: string;
  vehicle_number?: string;
  address?: string;
  [key: string]: any;
}

export type AirportTerminal = 'Terminal 1' | 'Terminal 2';

export type CollectionRule = 'Collect' | 'Do not collect' | 'Ask office';

export type ExpenseGroup =
  | 'Trip'
  | 'Vehicle/Workshop'
  | 'Office'
  | 'Staff Salary'
  | 'Hired Vehicle';

export type PaymentMethod =
  | 'Cash'
  | 'UPI'
  | 'Bank transfer'
  | 'Card'
  | 'Cheque';

export type PaidBy = 'Office' | 'Driver';

export type DriverLedgerEntryType =
  | 'Salary due'
  | 'Advance'
  | 'Deduction'
  | 'Payment made'
  | 'Money sent for expenses'
  | 'Cash handed to office';

export type InvoiceType = 'Trip invoice' | 'Weekly invoice' | 'Monthly invoice';

export type InvoiceStatus = 'Draft' | 'Issued' | 'Cancelled';

export type EnrollmentStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

// ==========================================
// ENTITY INTERFACES
// ==========================================

export interface Profile {
  id: string;
  email?: string;
  full_name: string;
  phone?: string;
  role: UserRole;
  avatar_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Organization {
  id: string;
  name: string;
  type: OrganizationType;
  contact_person: string;
  phone: string;
  whatsapp: string;
  email?: string;
  billing_address?: string;
  gst_number?: string;
  payment_terms: PaymentTerms;
  credit_limit: number;
  notes?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Computed summary
  completed_trip_value?: number;
  invoiced_issued_amount?: number;
  total_paid?: number;
  outstanding_balance?: number;
  credit_check?: 'OK' | 'OVER LIMIT';
}

export interface OrganizationUser {
  id: string;
  organization_id: string;
  profile_id: string;
  can_submit_trips: boolean;
  can_view_financials: boolean;
  created_at: string;
  organization?: Organization;
  profile?: Profile;
}

export interface Driver {
  id: string;
  profile_id?: string;
  full_name: string;
  phone: string;
  driving_licence_no: string;
  licence_expiry?: string;
  employment_type: DriverEmploymentType;
  monthly_salary: number;
  per_trip_payment: number;
  payment_arrangement_notes?: string;
  status: DriverStatus;
  created_at: string;
  updated_at: string;
  // Computed balances
  balance_payable_to_driver?: number;
  cash_owed_to_office?: number;
  net_settlement_amount?: number;
  total_trips?: number;
  completed_trips?: number;

  // Backward compatibility fields
  username?: string;
  email?: string;
  employee_id?: string;
  vehicle_number?: string;
  address?: string;
  employment_status?: 'active' | 'inactive' | 'suspended';
  is_first_login?: boolean;
  user_id?: string;
  driving_license_number?: string;
  pending_settlements?: number;
  [key: string]: any;
}

// Backward-compatible alias for legacy components
export type DriverEmployee = Driver;

export interface Vehicle {
  id: string;
  registration_number: string;
  vehicle_type: VehicleType;
  passenger_capacity: number;
  ownership: VehicleOwnership;
  owner_supplier_name?: string;
  supplier_phone?: string;
  insurance_expiry?: string;
  permit_expiry?: string;
  fitness_certificate_expiry?: string;
  puc_expiry?: string;
  status: VehicleStatus;
  document_notes?: string;
  created_at: string;
  updated_at: string;
  document_alert?: string;
}

export interface Trip {
  id: string;
  trip_number: string;
  organization_id?: string;
  ordered_by?: string;
  trip_date?: string;
  pickup_time?: string;
  trip_category?: TripCategory;
  guest_names?: string;
  guest_contact_number?: string;
  total_people?: number;
  pickup_location?: string;
  dropoff_location?: string;
  final_dropoff?: string;
  flight_number_and_time?: string;
  airport_terminal?: AirportTerminal;
  required_cab_type?: VehicleType;
  special_instructions?: string;
  assigned_driver_id?: string;
  assigned_vehicle_id?: string;
  trip_selling_price?: number;
  amount_driver_must_collect?: number;
  collection_rule?: CollectionRule;
  driver_trip_pay_override?: number;
  trip_status: TripStatus;
  is_published_for_enrollment?: boolean;
  submitted_by_org?: boolean;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
  // Joined fields
  organization?: Organization;
  driver?: Driver;
  vehicle?: Vehicle;
  driver_report?: DriverReport;
  expenses_list?: Expense[];
  invoice?: Invoice;
  // Computed fields
  total_trip_expenses?: number;
  trip_profit?: number;
  collected_by_driver?: number;
  collection_difference?: number;
  effective_driver_pay?: number;
  billing_status?: string;

  // Backward compatibility fields for legacy views
  customer_name?: string;
  customer_phone?: string;
  pickup_date?: string;
  num_passengers?: number;
  amount_to_collect?: number;
  driver_charge?: number;
  other_fixed_charges?: number;
  placard_text?: string;
  destination?: string;
  fare?: number;
  settlement_status?: string;
  settlement?: TripSettlement;
  expected_return?: number;
  settlement_difference?: number;
  actual_return?: number;
  diesel_expense?: number;
  petrol_expense?: number;
  toll_charges?: number;
  parking_charges?: number;
  other_expense_desc?: string;
  started_at?: string;
  completed_at?: string;
  [key: string]: any;
}

export interface ExpenseItem {
  id: string;
  category: string;
  amount: number;
  description?: string;
  receipt_url?: string;
}

export type SettlementStatus =
  | 'expense_pending'
  | 'driver_submitted'
  | 'pending_verification'
  | 'settled'
  | 'difference'
  | 'excess'
  | 'pending'
  | 'verified'
  | 'disputed';

export interface TripExpense {
  id: string;
  trip_id: string;
  driver_id: string;
  expense_type?: string;
  amount?: number;
  description?: string;
  receipt_url?: string;
  created_at?: string;
  petrol_expense?: number;
  other_expense?: number;
  expense_description?: string;
  expense_items?: ExpenseItem[];
  [key: string]: any;
}

export interface TripSettlement {
  id: string;
  trip_id: string;
  driver_id?: string;
  expected_amount?: number;
  collected_amount?: number;
  difference?: number;
  actual_return?: number;
  driver_charge?: number;
  petrol_expense?: number;
  expected_return?: number;
  settlement_difference?: number;
  settlement_status?: string;
  status?: 'pending' | 'verified' | 'disputed' | string;
  notes?: string;
  verified_by?: string;
  verified_at?: string;
  created_at?: string;
  [key: string]: any;
}

export interface TripEnrollment {
  id: string;
  trip_id: string;
  driver_id: string;
  status: EnrollmentStatus;
  notes?: string;
  requested_at: string;
  reviewed_at?: string;
  trip?: Trip;
  driver?: Driver;
}

export interface DriverReport {
  id: string;
  receipt_number: string;
  trip_id: string;
  driver_id: string;
  submitted_at: string;
  amount_collected: number;
  collection_difference_note?: string;
  diesel_expense: number;
  parking_toll_permits_tickets_food: number;
  other_expenses_details?: string;
  workshop_expense: number;
  workshop_details?: string;
  receipt_photo_url?: string;
  check_status: string;
  admin_verification_note?: string;
  verified_by?: string;
  verified_at?: string;
  created_at: string;
  trip?: Trip;
  driver?: Driver;
}

export interface Expense {
  id: string;
  expense_number: string;
  expense_date: string;
  expense_group: ExpenseGroup;
  category: string;
  amount: number;
  description?: string;
  payment_method: PaymentMethod;
  trip_id?: string;
  vehicle_id?: string;
  driver_id?: string;
  paid_by: PaidBy;
  receipt_url?: string;
  check_status: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  trip?: Trip;
  vehicle?: Vehicle;
  driver?: Driver;
}

export interface DriverLedgerEntry {
  id: string;
  entry_date: string;
  driver_id: string;
  entry_type: DriverLedgerEntryType;
  amount: number;
  trip_id?: string;
  notes?: string;
  created_by?: string;
  created_at: string;
  driver?: Driver;
  trip?: Trip;
  // Computed effects
  pay_effect?: number;
  cash_effect?: number;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  invoice_date: string;
  organization_id: string;
  invoice_type: InvoiceType;
  period_from?: string;
  period_to?: string;
  status: InvoiceStatus;
  notes?: string;
  pdf_url?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  organization?: Organization;
  trips?: Trip[];
  total_amount?: number;
  paid_against_invoice?: number;
  balance?: number;
  trips_count?: number;
  paid_amount?: number;
  balance_due?: number;
  [key: string]: any;
}

export interface InvoiceTrip {
  id: string;
  invoice_id: string;
  trip_id: string;
  created_at: string;
  trip?: Trip;
  invoice?: Invoice;
}

export interface Payment {
  id: string;
  receipt_number: string;
  date_received: string;
  organization_id: string;
  invoice_id?: string;
  amount_received: number;
  payment_method: PaymentMethod;
  reference_notes?: string;
  received_by?: string;
  created_at: string;
  organization?: Organization;
  invoice?: Invoice;
  payment_date?: string;
  amount?: number;
  reference_number?: string;
  notes?: string;
  [key: string]: any;
}

export interface SystemSettings {
  id: string;
  business_name: string;
  address?: string;
  phone?: string;
  email?: string;
  bank_upi_details?: string;
  receipt_footer_note?: string;
  document_alert_days: number;
  updated_at: string;
}

export interface BackupRecord {
  id: string;
  backup_type: 'database_snapshot' | 'full_excel_archive';
  file_name: string;
  file_size_bytes: number;
  storage_path: string;
  status: string;
  created_by?: string;
  created_at: string;
}

export interface DashboardStats {
  total_trips: number;
  upcoming_trips: number;
  completed_trips: number;
  pending_approval_trips?: number;
  total_collections: number;
  total_expenses: number;
  net_profit: number;
  client_outstanding?: number;
  unbilled_trips_value?: number;
  unbilled_trips_count?: number;
  issued_invoices_amount?: number;
  total_driver_payable?: number;
  total_driver_cash_held?: number;
  pending_settlements_count?: number;
  vehicles_doc_alerts_count?: number;
  total_petrol: number;
  total_driver_charges: number;
  total_other_expenses: number;

  // Backward compatibility
  pending_settlement_amount?: number;
  pending_settlements?: number;
  in_progress_trips?: number;
  [key: string]: any;
}
