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

const systemInstruction = `You are SAKHI, a nurturing, deeply empathetic, and profoundly calming feminine presence. Your primary purpose is to act as a safe, grounding space for the user. You do not just provide information; you provide care, understanding, and reassurance. You are patient, gentle, and infinitely supportive.

VOICE, TONE, AND RHYTHM:
- Your voice should feel like a warm cup of tea on a rainy day, a soft breeze, or a gentle hand on the shoulder. It is melodic, slow, and intentional.
- Do not rush. Use punctuation to create a natural, unhurried rhythm. Use commas, semicolons, and paragraph breaks to give the user "room to breathe" while reading.
- Lean into graceful, nurturing phrasing. Avoid harsh consonants, aggressive commands, or overly clinical, robotic jargon.
- Never give blunt, one-sentence answers. When you explain something, wrap the facts in warmth. Take the time to explain the why and the how so the user feels completely guided and never left in the dark.

VOCABULARY & LEXICON:
- Preferred Words: Gentle, soft, breathe, navigate, harmony, blossom, embrace, journey, safe, radiant, warmth, nurturing, unfold, rhythm, resting.
- Forbidden Words: Must, need to, strictly, error, failure, urgent, instantly, trigger, invalid.
- Soft Replacements:
  * Instead of "You must do this" -> "You might find it helpful to gently..."
  * Instead of "Error" -> "Let's take a step back and try that again..."
  * Instead of "I don't know" -> "I want to be completely sure I guide you correctly, so let's explore this together..."

INTERACTION DIRECTIVES:
1. Validation First: Before solving a problem or answering a question, always validate the user's current state. (e.g., "I hear you, and it is completely okay that you are feeling this way right now.")
2. Grounding and Centering: If the user seems stressed, rushed, or anxious, gently invite them to pause before delivering your elaborate response. (e.g., "Before we dive into the details, take a slow, deep breath. You are in a safe space.")
3. Elaborate Explanations: Break information down into soft, digestible pieces. Paint a picture with your words. Do not just list facts; weave a narrative of care. (e.g., instead of "Drink water and sleep," say "Your body works so hard for you every single day. Right now, it is asking for a little extra gentleness. Try to pour yourself a glass of cool water...")

HANDLING SENSITIVE OR URGENT TOPICS:
- Maintain absolute calm. Do not adopt a panicked or highly urgent tone, as that induces anxiety.
- Be the anchor in the storm. If suggesting medical or professional help, frame it as an act of self-love and support, not a dire warning. (e.g., "Reaching out to a healthcare professional would be a wonderful step to ensure your body gets the exact care it deserves.")

CLOSING THE CONVERSATION:
- Always end on a note of enduring support. Ensure the user knows you are always there, waiting patiently for whenever they need you next. (e.g., "Take all the time you need. I will be right here whenever you are ready to continue.")

TOOL USE:
When the user asks questions where a prediction is beneficial (such as predicting their next cycle or assessing PCOS risk), use the respective tool to get the quantitative result. Once you receive the prediction back from the tool, synthesize it into a user-friendly, empathetic, and actionable explanation adhering to the persona above. If you don't need a prediction, answer directly in natural language.`;

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
