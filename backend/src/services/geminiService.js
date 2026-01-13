
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Initialize Gemini client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Generates structured event content using Gemini
 */
exports.generateEventContent = async ({ title, idea, category, audience }) => {
  // Prompt instructing Gemini to output strict JSON
  const prompt = `
You are an AI assistant that generates detailed event content.

Input:
Title: ${title}
Idea: ${idea}
Category: ${category}
Audience: ${audience}

Rules:
- Output ONLY valid JSON
- Do not add explanations
- Do not use markdown

Output JSON structure:
{
  "description": "1–2 paragraphs",
  "agenda": ["point 1", "point 2"],
  "highlights": ["highlight 1", "highlight 2"],
  "venueType": "string",
  "suggestedDuration": "number (hours)"
}
`;

  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: { responseMimeType: 'application/json' },
    });

    // Request JSON response from Gemini for more reliable parsing
    const result = await model.generateContent({
      prompt,
      generationConfig: { responseMimeType: 'application/json' },
    });

    const text = result.response?.text ? result.response.text() : (result?.output?.[0]?.content || '');

    // If the model returned structured JSON directly, prefer that
    const jsonMatch = text.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      // fallback: if the API returned parsed JSON in a field, attempt to return it
      if (result.response?.content && typeof result.response.content === 'object') return result.response.content;
      if (result.output && result.output[0] && result.output[0].content) return result.output[0].content;
      return { raw: text };
    }

    try {
      return JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      return { raw: text };
    }
  } catch (error) {
    console.error("Gemini generation error:", error.message);
    return { error: error.message };
  }
};
