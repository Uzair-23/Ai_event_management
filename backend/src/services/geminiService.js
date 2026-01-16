const { GoogleGenerativeAI } = require("@google/generative-ai");

// Initialize Gemini client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Generates structured event content using Gemini
 */
exports.generateEventContent = async ({ title, idea, category, audience }) => {
  const prompt = `Generate detailed event content for an event with the following details:

Title: ${title}
Idea: ${idea}
Category: ${category}
Audience: ${audience}

Return ONLY a valid JSON object with this exact structure (no markdown, no extra text):
{
  "description": "A detailed 1-2 paragraph description of the event",
  "agenda": ["agenda point 1", "agenda point 2", "agenda point 3"],
  "highlights": ["highlight 1", "highlight 2", "highlight 3"],
  "venueType": "suggested venue type (indoor/outdoor/virtual/hybrid)",
  "suggestedDuration": 2
}`;

  try {
    console.log("[GEMINI] Starting AI generation...");
    console.log("[GEMINI] API Key exists:", !!process.env.GEMINI_API_KEY);
    
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
    });

    // CORRECT SYNTAX: Use contents array with role and parts
    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }]
        }
      ],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.7,
      },
    });

    console.log("[GEMINI] Generation successful");
    
    const text = result.response.text();
    console.log("[GEMINI] Response text:", text);
    
    // Parse the JSON response
    const parsedData = JSON.parse(text);
    console.log("[GEMINI] Parsed data:", parsedData);
    
    return parsedData;
  } catch (error) {
    console.error("[GEMINI] Generation error:", error);
    console.error("[GEMINI] Error details:", {
      message: error.message,
      stack: error.stack,
      response: error.response?.data
    });
    
    // Return a fallback structure if AI fails
    return {
      description: `${title} - ${idea}. This ${category} event promises to be an engaging experience for ${audience} audience.`,
      agenda: [
        "Welcome and registration",
        "Main event activities",
        "Networking session",
        "Closing remarks"
      ],
      highlights: [
        `${category} focused event`,
        "Expert speakers",
        "Networking opportunities"
      ],
      venueType: "To be determined",
      suggestedDuration: 2,
      _aiError: error.message
    };
  }
};