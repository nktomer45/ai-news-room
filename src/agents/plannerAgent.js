/**
 * ╔═══════════════════════════════════════════════════════════════╗
 * ║              PLANNER AGENT 🧠                                  ║
 * ║  Agentic decision layer: decides which topics to pursue        ║
 * ║  and enriches context with writing strategy                    ║
 * ╚═══════════════════════════════════════════════════════════════╝
 */
require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const logger = require('../config/logger');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

const plannerAgent = async (ctx) => {
  const { topics } = ctx;

  if (!topics || topics.length === 0) {
    logger.warn('[PlannerAgent] No topics to plan for.');
    return { ...ctx, plans: [] };
  }

  logger.info(`[PlannerAgent] 🧠 Planning strategy for ${topics.length} topics...`);

  const useMock = !process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key';

  const plans = await Promise.all(
    topics.map(async (topic) => {
      if (useMock) {
        return {
          topic: topic.title,
          slug: topic.title.toLowerCase().replace(/[^a-z0-9]/g, '-'),
          angle: 'General news coverage',
          targetAudience: 'General readers',
          category: 'Tech',
          seoKeywords: [topic.title, 'news', 'update'],
          tone: 'neutral',
          wordCount: 200,
          sourceSnippet: topic.contentSnippet || '',
        };
      }

      try {
        const prompt = `
You are a senior news editor. Given the following trending topic, create a writing plan.

Topic: "${topic.title}"
Snippet: "${topic.contentSnippet || ''}"

Return pure JSON (no markdown):
{
  "angle": "The unique editorial angle or hook",
  "targetAudience": "Who this article is for",
  "category": "One of: Tech, Business, Entertainment, world",
  "seoKeywords": ["keyword1", "keyword2", "keyword3"],
  "tone": "urgent|informative|analytical|neutral",
  "wordCount": 200
}`;

        const result = await model.generateContent({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: 'application/json'
          }
        });
        
        const text = result.response.text();
        const plan = JSON.parse(text);

        return {
          topic: topic.title,
          slug: topic.title.toLowerCase().replace(/[^a-z0-9]/g, '-'),
          sourceLink: topic.link,
          sourceSnippet: topic.contentSnippet || '',
          ...plan,
        };
      } catch (err) {
        logger.error(`[PlannerAgent] Failed to plan for "${topic.title}": ${err.message}`);
        return {
          topic: topic.title,
          slug: topic.title.toLowerCase().replace(/[^a-z0-9]/g, '-'),
          angle: 'Breaking news coverage',
          targetAudience: 'General public',
          category: 'Tech',
          seoKeywords: [topic.title],
          tone: 'neutral',
          wordCount: 700,
          sourceSnippet: topic.contentSnippet || '',
        };
      }
    })
  );

  logger.info(`[PlannerAgent] ✅ Planning complete for ${plans.length} articles.`);
  return { ...ctx, plans };
};

module.exports = plannerAgent;
