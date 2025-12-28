import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@/lib/supabase/server';
import { checkInSchema } from '@/lib/validations';

// GET /api/check-ins
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient(cookieStore);
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '7');
    const date = searchParams.get('date');

    let query = supabase
      .from('check_ins')
      .select('*')
      .eq('user_id', user.id)
      .order('check_in_date', { ascending: false });

    if (date) {
      query = query.eq('check_in_date', date);
    } else {
      query = query.limit(limit);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Get check-ins error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/check-ins
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient(cookieStore);
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const result = checkInSchema.safeParse(body);
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0].message },
        { status: 400 }
      );
    }

    // Check if already checked in today
    const today = new Date().toISOString().split('T')[0];
    const { data: existing } = await supabase
      .from('check_ins')
      .select('id')
      .eq('user_id', user.id)
      .eq('check_in_date', today)
      .single();

    if (existing) {
      // Update existing check-in
      const { data, error } = await supabase
        .from('check_ins')
        .update(result.data)
        .eq('id', existing.id)
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ data, updated: true });
    }

    // Create new check-in
    const { data, error } = await supabase
      .from('check_ins')
      .insert({
        user_id: user.id,
        check_in_date: today,
        ...result.data,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    console.error('Add check-in error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}