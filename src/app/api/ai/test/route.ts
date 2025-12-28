import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: 'No API key found' }, { status: 500 });
    }

    // List available models using REST API directly
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json({
        success: false,
        status: response.status,
        error: data,
      }, { status: 500 });
    }

    // Extract model names
    const modelNames = data.models?.map((m: any) => m.name) || [];

    return NextResponse.json({
      success: true,
      modelCount: modelNames.length,
      models: modelNames,
      fullData: data,
    });

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
    }, { status: 500 });
  }
}