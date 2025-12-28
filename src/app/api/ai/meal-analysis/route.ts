import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { mealName, description } = await request.json();

    if (!mealName) {
      return NextResponse.json({ error: 'Meal name is required' }, { status: 400 });
    }

    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      // Return estimated values based on common foods if no API key
      return NextResponse.json({
        success: true,
        data: getFallbackNutrition(mealName),
        source: 'fallback'
      });
    }

    const prompt = `You are a professional nutritionist AI. Analyze the following meal and provide accurate nutritional information.

Meal: ${mealName}${description ? `\nDescription: ${description}` : ''}

Provide a JSON response with the following structure (numbers only, no units in values):
{
  "calories": <number between 50-1500>,
  "protein_g": <number>,
  "carbs_g": <number>,
  "fat_g": <number>,
  "fiber_g": <number>,
  "description": "<brief 1-2 sentence description of the meal and its nutritional benefits>",
  "confidence": "<high/medium/low based on how specific the meal name is>"
}

Important guidelines:
- Base estimates on standard serving sizes (1 cup for liquids, palm-sized for proteins, fist-sized for carbs)
- Use USDA food database standards for accuracy
- For combination meals, sum the components
- If the meal is vague, provide a reasonable middle estimate
- Ensure macros roughly add up (protein*4 + carbs*4 + fat*9 ≈ calories, with some variance allowed)

Respond ONLY with the JSON object, no additional text.`;

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'https://alagapp.vercel.app',
        'X-Title': 'AlagApp Nutrition Analyzer',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.0-flash-001',
        messages: [
          { role: 'user', content: prompt },
        ],
        max_tokens: 500,
        temperature: 0.3, // Lower temperature for more consistent/accurate results
      }),
    });

    if (!response.ok) {
      console.error('OpenRouter API error:', response.status);
      return NextResponse.json({
        success: true,
        data: getFallbackNutrition(mealName),
        source: 'fallback'
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';

    try {
      // Parse the JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const nutritionData = JSON.parse(jsonMatch[0]);
        
        // Validate the data
        const validatedData = {
          calories: Math.max(0, Math.min(3000, parseInt(nutritionData.calories) || 0)),
          protein_g: Math.max(0, Math.min(200, parseFloat(nutritionData.protein_g) || 0)),
          carbs_g: Math.max(0, Math.min(500, parseFloat(nutritionData.carbs_g) || 0)),
          fat_g: Math.max(0, Math.min(200, parseFloat(nutritionData.fat_g) || 0)),
          fiber_g: Math.max(0, Math.min(100, parseFloat(nutritionData.fiber_g) || 0)),
          description: nutritionData.description || '',
          confidence: nutritionData.confidence || 'medium',
        };

        return NextResponse.json({
          success: true,
          data: validatedData,
          source: 'ai'
        });
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
    }

    // Fallback if parsing fails
    return NextResponse.json({
      success: true,
      data: getFallbackNutrition(mealName),
      source: 'fallback'
    });

  } catch (error) {
    console.error('Meal analysis error:', error);
    return NextResponse.json({ error: 'Failed to analyze meal' }, { status: 500 });
  }
}

function getFallbackNutrition(mealName: string): any {
  const name = mealName.toLowerCase();
  
  // Common meal patterns with realistic nutrition data based on USDA
  const patterns: { match: string[], nutrition: any }[] = [
    // Breakfast items
    { match: ['oatmeal', 'oat'], nutrition: { calories: 300, protein_g: 10, carbs_g: 54, fat_g: 6, fiber_g: 8, description: 'Whole grain oatmeal is high in fiber and provides sustained energy.' } },
    { match: ['egg', 'eggs'], nutrition: { calories: 220, protein_g: 18, carbs_g: 2, fat_g: 15, fiber_g: 0, description: 'Eggs are an excellent source of complete protein and essential nutrients.' } },
    { match: ['pancake'], nutrition: { calories: 350, protein_g: 8, carbs_g: 45, fat_g: 14, fiber_g: 2, description: 'Pancakes provide quick energy from carbohydrates.' } },
    { match: ['toast', 'bread'], nutrition: { calories: 160, protein_g: 5, carbs_g: 30, fat_g: 2, fiber_g: 2, description: 'Bread provides carbohydrates for energy.' } },
    { match: ['cereal'], nutrition: { calories: 280, protein_g: 6, carbs_g: 48, fat_g: 4, fiber_g: 4, description: 'Cereal with milk provides carbs, protein, and calcium.' } },
    { match: ['yogurt'], nutrition: { calories: 150, protein_g: 12, carbs_g: 18, fat_g: 4, fiber_g: 0, description: 'Yogurt is rich in protein and probiotics for gut health.' } },
    { match: ['smoothie'], nutrition: { calories: 280, protein_g: 8, carbs_g: 45, fat_g: 6, fiber_g: 4, description: 'Smoothies can be nutrient-dense depending on ingredients.' } },
    
    // Lunch/Dinner proteins
    { match: ['chicken'], nutrition: { calories: 335, protein_g: 38, carbs_g: 12, fat_g: 14, fiber_g: 2, description: 'Chicken is a lean protein source, low in fat when grilled or baked.' } },
    { match: ['salmon', 'fish'], nutrition: { calories: 380, protein_g: 34, carbs_g: 8, fat_g: 22, fiber_g: 1, description: 'Salmon is rich in omega-3 fatty acids and high-quality protein.' } },
    { match: ['beef', 'steak'], nutrition: { calories: 420, protein_g: 36, carbs_g: 6, fat_g: 28, fiber_g: 1, description: 'Beef provides iron, zinc, and complete protein.' } },
    { match: ['pork'], nutrition: { calories: 380, protein_g: 32, carbs_g: 8, fat_g: 24, fiber_g: 1, description: 'Pork is a good source of protein and B vitamins.' } },
    { match: ['turkey'], nutrition: { calories: 300, protein_g: 34, carbs_g: 8, fat_g: 12, fiber_g: 2, description: 'Turkey is a lean protein, lower in fat than other meats.' } },
    { match: ['tofu'], nutrition: { calories: 240, protein_g: 20, carbs_g: 8, fat_g: 14, fiber_g: 2, description: 'Tofu is a plant-based protein rich in calcium and iron.' } },
    
    // Salads
    { match: ['salad'], nutrition: { calories: 280, protein_g: 12, carbs_g: 18, fat_g: 18, fiber_g: 6, description: 'Salads are rich in fiber and vitamins from fresh vegetables.' } },
    
    // Carb-heavy meals
    { match: ['pasta', 'spaghetti'], nutrition: { calories: 480, protein_g: 16, carbs_g: 72, fat_g: 12, fiber_g: 4, description: 'Pasta provides energy from complex carbohydrates.' } },
    { match: ['rice'], nutrition: { calories: 340, protein_g: 8, carbs_g: 62, fat_g: 6, fiber_g: 2, description: 'Rice is a staple carbohydrate source providing quick energy.' } },
    { match: ['pizza'], nutrition: { calories: 540, protein_g: 22, carbs_g: 58, fat_g: 24, fiber_g: 3, description: 'Pizza provides a mix of carbs, protein, and fats.' } },
    { match: ['burger', 'hamburger'], nutrition: { calories: 520, protein_g: 28, carbs_g: 40, fat_g: 28, fiber_g: 2, description: 'Burgers provide protein but are often high in saturated fat.' } },
    { match: ['sandwich'], nutrition: { calories: 380, protein_g: 20, carbs_g: 42, fat_g: 14, fiber_g: 3, description: 'Sandwiches can be balanced meals with protein and vegetables.' } },
    { match: ['wrap', 'burrito'], nutrition: { calories: 450, protein_g: 22, carbs_g: 48, fat_g: 18, fiber_g: 5, description: 'Wraps can be nutrient-dense with protein and vegetables.' } },
    
    // Soups
    { match: ['soup'], nutrition: { calories: 220, protein_g: 12, carbs_g: 24, fat_g: 8, fiber_g: 4, description: 'Soup is hydrating and can be rich in vegetables and protein.' } },
    
    // Snacks
    { match: ['apple'], nutrition: { calories: 95, protein_g: 0, carbs_g: 25, fat_g: 0, fiber_g: 4, description: 'Apples are high in fiber and natural sugars for quick energy.' } },
    { match: ['banana'], nutrition: { calories: 105, protein_g: 1, carbs_g: 27, fat_g: 0, fiber_g: 3, description: 'Bananas are rich in potassium and natural carbohydrates.' } },
    { match: ['nuts', 'almond'], nutrition: { calories: 180, protein_g: 6, carbs_g: 6, fat_g: 16, fiber_g: 3, description: 'Nuts provide healthy fats, protein, and fiber.' } },
    { match: ['protein shake', 'protein'], nutrition: { calories: 180, protein_g: 25, carbs_g: 8, fat_g: 4, fiber_g: 1, description: 'Protein shakes help meet daily protein requirements.' } },
    { match: ['cookie', 'cookies'], nutrition: { calories: 160, protein_g: 2, carbs_g: 24, fat_g: 7, fiber_g: 1, description: 'Cookies are high in sugar and provide quick energy.' } },
    { match: ['chips'], nutrition: { calories: 220, protein_g: 3, carbs_g: 24, fat_g: 13, fiber_g: 2, description: 'Chips are high in sodium and provide carbs from potatoes.' } },
    
    // Beverages
    { match: ['coffee'], nutrition: { calories: 5, protein_g: 0, carbs_g: 1, fat_g: 0, fiber_g: 0, description: 'Black coffee is very low in calories.' } },
    { match: ['latte', 'cappuccino'], nutrition: { calories: 150, protein_g: 8, carbs_g: 15, fat_g: 6, fiber_g: 0, description: 'Coffee with milk provides calcium and protein.' } },
    { match: ['juice'], nutrition: { calories: 120, protein_g: 1, carbs_g: 28, fat_g: 0, fiber_g: 0, description: 'Juice provides vitamins but is high in natural sugars.' } },
    { match: ['milk'], nutrition: { calories: 150, protein_g: 8, carbs_g: 12, fat_g: 8, fiber_g: 0, description: 'Milk provides calcium, protein, and vitamin D.' } },
  ];

  // Find matching pattern
  for (const pattern of patterns) {
    if (pattern.match.some(keyword => name.includes(keyword))) {
      return {
        ...pattern.nutrition,
        confidence: 'medium'
      };
    }
  }

  // Default fallback for unknown meals
  return {
    calories: 350,
    protein_g: 15,
    carbs_g: 40,
    fat_g: 12,
    fiber_g: 3,
    description: 'Estimated nutrition for a typical meal. Adjust values based on actual portion size and ingredients.',
    confidence: 'low'
  };
}