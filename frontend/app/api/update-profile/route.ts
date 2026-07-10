import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  try {
    const { mode, profile } = await req.json();

    if (!mode || !profile) {
      return NextResponse.json({ error: 'Missing data' }, { status: 400 });
    }

    // In a real app with a DB, we would write to PostgreSQL here using `pool`.
    // Because the dashboard works in local demo mode, we'll store the updated profile in an HTTP cookie
    // so the GET routes can read it and instantly update the dashboards.
    
    const cookieStore = cookies();
    
    if (mode === 'pregnancy') {
      const existingStr = cookieStore.get('sakhi_preg_profile')?.value;
      const existing = existingStr ? JSON.parse(existingStr) : {};
      cookieStore.set('sakhi_preg_profile', JSON.stringify({ ...existing, ...profile }), { path: '/' });
    } else if (mode === 'her') {
      const existingStr = cookieStore.get('sakhi_her_profile')?.value;
      const existing = existingStr ? JSON.parse(existingStr) : {};
      cookieStore.set('sakhi_her_profile', JSON.stringify({ ...existing, ...profile }), { path: '/' });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Update Profile API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
