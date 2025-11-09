import { useState, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Upload, FileText, CheckCircle, AlertCircle, 
  Download, Clock, Edit3
} from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useUploadedFiles } from '@/hooks/useUploadedFiles';
import ManualCaseEntry from './ManualCaseEntry';

const DataUploadPanel = () => {
  const { files, uploadFile } = useUploadedFiles();
  const [isDragging, setIsDragging] = useState(false);
  const { toast } = useToast();

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    handleFileUpload(droppedFiles);
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      handleFileUpload(selectedFiles);
    }
  };

  const handleFileUpload = (uploadedFiles: File[]) => {
    uploadedFiles.forEach((file) => {
      const fileType = file.name.split('.').pop()?.toLowerCase();
      
      if (!['csv', 'json', 'xml'].includes(fileType || '')) {
        toast({
          title: "Invalid file type",
          description: `${file.name} is not a supported format. Use CSV, JSON, or XML.`,
          variant: "destructive"
        });
        return;
      }

      uploadFile.mutate(file);
    });
  };

  const getStatusIcon = (status: 'processing' | 'completed' | 'failed') => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'processing':
        return <Clock className="h-4 w-4 text-yellow-500 animate-pulse" />;
    }
  };

  const getStatusColor = (status: 'processing' | 'completed' | 'failed') => {
    switch (status) {
      case 'completed':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'failed':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'processing':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
    }
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="upload" className="space-y-4">
        <TabsList>
          <TabsTrigger value="upload">
            <Upload className="h-4 w-4 mr-2" />
            File Upload
          </TabsTrigger>
          <TabsTrigger value="manual">
            <Edit3 className="h-4 w-4 mr-2" />
            Manual Entry
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-6">
          {/* Upload Area */}
          <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Upload className="h-5 w-5 text-primary" />
          Upload Case Data
        </h3>
        
        <div
          className={`border-2 border-dashed rounded-lg p-12 text-center transition-all cursor-pointer ${
            isDragging 
              ? 'border-primary bg-primary/5' 
              : 'border-border hover:border-primary hover:bg-accent/5'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => document.getElementById('file-input')?.click()}
        >
          <Upload className={`h-12 w-12 mx-auto mb-4 ${isDragging ? 'text-primary' : 'text-muted-foreground'}`} />
          <h4 className="text-lg font-medium mb-2">
            {isDragging ? 'Drop files here' : 'Drag and drop files'}
          </h4>
          <p className="text-sm text-muted-foreground mb-4">
            or click to browse
          </p>
          <div className="flex gap-2 justify-center">
            <Badge variant="outline">.CSV</Badge>
            <Badge variant="outline">.JSON</Badge>
            <Badge variant="outline">.XML</Badge>
          </div>
          <input
            id="file-input"
            type="file"
            multiple
            accept=".csv,.json,.xml"
            className="hidden"
            onChange={handleFileInput}
          />
        </div>

        <div className="mt-4 p-4 bg-muted/50 rounded-lg">
          <p className="text-sm font-medium mb-2">Required Fields:</p>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">Case ID</Badge>
            <Badge variant="secondary">Crime Type</Badge>
            <Badge variant="secondary">Location</Badge>
            <Badge variant="secondary">Date</Badge>
            <Badge variant="secondary">Description</Badge>
          </div>
        </div>
      </Card>

      {/* Upload History */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Upload History</h3>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Log
          </Button>
        </div>

        <ScrollArea className="h-[400px]">
          <div className="space-y-3">
            {files.map((file) => (
              <div
                key={file.id}
                className="p-4 rounded-lg border border-border hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3 flex-1">
                    <FileText className="h-5 w-5 text-primary flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">{file.filename}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(file.uploaded_at), 'PPp')}
                      </p>
                    </div>
                  </div>
                  <Badge className={getStatusColor(file.status)}>
                    <span className="flex items-center gap-1">
                      {getStatusIcon(file.status)}
                      {file.status}
                    </span>
                  </Badge>
                </div>

                {file.status === 'processing' && (
                  <Progress value={66} className="h-2" />
                )}

                {file.status === 'completed' && file.records_count && (
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                    <span className="flex items-center gap-1">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      {file.records_count} records
                    </span>
                  </div>
                )}

                {file.errors && Array.isArray(file.errors) && file.errors.length > 0 && (
                  <div className="mt-3 p-3 bg-yellow-500/10 rounded border border-yellow-500/20">
                    <p className="text-sm font-medium text-yellow-500 mb-2">
                      Validation Warnings:
                    </p>
                    <div className="space-y-1">
                      {file.errors.slice(0, 3).map((error: any, idx: number) => (
                        <p key={idx} className="text-xs text-muted-foreground">
                          {error.message || JSON.stringify(error)}
                        </p>
                      ))}
                      {file.errors.length > 3 && (
                        <p className="text-xs text-muted-foreground">
                          +{file.errors.length - 3} more warnings
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </Card>
        </TabsContent>

        <TabsContent value="manual">
          <ManualCaseEntry />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DataUploadPanel;
