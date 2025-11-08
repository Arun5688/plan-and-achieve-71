import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  CheckCircle, Edit, 
  Clock
} from 'lucide-react';
import { format } from 'date-fns';
import { useWorkflowCases, WorkflowCase } from '@/hooks/useWorkflowCases';

const CaseWorkflow = () => {
  const { cases, updateStage, approveCase } = useWorkflowCases();
  const [selectedCase, setSelectedCase] = useState<WorkflowCase | null>(null);
  const [filter, setFilter] = useState<string>('all');

  const filteredCases = cases.filter(c => {
    if (filter === 'all') return true;
    if (filter === 'pending_review') return c.workflow_stage === 'pending_review';
    if (filter === 'urgent') return c.severity === 'critical';
    return true;
  });

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'high':
        return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
      case 'medium':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'low':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
    }
  };

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'pending_review':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'under_review':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'needs_editing':
        return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      case 'approved':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'published':
        return 'bg-primary/10 text-primary border-primary/20';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Filters */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Case Workflow Queue</h3>
          <div className="flex gap-2">
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter cases" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Cases</SelectItem>
                <SelectItem value="pending_review">Pending Review</SelectItem>
                <SelectItem value="urgent">Urgent Only</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={() => {}} disabled={!cases.some(c => c.workflow_stage === 'approved')}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Batch Approve
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-5 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-yellow-500">
              {cases.filter(c => c.workflow_stage === 'pending_review').length}
            </p>
            <p className="text-xs text-muted-foreground">Pending</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-500">
              {cases.filter(c => c.workflow_stage === 'under_review').length}
            </p>
            <p className="text-xs text-muted-foreground">In Review</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-purple-500">
              {cases.filter(c => c.workflow_stage === 'needs_editing').length}
            </p>
            <p className="text-xs text-muted-foreground">Editing</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-500">
              {cases.filter(c => c.workflow_stage === 'approved').length}
            </p>
            <p className="text-xs text-muted-foreground">Ready</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-red-500">
              {cases.filter(c => c.severity === 'critical').length}
            </p>
            <p className="text-xs text-muted-foreground">Critical</p>
          </div>
        </div>
      </Card>

      {/* Case List */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ScrollArea className="h-[600px] pr-4">
            <div className="space-y-3">
              {filteredCases.map((caseItem) => (
                <Card
                  key={caseItem.id}
                  className={`p-4 cursor-pointer transition-all ${
                    selectedCase?.id === caseItem.id 
                      ? 'ring-2 ring-primary' 
                      : 'hover:shadow-md'
                  }`}
                  onClick={() => setSelectedCase(caseItem)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-semibold">{caseItem.case_number}</h4>
                      <p className="text-sm text-primary">{caseItem.crime_type}</p>
                    </div>
                    <div className="flex gap-2">
                      <Badge className={getSeverityColor(caseItem.severity)}>
                        {caseItem.severity}
                      </Badge>
                      <Badge className={getStageColor(caseItem.workflow_stage)}>
                        {caseItem.workflow_stage.replace('_', ' ')}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {format(new Date(caseItem.date_reported), 'MMM d, HH:mm')}
                    </span>
                    <span>{caseItem.location}</span>
                  </div>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Case Detail Panel */}
        <Card className="p-6">
          {selectedCase ? (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg mb-2">{selectedCase.case_number}</h3>
                <p className="text-primary">{selectedCase.crime_type}</p>
                <p className="text-sm text-muted-foreground">{selectedCase.location}</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Workflow Stage</label>
                <Select
                  value={selectedCase.workflow_stage}
                  onValueChange={(value) => updateStage.mutate({ caseId: selectedCase.id, stage: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending_review">Pending Review</SelectItem>
                    <SelectItem value="under_review">Under Review</SelectItem>
                    <SelectItem value="needs_editing">Needs Editing</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  className="flex-1"
                  onClick={() => {
                    approveCase.mutate(selectedCase.id);
                    setSelectedCase(null);
                  }}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve & Publish
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Edit className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Select a case to review</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default CaseWorkflow;
