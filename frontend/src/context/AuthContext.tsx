import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Profile, UserRole, Driver, Organization } from '../types';
import { getStored, setStored } from '../lib/mockData';

interface AuthContextType {
  user: { id: string; email?: string } | null;
  profile: Profile | null;
  driver: Driver | null;
  organization: Organization | null;
  role: UserRole | null;
  loading: boolean;
  setDriver: (driver: Driver | null) => void;
  signInAdmin: (emailOrUsername: string, password: string) => Promise<{ error: string | null }>;
  signUpAdmin: (email: string, password: string, fullName: string) => Promise<{ error: string | null }>;
  signInDriver: (username: string, password: string) => Promise<{ error: string | null }>;
  signInOrganization: (emailOrUsername: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  updateDriverPassword: (newPassword: string) => Promise<{ success: boolean; error?: string }>;
  completeDriverProfile: (updates: {
    drivingLicenceNo: string;
    licenceExpiry?: string;
    avatarUrl?: string;
    newPassword?: string;
    address?: string;
    phone?: string;
    vehicleNumber?: string;
  }) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<{ id: string; email?: string } | null>(() => {
    return getStored('current_user', null);
  });
  const [profile, setProfile] = useState<Profile | null>(() => {
    return getStored('current_profile', null);
  });
  const [driver, setDriver] = useState<Driver | null>(() => {
    return getStored('current_driver', null);
  });
  const [organization, setOrganization] = useState<Organization | null>(() => {
    return getStored('current_organization', null);
  });
  const [loading, setLoading] = useState(true);

  // Sync session state to storage
  useEffect(() => {
    setStored('current_user', user);
    setStored('current_profile', profile);
    setStored('current_driver', driver);
    setStored('current_organization', organization);
  }, [user, profile, driver, organization]);

  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      if (!isSupabaseConfigured) {
        if (isMounted) setLoading(false);
        return;
      }

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user && isMounted) {
          setUser({ id: session.user.id, email: session.user.email });

          try {
            const { data, error } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single();

            if (data && !error && isMounted) {
              setProfile(data as Profile);

              if (data.role === 'driver') {
                const { data: dData } = await supabase
                  .from('drivers')
                  .select('*')
                  .or(`profile_id.eq.${session.user.id},id.eq.${session.user.id}`)
                  .maybeSingle();

                if (dData && isMounted) {
                  setDriver(dData as Driver);
                }
              } else if (data.role === 'organization') {
                const { data: orgUserData } = await supabase
                  .from('organization_users')
                  .select('*, organization:organizations(*)')
                  .or(`profile_id.eq.${session.user.id},user_id.eq.${session.user.id}`)
                  .maybeSingle();

                if (orgUserData?.organization && isMounted) {
                  setOrganization(orgUserData.organization as Organization);
                }
              }
            } else if (isMounted) {
              setProfile({
                id: session.user.id,
                role: (session.user.user_metadata?.role as UserRole) || 'admin',
                full_name: session.user.user_metadata?.full_name || 'Admin',
                email: session.user.email,
                is_active: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              });
            }
          } catch {
            if (isMounted) {
              setProfile({
                id: session.user.id,
                role: (session.user.user_metadata?.role as UserRole) || 'admin',
                full_name: session.user.user_metadata?.full_name || 'Admin',
                email: session.user.email,
                is_active: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              });
            }
          }
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({ id: session.user.id, email: session.user.email });
      } else {
        setUser(null);
        setProfile(null);
        setDriver(null);
        setOrganization(null);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Admin Registration
  const signUpAdmin = async (email: string, password: string, fullName: string): Promise<{ error: string | null }> => {
    try {
      const cleanEmail = email.trim();
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password: password,
        options: {
          data: {
            role: 'admin',
            full_name: fullName.trim(),
          },
        },
      });

      if (error) return { error: error.message };
      if (!data.user) return { error: 'Failed to create admin user' };

      try {
        await supabase.from('profiles').upsert({
          id: data.user.id,
          role: 'admin',
          full_name: fullName.trim(),
          email: cleanEmail,
          is_active: true,
        });
      } catch {
        // Table might not be ready
      }

      const adminProfile: Profile = {
        id: data.user.id,
        role: 'admin',
        full_name: fullName.trim(),
        email: cleanEmail,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      setUser({ id: data.user.id, email: cleanEmail });
      setProfile(adminProfile);
      setDriver(null);
      setOrganization(null);
      return { error: null };
    } catch (err: any) {
      return { error: err.message || 'Registration failed' };
    }
  };

  // Admin Login
  const signInAdmin = async (emailOrUsername: string, password: string): Promise<{ error: string | null }> => {
    if (!emailOrUsername || !password) {
      return { error: 'Please enter both username/email and password' };
    }

    const cleanInput = emailOrUsername.trim();
    const loginEmail = cleanInput.includes('@') ? cleanInput : `${cleanInput}@villalemon.in`;

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: password,
      });

      if (error) {
        return { error: error.message };
      }

      if (data.user) {
        let adminProfile: Profile | null = null;
        try {
          const { data: pData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();

          if (pData) {
            adminProfile = pData as Profile;
          }
        } catch {
          // Fallback
        }

        if (!adminProfile) {
          adminProfile = {
            id: data.user.id,
            role: (data.user.user_metadata?.role as UserRole) || 'admin',
            full_name: data.user.user_metadata?.full_name || 'Admin',
            email: data.user.email,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };

          try {
            await supabase.from('profiles').upsert({
              id: adminProfile.id,
              role: adminProfile.role,
              full_name: adminProfile.full_name,
              email: adminProfile.email,
              is_active: true,
            });
          } catch (e) {
            console.warn('Profile sync note:', e);
          }
        }

        setUser({ id: data.user.id, email: data.user.email });
        setProfile(adminProfile);
        setDriver(null);
        setOrganization(null);
        return { error: null };
      }

      return { error: 'Authentication failed' };
    } catch (err: any) {
      return { error: err.message || 'Login failed' };
    }
  };

  // Driver Login
  const signInDriver = async (username: string, password: string): Promise<{ error: string | null }> => {
    if (!username || !password) {
      return { error: 'Please enter driver username and password' };
    }

    const cleanUsername = username.trim().toLowerCase();

    try {
      // 1. Fetch drivers from Supabase to match phone, name, or username pattern
      let driverData: any = null;
      const { data: allDrivers } = await supabase.from('drivers').select('*');

      if (allDrivers && allDrivers.length > 0) {
        const cleanDigits = cleanUsername.replace(/[^0-9]/g, '');
        const cleanAlpha = cleanUsername.replace(/[^a-z]/g, '');

        driverData = allDrivers.find(d => {
          const dPhoneDigits = (d.phone || '').replace(/[^0-9]/g, '');
          const dNameLower = (d.full_name || '').toLowerCase().trim();
          const dNameAlpha = dNameLower.replace(/[^a-z]/g, '');

          // Direct match with input
          if (cleanDigits.length >= 6 && dPhoneDigits.includes(cleanDigits)) return true;
          if (dNameLower === cleanUsername) return true;

          // Alpha match e.g. "arjun657" -> alpha "arjun" matches driver "Arjun"
          if (cleanAlpha && cleanAlpha.length >= 3) {
            if (dNameAlpha === cleanAlpha) return true;
            if (dNameAlpha.includes(cleanAlpha) || cleanAlpha.includes(dNameAlpha)) return true;
          }

          if (d.payment_arrangement_notes && d.payment_arrangement_notes.toLowerCase().includes(cleanUsername)) return true;
          return false;
        });
      }

      // Fallback single query
      if (!driverData) {
        const { data: dData } = await supabase
          .from('drivers')
          .select('*')
          .or(`phone.eq.${cleanUsername},full_name.ilike.%${cleanUsername}%`)
          .maybeSingle();

        if (dData) {
          driverData = dData;
        }
      }

      const realDriverId = driverData?.id;
      const emailsToTry = [
        `${cleanUsername.replace(/\s+/g, '')}@villalemon.pickup`,
        driverData?.phone ? `${driverData.phone}@villalemon.pickup` : null,
      ].filter(Boolean) as string[];

      let authUser = null;
      for (const email of emailsToTry) {
        try {
          const { data: authData } = await supabase.auth.signInWithPassword({
            email,
            password: password,
          });
          if (authData?.user) {
            authUser = authData.user;
            break;
          }
        } catch {
          // Try next email option
        }
      }

      const driverEmail = authUser?.email || emailsToTry[0] || `${cleanUsername}@villalemon.pickup`;

      // Extract metadata from payment_arrangement_notes or driver record
      const notesStr = driverData?.payment_arrangement_notes || '';
      const userMatch = notesStr.match(/Username:\s*([a-zA-Z0-9_]+)/i);
      const addressMatch = notesStr.match(/Address:\s*([^|]+)/i);
      const vehicleMatch = notesStr.match(/Vehicle:\s*([^|]+)/i);
      const photoMatch = notesStr.match(/Photo:\s*([^|]+)/i);

      let avatarUrl = photoMatch ? photoMatch[1].trim() : null;
      if (!avatarUrl && (realDriverId || authUser?.id)) {
        try {
          const { data: prof } = await supabase
            .from('profiles')
            .select('avatar_url')
            .eq('id', realDriverId || authUser?.id)
            .maybeSingle();
          if (prof?.avatar_url) avatarUrl = prof.avatar_url;
        } catch {
          // ignore
        }
      }

      const isFirstLogin = !driverData?.driving_licence_no ||
                           driverData.driving_licence_no === 'N/A' ||
                           driverData.driving_licence_no === 'PENDING' ||
                           notesStr.includes('first_login:true') ||
                           !notesStr.includes('profile_completed:true');

      const driverProfile: Profile = {
        id: realDriverId || authUser?.id || driverData?.profile_id || 'driver-temp-id',
        role: 'driver',
        full_name: driverData?.full_name || username,
        email: driverEmail,
        phone: driverData?.phone,
        avatar_url: avatarUrl,
        is_active: true,
        created_at: driverData?.created_at || new Date().toISOString(),
        updated_at: driverData?.updated_at || new Date().toISOString(),
      };

      const finalDriver: Driver = driverData ? {
        id: driverData.id,
        full_name: driverData.full_name,
        phone: driverData.phone || '',
        username: userMatch ? userMatch[1].trim() : cleanUsername,
        driving_licence_no: driverData.driving_licence_no || '',
        licence_expiry: driverData.licence_expiry || '',
        vehicle_number: vehicleMatch ? vehicleMatch[1].trim() : '',
        address: addressMatch ? addressMatch[1].trim() : '',
        photo_url: avatarUrl || '',
        is_first_login: isFirstLogin,
        profile_completed: !isFirstLogin,
        employment_type: driverData.employment_type || 'Per-trip payment',
        monthly_salary: Number(driverData.monthly_salary) || 0,
        per_trip_payment: Number(driverData.per_trip_payment) || 500,
        payment_arrangement_notes: driverData.payment_arrangement_notes || '',
        status: driverData.status || 'Active',
        created_at: driverData.created_at || new Date().toISOString(),
        updated_at: driverData.updated_at || new Date().toISOString(),
      } : {
        id: driverProfile.id,
        full_name: driverProfile.full_name,
        phone: driverProfile.phone || '',
        username: cleanUsername,
        driving_licence_no: '',
        vehicle_number: '',
        address: '',
        photo_url: '',
        is_first_login: true,
        profile_completed: false,
        employment_type: 'Per-trip payment',
        monthly_salary: 0,
        per_trip_payment: 500,
        status: 'Active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      setUser({ id: driverProfile.id, email: driverEmail });
      setProfile(driverProfile);
      setDriver(finalDriver);
      setOrganization(null);
      return { error: null };
    } catch (err: any) {
      return { error: err.message || 'Driver login failed' };
    }
  };

  // Organization Partner Login
  const signInOrganization = async (emailOrUsername: string, password: string): Promise<{ error: string | null }> => {
    if (!emailOrUsername || !password) {
      return { error: 'Please enter organization email and password' };
    }

    const cleanInput = emailOrUsername.trim();
    const loginEmail = cleanInput.includes('@') ? cleanInput : `${cleanInput.replace(/\s+/g, '').toLowerCase()}@partner.villalemon.in`;

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: password,
      });

      if (error) {
        return { error: error.message };
      }

      if (data.user) {
        // Fetch profile
        let orgProfile: Profile | null = null;
        try {
          const { data: pData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();

          if (pData) orgProfile = pData as Profile;
        } catch {
          // Fallback
        }

        if (!orgProfile) {
          orgProfile = {
            id: data.user.id,
            role: 'organization',
            full_name: data.user.user_metadata?.full_name || 'Organization Partner',
            email: data.user.email,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
        }

        // Fetch associated organization record
        let orgData: Organization | null = null;
        try {
          const { data: orgUser } = await supabase
            .from('organization_users')
            .select('*, organization:organizations(*)')
            .or(`profile_id.eq.${data.user.id},user_id.eq.${data.user.id}`)
            .maybeSingle();

          if (orgUser?.organization) {
            orgData = orgUser.organization as Organization;
          } else {
            // Check direct organizations table
            const { data: directOrg } = await supabase
              .from('organizations')
              .select('*')
              .or(`email.eq.${loginEmail},name.ilike.%${cleanInput}%`)
              .maybeSingle();

            if (directOrg) orgData = directOrg as Organization;
          }
        } catch (e) {
          console.warn('Organization lookup error:', e);
        }

        setUser({ id: data.user.id, email: data.user.email });
        setProfile(orgProfile);
        setOrganization(orgData);
        setDriver(null);
        return { error: null };
      }

      return { error: 'Organization partner authentication failed' };
    } catch (err: any) {
      return { error: err.message || 'Organization login failed' };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch {
      // Ignore
    }
    setUser(null);
    setProfile(null);
    setDriver(null);
    setOrganization(null);
    localStorage.removeItem('villalemon_current_user');
    localStorage.removeItem('villalemon_current_profile');
    localStorage.removeItem('villalemon_current_driver');
    localStorage.removeItem('villalemon_current_organization');
  };

  const updateDriverPassword = async (newPassword: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (error) return { success: false, error: error.message };

      if (driver) {
        try {
          await supabase
            .from('drivers')
            .update({
              payment_arrangement_notes: driver.payment_arrangement_notes
                ? `${driver.payment_arrangement_notes} | first_login:false`
                : 'first_login:false',
              updated_at: new Date().toISOString(),
            })
            .eq('id', driver.id);
        } catch {
          // Ignore
        }
        setDriver({ ...driver, is_first_login: false });
      }
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  };

  const completeDriverProfile = async (updates: {
    drivingLicenceNo: string;
    licenceExpiry?: string;
    avatarUrl?: string;
    newPassword?: string;
    address?: string;
    phone?: string;
    vehicleNumber?: string;
  }): Promise<{ success: boolean; error?: string }> => {
    try {
      // 1. If new password provided, update user password
      if (updates.newPassword && updates.newPassword.length >= 6) {
        try {
          await supabase.auth.updateUser({ password: updates.newPassword });
        } catch (pwErr) {
          console.warn('Password update notice:', pwErr);
        }
      }

      // 2. Resolve real driver ID
      const effectiveDriverId = driver?.id;
      if (!effectiveDriverId) {
        return { success: false, error: 'No active driver found to update' };
      }

      // 3. Format payment_arrangement_notes metadata
      const cleanUsername = driver.username || driver.full_name.toLowerCase().replace(/\s+/g, '');
      const parts = [
        `Username: ${cleanUsername}`,
        updates.address ? `Address: ${updates.address}` : '',
        updates.vehicleNumber ? `Vehicle: ${updates.vehicleNumber}` : '',
        updates.avatarUrl ? `Photo: ${updates.avatarUrl}` : '',
        'profile_completed:true',
        'first_login:false'
      ].filter(Boolean);

      const updatedNotes = parts.join(' | ');

      // 4. Update 'drivers' table in Supabase
      const { error: dbError } = await supabase
        .from('drivers')
        .update({
          driving_licence_no: updates.drivingLicenceNo,
          licence_expiry: updates.licenceExpiry || null,
          phone: updates.phone || driver.phone,
          payment_arrangement_notes: updatedNotes,
          updated_at: new Date().toISOString(),
        })
        .eq('id', effectiveDriverId);

      if (dbError) {
        console.error('Failed to update driver record:', dbError);
      }

      // 5. Update 'profiles' table in Supabase
      const profileId = profile?.id || driver.profile_id;
      if (profileId) {
        try {
          const profilePayload: any = {
            updated_at: new Date().toISOString(),
          };
          if (updates.avatarUrl) profilePayload.avatar_url = updates.avatarUrl;
          if (updates.phone) profilePayload.phone = updates.phone;

          await supabase.from('profiles').update(profilePayload).eq('id', profileId);
        } catch (profErr) {
          console.warn('Profile avatar update notice:', profErr);
        }
      }

      // 6. Update local context state
      const updatedDriver: Driver = {
        ...driver,
        driving_licence_no: updates.drivingLicenceNo,
        licence_expiry: updates.licenceExpiry,
        phone: updates.phone || driver.phone,
        vehicle_number: updates.vehicleNumber || driver.vehicle_number,
        address: updates.address || driver.address,
        payment_arrangement_notes: updatedNotes,
        is_first_login: false,
        profile_completed: true,
        photo_url: updates.avatarUrl || driver.photo_url,
      };

      const updatedProfile: Profile | null = profile ? {
        ...profile,
        avatar_url: updates.avatarUrl || profile.avatar_url,
        phone: updates.phone || profile.phone,
      } : null;

      setDriver(updatedDriver);
      if (updatedProfile) setProfile(updatedProfile);

      localStorage.setItem('villalemon_current_driver', JSON.stringify(updatedDriver));
      if (updatedProfile) localStorage.setItem('villalemon_current_profile', JSON.stringify(updatedProfile));

      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message || 'Failed to complete profile' };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        driver,
        organization,
        role: profile?.role ?? null,
        loading,
        setDriver,
        signInAdmin,
        signUpAdmin,
        signInDriver,
        signInOrganization,
        signOut,
        updateDriverPassword,
        completeDriverProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
