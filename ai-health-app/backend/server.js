require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { chatWithGemini } = require("./gemini");

const app = express();
const PORT = process.env.PORT || 3001;
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://localhost:8000";

app.use(cors());
app.use(express.json());

// In-memory session history map: sessionId -> Array of Gemini content objects
const sessionHistories = new Map();

// Helper to make API calls to the FastAPI service
async function executeToolCall(name, args) {
  let endpoint = "";
  if (name === "predict_cycle") {
    endpoint = `${ML_SERVICE_URL}/predict/cycle`;
  } else if (name === "predict_pcos") {
    endpoint = `${ML_SERVICE_URL}/predict/pcos`;
  } else {
    throw new Error(`Unknown tool name: ${name}`);
  }

  console.log(`Forwarding prediction request to FastAPI: ${endpoint} with args:`, args);

  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(args)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`ML microservice returned status ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  console.log(`FastAPI response:`, data);
  return data;
}

// Core chat route
app.post("/api/chat", async (req, res) => {
  const { sessionId, message } = req.body;

  if (!sessionId || !message) {
    return res.status(400).json({ error: "Missing sessionId or message in request body." });
  }

  try {
    // 1. Get or create history
    let history = sessionHistories.get(sessionId);
    if (!history) {
      history = [];
    }

    // 2. Append new user message (in Gemini content format)
    const userMessage = {
      role: "user",
      parts: [{ text: message }]
    };
    const currentHistory = [...history, userMessage];

    // 3. Call Gemini orchestration (includes tool execution)
    const { reply, additionalHistory } = await chatWithGemini(currentHistory, executeToolCall);

    // 4. Update saved history
    const finalHistory = [...currentHistory, ...additionalHistory.slice(0, -1)]; // exclude duplicate of user message if present
    
    // We want to save: userMessage, toolCall(if any), toolResponse(if any), finalModelReply
    // additionalHistory contains either just [modelReply] or [toolCall, toolResponse, modelReply]
    const updatedHistory = [...currentHistory, ...additionalHistory];
    sessionHistories.set(sessionId, updatedHistory);

    // Get the final reply text
    const textReply = reply?.parts?.[0]?.text || "Sorry, I was unable to generate a response.";

    res.json({
      reply: textReply,
      history: updatedHistory
    });

  } catch (error) {
    console.error("Express /api/chat error:", error);
    res.status(500).json({
      error: "An internal server error occurred.",
      details: error.message
    });
  }
});

// Clear session route
app.post("/api/chat/clear", (req, res) => {
  const { sessionId } = req.body;
  if (sessionId) {
    sessionHistories.delete(sessionId);
    return res.json({ status: "cleared", sessionId });
  }
  res.status(400).json({ error: "Missing sessionId." });
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok", ml_service_url: ML_SERVICE_URL });
});

app.listen(PORT, () => {
  console.log(`Express orchestration backend running on port ${PORT}`);
});
