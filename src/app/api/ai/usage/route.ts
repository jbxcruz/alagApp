import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
    }

    // Fetch usage from OpenRouter
    const response = await fetch('https://openrouter.ai/api/v1/auth/key', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      console.error('OpenRouter usage fetch failed:', response.status);
      return NextResponse.json({ error: 'Failed to fetch usage' }, { status: 500 });
    }

    const data = await response.json();
    
    // OpenRouter returns usage info
    // data.data contains: { label, usage, limit, is_free_tier, rate_limit }
    
    return NextResponse.json({
      usage: data.data?.usage || 0,
      limit: data.data?.limit || null,
      isFreeTier: data.data?.is_free_tier || true,
      rateLimit: data.data?.rate_limit || null,
      label: data.data?.label || 'API Key',
    });

  } catch (error: any) {
    console.error('Usage API error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to get usage' },
      { status: 500 }
    );
  }
}