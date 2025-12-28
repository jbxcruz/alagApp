import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@/lib/supabase/server';

// Create admin client lazily to avoid build-time errors
function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing Supabase environment variables');
  }
  
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

interface DeletionStep {
  table: string;
  label: string;
}

const deletionSteps: DeletionStep[] = [
  { table: 'ai_messages', label: 'AI messages' },
  { table: 'ai_conversations', label: 'AI conversations' },
  { table: 'medication_doses', label: 'Medication doses' },
  { table: 'medications', label: 'Medications' },
  { table: 'nutrition_logs', label: 'Nutrition logs' },
  { table: 'water_logs', label: 'Water logs' },
  { table: 'exercise_logs', label: 'Exercise logs' },
  { table: 'symptom_logs', label: 'Symptom logs' },
  { table: 'vitals', label: 'Vitals' },
  { table: 'check_ins', label: 'Check-ins' },
  { table: 'health_goals', label: 'Health goals' },
  { table: 'saved_tips', label: 'Saved tips' },
  { table: 'profiles', label: 'Profile' },
];

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();

    if (!password) {
      return NextResponse.json(
        { error: 'Password is required' },
        { status: 400 }
      );
    }

    // Get current user from session
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient(cookieStore);
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify password by attempting to sign in
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email!,
      password: password,
    });

    if (signInError) {
      return NextResponse.json(
        { error: 'Invalid password' },
        { status: 401 }
      );
    }

    const userId = user.id;
    const deletionResults: { step: string; success: boolean; count?: number }[] = [];
    
    // Get admin client
    const supabaseAdmin = getSupabaseAdmin();

    // Delete data from each table in order
    for (const step of deletionSteps) {
      try {
        const { data, error } = await supabaseAdmin
          .from(step.table)
          .delete()
          .eq('user_id', userId)
          .select('id');

        if (error) {
          console.error(`Error deleting from ${step.table}:`, error);
          // Continue with other deletions even if one fails
          deletionResults.push({ step: step.label, success: false });
        } else {
          deletionResults.push({ 
            step: step.label, 
            success: true, 
            count: data?.length || 0 
          });
        }
      } catch (err) {
        console.error(`Exception deleting from ${step.table}:`, err);
        deletionResults.push({ step: step.label, success: false });
      }
    }

    // Delete the auth user using admin client
    const { error: deleteUserError } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (deleteUserError) {
      console.error('Error deleting auth user:', deleteUserError);
      return NextResponse.json(
        { 
          error: 'Failed to delete account. Please contact support.',
          deletionResults 
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Account deleted successfully',
      deletionResults,
    });

  } catch (error) {
    console.error('Account deletion error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

// GET endpoint to return deletion steps for progress display
export async function GET() {
  return NextResponse.json({
    steps: deletionSteps.map(s => s.label),
  });
}