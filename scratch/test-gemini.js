require('dotenv').config({ path: '.env.local' });
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function listModels() {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_AI_API_KEY);
  try {
    const list = await genAI.getGenerativeModel({ model: 'unknown' }).getGenerativeModel(); // This is wrong, let's use the real way
    // Actually, the correct way to list models is:
    // This requires a fetch usually or a specific method in the client.
    // However, the SDK might not have a direct listModels easily exported?
    // Let's try the common ones.
    console.log("Testing gemini-1.5-flash...");
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent("Hi");
    console.log("Success with gemini-1.5-flash!");
  } catch (e) {
    console.error("Error with gemini-1.5-flash:", e.message);
    
    console.log("Testing gemini-pro...");
    try {
        const modelPro = genAI.getGenerativeModel({ model: "gemini-pro" });
        await modelPro.generateContent("Hi");
        console.log("Success with gemini-pro!");
    } catch (e2) {
        console.error("Error with gemini-pro:", e2.message);
    }
  }
}

listModels();
