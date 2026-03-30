/**
 * ╔═══════════════════════════════════════════════════════════════╗
 * ║              WRITER AGENT ✍️                                   ║
 * ║  Takes the planner's strategy and writes a full SEO article    ║
 * ║  Returns: title, content, summary, tags, imagePrompt           ║
 * ╚═══════════════════════════════════════════════════════════════╝
 */
require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const logger = require('../config/logger');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

const writerAgent = async (ctx) => {
  const { plans } = ctx;

  if (!plans || plans.length === 0) {
    logger.warn('[WriterAgent] No plans to write from.');
    return { ...ctx, drafts: [] };
  }

  logger.info(`[WriterAgent] ✍️ Writing ${plans.length} articles...`);

  const useMock = !process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key';

  const drafts = await Promise.all(
    plans.map(async (plan) => {
      if (useMock) {
        return {
          plan,
          title: `Mock Article: ${plan.topic}`,
          summary: `A comprehensive overview of ${plan.topic} covering the latest developments.`,
          content: `## ${plan.topic}\n\nThis is a mock article about ${plan.topic}. ${plan.sourceSnippet}\n\n### Key Points\n\nLorem ipsum dolor sit amet, consectetur adipiscing elit. This article explores the impact of recent developments in ${plan.topic}.\n\n### Analysis\n\nFurther exploration of the topic reveals important trends that affect readers and industry observers alike.\n\n### Conclusion\n\nAs ${plan.topic} continues to evolve, staying informed remains essential for all stakeholders.`,
          tags: plan.seoKeywords || [plan.topic, 'news'],
          imagePrompt: `Professional news illustration for: ${plan.topic}`,
          wordCount: 180,
        };
      }

      try {
        const prompt = `
You are a professional news writer. Using the editorial plan below, write a complete, SEO-optimized news article.

EDITORIAL PLAN:
- Topic: ${plan.topic}
- Angle: ${plan.angle}
- Target Audience: ${plan.targetAudience}
- Tone: ${plan.tone}
- SEO Keywords: ${plan.seoKeywords?.join(', ')}
- Target Word Count: ${plan.wordCount}
- Background Context: ${plan.sourceSnippet}

Return the following structure in pure JSON (no markdown wrapping or backticks):
{
  "title": "Compelling SEO headline (under 70 chars)",
  "summary": "2-3 sentence meta description for SEO (under 160 chars)",
  "content": "Full article in markdown format. Use \n\n for paragraphs and ## for subheadings. Must be at least ${plan.wordCount} words.",
  "tags": ["tag1", "tag2"],
  "imagePrompt": "A vivid description for a header image"
}`;

        const result = await model.generateContent({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: 'application/json'
          }
        });
        
        const text = result.response.text();
        const article = JSON.parse(text);

        logger.info(`[WriterAgent] ✅ Drafted: "${article.title}"`);
        return { plan, ...article };
      } catch (err) {
        logger.error(`[WriterAgent] Failed to write "${plan.topic}": ${err.message}`);
        return null; // Will be filtered by Editor/QA
      }
    })
  );

  const validDrafts = drafts.filter(Boolean);
  logger.info(`[WriterAgent] Produced ${validDrafts.length}/${plans.length} valid drafts.`);

  return { ...ctx, drafts: validDrafts };
};

module.exports = writerAgent;
