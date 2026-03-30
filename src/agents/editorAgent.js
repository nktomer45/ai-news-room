/**
 * ╔═══════════════════════════════════════════════════════════════╗
 * ║              EDITOR AGENT 📝                                   ║
 * ║  Reviews drafts for quality, structure, tone consistency       ║
 * ║  Flags issues and returns a score + edited content             ║
 * ╚═══════════════════════════════════════════════════════════════╝
 */
require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const logger = require('../config/logger');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

const editorAgent = async (ctx) => {
  const { drafts } = ctx;

  if (!drafts || drafts.length === 0) {
    logger.warn('[EditorAgent] No drafts to edit.');
    return { ...ctx, edited: [] };
  }

  logger.info(`[EditorAgent] 📝 Editing ${drafts.length} drafts...`);

  const useMock = !process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key';

  const edited = await Promise.all(
    drafts.map(async (draft) => {
      if (useMock) {
        return {
          ...draft,
          qualityScore: 85,
          editorNotes: 'Mock edit: content looks good.',
          passedEdit: true,
        };
      }

      try {
        const prompt = `
You are a senior news editor. Review this article draft and improve it.

DRAFT:
Title: ${draft.title}
Summary: ${draft.summary}
Content (first 200 chars): ${draft.content?.slice(0, 200)}

Check for:
1. Factual clarity and journalistic tone
2. Strong headline impact (SEO)
3. Summary is a proper meta description
4. Content flows logically with no repetition

Return the following structure in pure JSON (no markdown wrapping or backticks):
{
  "title": "Improved or unchanged title",
  "summary": "Improved or unchanged summary",
  "content": "Full improved article content",
  "qualityScore": 85,
  "editorNotes": "Brief notes on what was changed",
  "passedEdit": true
}`;

        const result = await model.generateContent({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: 'application/json'
          }
        });

        const text = result.response.text();
        const review = JSON.parse(text);

        logger.info(`[EditorAgent] "${draft.title}" — Score: ${review.qualityScore}, Passed: ${review.passedEdit}`);
        return { ...draft, ...review };
      } catch (err) {
        logger.error(`[EditorAgent] Failed to edit "${draft.title}": ${err.message}`);
        // Pass through with default score if editor fails
        return { ...draft, qualityScore: 70, editorNotes: 'Edit skipped due to error.', passedEdit: true };
      }
    })
  );

  const passed = edited.filter(d => d.passedEdit !== false);
  const rejected = edited.filter(d => d.passedEdit === false);

  logger.info(`[EditorAgent] ✅ ${passed.length} passed, ${rejected.length} rejected.`);
  return { ...ctx, edited: passed, rejectedByEditor: rejected };
};

module.exports = editorAgent;
