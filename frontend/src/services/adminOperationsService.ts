import { supabase, isSupabaseConfigured } from '../lib/supabase';
import {
  Organization,
  Vehicle,
  Expense,
  DriverLedgerEntry,
  Invoice,
  Payment,
  BackupRecord,
  Driver,
  Trip,
} from '../types';

export const organizationService = {
  async getAll(): Promise<Organization[]> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('v_client_summary')
          .select('*')
          .order('organization_name', { ascending: true });

        if (!error && data) {
          return data.map((o: any) => ({
            ...o,
            id: o.organization_id || o.id,
            name: o.organization_name || o.name,
            type: o.organization_type || o.type,
            outstanding_amount: Number(o.outstanding_balance) || 0,
            total_billed: Number(o.completed_trip_value) || 0,
            credit_status: o.credit_check || 'OK',
          })) as Organization[];
        }
      } catch (e) {
        console.warn('v_client_summary query fallback:', e);
      }

      const { data: direct, error: dErr } = await supabase
        .from('organizations')
        .select('*')
        .order('name', { ascending: true });
      if (dErr) throw dErr;
      return (direct as Organization[]) || [];
    }
    return [];
  },

  async create(input: Partial<Organization>): Promise<Organization> {
    if (isSupabaseConfigured) {
      const payload = {
        ...input,
        whatsapp: input.whatsapp || input.phone || '',
        credit_limit: Number(input.credit_limit) || 50000,
        is_active: input.is_active !== undefined ? input.is_active : true,
      };
      const { data, error } = await supabase
        .from('organizations')
        .insert(payload)
        .select()
        .single();
      if (error) throw error;
      return data as Organization;
    }
    throw new Error('Supabase not configured');
  },

  async update(id: string, input: Partial<Organization>): Promise<Organization> {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('organizations')
        .update({ ...input, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as Organization;
    }
    throw new Error('Supabase not configured');
  },
};

export const vehicleService = {
  async getAll(): Promise<Vehicle[]> {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('v_vehicle_document_alerts')
        .select('*')
        .order('registration_number', { ascending: true });

      if (!error && data) return data as Vehicle[];

      const { data: direct, error: dErr } = await supabase
        .from('vehicles')
        .select('*')
        .order('registration_number', { ascending: true });
      if (dErr) throw dErr;
      return (direct as Vehicle[]) || [];
    }
    return [];
  },

  async create(input: Partial<Vehicle>): Promise<Vehicle> {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('vehicles')
        .insert(input)
        .select()
        .single();
      if (error) throw error;
      return data as Vehicle;
    }
    throw new Error('Supabase not configured');
  },

  async update(id: string, input: Partial<Vehicle>): Promise<Vehicle> {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('vehicles')
        .update({ ...input, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as Vehicle;
    }
    throw new Error('Supabase not configured');
  },
};

export const generalExpenseService = {
  async getAll(): Promise<Expense[]> {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('expenses')
        .select(`
          *,
          trip:trips(id, trip_number, guest_names),
          vehicle:vehicles(id, registration_number),
          driver:drivers(id, full_name)
        `)
        .order('expense_date', { ascending: false });
      if (error) throw error;
      return (data as Expense[]) || [];
    }
    return [];
  },

  async create(input: Partial<Expense>): Promise<Expense> {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('expenses')
        .insert(input)
        .select()
        .single();
      if (error) throw error;
      return data as Expense;
    }
    throw new Error('Supabase not configured');
  },

  async delete(id: string): Promise<void> {
    if (isSupabaseConfigured) {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', id);
      if (error) throw error;
    }
  },
};

export const driverLedgerService = {
  async getEntriesByDriver(driverId?: string): Promise<DriverLedgerEntry[]> {
    if (isSupabaseConfigured) {
      let query = supabase
        .from('driver_ledger')
        .select(`
          *,
          driver:drivers(id, full_name, phone),
          trip:trips(id, trip_number, guest_names)
        `)
        .order('entry_date', { ascending: false });

      if (driverId) query = query.eq('driver_id', driverId);

      const { data, error } = await query;
      if (error) throw error;
      return (data as DriverLedgerEntry[]) || [];
    }
    return [];
  },

  async createEntry(input: Partial<DriverLedgerEntry>): Promise<DriverLedgerEntry> {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('driver_ledger')
        .insert(input)
        .select()
        .single();
      if (error) throw error;
      return data as DriverLedgerEntry;
    }
    throw new Error('Supabase not configured');
  },

  async getDriverBalances(): Promise<any[]> {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('v_driver_balances')
        .select('*');
      if (error) throw error;
      return data || [];
    }
    return [];
  },
};

export const invoiceService = {
  async getAll(): Promise<Invoice[]> {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('invoices')
        .select(`
          *,
          organization:organizations(id, name, contact_person, phone)
        `)
        .order('invoice_date', { ascending: false });
      if (error) throw error;
      return (data as Invoice[]) || [];
    }
    return [];
  },

  async getUnbilledTrips(organizationId: string): Promise<Trip[]> {
    if (isSupabaseConfigured) {
      // Find completed trips for this org that aren't on an active invoice
      const { data, error } = await supabase
        .from('trips')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('trip_status', 'Completed')
        .order('trip_date', { ascending: false });
      if (error) throw error;
      return (data as Trip[]) || [];
    }
    return [];
  },

  async create(invoiceData: Partial<Invoice>, tripIds: string[]): Promise<Invoice> {
    if (isSupabaseConfigured) {
      // 1. Insert invoice
      const { data: inv, error: invErr } = await supabase
        .from('invoices')
        .insert(invoiceData)
        .select()
        .single();
      if (invErr) throw invErr;

      // 2. Link trips
      if (tripIds && tripIds.length > 0) {
        const linkRecords = tripIds.map(tid => ({
          invoice_id: inv.id,
          trip_id: tid,
        }));
        const { error: linkErr } = await supabase
          .from('invoice_trips')
          .insert(linkRecords);
        if (linkErr) console.warn('Link trips error:', linkErr);
      }

      return inv as Invoice;
    }
    throw new Error('Supabase not configured');
  },
};

export const paymentService = {
  async getAll(): Promise<Payment[]> {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('payments')
        .select(`
          *,
          organization:organizations(id, name),
          invoice:invoices(id, invoice_number)
        `)
        .order('date_received', { ascending: false });
      if (error) throw error;
      return (data as Payment[]) || [];
    }
    return [];
  },

  async create(input: Partial<Payment>): Promise<Payment> {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('payments')
        .insert(input)
        .select()
        .single();
      if (error) throw error;
      return data as Payment;
    }
    throw new Error('Supabase not configured');
  },
};

export const backupService = {
  async getAll(): Promise<BackupRecord[]> {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('backup_records')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data as BackupRecord[]) || [];
    }
    return [];
  },

  async createRecord(input: Partial<BackupRecord>): Promise<BackupRecord> {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('backup_records')
        .insert(input)
        .select()
        .single();
      if (error) throw error;
      return data as BackupRecord;
    }
    throw new Error('Supabase not configured');
  },
};

