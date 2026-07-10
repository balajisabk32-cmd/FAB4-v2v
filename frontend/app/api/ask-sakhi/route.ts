import { NextResponse } from 'next/server';
import { GoogleGenAI, Type } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "dummy-key-for-now" });

const analyze_cycle_declaration = {
  name: "analyze_cycle",
  description: "Predict the user's cycle regularity and days until their next period. Use this when the user asks about cycle timing, late periods, or irregular periods.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      last_period_date: {
        type: Type.STRING,
        description: "The date of their last period in YYYY-MM-DD format. Assume today's date minus 14 days if the user doesn't specify."
      },
      cycle_length_avg: {
        type: Type.INTEGER,
        description: "The user's average cycle length. Default to 28 if unknown."
      }
    },
    required: ["last_period_date", "cycle_length_avg"]
  }
};

const analyze_pcos_risk_declaration = {
  name: "analyze_pcos_risk",
  description: "Predict the risk of PCOS (Polycystic Ovary Syndrome). Use this when the user asks about symptoms like severe acne, rapid weight gain, unusual hair growth, or highly irregular cycles.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      weight: {
        type: Type.NUMBER,
        description: "The user's weight in kg. Default to 65.0 if unknown."
      },
      cycle_regularity: {
        type: Type.INTEGER,
        description: "0 if their cycles are irregular, 1 if they are regular."
      },
      acne_severity: {
        type: Type.INTEGER,
        description: "Acne severity from 1 to 10."
      }
    },
    required: ["weight", "cycle_regularity", "acne_severity"]
  }
};

export async function POST(req: Request) {
  try {
    const { prompt } = await requestBody(req);

    if (!prompt) {
      return NextResponse.json({ error: "Missing prompt" }, { status: 400 });
    }

    const chat = ai.chats.create({
      model: 'gemini-flash-lite-latest',
      config: {
        systemInstruction: "You are Sakhi, a deeply empathetic, calming, and nurturing feminine AI health assistant. You support women through their cycle and pregnancy journey. Always speak with warmth. You must use the provided tools to analyze symptoms and cycle data whenever appropriate.",
        tools: [{ functionDeclarations: [analyze_cycle_declaration, analyze_pcos_risk_declaration] }]
      }
    });

    let response = await chat.sendMessage({ message: prompt });
    let updatedChartData = null;

    // Handle function calls
    if (response.functionCalls && response.functionCalls.length > 0) {
      const call = response.functionCalls[0];
      let apiResult = null;
      let chartType = "";

      try {
        if (call.name === "analyze_cycle") {
          const args = call.args as any;
          const res = await fetch("http://127.0.0.1:8000/predict/cycle", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              last_period_date: args.last_period_date,
              cycle_length_avg: args.cycle_length_avg
            })
          });
          apiResult = await res.json();
          chartType = "cycle";
        } else if (call.name === "analyze_pcos_risk") {
          const args = call.args as any;
          const res = await fetch("http://127.0.0.1:8000/predict/pcos", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              weight: args.weight,
              cycle_regularity: args.cycle_regularity,
              acne_severity: args.acne_severity
            })
          });
          apiResult = await res.json();
          chartType = "pcos";
        }

        if (apiResult) {
          updatedChartData = { type: chartType, data: apiResult };
          // Send the result back to Gemini so it can answer the user
          response = await chat.sendMessage({
            message: [{
              functionResponse: {
                name: call.name,
                response: apiResult
              }
            }]
          });
        }
      } catch (backendErr) {
        console.error("FastAPI Backend Error:", backendErr);
        // Graceful degradation: Tell Gemini the backend failed
        response = await chat.sendMessage({
          message: [{
            functionResponse: {
              name: call.name,
              response: { error: "The ML prediction service is currently offline. Please provide general advice based on the user's input without exact predictions." }
            }
          }]
        });
      }
    }

    return NextResponse.json({
      reply: response.text,
      updatedChartData
    });
  } catch (error: any) {
    console.error("Ask Sakhi API Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", reply: "I'm having a little trouble connecting to my thoughts right now. Please give me a moment and try asking again softly." },
      { status: 500 }
    );
  }
}

async function requestBody(req: Request) {
  try { return await req.json(); } catch { return {}; }
}
