import { supabase } from '@/integrations/supabase/client';

// ==========================================
// Job Operations
// ==========================================

export async function getAllJobs() {
  const { data, error } = await supabase
    .from('jobs')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching jobs:', error);
    return [];
  }
  
  return data?.map(job => ({
    id: job.id,
    name: job.name,
    url: job.url,
    method: job.method,
    schedule: job.schedule,
    status: job.status,
    lastRun: job.last_run,
    nextRun: job.next_run,
    successRate: job.success_count + job.failure_count > 0 
      ? Number(((job.success_count / (job.success_count + job.failure_count)) * 100).toFixed(1))
      : 0,
    executionCount: job.success_count + job.failure_count,
    headers: job.headers,
    body: job.body,
    timeout: job.timeout,
    enabled: job.status === 'active' ? 1 : 0,
    success_count: job.success_count,
    failure_count: job.failure_count
  })) || [];
}

export async function getJobById(id: string) {
  const { data, error } = await supabase
    .from('jobs')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  
  if (error) {
    console.error('Error fetching job:', error);
    return null;
  }
  
  if (!data) return null;
  
  return {
    id: data.id,
    name: data.name,
    url: data.url,
    method: data.method,
    schedule: data.schedule,
    status: data.status,
    lastRun: data.last_run,
    nextRun: data.next_run,
    successRate: data.success_count + data.failure_count > 0 
      ? Number(((data.success_count / (data.success_count + data.failure_count)) * 100).toFixed(1))
      : 0,
    executionCount: data.success_count + data.failure_count,
    headers: data.headers,
    body: data.body,
    timeout: data.timeout,
    enabled: data.status === 'active' ? 1 : 0,
    success_count: data.success_count,
    failure_count: data.failure_count
  };
}

export async function createJob(job: any) {
  const { data, error } = await supabase
    .from('jobs')
    .insert({
      name: job.name,
      schedule: job.schedule,
      url: job.url,
      method: job.method || 'GET',
      headers: job.headers || null,
      body: job.body || null,
      timeout: job.timeout || 30,
      status: job.status || 'paused',
      next_run: job.nextRun || null
    })
    .select('id')
    .single();
  
  if (error) {
    console.error('Error creating job:', error);
    throw error;
  }
  
  return data.id;
}

export async function updateJob(id: string, updates: any) {
  const updateData: any = {};
  
  if (updates.name !== undefined) updateData.name = updates.name;
  if (updates.schedule !== undefined) updateData.schedule = updates.schedule;
  if (updates.url !== undefined) updateData.url = updates.url;
  if (updates.method !== undefined) updateData.method = updates.method;
  if (updates.headers !== undefined) updateData.headers = updates.headers;
  if (updates.body !== undefined) updateData.body = updates.body;
  if (updates.timeout !== undefined) updateData.timeout = updates.timeout;
  if (updates.status !== undefined) updateData.status = updates.status;
  if (updates.lastRun !== undefined) updateData.last_run = updates.lastRun;
  if (updates.nextRun !== undefined) updateData.next_run = updates.nextRun;
  if (updates.successCount !== undefined) updateData.success_count = updates.successCount;
  if (updates.failureCount !== undefined) updateData.failure_count = updates.failureCount;
  
  const { error } = await supabase
    .from('jobs')
    .update(updateData)
    .eq('id', id);
  
  if (error) {
    console.error('Error updating job:', error);
    throw error;
  }
}

export async function deleteJob(id: string) {
  const { error } = await supabase
    .from('jobs')
    .delete()
    .eq('id', id);
  
  if (error) {
    console.error('Error deleting job:', error);
    throw error;
  }
}

// ==========================================
// Execution Operations
// ==========================================

export async function createExecution(execution: any) {
  const { data, error } = await supabase
    .from('executions')
    .insert({
      job_id: execution.jobId,
      status: execution.status,
      response_code: execution.responseStatus || null,
      response_time: execution.duration || null,
      error_message: execution.logs || null
    })
    .select('id')
    .single();
  
  if (error) {
    console.error('Error creating execution:', error);
    throw error;
  }
  
  // Update job statistics
  const job = await getJobById(execution.jobId);
  if (job) {
    const updates: any = {};
    
    if (execution.status === 'success') {
      updates.successCount = (job.success_count || 0) + 1;
    } else if (execution.status === 'failed') {
      updates.failureCount = (job.failure_count || 0) + 1;
    }
    
    if (execution.startTime) {
      updates.lastRun = execution.startTime;
    }
    
    if (Object.keys(updates).length > 0) {
      await updateJob(execution.jobId, updates);
    }
  }
  
  return data.id;
}

export async function getExecutionsByJobId(jobId: string) {
  const { data, error } = await supabase
    .from('executions')
    .select('*')
    .eq('job_id', jobId)
    .order('executed_at', { ascending: false })
    .limit(100);
  
  if (error) {
    console.error('Error fetching executions:', error);
    return [];
  }
  
  return data?.map(exec => ({
    id: exec.id,
    jobId: exec.job_id,
    startTime: exec.executed_at,
    endTime: exec.executed_at,
    status: exec.status,
    duration: exec.response_time,
    logs: exec.error_message,
    responseStatus: exec.response_code,
    responseBody: null
  })) || [];
}

export async function getAllExecutions() {
  const { data, error } = await supabase
    .from('executions')
    .select('*')
    .order('executed_at', { ascending: false })
    .limit(1000);
  
  if (error) {
    console.error('Error fetching executions:', error);
    return [];
  }
  
  return data?.map(exec => ({
    id: exec.id,
    jobId: exec.job_id,
    startTime: exec.executed_at,
    endTime: exec.executed_at,
    status: exec.status,
    duration: exec.response_time,
    logs: exec.error_message,
    responseStatus: exec.response_code,
    responseBody: null
  })) || [];
}

// ==========================================
// Dashboard & Analytics Operations
// ==========================================

export async function getDashboardStats() {
  const jobs = await getAllJobs();
  const totalJobs = jobs.length;
  const activeJobs = jobs.filter(j => j.status === 'active').length;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const { data: todayExecutions } = await supabase
    .from('executions')
    .select('status')
    .gte('executed_at', today.toISOString());
  
  const successfulToday = todayExecutions?.filter(e => e.status === 'success').length || 0;
  const failedToday = todayExecutions?.filter(e => e.status === 'failed').length || 0;
  
  return {
    totalJobs,
    activeJobs,
    successfulToday,
    failedToday,
    successRate: successfulToday + failedToday > 0 
      ? ((successfulToday / (successfulToday + failedToday)) * 100).toFixed(1)
      : '0'
  };
}

export async function getExecutionTrends(days: number = 7) {
  const trends: Array<{ date: string; successful: number; failed: number }> = [];
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);
    
    const nextDate = new Date(date);
    nextDate.setDate(nextDate.getDate() + 1);
    
    const { data: executions } = await supabase
      .from('executions')
      .select('status')
      .gte('executed_at', date.toISOString())
      .lt('executed_at', nextDate.toISOString());
    
    const successful = executions?.filter(e => e.status === 'success').length || 0;
    const failed = executions?.filter(e => e.status === 'failed').length || 0;
    
    trends.push({
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      successful,
      failed
    });
  }
  
  return trends;
}

export async function getExecutionDistribution() {
  const { data: executions } = await supabase
    .from('executions')
    .select('status');
  
  const distribution = [
    { 
      name: 'Success', 
      value: executions?.filter(e => e.status === 'success').length || 0,
      color: 'hsl(var(--success))'
    },
    { 
      name: 'Failed', 
      value: executions?.filter(e => e.status === 'failed').length || 0,
      color: 'hsl(var(--destructive))'
    },
    { 
      name: 'Running', 
      value: executions?.filter(e => e.status === 'running').length || 0,
      color: 'hsl(var(--primary))'
    }
  ];
  
  return distribution;
}

// ==========================================
// Error Log Operations
// ==========================================

export async function createErrorLog(errorLog: any) {
  const { data, error } = await supabase
    .from('error_logs')
    .insert({
      job_id: errorLog.jobId,
      job_name: errorLog.jobName,
      error_message: errorLog.errorMessage,
      error_details: errorLog.stackTrace || null
    })
    .select('id')
    .single();
  
  if (error) {
    console.error('Error creating error log:', error);
    throw error;
  }
  
  return data.id;
}

export async function getAllErrorLogs() {
  const { data, error } = await supabase
    .from('error_logs')
    .select('*')
    .order('timestamp', { ascending: false })
    .limit(1000);
  
  if (error) {
    console.error('Error fetching error logs:', error);
    return [];
  }
  
  return data?.map(log => ({
    id: log.id,
    jobId: log.job_id,
    jobName: log.job_name,
    timestamp: log.timestamp,
    errorType: 'Error',
    errorMessage: log.error_message,
    stackTrace: log.error_details,
    responseStatus: null
  })) || [];
}

export async function getErrorLogsByJobId(jobId: string) {
  const { data, error } = await supabase
    .from('error_logs')
    .select('*')
    .eq('job_id', jobId)
    .order('timestamp', { ascending: false });
  
  if (error) {
    console.error('Error fetching error logs:', error);
    return [];
  }
  
  return data?.map(log => ({
    id: log.id,
    jobId: log.job_id,
    jobName: log.job_name,
    timestamp: log.timestamp,
    errorType: 'Error',
    errorMessage: log.error_message,
    stackTrace: log.error_details,
    responseStatus: null
  })) || [];
}

export async function deleteErrorLog(id: string) {
  const { error } = await supabase
    .from('error_logs')
    .delete()
    .eq('id', id);
  
  if (error) {
    console.error('Error deleting error log:', error);
    throw error;
  }
}
