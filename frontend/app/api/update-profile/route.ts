import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const { mode, profile } = await req.json();

    if (!mode || !profile) {
      return NextResponse.json({ error: 'Missing data' }, { status: 400 });
    }

    // In a real app with a DB, we would write to PostgreSQL here using `pool`.
    // Because the dashboard works in local demo mode, we'll store the updated profile in an HTTP cookie
    // so the GET routes can read it and instantly update the dashboards.
    
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const email = session.user.email.replace(/[^a-zA-Z0-9]/g, '_');

    const cookieStore = await cookies();
    
    if (mode === 'pregnancy') {
      const cookieName = `sakhi_preg_profile_${email}`;
      const existingStr = cookieStore.get(cookieName)?.value;
      const existing = existingStr ? JSON.parse(existingStr) : {};
      cookieStore.set(cookieName, JSON.stringify({ ...existing, ...profile }), { path: '/' });
    } else if (mode === 'her') {
      const cookieName = `sakhi_her_profile_${email}`;
      const existingStr = cookieStore.get(cookieName)?.value;
      const existing = existingStr ? JSON.parse(existingStr) : {};
      cookieStore.set(cookieName, JSON.stringify({ ...existing, ...profile }), { path: '/' });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Update Profile API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
