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

// GET: Fetch dashboard data for charts
export async function GET() {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!pool) {
    // Generate realistic mock data for Hackathon presentation without a DB
    const today = new Date();
    const lastPeriod = new Date(today);
    lastPeriod.setDate(today.getDate() - 14); // 14 days ago (Ovulation phase)

    const mockProfile = {
      preferred_name: "Sakhi Explorer",
      last_period_start: lastPeriod.toISOString(),
      cycle_length_avg: 28,
      period_duration: 5,
      cycle_regularity: "Yes",
      diagnosed_conditions: ["None"]
    };

    const mockLogs = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      mockLogs.push({
        log_date: d.toISOString(),
        flow_intensity: i > 4 ? "Heavy" : i > 2 ? "Moderate" : "None",
        cramps_severity: i > 4 ? 6 : i > 2 ? 3 : 0,
        symptoms: i > 4 ? ["Cramps", "Fatigue", "Bloating"] : ["Fatigue"]
      });
    }

    return NextResponse.json({ profile: mockProfile, logs: mockLogs, mode: 'mock' });
  }

  try {
    const client = await pool.connect();
    
    // Get user id
    const userRes = await client.query('SELECT id FROM users WHERE email = $1', [session.user.email]);
    if (userRes.rows.length === 0) {
      client.release();
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    const userId = userRes.rows[0].id;

    // Fetch Profile
    const profileRes = await client.query('SELECT * FROM user_health_profiles WHERE user_id = $1', [userId]);
    const profile = profileRes.rows.length > 0 ? profileRes.rows[0] : null;

    // Fetch last 30 daily logs
    const logsRes = await client.query(
      'SELECT * FROM daily_health_logs WHERE user_id = $1 ORDER BY log_date ASC LIMIT 30',
      [userId]
    );
    const logs = logsRes.rows;

    client.release();
    
    return NextResponse.json({ profile, logs });
    
  } catch (error: any) {
    console.error('Error fetching dashboard data:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
