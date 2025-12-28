import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@/lib/supabase/server';
import { saveTipSchema, tipCategories } from '@/lib/validations';

// Demo tips for when Gemini is not configured
const demoTips: Record<string, { content: string; emoji: string }[]> = {
  food: [
    { content: 'Eating protein with breakfast can help stabilize blood sugar levels and reduce mid-morning cravings.', emoji: '🥗' },
    { content: 'Drinking water 30 minutes before meals can aid digestion and help with portion control.', emoji: '💧' },
    { content: 'Colorful vegetables contain different nutrients - aim for a variety of colors on your plate.', emoji: '🌈' },
  ],
  medical: [
    { content: 'Taking medications at the same time each day helps build a consistent routine and improves adherence.', emoji: '💊' },
    { content: 'Blood pressure readings are most accurate when taken at the same time daily, after resting for 5 minutes.', emoji: '❤️' },
    { content: 'Keep a list of your medications in your wallet for emergencies.', emoji: '📋' },
  ],
  quick: [
    { content: 'The 20-20-20 rule: Every 20 minutes, look at something 20 feet away for 20 seconds to reduce eye strain.', emoji: '👀' },
    { content: 'Stand up and stretch for 1 minute every hour to improve circulation and reduce stiffness.', emoji: '🧘' },
    { content: 'Take 3 deep breaths whenever you feel stressed - it activates your parasympathetic nervous system.', emoji: '😮‍💨' },
  ],
  life: [
    { content: 'Try the 4-7-8 breathing technique before bed: inhale 4 seconds, hold 7, exhale 8 for better sleep.', emoji: '🌙' },
    { content: 'Morning sunlight exposure within 30 minutes of waking helps regulate your circadian rhythm.', emoji: '☀️' },
    { content: 'Gratitude journaling for 5 minutes daily can improve mental well-being and sleep quality.', emoji: '📝' },
  ],
  fitness: [
    { content: 'Just 10 minutes of walking counts as exercise and adds up throughout the day.', emoji: '🚶' },
    { content: 'Rest days are when your muscles actually grow - they are as important as workout days.', emoji: '💪' },
    { content: 'Warming up for 5 minutes before exercise can prevent injuries and improve performance.', emoji: '🔥' },
  ],
};

// GET /api/tips - Get a random tip
export async function GET(request: NextRequest) {
  try {
    const category = request.nextUrl.searchParams.get('category') as typeof tipCategories[number] | null;
    
    // For demo/prototype, return random tips
    let tips: { content: string; emoji: string }[] = [];
    
    if (category && demoTips[category]) {
      tips = demoTips[category];
    } else {
      // Get random category
      const categories = Object.keys(demoTips);
      const randomCategory = categories[Math.floor(Math.random() * categories.length)];
      tips = demoTips[randomCategory];
    }
    
    const randomTip = tips[Math.floor(Math.random() * tips.length)];
    const tipCategory = category || Object.keys(demoTips).find(cat => 
      demoTips[cat].some(t => t.content === randomTip.content)
    );

    return NextResponse.json({
      tip: {
        category: tipCategory,
        ...randomTip,
      },
    });
  } catch (error) {
    console.error('Get tip error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/tips - Save a tip
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient(cookieStore);
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const result = saveTipSchema.safeParse(body);
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0].message },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('saved_tips')
      .insert({
        user_id: user.id,
        ...result.data,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    console.error('Save tip error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/tips?id=xxx - Delete a saved tip
export async function DELETE(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient(cookieStore);
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const id = request.nextUrl.searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Tip ID is required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('saved_tips')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'Tip deleted' });
  } catch (error) {
    console.error('Delete tip error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
