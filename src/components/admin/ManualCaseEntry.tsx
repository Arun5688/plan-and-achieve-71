import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { FileText, Loader2 } from 'lucide-react';
import { z } from 'zod';

const caseSchema = z.object({
  case_number: z.string().min(3, "Case number must be at least 3 characters"),
  title: z.string().min(5, "Title must be at least 5 characters").max(200),
  description: z.string().min(20, "Description must be at least 20 characters").max(2000),
  crime_type: z.string().min(1, "Crime type is required"),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  location: z.string().min(1, "Location is required").max(200),
  primary_suspect: z.string().max(500).optional(),
  evidence_summary: z.string().max(1000).optional()
});

const ManualCaseEntry = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    case_number: '',
    title: '',
    description: '',
    crime_type: '',
    severity: 'medium' as const,
    location: '',
    primary_suspect: '',
    evidence_summary: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Validate form data
      const validatedData = caseSchema.parse(formData);
      
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Insert case into database
      const { error } = await supabase
        .from('cases')
        .insert([{
          case_number: validatedData.case_number,
          title: validatedData.title,
          description: validatedData.description || null,
          crime_type: validatedData.crime_type,
          severity: validatedData.severity,
          status: 'open',
          location: validatedData.location || null,
          primary_suspect: validatedData.primary_suspect || null,
          evidence_summary: validatedData.evidence_summary || null,
          workflow_stage: 'pending_review',
          date_reported: new Date().toISOString(),
          assigned_officer: user.id
        }]);

      if (error) throw error;

      toast({
        title: "Case created successfully",
        description: `Case ${validatedData.case_number} has been added to the database`
      });

      // Reset form
      setFormData({
        case_number: '',
        title: '',
        description: '',
        crime_type: '',
        severity: 'medium',
        location: '',
        primary_suspect: '',
        evidence_summary: ''
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Validation error",
          description: error.errors[0].message,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Failed to create case",
          description: error instanceof Error ? error.message : "Unknown error occurred",
          variant: "destructive"
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-6">
        <FileText className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Manual Case Entry</h3>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="case_number">Case Number *</Label>
            <Input
              id="case_number"
              value={formData.case_number}
              onChange={(e) => setFormData({ ...formData, case_number: e.target.value })}
              placeholder="e.g., CASE-2024-001"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="crime_type">Crime Type *</Label>
            <Input
              id="crime_type"
              value={formData.crime_type}
              onChange={(e) => setFormData({ ...formData, crime_type: e.target.value })}
              placeholder="e.g., Robbery, Assault"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="severity">Severity *</Label>
            <Select
              value={formData.severity}
              onValueChange={(value: any) => setFormData({ ...formData, severity: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location *</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="e.g., 123 Main St, City"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="title">Case Title *</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="Brief descriptive title of the case"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description *</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Detailed description of the incident..."
            rows={4}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="primary_suspect">Primary Suspect (Optional)</Label>
          <Textarea
            id="primary_suspect"
            value={formData.primary_suspect}
            onChange={(e) => setFormData({ ...formData, primary_suspect: e.target.value })}
            placeholder="Description of suspect(s), if known..."
            rows={2}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="evidence_summary">Evidence Summary (Optional)</Label>
          <Textarea
            id="evidence_summary"
            value={formData.evidence_summary}
            onChange={(e) => setFormData({ ...formData, evidence_summary: e.target.value })}
            placeholder="Summary of collected evidence..."
            rows={2}
          />
        </div>

        <div className="flex gap-3 pt-4">
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Submit Case
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => setFormData({
              case_number: '',
              title: '',
              description: '',
              crime_type: '',
              severity: 'medium',
              location: '',
              primary_suspect: '',
              evidence_summary: ''
            })}
          >
            Clear Form
          </Button>
        </div>
      </form>
    </Card>
  );
};

export default ManualCaseEntry;
