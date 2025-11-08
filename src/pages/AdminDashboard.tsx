import Layout from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Database, BarChart3, CheckCircle } from "lucide-react";
import DataUploadPanel from "@/components/admin/DataUploadPanel";
import CaseWorkflow from "@/components/admin/CaseWorkflow";
import UserManagement from "@/components/admin/UserManagement";
import SystemAnalytics from "@/components/admin/SystemAnalytics";
import { useAdminUsers } from "@/hooks/useAdminUsers";
import { useWorkflowCases } from "@/hooks/useWorkflowCases";

const AdminDashboard = () => {
  const { users } = useAdminUsers();
  const { cases } = useWorkflowCases();
  
  const activeUsers = users.filter(u => u.is_active).length;
  const pendingApprovals = cases.filter(c => c.workflow_stage === 'pending_review').length;
  const totalCases = cases.length;

  return (
    <Layout role="admin">
      <div className="space-y-6">
        {/* Welcome Section */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">
            Administrator Dashboard
          </h1>
          <p className="text-muted-foreground">
            System management, data oversight, and user administration
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="rounded-lg bg-accent/10 p-3">
                <Users className="h-6 w-6 text-accent" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Users</p>
                <p className="text-2xl font-bold">{activeUsers}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="rounded-lg bg-primary/10 p-3">
                <Database className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Cases</p>
                <p className="text-2xl font-bold">{totalCases}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="rounded-lg bg-accent/10 p-3">
                <CheckCircle className="h-6 w-6 text-accent" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending Approval</p>
                <p className="text-2xl font-bold">{pendingApprovals}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="rounded-lg bg-primary/10 p-3">
                <BarChart3 className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">System Health</p>
                <p className="text-2xl font-bold text-accent">Good</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Tabbed Interface */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="data">Data Management</TabsTrigger>
            <TabsTrigger value="users">User Management</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <SystemAnalytics />
          </TabsContent>

          <TabsContent value="data" className="space-y-4">
            <Tabs defaultValue="upload" className="space-y-4">
              <TabsList>
                <TabsTrigger value="upload">Data Upload</TabsTrigger>
                <TabsTrigger value="workflow">Case Workflow</TabsTrigger>
              </TabsList>

              <TabsContent value="upload">
                <DataUploadPanel />
              </TabsContent>

              <TabsContent value="workflow">
                <CaseWorkflow />
              </TabsContent>
            </Tabs>
          </TabsContent>

          <TabsContent value="users" className="space-y-4">
            <UserManagement />
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <SystemAnalytics />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default AdminDashboard;
