import initSqlJs, { Database } from 'sql.js';

let db: Database | null = null;

export async function initDatabase() {
  if (db) return db;

  const SQL = await initSqlJs({
    locateFile: file => `https://sql.js.org/dist/${file}`
  });

  // Try to load existing database from localStorage
  const savedDb = localStorage.getItem('cronhub_db');
  if (savedDb) {
    const uint8Array = new Uint8Array(JSON.parse(savedDb));
    db = new SQL.Database(uint8Array);
  } else {
    db = new SQL.Database();
    
    // Create tables
    db.run(`
      CREATE TABLE IF NOT EXISTS jobs (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        url TEXT NOT NULL,
        method TEXT NOT NULL,
        schedule TEXT NOT NULL,
        status TEXT NOT NULL,
        lastRun TEXT,
        nextRun TEXT,
        successRate REAL,
        executionCount INTEGER DEFAULT 0,
        headers TEXT,
        body TEXT,
        timeout INTEGER,
        enabled INTEGER DEFAULT 1,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS executions (
        id TEXT PRIMARY KEY,
        jobId TEXT NOT NULL,
        startTime TEXT NOT NULL,
        endTime TEXT,
        status TEXT NOT NULL,
        duration INTEGER,
        logs TEXT,
        responseStatus INTEGER,
        responseBody TEXT,
        FOREIGN KEY (jobId) REFERENCES jobs(id) ON DELETE CASCADE
      );
    `);

    saveDatabase();
  }

  return db;
}

export function saveDatabase() {
  if (!db) return;
  const data = db.export();
  const buffer = Array.from(data);
  localStorage.setItem('cronhub_db', JSON.stringify(buffer));
}

export function getDatabase() {
  return db;
}

export async function getAllJobs() {
  const database = await initDatabase();
  const result = database.exec('SELECT * FROM jobs ORDER BY createdAt DESC');
  if (result.length === 0) return [];
  
  return result[0].values.map(row => ({
    id: row[0] as string,
    name: row[1] as string,
    url: row[2] as string,
    method: row[3] as string,
    schedule: row[4] as string,
    status: row[5] as string,
    lastRun: row[6] as string,
    nextRun: row[7] as string,
    successRate: row[8] as number,
    executionCount: row[9] as number,
    headers: row[10] as string,
    body: row[11] as string,
    timeout: row[12] as number,
    enabled: row[13] as number,
  }));
}

export async function getJobById(id: string) {
  const database = await initDatabase();
  const result = database.exec('SELECT * FROM jobs WHERE id = ?', [id]);
  if (result.length === 0 || result[0].values.length === 0) return null;
  
  const row = result[0].values[0];
  return {
    id: row[0] as string,
    name: row[1] as string,
    url: row[2] as string,
    method: row[3] as string,
    schedule: row[4] as string,
    status: row[5] as string,
    lastRun: row[6] as string,
    nextRun: row[7] as string,
    successRate: row[8] as number,
    executionCount: row[9] as number,
    headers: row[10] as string,
    body: row[11] as string,
    timeout: row[12] as number,
    enabled: row[13] as number,
  };
}

export async function createJob(job: any) {
  const database = await initDatabase();
  database.run(
    `INSERT INTO jobs (id, name, url, method, schedule, status, lastRun, nextRun, successRate, executionCount, headers, body, timeout, enabled)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      job.id,
      job.name,
      job.url,
      job.method,
      job.schedule,
      job.status || 'paused',
      job.lastRun || null,
      job.nextRun || '-',
      job.successRate || 0,
      job.executionCount || 0,
      job.headers || null,
      job.body || null,
      job.timeout || 30,
      job.enabled ? 1 : 0,
    ]
  );
  saveDatabase();
}

export async function updateJob(id: string, updates: any) {
  const database = await initDatabase();
  const fields = Object.keys(updates)
    .map(key => `${key} = ?`)
    .join(', ');
  const values = [...Object.values(updates), id];
  
  database.run(`UPDATE jobs SET ${fields} WHERE id = ?`, values);
  saveDatabase();
}

export async function deleteJob(id: string) {
  const database = await initDatabase();
  database.run('DELETE FROM jobs WHERE id = ?', [id]);
  database.run('DELETE FROM executions WHERE jobId = ?', [id]);
  saveDatabase();
}

export async function createExecution(execution: any) {
  const database = await initDatabase();
  database.run(
    `INSERT INTO executions (id, jobId, startTime, endTime, status, duration, logs, responseStatus, responseBody)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      execution.id,
      execution.jobId,
      execution.startTime,
      execution.endTime || null,
      execution.status,
      execution.duration || 0,
      execution.logs || '',
      execution.responseStatus || null,
      execution.responseBody || null,
    ]
  );
  
  // Update job execution count and success rate
  const execResult = database.exec(
    'SELECT COUNT(*) as total, SUM(CASE WHEN status = "success" THEN 1 ELSE 0 END) as successful FROM executions WHERE jobId = ?',
    [execution.jobId]
  );
  
  if (execResult.length > 0 && execResult[0].values.length > 0) {
    const [total, successful] = execResult[0].values[0];
    const successRate = total > 0 ? ((successful as number) / (total as number)) * 100 : 0;
    
    database.run(
      'UPDATE jobs SET executionCount = ?, successRate = ?, lastRun = ? WHERE id = ?',
      [total, successRate, execution.startTime, execution.jobId]
    );
  }
  
  saveDatabase();
}

export async function getExecutionsByJobId(jobId: string) {
  const database = await initDatabase();
  const result = database.exec(
    'SELECT * FROM executions WHERE jobId = ? ORDER BY startTime DESC LIMIT 100',
    [jobId]
  );
  
  if (result.length === 0) return [];
  
  return result[0].values.map(row => ({
    id: row[0] as string,
    jobId: row[1] as string,
    startTime: row[2] as string,
    endTime: row[3] as string,
    status: row[4] as string,
    duration: row[5] as number,
    logs: row[6] as string,
    responseStatus: row[7] as number,
    responseBody: row[8] as string,
  }));
}
