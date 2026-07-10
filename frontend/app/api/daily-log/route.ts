import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { Pool } from 'pg';

let pool: Pool | null = null;
if (process.env.DATABASE_URL) {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL.includes('supabase.co') || process.env.DATABASE_URL.includes('neon.tech') 
      ? { rejectUnauthorized: false } 
      : undefined
  });
}

// POST: Save daily log data
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      logDate,
      onPeriod,
      flowIntensity,
      crampsSeverity,
      symptoms,
      mood,
      sleepHours,
      waterConsumed,
      exercised,
      warningSigns,
      notes
    } = body;

    if (!pool) {
      return NextResponse.json({ success: true, message: 'Saved daily log to mock store' });
    }

    const client = await pool.connect();
    
    // Get user id
    const userRes = await client.query('SELECT id FROM users WHERE email = $1', [session.user.email]);
    if (userRes.rows.length === 0) {
      client.release();
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    const userId = userRes.rows[0].id;

    // Check if log exists for today
    const existingLog = await client.query('SELECT id FROM daily_health_logs WHERE user_id = $1 AND log_date = $2', [userId, logDate]);

    if (existingLog.rows.length > 0) {
      await client.query(
        `UPDATE daily_health_logs 
         SET on_period = $1, flow_intensity = $2, cramps_severity = $3, symptoms = $4, 
             mood = $5, sleep_hours = $6, water_consumed = $7, exercised = $8, 
             warning_signs = $9, notes = $10 
         WHERE user_id = $11 AND log_date = $12`,
        [onPeriod, flowIntensity, crampsSeverity, symptoms, mood, sleepHours, waterConsumed, exercised, warningSigns, notes, userId, logDate]
      );
    } else {
      await client.query(
        `INSERT INTO daily_health_logs 
         (user_id, log_date, on_period, flow_intensity, cramps_severity, symptoms, mood, sleep_hours, water_consumed, exercised, warning_signs, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        [userId, logDate, onPeriod, flowIntensity, crampsSeverity, symptoms, mood, sleepHours, waterConsumed, exercised, warningSigns, notes]
      );
    }
    
    client.release();
    return NextResponse.json({ success: true });
    
  } catch (error: any) {
    console.error('Error saving daily log:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
