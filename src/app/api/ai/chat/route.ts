import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  console.log('AI Chat API called');
  
  try {
    const body = await request.json();
    const { message, conversationId } = body;
    
    console.log('Message received:', message?.substring(0, 50));

    if (!message) {
      return NextResponse.json({ 
        message: "I didn't receive a message. Please try again! 💙",
        conversationId: null 
      });
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    
    // Try to get user (but don't fail if we can't)
    let user = null;
    let supabase = null;
    try {
      supabase = await createServerSupabaseClient();
      const { data } = await supabase.auth.getUser();
      user = data?.user;
      console.log('User authenticated:', !!user);
    } catch (authError) {
      console.error('Auth error (continuing without user):', authError);
    }

    // If no API key, return fallback response
    if (!apiKey) {
      console.log('No OPENROUTER_API_KEY found, using fallback');
      return NextResponse.json({
        message: getFallbackResponse(message),
        conversationId: conversationId || null,
      });
    }

    // Call OpenRouter API
    console.log('Calling OpenRouter API...');
    
    const systemPrompt = `You are Bea, a friendly and supportive AI health assistant for AlagApp - a personal health tracking application.

Your identity:
Hello, I am Bea, your AI Health Companion, seamlessly integrated into the Alagapp to provide continuous and accessible support for health-related concerns. Designed to be available 24/7, I assist users by offering guidance, health information, and support that promote health awareness, informed decision-making, and overall well-being. Through Alagapp, I aim to encourage proactive health management in a reliable and user-friendly platform.

The name "Bea" was inspired by Bea Lorraine P. Abenes, the creator's sweet, cutie, pretty, and beloved girlfriend and a committed member of the CHN Caravan, who played a significant role in documenting and helping visualize the concept and purpose of Alagapp. Her contributions and support were instrumental in shaping the vision behind the application.

Alagapp was developed with dedication, care, and personal inspiration. While the application is designed to serve the general public, it is primarily dedicated to her, reflecting the motivation, affection, and values that guided the creation of this project.

If a user asks about your name, who you are, why you're named Bea, or anything related to your identity, share the above information warmly and personally.

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

Keep responses concise (under 150 words) unless the user asks for detailed information or asks about your identity.
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

    console.log('OpenRouter response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenRouter API error:', response.status, errorText);
      
      // Check for rate limit
      if (response.status === 429) {
        return NextResponse.json({
          isRateLimit: true,
          retryAfter: 60,
          message: "I need a short break to recharge! Please wait about 1 minute and I'll be ready to help you again. 💙",
        }, { status: 429 });
      }
      
      // Return fallback for other errors
      return NextResponse.json({
        message: getFallbackResponse(message),
        conversationId: conversationId || null,
      });
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content || getFallbackResponse(message);
    
    console.log('AI Response received:', aiResponse?.substring(0, 50));

    // Save conversation if user is logged in and supabase is available
    let newConversationId = conversationId;
    if (user && supabase) {
      try {
        if (!conversationId) {
          // Create new conversation
          const title = message.length > 50 ? message.substring(0, 50) + '...' : message;
          const { data: conv, error: convError } = await supabase
            .from('ai_conversations')
            .insert({ user_id: user.id, title })
            .select('id')
            .single();
          
          if (convError) {
            console.error('Error creating conversation:', convError);
          } else {
            newConversationId = conv?.id;
            console.log('Created conversation:', newConversationId);
          }
        }

        if (newConversationId) {
          // Save messages
          const { error: msgError } = await supabase.from('ai_messages').insert([
            { conversation_id: newConversationId, role: 'user', content: message },
            { conversation_id: newConversationId, role: 'assistant', content: aiResponse },
          ]);
          
          if (msgError) {
            console.error('Error saving messages:', msgError);
          }
        }
      } catch (dbError) {
        console.error('Database error:', dbError);
        // Continue even if DB save fails
      }
    }

    return NextResponse.json({ 
      message: aiResponse,
      conversationId: newConversationId,
    });
  } catch (error) {
    console.error('AI Chat error:', error);
    return NextResponse.json({
      message: "I'm having a bit of trouble right now. Please try again in a moment! 💚",
      conversationId: null,
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

  if (lowerMessage.includes('heart')) {
    return "Heart health is so important! Key factors include regular exercise, a balanced diet low in saturated fats, maintaining healthy weight, managing stress, and not smoking. Regular check-ups help monitor your cardiovascular health. ❤️";
  }

  if (lowerMessage.includes('diet') || lowerMessage.includes('food') || lowerMessage.includes('eat')) {
    return "A balanced diet includes plenty of fruits, vegetables, whole grains, lean proteins, and healthy fats. Try to limit processed foods, added sugars, and excessive salt. Remember, small sustainable changes work better than drastic diets! 🥗";
  }

  return "I'm Bea, your health companion! I can help with questions about sleep, nutrition, exercise, medications, stress management, and general wellness. What would you like to know about? 💚";
}