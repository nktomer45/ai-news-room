require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Use a stable, high-performance model from the 2026 era
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

const generateArticle = async (topic) => {
  try {
    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key') {
      console.warn('Gemini API Key not provided. Using mock article generation.');
      return {
        title: `Mock Article: ${topic}`,
        summary: `This is a mock summary for ${topic}.`,
        content: `This is a mock full content for ${topic}. It discusses the latest trends and impact.`,
        tags: ['news', 'ai', 'update'],
        category: 'Tech'
      };
    }

    const prompt = `
Generate a unique, SEO-optimized news article about the topic: "${topic}".

RETURN ONLY VALID JSON. Do not include markdown code blocks or extra text.
Format:
{
  "title": "A catchy news headline",
  "summary": "A concise overview",
  "content": "Full article with at least 3 detailed paragraphs",
  "tags": ["tag1", "tag2"],
  "category": "Tech" (Choose from: Tech, Business, Sports, Entertainment, Health, Science)
}
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Clean any markdown if the model included it despite instructions
    const cleanJson = text.replace(/```json|```/g, '').trim();
    
    return JSON.parse(cleanJson);

  } catch (error) {
    console.error('Error in AI Article Generation:', error.message);
    throw error;
  }
};

module.exports = { generateArticle };