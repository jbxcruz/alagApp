import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@/lib/supabase/server';

export async function POST() {
  try {
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient(cookieStore);

    // Sign out from Supabase
    await supabase.auth.signOut();

    // Create response
    const response = NextResponse.json({ message: 'Logged out successfully' });

    // Clear all Supabase auth cookies
    const allCookies = cookieStore.getAll();
    for (const cookie of allCookies) {
      if (cookie.name.includes('supabase') || cookie.name.includes('sb-')) {
        response.cookies.set(cookie.name, '', {
          expires: new Date(0),
          path: '/',
        });
      }
    }

    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}