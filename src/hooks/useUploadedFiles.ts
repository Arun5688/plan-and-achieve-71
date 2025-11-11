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

      try {
        // Upload file to storage
        const filePath = `${user.id}/${Date.now()}-${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from('case-files')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        // Read and parse file content
        const fileContent = await file.text();
        let cases: any[] = [];

        if (fileType === 'csv') {
          // Parse CSV
          const lines = fileContent.split('\n').filter(line => line.trim());
          const headers = lines[0].split(',').map(h => h.trim());
          
          for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map(v => v.trim());
            const caseObj: any = {};
            headers.forEach((header, idx) => {
              caseObj[header] = values[idx];
            });
            cases.push(caseObj);
          }
        } else if (fileType === 'json') {
          // Parse JSON
          const parsed = JSON.parse(fileContent);
          cases = Array.isArray(parsed) ? parsed : [parsed];
        }

        // Insert cases into database
        const casesToInsert = cases.map(c => ({
          case_number: c.case_number || c.case_id || c.id || `AUTO-${Date.now()}`,
          title: c.title || 'Untitled Case',
          description: c.description || '',
          crime_type: c.crime_type || 'Unknown',
          severity: (c.severity || 'medium').toLowerCase(),
          status: 'open',
          location: c.location || 'Unknown',
          date_reported: c.date_reported || c.date || new Date().toISOString(),
          assigned_officer: user.id,
          workflow_stage: 'pending_review'
        }));

        const { error: insertError } = await supabase
          .from('cases')
          .insert(casesToInsert);

        if (insertError) throw insertError;

        // Update file status to completed
        const { error: updateError } = await supabase
          .from('uploaded_files')
          .update({
            status: 'completed',
            records_count: casesToInsert.length
          })
          .eq('id', data.id);

        if (updateError) throw updateError;

        return { ...data, status: 'completed' as const, records_count: casesToInsert.length };
      } catch (err: any) {
        // Update status to failed
        await supabase
          .from('uploaded_files')
          .update({
            status: 'failed',
            errors: { message: err.message }
          })
          .eq('id', data.id);

        throw err;
      }
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
