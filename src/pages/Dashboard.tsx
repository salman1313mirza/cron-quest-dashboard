import { useState, useEffect } from "react";
import { MetricCard } from "@/components/MetricCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, CheckCircle2, XCircle, Clock } from "lucide-react";
import { getDashboardStats, getExecutionTrends, getAllJobs, initDatabase } from "@/lib/database";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalJobs: 0,
    activeJobs: 0,
    successfulToday: 0,
    failedToday: 0,
    successRate: '0'
  });
  const [trends, setTrends] = useState<Array<{ date: string; successful: number; failed: number }>>([]);
  const [recentJobs, setRecentJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadDashboardData = async () => {
    await initDatabase();
    const statsData = await getDashboardStats();
    const trendsData = await getExecutionTrends(7);
    const jobs = await getAllJobs();
    
    setStats(statsData);
    setTrends(trendsData);
    setRecentJobs(jobs.slice(0, 5));
    setLoading(false);
  };

  useEffect(() => {
    loadDashboardData();
    
    // Realtime updates every 5 seconds
    const interval = setInterval(loadDashboardData, 5000);
    
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return <div className="p-8">Loading dashboard...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Monitor your cron jobs and system performance</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard title="Total Jobs" value={stats.totalJobs} icon={Clock} />
        <MetricCard title="Active Jobs" value={stats.activeJobs} icon={Activity} variant="success" />
        <MetricCard
          title="Success Rate"
          value={`${stats.successRate}%`}
          icon={CheckCircle2}
          variant="success"
          trend="Today"
        />
        <MetricCard title="Failed Today" value={stats.failedToday} icon={XCircle} variant="destructive" />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Execution Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={trends}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "var(--radius)",
                  }}
                />
                <Bar dataKey="successful" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="failed" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Jobs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentJobs.length > 0 ? (
                recentJobs.map((job) => (
                  <div key={job.id} className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-medium">{job.name}</p>
                      <p className="text-sm text-muted-foreground font-mono">{job.schedule}</p>
                    </div>
                    <Badge
                      variant={
                        job.status === "success"
                          ? "default"
                          : job.status === "failed"
                          ? "destructive"
                          : job.status === "running"
                          ? "secondary"
                          : "outline"
                      }
                      className={
                        job.status === "success"
                          ? "bg-success text-success-foreground"
                          : job.status === "running"
                          ? "bg-primary text-primary-foreground"
                          : ""
                      }
                    >
                      {job.status}
                    </Badge>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-center py-4">No jobs yet. Create your first job!</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
