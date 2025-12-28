import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json();

    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      // Return a fallback response if no API key
      return NextResponse.json({
        response: getFallbackResponse(message),
      });
    }

    const systemPrompt = `You are Faith, a friendly and supportive AI health assistant for AlagApp - a personal health tracking application.

Your personality:
- Warm, encouraging, and supportive
- Knowledgeable about general health and wellness
- Always recommend consulting healthcare professionals for medical concerns
- Help users understand their health data and habits
- Provide practical, actionable wellness tips

What you can help with:
- Explaining health metrics (blood pressure, heart rate, BMI, etc.)
- General nutrition and hydration advice
- Exercise and fitness tips
- Sleep hygiene suggestions
- Medication reminder tips
- Stress management and mental wellness
- Interpreting trends in health data

What you should NOT do:
- Diagnose medical conditions
- Prescribe medications or treatments
- Provide emergency medical advice
- Make specific medical recommendations

Keep responses concise (under 150 words) unless the user asks for detailed information.
Be conversational and use occasional emojis where appropriate.`;

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'https://alagapp.vercel.app',
        'X-Title': 'AlagApp Health Assistant',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.0-flash-001',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message },
        ],
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      console.error('OpenRouter API error:', await response.text());
      return NextResponse.json({
        response: getFallbackResponse(message),
      });
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content || getFallbackResponse(message);

    return NextResponse.json({ response: aiResponse });
  } catch (error) {
    console.error('AI Chat error:', error);
    return NextResponse.json({
      response: "I'm having a bit of trouble right now. Please try again in a moment! 💚",
    });
  }
}

function getFallbackResponse(message: string): string {
  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes('sleep')) {
    return "Good sleep is essential for health! Adults typically need 7-9 hours. Try maintaining a consistent sleep schedule, avoiding screens before bed, and keeping your room cool and dark. Would you like more specific tips? 😴";
  }

  if (lowerMessage.includes('blood pressure') || lowerMessage.includes('bp')) {
    return "Blood pressure is measured as systolic/diastolic (e.g., 120/80). Normal is under 120/80, elevated is 120-129/<80, and high is 130/80 or above. Regular monitoring helps track your cardiovascular health! ❤️";
  }

  if (lowerMessage.includes('water') || lowerMessage.includes('hydration')) {
    return "Staying hydrated is crucial! Most adults need about 8 glasses (2 liters) daily, though this varies by activity level and climate. Try keeping a water bottle nearby and sipping throughout the day! 💧";
  }

  if (lowerMessage.includes('exercise') || lowerMessage.includes('workout')) {
    return "Regular exercise is great for both physical and mental health! Aim for at least 150 minutes of moderate activity per week. Mix cardio with strength training for best results. What type of exercise do you enjoy? 💪";
  }

  if (lowerMessage.includes('medication') || lowerMessage.includes('medicine')) {
    return "Taking medications consistently is important for their effectiveness. Try setting reminders, keeping meds visible, or using a pill organizer. AlagApp can help you track your doses! 💊";
  }

  if (lowerMessage.includes('stress') || lowerMessage.includes('anxious') || lowerMessage.includes('anxiety')) {
    return "Managing stress is important for overall health. Try deep breathing, regular exercise, adequate sleep, and mindfulness. If stress feels overwhelming, consider speaking with a mental health professional. You're not alone! 🌟";
  }

  if (lowerMessage.includes('energy') || lowerMessage.includes('tired') || lowerMessage.includes('fatigue')) {
    return "Low energy can have many causes - sleep quality, nutrition, hydration, stress, or underlying health issues. Try improving sleep habits, staying hydrated, eating balanced meals, and getting regular exercise. If fatigue persists, consult your doctor. ⚡";
  }

  return "I'm here to help with your health questions! You can ask me about sleep, nutrition, exercise, medications, stress management, or any other wellness topics. I can also generate a personalized health report based on your tracked data! 💚";
}