import { useState } from "react";
import Layout from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Search, FileText, TrendingUp, Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import VoiceCommandCenter from "@/components/VoiceCommandCenter";
import CaseDetailView from "@/components/CaseDetailView";
import CaseMatchAnalyzer from "@/components/CaseMatchAnalyzer";
import InvestigatorChatbot from "@/components/investigator/InvestigatorChatbot";
import { ParsedCommand } from "@/utils/nlpProcessor";
import { Case, SearchFilters } from "@/types/case";
import { useCases } from "@/hooks/useCases";
import { useSearchHistory } from "@/hooks/useSearchHistory";
import { Button } from "@/components/ui/button";

const InvestigatorDashboard = () => {
  const [searchFilters, setSearchFilters] = useState<SearchFilters | undefined>();
  const { cases, isLoading } = useCases(searchFilters);
  const { addSearch } = useSearchHistory();
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);

  const handleCommandParsed = async (command: ParsedCommand) => {
    console.log('Command received:', command);
    
    if (!command.needsClarification) {
      // Build filters from voice command
      const filters: SearchFilters = {};
      
      if (command.entities.crimeType && command.entities.crimeType.length > 0) {
        filters.crimeType = command.entities.crimeType[0];
      }
      
      if (command.entities.location) {
        filters.keywords = command.entities.location;
      }
      
      if (command.entities.keywords && command.entities.keywords.length > 0) {
        filters.keywords = command.entities.keywords.join(' ');
      }
      
      setSearchFilters(filters);
      
      // Save to search history
      await addSearch.mutateAsync({
        query: command.rawText,
        filters: command.entities,
        resultsCount: cases.length
      });
    }
  };

  return (
    <Layout role="investigator">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">
            Investigator Dashboard
          </h1>
          <p className="text-muted-foreground">
            Voice-powered criminal intelligence and case matching system
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="rounded-lg bg-primary/10 p-3">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Cases</p>
                <p className="text-2xl font-bold">{cases.length}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="rounded-lg bg-accent/10 p-3">
                <TrendingUp className="h-6 w-6 text-accent" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Under Investigation</p>
                <p className="text-2xl font-bold">
                  {cases.filter(c => c.status === 'under_investigation').length}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="rounded-lg bg-primary/10 p-3">
                <Search className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Open Cases</p>
                <p className="text-2xl font-bold">
                  {cases.filter(c => c.status === 'open').length}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Voice Command Center */}
        <VoiceCommandCenter onCommandParsed={handleCommandParsed} />

        {/* Main Content Tabs */}
        <Tabs defaultValue="cases" className="space-y-4">
          <TabsList>
            <TabsTrigger value="cases">Case Files</TabsTrigger>
            <TabsTrigger value="analyzer">AI Case Matching</TabsTrigger>
          </TabsList>

          <TabsContent value="cases">
            {/* Cases Display */}
            <Card className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Cases</h2>
                <Button
                  variant="outline"
                  onClick={() => setSearchFilters(undefined)}
                >
                  Clear Filters
                </Button>
              </div>

              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : cases.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  No cases found. Try adjusting your search filters.
                </div>
              ) : (
                <div className="grid gap-4">
                  {cases.map((caseItem) => (
                    <Card
                      key={caseItem.id}
                      className="p-4 hover:bg-accent/5 cursor-pointer transition-colors"
                      onClick={() => setSelectedCase(caseItem as Case)}
                    >
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <h3 className="font-semibold">{caseItem.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            Case #: {caseItem.case_number}
                          </p>
                          <p className="text-sm">{caseItem.description}</p>
                        </div>
                        <div className="flex flex-col gap-2 text-right">
                          <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                            caseItem.severity === 'critical' ? 'bg-destructive/10 text-destructive' :
                            caseItem.severity === 'high' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400' :
                            caseItem.severity === 'medium' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400' :
                            'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                          }`}>
                            {caseItem.severity}
                          </span>
                          <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                            caseItem.status === 'open' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400' :
                            caseItem.status === 'under_investigation' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400' :
                            caseItem.status === 'closed' ? 'bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400' :
                            'bg-slate-100 text-slate-700 dark:bg-slate-900/20 dark:text-slate-400'
                          }`}>
                            {caseItem.status.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                      <div className="mt-4 flex gap-4 text-sm text-muted-foreground">
                        <span>{caseItem.crime_type}</span>
                        <span>•</span>
                        <span>{caseItem.location}</span>
                        <span>•</span>
                        <span>{new Date(caseItem.date_reported).toLocaleDateString()}</span>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="analyzer">
            <CaseMatchAnalyzer />
          </TabsContent>
        </Tabs>
      </div>

      {selectedCase && (
        <CaseDetailView
          caseData={selectedCase}
          open={!!selectedCase}
          onOpenChange={() => setSelectedCase(null)}
        />
      )}
      
      <InvestigatorChatbot />
    </Layout>
  );
};

export default InvestigatorDashboard;