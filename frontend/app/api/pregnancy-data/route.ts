import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function GET() {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const email = session.user.email.replace(/[^a-zA-Z0-9]/g, '_');

  const today = new Date();
  
  // Get user profile overrides from cookies
  const cookieStore = await cookies();
  const overridesStr = cookieStore.get(`sakhi_preg_profile_${email}`)?.value;
  const overrides = overridesStr ? JSON.parse(overridesStr) : {};
  
  // Calculate a mock pregnancy that is currently in Week 18 (unless overridden)
  const weeksPregnant = overrides.weeks_pregnant ? parseInt(overrides.weeks_pregnant) : 18;
  const daysPregnant = weeksPregnant * 7;
  const conceptionDate = new Date(today.getTime() - (daysPregnant * 24 * 60 * 60 * 1000));
  const expectedDueDate = overrides.expected_due_date ? new Date(overrides.expected_due_date) : new Date(conceptionDate.getTime() + (280 * 24 * 60 * 60 * 1000));
  
  const mockProfile = {
    preferred_name: overrides.preferred_name || "Mama",
    weeks_pregnant: weeksPregnant,
    conception_date: conceptionDate.toISOString(),
    expected_due_date: expectedDueDate.toISOString(),
    risk_level: "Moderate",
    baby_size_fruit: "Mango"
  };

  const mockLogs = [];
  const moods = ["Happy", "Calm", "Anxious", "Fatigued"];
  
  // Generate 90 days of logs for charts
  let weight = 60.0;
  let systolic = 110;
  let diastolic = 70;
  let bloodSugar = 90;
  
  for (let i = 90; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    
    // Simulate slight gradual increases
    weight += Math.random() * 0.1; 
    
    // Slight BP fluctuation
    systolic = 110 + Math.floor(Math.random() * 15);
    diastolic = 70 + Math.floor(Math.random() * 10);
    
    // Fasting Blood Sugar
    bloodSugar = 85 + Math.floor(Math.random() * 20);
    
    const mood = moods[Math.floor(Math.random() * moods.length)];
    const sleepHours = 6 + Math.random() * 3;
    
    // Baby Movement (Morning, Afternoon, Night) - Starts picking up around week 16
    const currentDayOfPregnancy = daysPregnant - i;
    const isMoving = currentDayOfPregnancy > 112; // 16 weeks * 7
    
    const movement = {
      morning: isMoving ? Math.floor(Math.random() * 5) : 0,
      afternoon: isMoving ? Math.floor(Math.random() * 8) : 0,
      night: isMoving ? Math.floor(Math.random() * 6) : 0,
    };

    mockLogs.push({
      log_date: d.toISOString().split('T')[0],
      weight: parseFloat(weight.toFixed(1)),
      blood_pressure_systolic: systolic,
      blood_pressure_diastolic: diastolic,
      blood_sugar: bloodSugar,
      mood: mood,
      sleep_hours: parseFloat(sleepHours.toFixed(1)),
      baby_movement: movement
    });
  }
  
  const nutritionScore = {
    protein: 30,
    iron: 25,
    calcium: 20,
    water: 25
  };

  const appointments = [
    { name: "ANC Visit 1", completed: true },
    { name: "Anomaly Scan", completed: true },
    { name: "Blood Test", completed: false },
    { name: "ANC Visit 2", completed: false },
  ];

  return NextResponse.json({ 
    profile: mockProfile, 
    logs: mockLogs, 
    nutrition: nutritionScore,
    appointments: appointments,
    mode: 'mock' 
  });
}
