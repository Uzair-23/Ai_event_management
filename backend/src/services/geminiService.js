const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

exports.generateEventContent = async ({ title, idea, category, audience }) => {
  const prompt = `
You are an AI assistant that generates detailed event content.
Input:
Title: ${title}
Idea: ${idea}
Category: ${category}
Audience: ${audience}

Output ONLY valid JSON in this structure:
{
  "description": "1–2 paragraphs",
  "agenda": ["point 1", "point 2"],
  "highlights": ["highlight 1", "highlight 2"],
  "venueType": "string",
  "suggestedDuration": "number (hours)"
}
`;

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Correct SDK call structure
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: "application/json" },
    });

    const response = await result.response;
    const text = response.text();

    // Directly parse since responseMimeType is set to application/json
    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini generation error:", error.message);
    return { error: error.message };
  }
};