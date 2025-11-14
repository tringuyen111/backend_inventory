import React, { createContext, useState, useEffect, useContext, ReactNode, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from './AuthContext';

interface PermissionsContextType {
  permissions: string[];
  loading: boolean;
  hasPermission: (permission: string) => boolean;
}

const PermissionsContext = createContext<PermissionsContextType | undefined>(undefined);

export const PermissionsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, loading: authLoading } = useAuth();
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPermissions = async () => {
      if (user) {
        setLoading(true);
        try {
          // @ts-ignore - The user object will have an id.
          const { data, error } = await supabase.rpc('get_user_permissions', { p_user_id: user.id });
          if (error) {
            console.error('Error fetching permissions:', error);
            setPermissions([]);
          } else {
            // Add detailed logging for debugging.
            console.log(`[Permissions Debug] RPC 'get_user_permissions' returned:`, data);
            setPermissions(data || []);
          }
        } catch (e) {
            console.error('Exception fetching permissions:', e);
            setPermissions([]);
        } finally {
            setLoading(false);
        }

      } else {
        // If no user, clear permissions and stop loading
        setPermissions([]);
        setLoading(false);
      }
    };

    if (!authLoading) {
      fetchPermissions();
    }
  }, [user, authLoading]);

  const hasPermission = useCallback((permission: string) => {
    // An admin user is identified by the wildcard permission '*'.
    if (permissions.includes('*')) {
      return true;
    }
    // Otherwise, check for the specific permission.
    return permissions.includes(permission);
  }, [permissions]);


  const value = { permissions, loading, hasPermission };

  return <PermissionsContext.Provider value={value}>{children}</PermissionsContext.Provider>;
};

export const usePermissions = () => {
  const context = useContext(PermissionsContext);
  if (context === undefined) {
    throw new Error('usePermissions must be used within a PermissionsProvider');
  }
  return context;
};