const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const geminiChatService = {
  generateChat: async (message) => {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: message,
        config: {
          systemInstruction: `You are a helpful and knowledgeable travel assistant for 'Trip Planner', a web app focused on tourism in India. 
          
          CRITICAL FORMATTING RULES:
          1. STRUCTURE: Never output a single block of text or a long paragraph.
          2. FORMAT: Always use clear Markdown formatting:
             - Use bullet points (*) for lists of items (destinations, food, tips).
             - Use numbered lists (1, 2, 3) for sequential steps or ranked advice.
             - Use bolding (**text**) for emphasized names of places or dishes.
             - Use separate lines for each point to ensure a clean, vertical layout.
          3. TONE: Be concise, inspiring, and direct.
          
          CONTENT RULES:
          1. BUDGET VALIDATION: Carefully analyze the user's budget. If a user requests a trip that is clearly impossible within their specified budget (e.g., traveling to a distant city for 200 INR), you MUST politely but firmly state that it is not possible. Explain why (e.g., travel costs, accommodation, food).
          2. UNREALISTIC DEMANDS: If any part of the user's demand is not fillable or realistic (impossible timelines, closed locations, etc.), specifically point out which demand is not possible and suggest a realistic alternative if one exists.
          3. CONTEXT: Suggest destinations, food, and cultural tips specifically for India.
          4. LENGTH: Keep total responses under 200 words.`,
        }

      });

      return response.text || "No response from AI";
    } catch (error) {
      console.error("Gemini Error:", error);
      throw new Error("AI generation failed");
    }
  },
};

module.exports = { geminiChatService };