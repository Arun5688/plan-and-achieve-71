import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  TrendingUp, TrendingDown, Activity, Users, 
  Search, Database, Clock, AlertCircle 
} from 'lucide-react';
import { format } from 'date-fns';
import { useActivityLogs } from '@/hooks/useActivityLogs';

const SystemAnalytics = () => {
  const { logs } = useActivityLogs(50);
  const metrics = [
    { label: 'Total Searches (24h)', value: '1,247', change: 12.5, trend: 'up' as const, icon: Search },
    { label: 'Active Users (Now)', value: '42', change: -3.2, trend: 'down' as const, icon: Users },
    { label: 'Avg Response Time', value: '145ms', change: -8.4, trend: 'up' as const, icon: Clock },
    { label: 'Database Size', value: '2.4 GB', change: 5.1, trend: 'up' as const, icon: Database },
    { label: 'API Calls (Today)', value: '8,932', change: 18.2, trend: 'up' as const, icon: Activity },
    { label: 'Error Rate', value: '0.03%', change: -12.1, trend: 'up' as const, icon: AlertCircle },
  ];

  const searchPatterns = [
    { query: 'Armed Robbery', count: 156, percentage: 15 },
    { query: 'Burglary', count: 134, percentage: 13 },
    { query: 'Drug Trafficking', count: 98, percentage: 9 },
    { query: 'Assault', count: 87, percentage: 8 },
    { query: 'Vehicle Theft', count: 76, percentage: 7 },
  ];

  const systemHealth = [
    { component: 'Database', status: 'healthy', uptime: '99.98%', responseTime: '12ms' },
    { component: 'API Server', status: 'healthy', uptime: '99.95%', responseTime: '45ms' },
    { component: 'Voice Recognition', status: 'warning', uptime: '98.20%', responseTime: '350ms' },
    { component: 'Search Engine', status: 'healthy', uptime: '99.99%', responseTime: '18ms' },
    { component: 'File Storage', status: 'healthy', uptime: '100%', responseTime: '8ms' },
  ];

  const getActionColor = (action: string) => {
    if (action.includes('Login')) return 'bg-blue-500/10 text-blue-500';
    if (action.includes('Search')) return 'bg-purple-500/10 text-purple-500';
    if (action.includes('Upload')) return 'bg-green-500/10 text-green-500';
    if (action.includes('Updated')) return 'bg-yellow-500/10 text-yellow-500';
    if (action.includes('Approved')) return 'bg-green-500/10 text-green-500';
    return 'bg-gray-500/10 text-gray-500';
  };

  const getHealthColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'warning':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'critical':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      default:
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  return (
    <div className="space-y-6">
      {/* Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-3">
        {metrics.map((metric) => (
          <Card key={metric.label} className="p-6">
            <div className="flex items-start justify-between mb-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <metric.icon className="h-5 w-5 text-primary" />
              </div>
              <div className={`flex items-center gap-1 text-sm ${
                metric.change > 0 ? 'text-green-500' : 'text-red-500'
              }`}>
                {metric.change > 0 ? (
                  <TrendingUp className="h-4 w-4" />
                ) : (
                  <TrendingDown className="h-4 w-4" />
                )}
                {Math.abs(metric.change)}%
              </div>
            </div>
            <p className="text-3xl font-bold mb-1">{metric.value}</p>
            <p className="text-sm text-muted-foreground">{metric.label}</p>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Search Patterns */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Top Search Patterns</h3>
          <div className="space-y-4">
            {searchPatterns.map((pattern) => (
              <div key={pattern.query}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">{pattern.query}</span>
                  <span className="text-sm text-muted-foreground">{pattern.count} searches</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: `${pattern.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* System Health */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">System Health</h3>
          <div className="space-y-3">
            {systemHealth.map((component) => (
              <div key={component.component} className="flex items-center justify-between p-3 rounded-lg border border-border">
                <div className="flex-1">
                  <p className="font-medium">{component.component}</p>
                  <div className="flex gap-4 text-xs text-muted-foreground mt-1">
                    <span>Uptime: {component.uptime}</span>
                    <span>Response: {component.responseTime}</span>
                  </div>
                </div>
                <Badge className={getHealthColor(component.status)}>
                  {component.status}
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Activity Feed */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Recent System Activity</h3>
        <ScrollArea className="h-[400px]">
          <div className="space-y-3">
            {logs.map((log) => (
              <div key={log.id} className="flex gap-4 p-3 rounded-lg hover:bg-accent/50 transition-colors">
                <div className="flex-shrink-0">
                  <Badge variant="outline" className={getActionColor(log.action)}>
                    {log.action}
                  </Badge>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{log.user_name || 'Unknown User'}</p>
                  <p className="text-sm text-muted-foreground">{log.action}</p>
                  {log.details && (
                    <p className="text-xs text-muted-foreground mt-1">{log.details}</p>
                  )}
                </div>
                <div className="flex-shrink-0 text-sm text-muted-foreground">
                  {format(new Date(log.created_at), 'HH:mm')}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </Card>
    </div>
  );
};

export default SystemAnalytics;
