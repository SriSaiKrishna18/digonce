// POST /api/demo/login — One-click demo department login
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient();

    const email = process.env.DEMO_DEPARTMENT_EMAIL;
    const password = process.env.DEMO_DEPARTMENT_PASSWORD;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Demo credentials not configured' },
        { status: 500 },
      );
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return NextResponse.json(
        { error: 'Demo login failed', details: error.message },
        { status: 401 },
      );
    }

    return NextResponse.json({
      session: data.session,
      user: {
        id: data.user.id,
        email: data.user.email,
      },
    });
  } catch (err) {
    console.error('Demo login error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
