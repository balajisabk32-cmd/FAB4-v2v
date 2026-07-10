import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { Pool } from 'pg';
import { cookies } from 'next/headers';

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
  if (!pool) {
    // Generate rich mock data for the new dashboard features
    const today = new Date();
    
    // Get any user overrides from settings
    const cookieStore = cookies();
    const overridesStr = cookieStore.get('sakhi_her_profile')?.value;
    const overrides = overridesStr ? JSON.parse(overridesStr) : {};
      
      const mockProfile = {
        preferred_name: overrides.preferred_name || "", // Leave blank to trigger onboarding if we want, but let's set it to test dashboard first
        last_period_start: overrides.last_period_start ? new Date(overrides.last_period_start).toISOString() : new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString(),
        cycle_length_avg: overrides.cycle_length_avg ? parseInt(overrides.cycle_length_avg) : 28,
        period_duration: overrides.period_duration ? parseInt(overrides.period_duration) : 5,
        cycle_regularity: overrides.cycle_regularity || "Yes",
        diagnosed_conditions: overrides.diagnosed_conditions || ["None"]
      };

      const mockLogs = [];
      const moods = ["Happy", "Calm", "Anxious", "Irritable", "Sad", "Fatigued"];
      const flows = ["None", "Spotting", "Light", "Moderate", "Heavy", "Very Heavy"];
      
      // Generate 90 days of logs for charts
      let weight = 65.0;
      for (let i = 90; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        
        // Simulate a period cycle
        const dayOfCycle = (90 - i) % 28;
        const isPeriod = dayOfCycle < 5;
        const isOvulation = dayOfCycle >= 12 && dayOfCycle <= 16;
        
        const flowIntensity = isPeriod ? flows[Math.max(1, 5 - dayOfCycle)] : "None";
        const crampsSeverity = isPeriod ? Math.max(0, 8 - (dayOfCycle * 2)) : (isOvulation ? 2 : 0);
        
        const mood = isPeriod ? "Irritable" : isOvulation ? "Happy" : "Calm";
        const sleepHours = isPeriod ? 6 + Math.random() : 7 + Math.random() * 2;
        
        weight += (Math.random() - 0.5) * 0.2; // Slight weight fluctuation

        mockLogs.push({
          log_date: d.toISOString().split('T')[0],
          flow_intensity: flowIntensity,
          cramps_severity: Math.floor(crampsSeverity),
          symptoms: isPeriod ? ["Cramps", "Bloating"] : isOvulation ? ["Mild Cramp"] : ["None"],
          mood: mood,
          sleep_hours: parseFloat(sleepHours.toFixed(1)),
          weight: parseFloat(weight.toFixed(1)),
          day_of_cycle: dayOfCycle
        });
      }

      // Cycle history (for Cycle Length Trend)
      const mockCycleHistory = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setMonth(today.getMonth() - i);
        mockCycleHistory.push({
          month: d.toLocaleString('default', { month: 'short' }),
          cycleLength: 26 + Math.floor(Math.random() * 5),
          periodDuration: 4 + Math.floor(Math.random() * 3)
        });
      }

    return NextResponse.json({ profile: mockProfile, logs: mockLogs, cycleHistory: mockCycleHistory, mode: 'mock' });
  }

  const session = await getServerSession(authOptions);
  
  if (!session || !session.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
