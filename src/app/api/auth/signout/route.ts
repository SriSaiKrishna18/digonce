import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  const supabase = createServerClient();
  await supabase.auth.signOut();
  return NextResponse.redirect(new URL('/dept', request.url));
}
