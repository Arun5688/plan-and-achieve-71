import { useState } from "react";
import Layout from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Search, History, FileText, TrendingUp } from "lucide-react";
import VoiceCommandCenter from "@/components/VoiceCommandCenter";
import { ParsedCommand } from "@/utils/nlpProcessor";

const InvestigatorDashboard = () => {
  const [lastCommand, setLastCommand] = useState<ParsedCommand | null>(null);

  const handleCommandParsed = (command: ParsedCommand) => {
    setLastCommand(command);
    console.log('Command received in dashboard:', command);
    // TODO: Phase 3 - Implement actual search functionality
  };

  return (
    <Layout role="investigator">
      <div className="space-y-6">
        {/* Welcome Section */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">
            Investigator Dashboard
          </h1>
          <p className="text-muted-foreground">
            Voice-driven investigation tools and case management
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="rounded-lg bg-primary/10 p-3">
                <Search className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Searches</p>
                <p className="text-2xl font-bold">--</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="rounded-lg bg-accent/10 p-3">
                <FileText className="h-6 w-6 text-accent" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Cases Accessed</p>
                <p className="text-2xl font-bold">--</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="rounded-lg bg-primary/10 p-3">
                <History className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Recent Queries</p>
                <p className="text-2xl font-bold">--</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="rounded-lg bg-accent/10 p-3">
                <TrendingUp className="h-6 w-6 text-accent" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">High Priority</p>
                <p className="text-2xl font-bold">--</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Voice Command Center */}
          <div className="lg:col-span-2">
            <VoiceCommandCenter onCommandParsed={handleCommandParsed} />
          </div>

          {/* Quick Actions */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button className="w-full p-3 text-left rounded-lg border border-border hover:bg-accent transition-colors">
                <div className="flex items-center gap-3">
                  <Search className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">New Search</p>
                    <p className="text-xs text-muted-foreground">Start investigation</p>
                  </div>
                </div>
              </button>
              <button className="w-full p-3 text-left rounded-lg border border-border hover:bg-accent transition-colors">
                <div className="flex items-center gap-3">
                  <History className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">View History</p>
                    <p className="text-xs text-muted-foreground">Past searches</p>
                  </div>
                </div>
              </button>
              <button className="w-full p-3 text-left rounded-lg border border-border hover:bg-accent transition-colors">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">Recent Cases</p>
                    <p className="text-xs text-muted-foreground">View details</p>
                  </div>
                </div>
              </button>
            </div>
          </Card>
        </div>

        {/* Search Results Placeholder */}
        {lastCommand && !lastCommand.needsClarification && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Search Results</h3>
            <div className="text-center py-8 text-muted-foreground">
              <p>Phase 3: Search results will be displayed here</p>
              <p className="text-sm mt-2">
                Case search and filtering functionality coming in Phase 3
              </p>
            </div>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default InvestigatorDashboard;
