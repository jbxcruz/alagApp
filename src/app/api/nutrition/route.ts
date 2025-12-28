import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(request: NextRequest) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'API key not configured' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { foodName } = body;

    if (!foodName || typeof foodName !== 'string' || foodName.trim().length < 2) {
      return NextResponse.json(
        { error: 'Valid food name is required' },
        { status: 400 }
      );
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-lite' });

    const prompt = `You are a certified nutritionist database assistant. Provide accurate nutritional information for: "${foodName.trim()}"

IMPORTANT: Use data based on USDA FoodData Central standards. Provide values for a STANDARD SINGLE SERVING.

Return ONLY a valid JSON object with these exact fields (no markdown, no code blocks, no extra text):
{"description":"brief description including serving size","calories":number,"protein_g":number,"carbs_g":number,"fat_g":number,"fiber_g":number,"sugar_g":number,"sodium_mg":number,"serving_size":"serving size description","confidence":"high or medium or low"}

Guidelines:
- calories: total kilocalories
- protein_g, carbs_g, fat_g, fiber_g, sugar_g: in grams (1 decimal)
- sodium_mg: in milligrams
- confidence: "high" for common foods, "medium" for dishes, "low" for unusual items
- Use realistic portions (e.g., 1 medium apple, 1 chicken breast, 1 cup rice)

Example for "banana":
{"description":"1 medium banana, raw (118g)","calories":105,"protein_g":1.3,"carbs_g":27.0,"fat_g":0.4,"fiber_g":3.1,"sugar_g":14.4,"sodium_mg":1,"serving_size":"1 medium (118g)","confidence":"high"}

Now provide accurate JSON for: "${foodName.trim()}"`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    // Clean up the response
    let cleanedText = text.trim();
    
    if (cleanedText.startsWith('```json')) {
      cleanedText = cleanedText.slice(7);
    } else if (cleanedText.startsWith('```')) {
      cleanedText = cleanedText.slice(3);
    }
    if (cleanedText.endsWith('```')) {
      cleanedText = cleanedText.slice(0, -3);
    }
    cleanedText = cleanedText.trim();

    const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      cleanedText = jsonMatch[0];
    }

    try {
      const nutritionData = JSON.parse(cleanedText);
      
      const validated = {
        description: nutritionData.description || `${foodName} - standard serving`,
        calories: Math.round(Number(nutritionData.calories)) || 0,
        protein_g: Math.round(Number(nutritionData.protein_g) * 10) / 10 || 0,
        carbs_g: Math.round(Number(nutritionData.carbs_g) * 10) / 10 || 0,
        fat_g: Math.round(Number(nutritionData.fat_g) * 10) / 10 || 0,
        fiber_g: Math.round(Number(nutritionData.fiber_g) * 10) / 10 || 0,
        sugar_g: Math.round(Number(nutritionData.sugar_g) * 10) / 10 || 0,
        sodium_mg: Math.round(Number(nutritionData.sodium_mg)) || 0,
        serving_size: nutritionData.serving_size || 'standard serving',
        confidence: nutritionData.confidence || 'medium',
      };

      return NextResponse.json(validated);

    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      return NextResponse.json({
        error: 'Could not parse nutrition data'
      }, { status: 500 });
    }

  } catch (error: any) {
    console.error('AI Nutrition error:', error?.message || error);
    
    // Extract retry time from error message if rate limited
    const errorMessage = error?.message || 'Failed to get nutrition data';
    let retryAfter = 60; // Default 60 seconds
    
    // Try to extract retry time from error message
    const retryMatch = errorMessage.match(/retry in (\d+(?:\.\d+)?)/i);
    if (retryMatch) {
      retryAfter = Math.ceil(parseFloat(retryMatch[1]));
    }
    
    // Check if it's a rate limit error
    const isRateLimit = errorMessage.includes('429') || 
                        errorMessage.includes('quota') || 
                        errorMessage.includes('Too Many Requests') ||
                        errorMessage.includes('rate');
    
    return NextResponse.json(
      { 
        error: errorMessage,
        isRateLimit,
        retryAfter: isRateLimit ? retryAfter : null
      },
      { status: isRateLimit ? 429 : 500 }
    );
  }
}