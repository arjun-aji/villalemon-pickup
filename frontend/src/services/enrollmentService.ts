import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { TripEnrollment, EnrollmentStatus } from '../types';
import { initialEnrollments, initialTrips, getStored, setStored } from '../lib/mockData';
import { tripService } from './tripService';

export const enrollmentService = {
  async getAll(status?: EnrollmentStatus): Promise<TripEnrollment[]> {
    if (isSupabaseConfigured) {
      let query = supabase
        .from('trip_enrollments')
        .select(`
          *,
          trip:trips(id, trip_number, guest_names, customer_name, trip_date, pickup_date, pickup_location, dropoff_location, destination, amount_driver_must_collect, trip_selling_price, driver_trip_pay_override),
          driver:drivers(id, full_name, phone)
        `)
        .order('requested_at', { ascending: false });

      if (status) query = query.eq('status', status);
      const { data, error } = await query;
      if (error) throw error;
      return data as TripEnrollment[];
    }

    let enrollments: TripEnrollment[] = getStored('enrollments', initialEnrollments);
    const trips = getStored('trips', initialTrips);
    const drivers = getStored('drivers', []);

    enrollments = enrollments.map(e => ({
      ...e,
      trip: trips.find((t: any) => t.id === e.trip_id) || e.trip,
      driver: drivers.find((d: any) => d.id === e.driver_id) || e.driver,
    }));

    if (status) {
      enrollments = enrollments.filter(e => e.status === status);
    }

    return enrollments;
  },

  async getDriverEnrollments(driverId: string): Promise<TripEnrollment[]> {
    const all = await this.getAll();
    return all.filter(e => e.driver_id === driverId);
  },

  async enroll(tripId: string, driverId: string): Promise<TripEnrollment> {
    const enrollments: TripEnrollment[] = getStored('enrollments', initialEnrollments);
    
    // Check if driver already enrolled
    const existing = enrollments.find(e => e.trip_id === tripId && e.driver_id === driverId);
    if (existing) {
      throw new Error('You have already submitted an enrollment request for this trip.');
    }

    const trips = getStored('trips', initialTrips);
    const trip = trips.find((t: any) => t.id === tripId);
    const drivers = getStored('drivers', []);
    const driver = drivers.find((d: any) => d.id === driverId);

    const newEnrollment: TripEnrollment = {
      id: `en-${Date.now()}`,
      trip_id: tripId,
      driver_id: driverId,
      status: 'pending',
      requested_at: new Date().toISOString(),
      trip: trip,
      driver: driver,
    };

    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from('trip_enrollments').insert({
        trip_id: tripId,
        driver_id: driverId,
        status: 'pending',
      }).select().single();
      if (error) throw error;
      return data as TripEnrollment;
    }

    setStored('enrollments', [newEnrollment, ...enrollments]);
    return newEnrollment;
  },

  async approve(enrollmentId: string, _reviewedBy: string = 'admin'): Promise<TripEnrollment> {
    const enrollments: TripEnrollment[] = getStored('enrollments', initialEnrollments);
    const target = enrollments.find(e => e.id === enrollmentId);
    if (!target) throw new Error('Enrollment request not found');

    // Update target to approved
    const updated = enrollments.map(e => {
      if (e.id === enrollmentId) {
        return {
          ...e,
          status: 'approved' as EnrollmentStatus,
          reviewed_at: new Date().toISOString(),
        };
      }
      // reject other enrollments for the same trip
      if (e.trip_id === target.trip_id && e.id !== enrollmentId && e.status === 'pending') {
        return {
          ...e,
          status: 'rejected' as EnrollmentStatus,
          reviewed_at: new Date().toISOString(),
          notes: 'Another driver was selected.',
        };
      }
      return e;
    });
    setStored('enrollments', updated);

    // Directly assign trip to driver
    await tripService.assignDriver(target.trip_id, target.driver_id);

    if (isSupabaseConfigured) {
      await supabase.from('trip_enrollments').update({ status: 'approved' }).eq('id', enrollmentId);
      await supabase.from('trip_enrollments').update({ status: 'rejected' }).eq('trip_id', target.trip_id).neq('id', enrollmentId);
    }

    return updated.find(e => e.id === enrollmentId)!;
  },

  async reject(enrollmentId: string, notes?: string): Promise<TripEnrollment> {
    const enrollments: TripEnrollment[] = getStored('enrollments', initialEnrollments);
    const updated = enrollments.map(e => {
      if (e.id === enrollmentId) {
        return {
          ...e,
          status: 'rejected' as EnrollmentStatus,
          reviewed_at: new Date().toISOString(),
          notes: notes || 'Rejected by admin.',
        };
      }
      return e;
    });
    setStored('enrollments', updated);

    if (isSupabaseConfigured) {
      await supabase.from('trip_enrollments').update({ status: 'rejected', notes }).eq('id', enrollmentId);
    }

    return updated.find(e => e.id === enrollmentId)!;
  },
};

