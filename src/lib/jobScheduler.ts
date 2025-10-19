import { getAllJobs, updateJob, createExecution, createErrorLog } from './database';
import { calculateNextRun } from './cronUtils';

class JobScheduler {
  private intervalId: number | null = null;
  private isRunning = false;

  async executeJob(job: any) {
    console.log(`Executing job: ${job.name}`);
    
    // Update job status to running
    await updateJob(job.id, { status: 'running' });

    const startTime = Date.now();
    
    try {
      // Parse headers
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      if (job.headers) {
        try {
          const parsedHeaders = typeof job.headers === 'string' 
            ? JSON.parse(job.headers) 
            : job.headers;
          Object.assign(headers, parsedHeaders);
        } catch (e) {
          console.error('Failed to parse headers:', e);
        }
      }

      // Parse body
      let bodyContent = undefined;
      if (job.body && (job.method === 'POST' || job.method === 'PUT' || job.method === 'PATCH')) {
        try {
          bodyContent = typeof job.body === 'string' ? job.body : JSON.stringify(job.body);
        } catch (e) {
          console.error('Failed to parse body:', e);
        }
      }

      // Make the HTTP request with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), (job.timeout || 30) * 1000);

      const response = await fetch(job.url, {
        method: job.method || 'GET',
        headers,
        body: bodyContent,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const duration = Date.now() - startTime;
      const responseText = await response.text();

      // Create execution record
      await createExecution({
        id: `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        jobId: job.id,
        jobName: job.name,
        timestamp: new Date().toISOString(),
        status: response.ok ? 'success' : 'failed',
        duration,
        logs: `Status: ${response.status}\nDuration: ${duration}ms`,
        responseStatus: response.status,
        responseBody: responseText.substring(0, 1000), // Limit response body size
      });

      const now = new Date();
      const nextRun = calculateNextRun(job.schedule, now);

      // Update job with new status and next run time
      await updateJob(job.id, {
        status: response.ok ? 'success' : 'failed',
        lastRun: now.toISOString(),
        nextRun: nextRun.toISOString(),
      });

      console.log(`Job ${job.name} completed successfully`);

    } catch (error: any) {
      const duration = Date.now() - startTime;
      
      // Log error
      await createErrorLog({
        id: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        jobId: job.id,
        jobName: job.name,
        timestamp: new Date().toISOString(),
        errorType: error.name || 'Error',
        errorMessage: error.message || 'Unknown error',
        stackTrace: error.stack || '',
        responseStatus: null,
      });

      // Create failed execution record
      await createExecution({
        id: `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        jobId: job.id,
        jobName: job.name,
        timestamp: new Date().toISOString(),
        status: 'failed',
        duration,
        logs: `Error: ${error.message}\nStack: ${error.stack}`,
        responseStatus: null,
        responseBody: null,
      });

      const now = new Date();
      const nextRun = calculateNextRun(job.schedule, now);

      // Update job status to failed
      await updateJob(job.id, {
        status: 'failed',
        lastRun: now.toISOString(),
        nextRun: nextRun.toISOString(),
      });

      console.error(`Job ${job.name} failed:`, error);
    }
  }

  async checkAndExecuteJobs() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    
    try {
      const jobs = await getAllJobs();
      const now = new Date();

      for (const job of jobs) {
        // Skip paused jobs
        if (job.status === 'paused') continue;

        // Check if job should run
        if (job.nextRun && job.nextRun !== '-') {
          const nextRunDate = new Date(job.nextRun);
          
          // If current time is past or equal to next run time
          if (now >= nextRunDate) {
            // Execute job in background
            this.executeJob(job).catch(err => {
              console.error(`Error executing job ${job.name}:`, err);
            });
          }
        }
      }
    } catch (error) {
      console.error('Error in job scheduler:', error);
    } finally {
      this.isRunning = false;
    }
  }

  start() {
    if (this.intervalId !== null) return;

    console.log('Job scheduler started');
    
    // Check every 30 seconds
    this.intervalId = window.setInterval(() => {
      this.checkAndExecuteJobs();
    }, 30000);

    // Also check immediately
    this.checkAndExecuteJobs();
  }

  stop() {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('Job scheduler stopped');
    }
  }
}

export const jobScheduler = new JobScheduler();
