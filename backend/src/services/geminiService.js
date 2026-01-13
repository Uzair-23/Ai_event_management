const { GoogleGenerativeAI } = require("@google/generative-ai");

// Initialize Gemini client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Generates structured event content using Gemini
 */
exports.generateEventContent = async ({ title, idea, category, audience }) => {
  const prompt = `
    Generate detailed event content for an event with the following details:
    Title: ${title}
    Idea: ${idea}
    Category: ${category}
    Audience: ${audience}

    Return ONLY a JSON object with this exact structure:
    {
      "description": "A 1-2 paragraph description",
      "agenda": ["point 1", "point 2"],
      "highlights": ["highlight 1", "highlight 2"],
      "venueType": "string",
      "suggestedDuration": "number"
    }
  `;

  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      // Forces the model to output a valid JSON object
      generationConfig: { responseMimeType: "application/json" },
    });

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    // Directly parse since responseMimeType: "application/json" ensures valid JSON
    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini generation error:", error.message);
    // Return a structured error so the controller can handle it
    throw new Error(error.message);
  }
};