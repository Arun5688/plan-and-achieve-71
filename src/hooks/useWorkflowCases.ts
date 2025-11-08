import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface WorkflowCase {
  id: string;
  case_number: string;
  title: string;
  crime_type: string;
  location: string | null;
  workflow_stage: 'pending_review' | 'under_review' | 'needs_editing' | 'approved' | 'published';
  severity: 'low' | 'medium' | 'high' | 'critical';
  date_reported: string;
  last_updated: string;
}

export function useWorkflowCases() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: cases = [], isLoading } = useQuery({
    queryKey: ['workflow-cases'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cases')
        .select('*')
        .neq('workflow_stage', 'published')
        .order('last_updated', { ascending: false });

      if (error) throw error;
      return data as WorkflowCase[];
    }
  });

  const updateStage = useMutation({
    mutationFn: async ({ caseId, stage }: { caseId: string; stage: string }) => {
      const { error } = await supabase
        .from('cases')
        .update({ 
          workflow_stage: stage,
          last_updated: new Date().toISOString()
        })
        .eq('id', caseId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflow-cases'] });
      toast({
        title: "Stage updated",
        description: "Case workflow stage has been updated"
      });
    }
  });

  const approveCase = useMutation({
    mutationFn: async (caseId: string) => {
      const { error } = await supabase
        .from('cases')
        .update({ 
          workflow_stage: 'published',
          last_updated: new Date().toISOString()
        })
        .eq('id', caseId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflow-cases'] });
      queryClient.invalidateQueries({ queryKey: ['cases'] });
      toast({
        title: "Case approved",
        description: "Case has been published to the database"
      });
    }
  });

  return {
    cases,
    isLoading,
    updateStage,
    approveCase
  };
}
