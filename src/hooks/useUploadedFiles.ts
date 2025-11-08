import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface UploadedFile {
  id: string;
  filename: string;
  file_type: 'csv' | 'json' | 'xml';
  uploaded_by: string;
  uploaded_at: string;
  status: 'processing' | 'completed' | 'failed';
  records_count: number | null;
  errors: any;
  size_bytes: number;
}

export function useUploadedFiles() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: files = [], isLoading } = useQuery({
    queryKey: ['uploaded-files'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('uploaded_files')
        .select('*')
        .order('uploaded_at', { ascending: false });

      if (error) throw error;
      return data as UploadedFile[];
    }
  });

  const uploadFile = useMutation({
    mutationFn: async (file: File) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const fileType = file.name.split('.').pop()?.toLowerCase();
      if (!['csv', 'json', 'xml'].includes(fileType || '')) {
        throw new Error('Invalid file type');
      }

      // Insert file record
      const { data, error } = await supabase
        .from('uploaded_files')
        .insert({
          filename: file.name,
          file_type: fileType as 'csv' | 'json' | 'xml',
          uploaded_by: user.id,
          status: 'processing',
          size_bytes: file.size,
          records_count: null
        })
        .select()
        .single();

      if (error) throw error;

      // Simulate processing (in real app, this would be a background job)
      setTimeout(async () => {
        await supabase
          .from('uploaded_files')
          .update({
            status: 'completed',
            records_count: Math.floor(Math.random() * 100) + 10
          })
          .eq('id', data.id);
        
        queryClient.invalidateQueries({ queryKey: ['uploaded-files'] });
      }, 3000);

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['uploaded-files'] });
      toast({
        title: "File uploaded",
        description: "Your file is being processed"
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  return {
    files,
    isLoading,
    uploadFile
  };
}
