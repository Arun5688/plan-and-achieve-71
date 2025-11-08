import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface AdminUser {
  id: string;
  email: string;
  full_name: string | null;
  badge_number: string | null;
  role: 'investigator' | 'senior_investigator' | 'admin';
  is_active: boolean;
  created_at: string;
  last_login: string | null;
}

export function useAdminUsers() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      // Fetch profiles with user roles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*');

      if (profilesError) throw profilesError;

      // Fetch user roles
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('*');

      if (rolesError) throw rolesError;

      // Combine data (simplified without auth.admin API)
      const combinedUsers: AdminUser[] = profiles.map(profile => {
        const userRole = roles.find((r: any) => r.user_id === profile.id);
        
        return {
          id: profile.id,
          email: profile.id, // Will be fetched from auth if needed
          full_name: profile.full_name,
          badge_number: profile.badge_number,
          role: (userRole?.role || 'investigator') as 'investigator' | 'senior_investigator' | 'admin',
          is_active: true,
          created_at: profile.created_at,
          last_login: null
        };
      });

      return combinedUsers;
    }
  });

  const updateUserRole = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: 'investigator' | 'senior_investigator' | 'admin' }) => {
      const { error } = await supabase
        .from('user_roles')
        .update({ role: role as any })
        .eq('user_id', userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast({
        title: "Role updated",
        description: "User role has been updated successfully"
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  return {
    users,
    isLoading,
    updateUserRole
  };
}
