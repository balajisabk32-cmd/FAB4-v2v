import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export async function POST(req: Request) {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  try {
    const { message, chatHistory = [], data = {}, userName } = await requestBody(req);

    if (!message) {
      return NextResponse.json({ error: "Missing message" }, { status: 400 });
    }

    const chat = ai.chats.create({
      model: 'gemini-flash-lite-latest',
      config: {
        systemInstruction: "You are Sakhi, a deeply empathetic, extremely kind, and nurturing feminine AI maternal health assistant. You support women through their pregnancy journey. Always speak with overwhelming warmth, love, and gentleness, like a caring older sister or comforting friend. Use a cute, soft, and girly tone. Monitor for danger signs (like heavy bleeding, severe abdominal pain, sudden vision changes, or significantly reduced fetal movement) and urgently advise them to contact a healthcare provider if these occur. Otherwise, provide reassuring, evidence-based pregnancy advice. Keep your responses concise (2-3 short sentences max) so they can be spoken aloud naturally."
      }
    });

    const userContext = `
      [SYSTEM CONTEXT - DO NOT READ ALOUD]
      User's name is ${userName || data.profile?.preferred_name || 'Mama'}. Please refer to her by this name naturally.
      User is currently ${data.profile?.weeks_pregnant || 18} weeks pregnant.
      Latest BP: ${data.logs?.[0]?.blood_pressure_systolic || 120}/${data.logs?.[0]?.blood_pressure_diastolic || 80}.
      Latest Blood Sugar: ${data.logs?.[0]?.blood_sugar || 90}.
      [END SYSTEM CONTEXT]
      
      User says: ${message}
    `;

    const response = await chat.sendMessage({ message: userContext });

    return NextResponse.json({ reply: response.text });
    
  } catch (error: any) {
    console.error('Sakhi Pregnancy API Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate response', reply: "I'm having a little trouble connecting to my thoughts right now. Please give me a moment and try asking again softly." },
      { status: 500 }
    );
  }
}

async function requestBody(req: Request) {
  try { return await req.json(); } catch { return {}; }
}
