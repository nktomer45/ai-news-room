/**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║              IMAGE AGENT 🖼️                                       ║
 * ║  Pipeline Stage: WriterAgent → ImageAgent → EditorAgent          ║
 * ║                                                                  ║
 * ║  1. Takes imagePrompt from each draft                            ║
 * ║  2. Generates image via Gemini Imagen 3                          ║
 * ║  3. Uploads generated image to Firebase Storage                  ║
 * ║  4. Attaches public imageUrl to draft context                    ║
 * ╚══════════════════════════════════════════════════════════════════╝
 */
require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { bucket } = require('../config/firebase');
const logger = require('../config/logger');
const path = require('path');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Generate an image using Gemini's Imagen model.
 * Returns a Buffer of image bytes.
 */
const generateImageBytes = async (prompt) => {
  // Use gemini-2.0-flash-preview-image-generation which supports image output
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash-preview-image-generation',
  });

  const result = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: `Generate a professional, high-quality news article header image: ${prompt}. Style: photorealistic, editorial, clean composition.` }] }],
    generationConfig: { responseModalities: ['IMAGE', 'TEXT'] },
  });

  const response = result.response;
  const parts = response.candidates?.[0]?.content?.parts || [];

  for (const part of parts) {
    if (part.inlineData?.mimeType?.startsWith('image/')) {
      return {
        buffer: Buffer.from(part.inlineData.data, 'base64'),
        mimeType: part.inlineData.mimeType,
      };
    }
  }

  throw new Error('No image data returned from Gemini Imagen.');
};

/**
 * Upload an image buffer to Firebase Storage and return public URL.
 */
const uploadToFirebase = async (buffer, mimeType, filename) => {
  if (!bucket) {
    throw new Error('Firebase bucket not initialized.');
  }

  const extension = mimeType === 'image/png' ? 'png' : 'jpg';
  const destination = `articles/images/${filename}.${extension}`;

  const file = bucket.file(destination);

  await file.save(buffer, {
    metadata: {
      contentType: mimeType,
      cacheControl: 'public, max-age=31536000',
    },
  });

  // Make file publicly accessible
  await file.makePublic();

  const publicUrl = `https://storage.googleapis.com/${bucket.name}/${destination}`;
  logger.info(`[ImageAgent] Uploaded: ${publicUrl}`);
  return publicUrl;
};

/**
 * Main Image Agent function — called by orchestrator after WriterAgent.
 */
const imageAgent = async (ctx) => {
  const { drafts } = ctx;

  if (!drafts || drafts.length === 0) {
    logger.warn('[ImageAgent] No drafts to generate images for.');
    return ctx;
  }

  const useMock = !process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key';
  const firebaseEnabled = !!bucket;

  logger.info(`[ImageAgent] 🖼️ Generating images for ${drafts.length} articles... (Firebase: ${firebaseEnabled ? 'ON' : 'OFF'})`);

  const enrichedDrafts = await Promise.all(
    drafts.map(async (draft) => {
      const imagePrompt = draft.imagePrompt || `News article illustration for: ${draft.plan?.topic || draft.title}`;
      const slug = draft.plan?.slug || draft.title?.toLowerCase().replace(/[^a-z0-9]/g, '-') || `article-${Date.now()}`;
      const filename = `${slug}-${Date.now()}`;

      // ── Mock mode if no API key ──
      if (useMock || !firebaseEnabled) {
        const fallbackUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(draft.plan?.topic || 'AI News')}&background=1a1a1a&color=f59e0b&size=1200`;
        logger.info(`[ImageAgent] Mock image for "${draft.title}": ${fallbackUrl}`);
        return { ...draft, imageUrl: fallbackUrl };
      }

      try {
        logger.info(`[ImageAgent] Generating image for: "${draft.title}"`);

        const { buffer, mimeType } = await generateImageBytes(imagePrompt);
        const imageUrl = await uploadToFirebase(buffer, mimeType, filename);

        logger.info(`[ImageAgent] ✅ Image ready for "${draft.title}"`);
        return { ...draft, imageUrl };

      } catch (err) {
        logger.warn(`[ImageAgent] ⚠️ Image generation failed for "${draft.title}": ${err.message}. Using fallback.`);

        // Graceful fallback — use a placeholder so article isn't blocked
        const fallbackUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(draft.plan?.topic || 'AI News')}&background=1a1a1a&color=f59e0b&size=1200`;
        return { ...draft, imageUrl: fallbackUrl };
      }
    })
  );

  logger.info(`[ImageAgent] ✅ Image generation complete for ${enrichedDrafts.length} articles.`);
  return { ...ctx, drafts: enrichedDrafts };
};

module.exports = imageAgent;
