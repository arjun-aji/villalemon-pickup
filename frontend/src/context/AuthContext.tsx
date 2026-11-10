import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Profile, UserRole, DriverEmployee } from '../types';
import { getStored, setStored } from '../lib/mockData';

interface AuthContextType {
  user: { id: string; email?: string } | null;
  profile: Profile | null;
  driver: DriverEmployee | null;
  role: UserRole | null;
  loading: boolean;
  signInAdmin: (emailOrUsername: string, password: string) => Promise<{ error: string | null }>;
  signUpAdmin: (email: string, password: string, fullName: string) => Promise<{ error: string | null }>;
  signInDriver: (username: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  updateDriverPassword: (newPassword: string) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<{ id: string; email?: string } | null>(() => {
    return getStored('current_user', null);
  });
  const [profile, setProfile] = useState<Profile | null>(() => {
    return getStored('current_profile', null);
  });
  const [driver, setDriver] = useState<DriverEmployee | null>(() => {
    return getStored('current_driver', null);
  });
  const [loading, setLoading] = useState(true);

  // Sync session state to storage
  useEffect(() => {
    setStored('current_user', user);
    setStored('current_profile', profile);
    setStored('current_driver', driver);
  }, [user, profile, driver]);

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
                  .from('driver_employees')
                  .select('*')
                  .eq('user_id', session.user.id)
                  .single();
                if (dData && isMounted) setDriver(dData as DriverEmployee);
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
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Admin Registration (for setting up initial strong admin account on fresh Supabase)
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

      // Attempt to upsert into profiles if table exists
      try {
        await supabase.from('profiles').upsert({
          id: data.user.id,
          role: 'admin',
          full_name: fullName.trim(),
          email: cleanEmail,
          is_active: true,
        });
      } catch {
        // Table might not be ready yet
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
      return { error: null };
    } catch (err: any) {
      return { error: err.message || 'Registration failed' };
    }
  };

  // Admin Login (supports email or username)
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
          // Fallback to user metadata
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
        return { error: null };
      }

      return { error: 'Authentication failed' };
    } catch (err: any) {
      return { error: err.message || 'Login failed' };
    }
  };

  // Driver Login (queries driver_employees table in Supabase)
  const signInDriver = async (username: string, password: string): Promise<{ error: string | null }> => {
    if (!username || !password) {
      return { error: 'Please enter driver username and password' };
    }

    const cleanUsername = username.trim().toLowerCase();

    try {
      // Look up driver employee record from Supabase
      const { data: driverData, error: driverLookupError } = await supabase
        .from('driver_employees')
        .select('*')
        .eq('username', cleanUsername)
        .single();

      if (driverLookupError || !driverData) {
        return { error: `Driver with username "${cleanUsername}" was not found. Please contact admin.` };
      }

      if (driverData.employment_status !== 'active') {
        return { error: 'This driver account is inactive or suspended. Please contact admin.' };
      }

      const driverEmail = driverData.email || `${cleanUsername}@villalemon.pickup`;

      let authUser = null;
      try {
        const { data: authData } = await supabase.auth.signInWithPassword({
          email: driverEmail,
          password: password,
        });
        if (authData?.user) {
          authUser = authData.user;
        }
      } catch {
        // Fallback to driver record
      }

      const driverProfile: Profile = {
        id: authUser?.id || driverData.user_id || driverData.id,
        role: 'driver',
        full_name: driverData.full_name,
        email: driverEmail,
        phone: driverData.phone,
        is_active: true,
        created_at: driverData.created_at,
        updated_at: driverData.updated_at,
      };

      setUser({ id: driverProfile.id, email: driverEmail });
      setProfile(driverProfile);
      setDriver(driverData as DriverEmployee);
      localStorage.setItem('villalemon_current_profile', JSON.stringify(driverProfile));
      localStorage.setItem('villalemon_current_driver', JSON.stringify(driverData));
      return { error: null };
    } catch (err: any) {
      return { error: err.message || 'Driver login failed' };
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
    localStorage.removeItem('villalemon_current_user');
    localStorage.removeItem('villalemon_current_profile');
    localStorage.removeItem('villalemon_current_driver');
  };

  const updateDriverPassword = async (newPassword: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (error) return { success: false, error: error.message };

      if (driver) {
        await supabase
          .from('driver_employees')
          .update({ is_first_login: false })
          .eq('id', driver.id);
        setDriver({ ...driver, is_first_login: false });
      }
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        driver,
        role: profile?.role ?? null,
        loading,
        signInAdmin,
        signUpAdmin,
        signInDriver,
        signOut,
        updateDriverPassword,
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
