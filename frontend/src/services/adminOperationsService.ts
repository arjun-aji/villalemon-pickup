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
import { parseTripBilling, embedTripBilling } from '../utils/formatters';

export const organizationService = {
  async getAll(): Promise<Organization[]> {
    if (isSupabaseConfigured) {
      try {
        // Direct query on organizations excluding soft-deleted / inactive ones
        const { data: orgRecords, error: orgErr } = await supabase
          .from('organizations')
          .select('*')
          .neq('is_active', false)
          .order('name', { ascending: true });

        if (orgErr) throw orgErr;

        // Try enriching with calculated statement balances from v_client_summary
        try {
          const { data: summaryData } = await supabase
            .from('v_client_summary')
            .select('*');

          if (summaryData && summaryData.length > 0) {
            const summaryMap = new Map(summaryData.map((s: any) => [s.organization_id || s.id, s]));
            return (orgRecords || []).map((o: any) => {
              const s = summaryMap.get(o.id);
              return {
                ...o,
                outstanding_amount: s ? (Number(s.outstanding_balance) || 0) : 0,
                total_billed: s ? (Number(s.completed_trip_value) || 0) : 0,
                credit_status: s ? (s.credit_check || 'OK') : 'OK',
                completed_trip_value: s ? (Number(s.completed_trip_value) || 0) : 0,
                invoiced_issued_amount: s ? (Number(s.invoiced_issued_amount) || 0) : 0,
                total_paid: s ? (Number(s.total_paid) || 0) : 0,
                outstanding_balance: s ? (Number(s.outstanding_balance) || 0) : 0,
                credit_check: s ? (s.credit_check || 'OK') : 'OK',
              } as Organization;
            });
          }
        } catch (sumErr) {
          console.warn('v_client_summary query fallback:', sumErr);
        }

        return (orgRecords as Organization[]) || [];
      } catch (e) {
        console.warn('Organization fetch error:', e);
      }
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

  async setOrganizationCredentials(id: string, newPassword: string, newUsername?: string): Promise<{ success: boolean; username?: string; password?: string; error?: string }> {
    const cleanPassword = newPassword.trim();
    if (!cleanPassword) {
      return { success: false, error: 'Password cannot be empty' };
    }

    if (isSupabaseConfigured) {
      try {
        const { data: curr, error: fetchErr } = await supabase
          .from('organizations')
          .select('id, name, phone, email, notes')
          .eq('id', id)
          .single();

        if (fetchErr || !curr) {
          return { success: false, error: fetchErr?.message || 'Organization record not found' };
        }

        let notes = curr.notes || '';
        const cleanUser = (newUsername || '').trim().toLowerCase() ||
          curr.name.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() ||
          (curr.phone ? curr.phone.replace(/[^0-9]/g, '') : 'partner');

        if (cleanUser) {
          if (/Username:\s*[^|]+/i.test(notes)) {
            notes = notes.replace(/Username:\s*[^|]+/i, `Username: ${cleanUser}`);
          } else {
            notes = `Username: ${cleanUser} | ${notes}`;
          }
        }

        if (/Password:\s*[^|]+/i.test(notes)) {
          notes = notes.replace(/Password:\s*[^|]+/i, `Password: ${cleanPassword}`);
        } else {
          notes = `${notes} | Password: ${cleanPassword}`;
        }

        // Clean up flags & empty segments
        notes = notes.split('|').map((p: string) => p.trim()).filter(Boolean).join(' | ');

        const { error: updateErr } = await supabase
          .from('organizations')
          .update({
            notes,
            updated_at: new Date().toISOString(),
          })
          .eq('id', id);

        if (updateErr) {
          return { success: false, error: updateErr.message };
        }

        // Also sync with Supabase Auth without session persistence
        try {
          const { createClient } = await import('@supabase/supabase-js');
          const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://cnvknruutfrmwyrbhdjq.supabase.co';
          const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY;
          const authClient = createClient(supabaseUrl, supabaseKey, {
            auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
          });

          const partnerEmail = `${cleanUser}@partner.villalemon.in`;

          const { data: authData } = await authClient.auth.signUp({
            email: partnerEmail,
            password: cleanPassword,
            options: {
              data: {
                role: 'organization',
                full_name: curr.name,
                username: cleanUser,
              },
            },
          });

          if (authData?.user) {
            // Upsert profile
            await supabase.from('profiles').upsert({
              id: authData.user.id,
              email: partnerEmail,
              full_name: curr.name,
              phone: curr.phone,
              role: 'organization',
              is_active: true,
            });

            // Upsert organization_users link
            await supabase.from('organization_users').upsert({
              organization_id: id,
              profile_id: authData.user.id,
              role: 'admin',
            });
          }
        } catch (authSyncErr) {
          console.warn('Partner auth sync note:', authSyncErr);
        }

        return { success: true, username: cleanUser, password: cleanPassword };
      } catch (err: any) {
        return { success: false, error: err.message };
      }
    }

    return { success: false, error: 'Database not connected' };
  },

  async delete(id: string): Promise<void> {
    if (isSupabaseConfigured) {
      try {
        // 1. Clean up multi-tenant user mapping
        try {
          await supabase
            .from('organization_users')
            .delete()
            .eq('organization_id', id);
        } catch (e) {
          console.warn('Cleanup organization_users note:', e);
        }

        // 2. Check if there are linked trips, invoices, or payments
        const [tripsRes, invRes, payRes] = await Promise.all([
          supabase.from('trips').select('id', { count: 'exact', head: true }).eq('organization_id', id),
          supabase.from('invoices').select('id', { count: 'exact', head: true }).eq('organization_id', id),
          supabase.from('payments').select('id', { count: 'exact', head: true }).eq('organization_id', id),
        ]);

        const hasLinkedRecords = (tripsRes.count || 0) > 0 || (invRes.count || 0) > 0 || (payRes.count || 0) > 0;

        if (hasLinkedRecords) {
          // Soft-delete so historical audit and foreign keys remain valid
          const { error: softErr } = await supabase
            .from('organizations')
            .update({
              is_active: false,
              updated_at: new Date().toISOString(),
            })
            .eq('id', id);

          if (softErr) throw softErr;
          return;
        }

        // 3. If no linked records exist, hard-delete
        const { error: hardErr } = await supabase
          .from('organizations')
          .delete()
          .eq('id', id);

        if (hardErr) {
          // If hard delete still hits an unexpected constraint, fallback to soft-delete
          console.warn('Hard-delete failed, falling back to soft-delete:', hardErr);
          const { error: fallbackErr } = await supabase
            .from('organizations')
            .update({
              is_active: false,
              updated_at: new Date().toISOString(),
            })
            .eq('id', id);

          if (fallbackErr) throw fallbackErr;
        }
        return;
      } catch (err: any) {
        console.error('Organization deletion error:', err);
        throw new Error(err?.message || 'Failed to delete organization');
      }
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

  async getPendingReturns(): Promise<DriverLedgerEntry[]> {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('driver_ledger')
        .select(`
          *,
          driver:drivers(id, full_name, phone),
          trip:trips(id, trip_number, guest_names)
        `)
        .ilike('notes', '%Pending Admin Confirmation%')
        .order('entry_date', { ascending: false });
      if (error) throw error;
      return (data as DriverLedgerEntry[]) || [];
    }
    return [];
  },

  async confirmEntry(entryId: string): Promise<void> {
    if (isSupabaseConfigured) {
      const { data: current } = await supabase
        .from('driver_ledger')
        .select('*')
        .eq('id', entryId)
        .single();

      const rawNotes = current?.notes || '';
      const cleanNotes = rawNotes.replace(/\[Pending Admin Confirmation\]/gi, '').trim();
      const updatedNotes = `[Confirmed by Admin ${new Date().toLocaleDateString('en-IN')}] ${cleanNotes}`.trim();

      const { error } = await supabase
        .from('driver_ledger')
        .update({ notes: updatedNotes })
        .eq('id', entryId);

      if (error) throw error;

      // If linked to a trip, also confirm any paired entries for that trip
      if (current?.trip_id) {
        const { data: paired } = await supabase
          .from('driver_ledger')
          .select('id, notes')
          .eq('trip_id', current.trip_id)
          .ilike('notes', '%Pending Admin Confirmation%');

        if (paired && paired.length > 0) {
          for (const p of paired) {
            const pClean = (p.notes || '').replace(/\[Pending Admin Confirmation\]/gi, '').trim();
            await supabase
              .from('driver_ledger')
              .update({ notes: `[Confirmed by Admin ${new Date().toLocaleDateString('en-IN')}] ${pClean}`.trim() })
              .eq('id', p.id);
          }
        }
      }
    }
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

  async deleteEntry(entryId: string): Promise<void> {
    if (isSupabaseConfigured) {
      const { error } = await supabase
        .from('driver_ledger')
        .delete()
        .eq('id', entryId);
      if (error) throw error;
    }
  },
};

export const invoiceService = {
  async getAll(): Promise<Invoice[]> {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('invoices')
        .select(`
          *,
          organization:organizations(id, name, contact_person, phone, billing_address, email),
          invoice_trips(
            id,
            trip_id,
            trip:trips(
              id,
              trip_number,
              trip_date,
              pickup_time,
              trip_category,
              guest_names,
              pickup_location,
              dropoff_location,
              required_cab_type,
              trip_selling_price,
              special_instructions,
              trip_status
            )
          )
        `)
        .order('invoice_date', { ascending: false });
      if (error) throw error;

      return (data || []).map((inv: any) => {
        const rawTrips = (inv.invoice_trips || [])
          .map((it: any) => it.trip)
          .filter(Boolean);

        const enrichedTrips = rawTrips.map((t: any) => {
          const sellPrice = Number(t.trip_selling_price) || 0;
          const bInfo = parseTripBilling(t.special_instructions, sellPrice);
          return {
            ...t,
            advance_amount: bInfo.advanceAmount,
            billing_status: bInfo.billingStatus,
            pending_amount: bInfo.pendingAmount,
          };
        });

        const totalAmt = enrichedTrips.reduce((s: number, t: any) => s + (Number(t.trip_selling_price) || 0), 0);
        const totalAdv = enrichedTrips.reduce(
          (s: number, t: any) => s + (t.billing_status === 'Paid' ? (Number(t.trip_selling_price) || 0) : (Number(t.advance_amount) || 0)),
          0
        );
        const bal = Math.max(0, totalAmt - totalAdv);

        return {
          ...inv,
          trips: enrichedTrips,
          trips_count: enrichedTrips.length,
          total_amount: totalAmt,
          paid_against_invoice: totalAdv,
          balance: bal,
        } as Invoice;
      });
    }
    return [];
  },

  async getTripsForInvoice(organizationId: string, fromDate?: string, toDate?: string): Promise<Trip[]> {
    if (isSupabaseConfigured) {
      let query = supabase
        .from('trips')
        .select(`
          *,
          organization:organizations(id, name, type),
          driver:drivers(id, full_name, phone)
        `)
        .order('trip_date', { ascending: true })
        .order('pickup_time', { ascending: true });

      if (organizationId && organizationId !== 'all' && organizationId !== 'all_partners') {
        query = query.eq('organization_id', organizationId);
      }
      if (fromDate) {
        query = query.gte('trip_date', fromDate);
      }
      if (toDate) {
        query = query.lte('trip_date', toDate);
      }

      const { data, error } = await query;
      if (error) throw error;

      let list = (data || []).map((t: any) => {
        const sellPrice = Number(t.trip_selling_price) || 0;
        const bInfo = parseTripBilling(t.special_instructions, sellPrice);
        return {
          ...t,
          advance_amount: bInfo.advanceAmount,
          billing_status: bInfo.billingStatus,
          pending_amount: bInfo.pendingAmount,
        } as Trip;
      });

      if (organizationId === 'all_partners') {
        list = list.filter(t => !t.organization?.name?.toLowerCase().includes('villa lemon'));
      }

      return list;
    }
    return [];
  },

  async getUnbilledTrips(organizationId: string, fromDate?: string, toDate?: string): Promise<Trip[]> {
    return this.getTripsForInvoice(organizationId, fromDate, toDate);
  },

  async create(invoiceData: Partial<Invoice>, tripIds: string[]): Promise<Invoice> {
    if (isSupabaseConfigured) {
      // 1. Insert invoice
      const { data: inv, error: invErr } = await supabase
        .from('invoices')
        .insert({
          organization_id: invoiceData.organization_id,
          invoice_type: invoiceData.invoice_type || 'Weekly invoice',
          invoice_date: invoiceData.invoice_date || new Date().toISOString().split('T')[0],
          period_from: invoiceData.period_from || null,
          period_to: invoiceData.period_to || null,
          status: invoiceData.status || 'Issued',
          notes: invoiceData.notes || null,
        })
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

  async deleteInvoice(id: string): Promise<void> {
    if (isSupabaseConfigured) {
      await supabase.from('invoice_trips').delete().eq('invoice_id', id);
      const { error } = await supabase.from('invoices').delete().eq('id', id);
      if (error) throw error;
    }
  },

  async updateTripBilling(tripId: string, billing: { advanceAmount?: number; billingStatus?: 'Pending' | 'Paid' }): Promise<void> {
    if (isSupabaseConfigured) {
      const { data: trip } = await supabase.from('trips').select('special_instructions, trip_selling_price').eq('id', tripId).single();
      if (!trip) return;
      const current = parseTripBilling(trip.special_instructions, trip.trip_selling_price);
      const newAdvance = billing.advanceAmount !== undefined ? billing.advanceAmount : current.advanceAmount;
      const newStatus = billing.billingStatus !== undefined ? billing.billingStatus : current.billingStatus;
      const updated = embedTripBilling(trip.special_instructions, {
        advanceAmount: newAdvance,
        billingStatus: newStatus,
      });
      const { error } = await supabase.from('trips').update({
        special_instructions: updated,
        updated_at: new Date().toISOString(),
      }).eq('id', tripId);
      if (error) throw error;
    }
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

  async deleteRecord(id: string): Promise<void> {
    if (isSupabaseConfigured) {
      const { error } = await supabase
        .from('backup_records')
        .delete()
        .eq('id', id);
      if (error) throw error;
    }
  },

  async cleanupOrphanedRecords(): Promise<{ ledgerDeleted: number; expensesDeleted: number; reportsDeleted: number }> {
    if (isSupabaseConfigured) {
      // 1. Get all valid trip IDs and trip numbers
      const { data: trips } = await supabase.from('trips').select('id, trip_number');
      const validTripIds = new Set((trips || []).map(t => t.id));
      const validTripNums = (trips || []).map(t => (t.trip_number || '').toUpperCase());

      // 2. Find and delete orphaned driver_ledger records
      const { data: allLedger } = await supabase.from('driver_ledger').select('id, trip_id, notes');
      const orphanedLedgerIds = (allLedger || [])
        .filter(l => {
          if (l.trip_id && !validTripIds.has(l.trip_id)) return true;
          if (l.notes) {
            const vhMatch = l.notes.match(/VH-\d{4}/i);
            if (vhMatch && !validTripNums.includes(vhMatch[0].toUpperCase())) {
              return true;
            }
          }
          return false;
        })
        .map(l => l.id);

      let ledgerDeleted = 0;
      if (orphanedLedgerIds.length > 0) {
        const { error } = await supabase.from('driver_ledger').delete().in('id', orphanedLedgerIds);
        if (!error) ledgerDeleted = orphanedLedgerIds.length;
      }

      // 3. Find and delete orphaned expenses
      const { data: allExpenses } = await supabase.from('expenses').select('id, trip_id');
      const orphanedExpenseIds = (allExpenses || [])
        .filter(e => e.trip_id && !validTripIds.has(e.trip_id))
        .map(e => e.id);

      let expensesDeleted = 0;
      if (orphanedExpenseIds.length > 0) {
        const { error } = await supabase.from('expenses').delete().in('id', orphanedExpenseIds);
        if (!error) expensesDeleted = orphanedExpenseIds.length;
      }

      // 4. Find and delete orphaned driver_reports
      const { data: allReports } = await supabase.from('driver_reports').select('id, trip_id');
      const orphanedReportIds = (allReports || [])
        .filter(r => r.trip_id && !validTripIds.has(r.trip_id))
        .map(r => r.id);

      let reportsDeleted = 0;
      if (orphanedReportIds.length > 0) {
        const { error } = await supabase.from('driver_reports').delete().in('id', orphanedReportIds);
        if (!error) reportsDeleted = orphanedReportIds.length;
      }

      return { ledgerDeleted, expensesDeleted, reportsDeleted };
    }
    return { ledgerDeleted: 0, expensesDeleted: 0, reportsDeleted: 0 };
  },
};

