import "server-only";
import { GoogleGenAI } from "@google/genai";
import { getServerEnv } from "@/lib/server-env";

let cachedClient: GoogleGenAI | null = null;

/**
 * Returns a cached GoogleGenAI client initialized with the server's GEMINI_API_KEY.
 * Validates credentials lazily upon first call.
 */
export function getGeminiClient(): GoogleGenAI {
  if (cachedClient) {
    return cachedClient;
  }

  const env = getServerEnv();
  cachedClient = new GoogleGenAI({
    apiKey: env.GEMINI_API_KEY,
  });

  return cachedClient;
}

/**
 * Helper to retrieve active model configurations.
 */
export function getGeminiModelConfig() {
  const env = getServerEnv();
  return {
    primary: env.GEMINI_MODEL_PRIMARY,
    fallback: env.GEMINI_MODEL_FALLBACK,
    embedding: env.GEMINI_MODEL_EMBEDDING,
    isStub: env.AI_MODE === "stub",
  };
}
