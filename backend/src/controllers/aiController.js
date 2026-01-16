const { generateEventContent } = require('../services/geminiService');

exports.generate = async (req, res) => {
  try {
    console.log("[AI CONTROLLER] Generate request received");
    console.log("[AI CONTROLLER] User:", req.user);
    console.log("[AI CONTROLLER] Body:", req.body);
    
    const { title, idea, category, audience } = req.body;
    
    // Validate required fields
    if (!title || !idea || !category) {
      console.log("[AI CONTROLLER] Missing required fields");
      return res.status(400).json({ 
        message: 'Missing required fields',
        required: ['title', 'idea', 'category'],
        received: { title: !!title, idea: !!idea, category: !!category }
      });
    }
    
    console.log("[AI CONTROLLER] Calling Gemini service...");
    
    const result = await generateEventContent({ 
      title, 
      idea, 
      category, 
      audience: audience || 'general' 
    });
    
    console.log("[AI CONTROLLER] Generation successful");
    
    res.json(result);
  } catch (err) {
    console.error("[AI CONTROLLER] Error:", err);
    res.status(500).json({ 
      message: 'AI service error',
      error: err.message,
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
};