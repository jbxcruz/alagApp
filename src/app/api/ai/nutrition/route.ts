import { NextRequest, NextResponse } from 'next/server';
import { getNutritionEstimate } from '@/lib/openrouter';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { foodName } = body;

    if (!foodName || typeof foodName !== 'string' || foodName.trim().length < 2) {
      return NextResponse.json(
        { error: 'Valid food name is required' },
        { status: 400 }
      );
    }

    const result = await getNutritionEstimate(foodName.trim());

    if (result.error) {
      if (result.isRateLimit) {
        return NextResponse.json({
          error: result.error,
          isRateLimit: true,
          retryAfter: result.retryAfter || 60,
        }, { status: 429 });
      }
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json(result.data);

  } catch (error: any) {
    console.error('AI Nutrition error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to get nutrition data' },
      { status: 500 }
    );
  }
}