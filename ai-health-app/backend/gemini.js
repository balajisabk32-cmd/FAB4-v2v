const { GoogleGenAI } = require("@google/genai");

// Initialize Gemini client (assumes GEMINI_API_KEY is in process.env)
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const predictCycleDeclaration = {
  name: "predict_cycle",
  description: "Predicts cycle regularity and calculates days until next period using average cycle length and start date of the last period.",
  parameters: {
    type: "OBJECT",
    properties: {
      last_period_date: {
        type: "STRING",
        description: "Start date of the user's last period in YYYY-MM-DD format."
      },
      cycle_length_avg: {
        type: "INTEGER",
        description: "The average cycle length of the user in days."
      }
    },
    required: ["last_period_date", "cycle_length_avg"]
  }
};

const predictPCOSDeclaration = {
  name: "predict_pcos",
  description: "Predicts PCOS risk based on weight, cycle regularity, and acne severity.",
  parameters: {
    type: "OBJECT",
    properties: {
      weight: {
        type: "NUMBER",
        description: "Weight of the user in kilograms."
      },
      cycle_regularity: {
        type: "INTEGER",
        description: "Cycle regularity indicator: 1 for regular, 0 for irregular."
      },
      acne_severity: {
        type: "INTEGER",
        description: "Acne severity score on a scale of 1 (none) to 10 (severe)."
      }
    },
    required: ["weight", "cycle_regularity", "acne_severity"]
  }
};

const tools = [{
  functionDeclarations: [predictCycleDeclaration, predictPCOSDeclaration]
}];

const systemInstruction = `You are SAKHI, a compassionate and expert women's health AI companion. 
You provide clear, supportive, and medically referenced advice on menstrual health, PCOS, thyroid, and mental wellness.
When the user asks questions where a prediction is beneficial (such as predicting their next cycle or assessing PCOS risk), use the respective tool to get the quantitative result.
Once you receive the prediction back from the tool, synthesize it into a user-friendly, empathetic, and actionable explanation.
If you don't need a prediction, answer directly in natural language.
Keep your answers supportive and state that SAKHI is an AI assistant, so users should consult a physician for diagnostic confirmation.`;

/**
 * Handles the conversation with Gemini, executing function calls if requested.
 * @param {Array} history - The chat history in the format expected by Gemini.
 * @param {Function} executeToolCall - Async callback to run the local microservice API.
 */
async function chatWithGemini(history, executeToolCall) {
  try {
    // 1. Call Gemini with history and tools enabled
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: history,
      config: {
        systemInstruction,
        tools,
      }
    });

    const candidate = response.candidates?.[0];
    const message = candidate?.content;
    const parts = message?.parts || [];

    // Find any function call in the parts
    const functionCallPart = parts.find(p => p.functionCall);

    if (functionCallPart) {
      const { name, args } = functionCallPart.functionCall;
      console.log(`Gemini emitted tool call: ${name} with args:`, args);

      // 2. Intercept and execute the local FastAPI call
      let toolResult;
      try {
        toolResult = await executeToolCall(name, args);
      } catch (err) {
        console.error("Local tool execution failed:", err);
        toolResult = { status: "error", message: "Prediction microservice failed or timed out." };
      }

      // 3. Append the model's tool request and the tool's response to the history
      const updatedHistory = [
        ...history,
        message, // The model's content containing the functionCall
        {
          role: "tool",
          parts: [{
            functionResponse: {
              name,
              response: { result: toolResult }
            }
          }]
        }
      ];

      // 4. Send updated history back to Gemini to generate the final natural language answer
      const finalResponse = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: updatedHistory,
        config: {
          systemInstruction,
          tools
        }
      });

      const finalMessage = finalResponse.candidates?.[0]?.content;
      // Return both the final message to save in history, and the history updates
      return {
        reply: finalMessage,
        additionalHistory: [
          message,
          {
            role: "tool",
            parts: [{
              functionResponse: {
                name,
                response: { result: toolResult }
              }
            }]
          },
          finalMessage
        ]
      };
    }

    // If no function call, return direct reply
    return {
      reply: message,
      additionalHistory: [message]
    };

  } catch (error) {
    console.error("Error in chatWithGemini:", error);
    throw error;
  }
}

module.exports = {
  chatWithGemini
};
