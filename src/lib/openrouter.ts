const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OpenRouterResponse {
  id: string;
  choices: {
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }[];
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

interface OpenRouterError {
  error: {
    message: string;
    code?: number;
  };
}

// Free models available on OpenRouter (as of late 2024)
// Check https://openrouter.ai/models for current free models
const FREE_MODEL = 'nousresearch/hermes-3-llama-3.1-405b:free';
// Alternative free models if the above doesn't work:
// 'meta-llama/llama-3.2-3b-instruct:free'
// 'qwen/qwen-2-7b-instruct:free'
// 'google/gemma-2-9b-it:free'
// 'mistralai/mistral-7b-instruct:free'

export async function chatWithFaith(
  messages: Message[],
  options?: {
    maxTokens?: number;
    temperature?: number;
  }
): Promise<{ content: string; error?: string; isRateLimit?: boolean; retryAfter?: number }> {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    console.error('OpenRouter API key not configured');
    return { content: '', error: 'OpenRouter API key not configured' };
  }

  try {
    console.log('Calling OpenRouter with model:', FREE_MODEL);
    
    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        'X-Title': 'AlagApp Health Assistant',
      },
      body: JSON.stringify({
        model: FREE_MODEL,
        messages,
        max_tokens: options?.maxTokens || 1024,
        temperature: options?.temperature || 0.7,
      }),
    });

    const data = await response.json();
    
    console.log('OpenRouter response status:', response.status);
    console.log('OpenRouter response:', JSON.stringify(data).substring(0, 500));

    // Check for rate limit
    if (response.status === 429) {
      const retryAfter = parseInt(response.headers.get('retry-after') || '60', 10);
      return {
        content: '',
        error: 'Rate limit reached',
        isRateLimit: true,
        retryAfter,
      };
    }

    // Check for errors
    if (!response.ok || data.error) {
      const errorMsg = data.error?.message || data.error || `HTTP ${response.status}`;
      console.error('OpenRouter error:', errorMsg);
      
      // Check if it's a model not found error
      if (errorMsg.includes('No endpoints') || errorMsg.includes('not found')) {
        return {
          content: '',
          error: `Model not available. Please check OpenRouter for available free models.`,
        };
      }
      
      return {
        content: '',
        error: errorMsg,
        isRateLimit: response.status === 429,
      };
    }

    const result = data as OpenRouterResponse;
    const content = result.choices?.[0]?.message?.content || '';

    if (!content) {
      console.error('Empty response from OpenRouter');
      return { content: '', error: 'Empty response from AI' };
    }

    return { content };

  } catch (error: any) {
    console.error('OpenRouter fetch error:', error);
    return {
      content: '',
      error: error?.message || 'Failed to connect to AI service',
    };
  }
}

export async function getNutritionEstimate(
  foodName: string
): Promise<{
  data?: {
    description: string;
    calories: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
    fiber_g: number;
    sugar_g: number;
    sodium_mg: number;
    serving_size: string;
    confidence: 'high' | 'medium' | 'low';
  };
  error?: string;
  isRateLimit?: boolean;
  retryAfter?: number;
}> {
  const prompt = `You are a nutrition database assistant. Provide accurate nutritional information for: "${foodName}"

Return ONLY a valid JSON object (no markdown, no explanation, no code blocks) with these exact fields:
{"description":"brief description with serving size","calories":number,"protein_g":number,"carbs_g":number,"fat_g":number,"fiber_g":number,"sugar_g":number,"sodium_mg":number,"serving_size":"serving description","confidence":"high or medium or low"}

Use USDA data standards. For common foods use "high" confidence, dishes use "medium", unusual items use "low".
Return ONLY the JSON object, nothing else.`;

  const result = await chatWithFaith([
    { role: 'user', content: prompt }
  ], { temperature: 0.3 });

  if (result.error) {
    return {
      error: result.error,
      isRateLimit: result.isRateLimit,
      retryAfter: result.retryAfter,
    };
  }

  try {
    // Clean and parse JSON
    let jsonStr = result.content.trim();
    
    // Remove markdown code blocks if present
    if (jsonStr.startsWith('```json')) {
      jsonStr = jsonStr.slice(7);
    } else if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.slice(3);
    }
    if (jsonStr.endsWith('```')) {
      jsonStr = jsonStr.slice(0, -3);
    }
    jsonStr = jsonStr.trim();

    // Find JSON object
    const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonStr = jsonMatch[0];
    }

    const data = JSON.parse(jsonStr);

    return {
      data: {
        description: data.description || `${foodName} - standard serving`,
        calories: Math.round(Number(data.calories)) || 0,
        protein_g: Math.round(Number(data.protein_g) * 10) / 10 || 0,
        carbs_g: Math.round(Number(data.carbs_g) * 10) / 10 || 0,
        fat_g: Math.round(Number(data.fat_g) * 10) / 10 || 0,
        fiber_g: Math.round(Number(data.fiber_g) * 10) / 10 || 0,
        sugar_g: Math.round(Number(data.sugar_g) * 10) / 10 || 0,
        sodium_mg: Math.round(Number(data.sodium_mg)) || 0,
        serving_size: data.serving_size || 'standard serving',
        confidence: data.confidence || 'medium',
      },
    };

  } catch (parseError) {
    console.error('Failed to parse nutrition data:', parseError);
    console.error('Raw content:', result.content);
    return { error: 'Could not parse nutrition data' };
  }
}