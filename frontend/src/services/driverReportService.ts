import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { DriverReport } from '../types';

export interface SubmitDriverReportInput {
  trip_id: string;
  driver_id: string;
  amount_collected: number;
  collection_difference_note?: string;
  diesel_expense: number;
  parking_toll_permits_tickets_food: number;
  other_expenses_details?: string;
  workshop_expense: number;
  workshop_details?: string;
  receipt_photo_url?: string;
  cash_returned_to_office?: number;
  cash_return_method?: string;
}

export const driverReportService = {
  async getByTrip(tripId: string): Promise<DriverReport | null> {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('driver_reports')
        .select('*')
        .eq('trip_id', tripId)
        .maybeSingle();

      if (error) console.warn('Fetch report error:', error);
      return (data as DriverReport) || null;
    }
    return null;
  },

  async submitReport(input: SubmitDriverReportInput): Promise<DriverReport> {
    if (isSupabaseConfigured) {
      // 1. Insert or update driver report
      const { data, error } = await supabase
        .from('driver_reports')
        .upsert(
          {
            trip_id: input.trip_id,
            driver_id: input.driver_id,
            amount_collected: Number(input.amount_collected) || 0,
            collection_difference_note: input.collection_difference_note || null,
            diesel_expense: Number(input.diesel_expense) || 0,
            parking_toll_permits_tickets_food: Number(input.parking_toll_permits_tickets_food) || 0,
            other_expenses_details: input.other_expenses_details || null,
            workshop_expense: Number(input.workshop_expense) || 0,
            workshop_details: input.workshop_details || null,
            receipt_photo_url: input.receipt_photo_url || null,
            check_status: 'Pending check',
          },
          { onConflict: 'trip_id' }
        )
        .select()
        .single();

      if (error) throw error;

      // 2. Mark trip status as Completed
      await supabase
        .from('trips')
        .update({
          trip_status: 'Completed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', input.trip_id);

      // 3. If driver returned cash to office, log it in driver_ledger with Pending Admin Confirmation
      if (input.cash_returned_to_office && Number(input.cash_returned_to_office) > 0) {
        const { data: tripData } = await supabase
          .from('trips')
          .select('trip_number')
          .eq('id', input.trip_id)
          .maybeSingle();

        const tripNum = tripData?.trip_number || 'trip';
        await supabase.from('driver_ledger').insert({
          entry_date: new Date().toISOString().split('T')[0],
          driver_id: input.driver_id,
          trip_id: input.trip_id,
          entry_type: 'Cash handed to office',
          amount: Number(input.cash_returned_to_office),
          notes: `[Pending Admin Confirmation] Returned from ${tripNum} (${input.cash_return_method || 'Cash'})`,
        });
      }

      return data as DriverReport;
    }
    throw new Error('Supabase not configured');
  },

  async uploadReceipt(file: File, tripId: string): Promise<string> {
    if (!isSupabaseConfigured) return '';

    const ext = file.name.split('.').pop() || 'jpg';
    const filePath = `receipts/${tripId}-${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('receipts')
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      console.warn('Storage upload error:', uploadError);
      return '';
    }

    const { data: urlData } = supabase.storage
      .from('receipts')
      .getPublicUrl(filePath);

    return urlData?.publicUrl || '';
  },

  async getAllReports(): Promise<any[]> {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('driver_reports')
        .select(`
          *,
          trip:trips(
            id, 
            trip_number, 
            trip_date, 
            guest_names, 
            pickup_location, 
            dropoff_location, 
            trip_selling_price, 
            amount_driver_must_collect, 
            collection_rule, 
            driver_trip_pay_override, 
            organization:organizations(name),
            vehicle:vehicles(registration_number, vehicle_type)
          ),
          driver:drivers(id, full_name, phone, driving_licence_no)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    }
    return [];
  },

  async verifyReport(id: string, status: 'Verified OK' | 'Difference Flagged', _notes?: string): Promise<void> {
    if (isSupabaseConfigured) {
      const { error } = await supabase
        .from('driver_reports')
        .update({
          check_status: status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;
    }
  },
};
