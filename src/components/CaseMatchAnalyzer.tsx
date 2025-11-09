import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, Search, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { z } from 'zod';

const caseDetailsSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters").max(200, "Title must be less than 200 characters"),
  description: z.string().min(20, "Description must be at least 20 characters").max(2000, "Description must be less than 2000 characters"),
  crime_type: z.string().min(3, "Crime type must be at least 3 characters").max(100, "Crime type must be less than 100 characters"),
  severity: z.enum(["low", "medium", "high", "critical"], { errorMap: () => ({ message: "Please select a valid severity level" }) }),
  location: z.string().max(200, "Location must be less than 200 characters"),
  suspect_description: z.string().max(1000, "Suspect description must be less than 1000 characters"),
  evidence_description: z.string().max(1000, "Evidence description must be less than 1000 characters"),
});

interface CaseMatch {
  case_id: string;
  case_number: string;
  similarity_score: number;
  matching_factors: string[];
  reasoning: string;
}

interface AnalysisResult {
  matches: CaseMatch[];
  overall_assessment: string;
}

const CaseMatchAnalyzer = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const { toast } = useToast();

  const [caseDetails, setCaseDetails] = useState({
    title: '',
    description: '',
    crime_type: '',
    severity: 'medium' as 'low' | 'medium' | 'high' | 'critical',
    location: '',
    suspect_description: '',
    evidence_description: ''
  });

  const handleAnalyze = async () => {
    // Validate input with zod schema
    const validationResult = caseDetailsSchema.safeParse(caseDetails);
    
    if (!validationResult.success) {
      const firstError = validationResult.error.errors[0];
      toast({
        title: 'Validation Error',
        description: firstError.message,
        variant: 'destructive'
      });
      return;
    }

    setIsAnalyzing(true);
    setAnalysis(null);

    try {
      const { data, error } = await supabase.functions.invoke('match-case', {
        body: { caseDetails }
      });

      if (error) {
        throw error;
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      setAnalysis(data.analysis);
      toast({
        title: 'Analysis Complete',
        description: `Found ${data.analysis.matches.length} matching cases`
      });
    } catch (error) {
      console.error('Analysis error:', error);
      toast({
        title: 'Analysis Failed',
        description: error instanceof Error ? error.message : 'Failed to analyze case',
        variant: 'destructive'
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'bg-red-500';
    if (score >= 60) return 'bg-orange-500';
    if (score >= 40) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Case Matching Analyzer
          </CardTitle>
          <CardDescription>
            Submit case details to find similar cases and get AI-powered matching analysis
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Case Title *</Label>
              <Input
                id="title"
                placeholder="e.g., Armed Robbery at Downtown Bank"
                value={caseDetails.title}
                onChange={(e) => setCaseDetails({ ...caseDetails, title: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="crime_type">Crime Type *</Label>
              <Input
                id="crime_type"
                placeholder="e.g., Robbery, Burglary, Assault"
                value={caseDetails.crime_type}
                onChange={(e) => setCaseDetails({ ...caseDetails, crime_type: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="severity">Severity</Label>
              <Select
                value={caseDetails.severity}
                onValueChange={(value: any) => setCaseDetails({ ...caseDetails, severity: value })}
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
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                placeholder="e.g., 123 Main St, Downtown"
                value={caseDetails.location}
                onChange={(e) => setCaseDetails({ ...caseDetails, location: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Case Description *</Label>
            <Textarea
              id="description"
              placeholder="Provide detailed description of the incident, including timeline, circumstances, and any notable patterns..."
              className="min-h-[100px]"
              value={caseDetails.description}
              onChange={(e) => setCaseDetails({ ...caseDetails, description: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="suspect">Suspect Description</Label>
            <Textarea
              id="suspect"
              placeholder="Physical description, clothing, behavior patterns, vehicle information..."
              className="min-h-[80px]"
              value={caseDetails.suspect_description}
              onChange={(e) => setCaseDetails({ ...caseDetails, suspect_description: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="evidence">Evidence Description</Label>
            <Textarea
              id="evidence"
              placeholder="Weapons used, tools, DNA, fingerprints, CCTV footage, witness statements..."
              className="min-h-[80px]"
              value={caseDetails.evidence_description}
              onChange={(e) => setCaseDetails({ ...caseDetails, evidence_description: e.target.value })}
            />
          </div>

          <Button
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            className="w-full"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing Cases...
              </>
            ) : (
              <>
                <Search className="mr-2 h-4 w-4" />
                Analyze & Find Matches
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {analysis && (
        <Card>
          <CardHeader>
            <CardTitle>Analysis Results</CardTitle>
            <CardDescription>AI-powered case matching analysis</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[600px] pr-4">
              <div className="space-y-6">
                {/* Overall Assessment */}
                <div className="p-4 bg-accent/10 rounded-lg border border-accent/20">
                  <div className="flex items-start gap-2 mb-2">
                    <AlertCircle className="h-5 w-5 text-accent mt-0.5" />
                    <h3 className="font-semibold">Overall Assessment</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">{analysis.overall_assessment}</p>
                </div>

                {/* Matching Cases */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Top {analysis.matches.length} Matching Cases</h3>
                  {analysis.matches.map((match, index) => (
                    <Card key={match.case_id} className="border-2">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Badge variant="outline" className="text-sm">
                              #{index + 1}
                            </Badge>
                            <CardTitle className="text-lg">{match.case_number}</CardTitle>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">Similarity:</span>
                            <div className={`px-3 py-1 rounded-full ${getScoreColor(match.similarity_score)} text-white font-bold text-sm`}>
                              {match.similarity_score}%
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div>
                          <h4 className="font-semibold text-sm mb-2">Matching Factors:</h4>
                          <div className="flex flex-wrap gap-2">
                            {match.matching_factors.map((factor, idx) => (
                              <Badge key={idx} variant="secondary" className="text-xs">
                                {factor}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div>
                          <h4 className="font-semibold text-sm mb-1">Analysis:</h4>
                          <p className="text-sm text-muted-foreground">{match.reasoning}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CaseMatchAnalyzer;
