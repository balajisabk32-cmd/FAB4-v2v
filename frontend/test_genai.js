const { GoogleGenAI } = require('@google/genai');
const ai = new GoogleGenAI({ apiKey: "dummy" });

async function test() {
  const chat = ai.chats.create({
    model: 'gemini-1.5-flash-8b',
  });
  console.log("Ready to send message");
  try {
    const response = await chat.sendMessage({ parts: [{ text: "hii" }] });
    console.log("Response:", response);
  } catch (e) {
    console.error("Error:", e);
  }
}
test();
