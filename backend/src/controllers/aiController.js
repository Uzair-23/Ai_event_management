const { generateEventContent } = require('../services/geminiService');

exports.generate = async (req, res) => {
  try {
    const { title, idea, category, audience } = req.body;
    const result = await generateEventContent({ title, idea, category, audience });
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'AI service error' });
  }
};