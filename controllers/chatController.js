const { geminiChatService } = require("../services/geminiChatService");

const chatWithAI = async (req, res) => {
  try {
    console.log("BODY:", req.body);

    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    const reply = await geminiChatService.generateChat(message);

    res.status(200).json({ reply });
  } catch (err) {
    console.error("Chat Controller Error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports = { chatWithAI };