export interface Job {
  id: string;
  name: string;
  url: string;
  method: string;
  schedule: string;
  status: "running" | "success" | "failed" | "paused";
  lastRun: string;
  nextRun: string;
  successRate: number;
  executionCount: number;
  headers?: string;
  body?: string;
  timeout?: number;
}

export interface Execution {
  id: string;
  jobId: string;
  startTime: string;
  endTime: string;
  status: "success" | "failed" | "running";
  duration: number;
  logs: string;
}

export const mockJobs: Job[] = [
  {
    id: "1",
    name: "Database Backup",
    url: "https://example.com/api/backup.php",
    method: "POST",
    schedule: "0 2 * * *",
    status: "success",
    lastRun: "2025-10-18T02:00:00",
    nextRun: "2025-10-19T02:00:00",
    successRate: 98.5,
    executionCount: 543,
    timeout: 300,
  },
  {
    id: "2",
    name: "Send Email Reports",
    url: "https://example.com/api/reports.php",
    method: "GET",
    schedule: "0 8 * * MON",
    status: "success",
    lastRun: "2025-10-14T08:00:00",
    nextRun: "2025-10-21T08:00:00",
    successRate: 100,
    executionCount: 156,
    timeout: 180,
  },
  {
    id: "3",
    name: "Clean Temp Files",
    url: "https://example.com/api/cleanup.php",
    method: "POST",
    schedule: "0 */6 * * *",
    status: "failed",
    lastRun: "2025-10-18T12:00:00",
    nextRun: "2025-10-18T18:00:00",
    successRate: 87.3,
    executionCount: 892,
    timeout: 60,
  },
  {
    id: "4",
    name: "Data Sync",
    url: "https://example.com/api/sync.php",
    method: "POST",
    schedule: "*/15 * * * *",
    status: "running",
    lastRun: "2025-10-18T14:30:00",
    nextRun: "2025-10-18T14:45:00",
    successRate: 95.2,
    executionCount: 2341,
    timeout: 120,
  },
  {
    id: "5",
    name: "Generate Analytics",
    url: "https://example.com/api/analytics.php",
    method: "GET",
    schedule: "0 0 * * *",
    status: "paused",
    lastRun: "2025-10-17T00:00:00",
    nextRun: "-",
    successRate: 92.1,
    executionCount: 234,
    timeout: 240,
  },
];

export const mockExecutions: Execution[] = [
  {
    id: "e1",
    jobId: "1",
    startTime: "2025-10-18T02:00:00",
    endTime: "2025-10-18T02:05:23",
    status: "success",
    duration: 323,
    logs: "Backup completed successfully. 1.2GB backed up.",
  },
  {
    id: "e2",
    jobId: "3",
    startTime: "2025-10-18T12:00:00",
    endTime: "2025-10-18T12:00:45",
    status: "failed",
    duration: 45,
    logs: "Error: Permission denied accessing /tmp/cache",
  },
  {
    id: "e3",
    jobId: "4",
    startTime: "2025-10-18T14:30:00",
    endTime: "",
    status: "running",
    duration: 0,
    logs: "Syncing data from API...",
  },
];

export const chartData = {
  executions: [
    { date: "Oct 12", successful: 145, failed: 8 },
    { date: "Oct 13", successful: 152, failed: 5 },
    { date: "Oct 14", successful: 148, failed: 12 },
    { date: "Oct 15", successful: 158, failed: 7 },
    { date: "Oct 16", successful: 162, failed: 4 },
    { date: "Oct 17", successful: 155, failed: 9 },
    { date: "Oct 18", successful: 167, failed: 6 },
  ],
  distribution: [
    { name: "Success", value: 1287, color: "hsl(var(--success))" },
    { name: "Failed", value: 51, color: "hsl(var(--destructive))" },
    { name: "Running", value: 8, color: "hsl(var(--primary))" },
  ],
};
