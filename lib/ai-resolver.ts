import { getDecryptedAiConfig, getPlatformApiKey, getApiKeyForOrg } from './ai-config';

/**
 * AI Provider Resolution Service
 *
 * Resolves the appropriate AI model identifier based on organization configuration.
 * Uses AI SDK v5's provider:model string format (e.g., 'openai:gpt-4o').
 */

/**
 * Get AI model identifier for an organization
 *
 * Returns the model identifier string that the AI SDK can use.
 * The AI SDK will handle provider resolution based on environment variables.
 *
 * @param orgId - Clerk organization ID
 * @param modelType - Type of model to use ('chat' or 'embedding')
 * @returns Model identifier string
 *
 * @example
 * const model = await getAiModel(orgId, 'chat');
 * const result = await generateText({ model, prompt: '...' });
 */
export async function getAiModel(
  orgId: string,
  modelType: 'chat' | 'embedding' = 'chat'
): Promise<string> {
  const config = await getDecryptedAiConfig(orgId);

  // Return the model ID from config
  // The AI SDK v5 uses provider:model format
  return config.models[modelType];
}

/**
 * Get chat model identifier
 *
 * @param orgId - Clerk organization ID
 * @returns Chat model identifier
 */
export async function getChatModel(orgId: string): Promise<string> {
  return getAiModel(orgId, 'chat');
}

/**
 * Get embedding model identifier
 *
 * @param orgId - Clerk organization ID
 * @returns Embedding model identifier
 */
export async function getEmbeddingModel(orgId: string): Promise<string> {
  return getAiModel(orgId, 'embedding');
}

/**
 * Test AI configuration for an organization
 *
 * @param orgId - Clerk organization ID
 * @returns Test result with success status and message
 */
export async function testAiConfig(
  orgId: string
): Promise<{ success: boolean; message: string }> {
  try {
    const model = await getChatModel(orgId);
    const apiKey = await getApiKeyForOrg(orgId);

    // Set API key in process env temporarily for test
    const originalKey = process.env.OPENROUTER_API_KEY;
    process.env.OPENROUTER_API_KEY = apiKey;

    try {
      const { generateText } = await import('ai');
      await generateText({
        model,
        prompt: 'Say "test successful" if you can read this.',
      });

      return {
        success: true,
        message: 'AI configuration is valid and working',
      };
    } finally {
      // Restore original key
      if (originalKey) {
        process.env.OPENROUTER_API_KEY = originalKey;
      } else {
        delete process.env.OPENROUTER_API_KEY;
      }
    }
  } catch (error) {
    return {
      success: false,
      message: `AI configuration test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}
