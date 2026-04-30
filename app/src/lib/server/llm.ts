import Anthropic from '@anthropic-ai/sdk';
import { env } from '$env/dynamic/private';

export function getAnthropicClient(userId?: string, sessionId?: string) {
  const anthropicKey = env.ANTHROPIC_API_KEY ?? '';
  const tokentapUrl = env.TOKENTAP_URL;
  const tokentapKey = env.TOKENTAP_KEY;

  // When routing through Token Tap, use the tt_ key as the API key
  // (Token Tap checks x-api-key header for auth, then injects the real Anthropic key)
  const apiKey = tokentapUrl && tokentapKey ? tokentapKey : anthropicKey;

  const headers: Record<string, string> = {};
  if (userId) headers['X-TokenTap-User'] = userId;
  if (sessionId) headers['X-TokenTap-Session'] = sessionId;

  return new Anthropic({
    apiKey,
    ...(tokentapUrl ? { baseURL: `${tokentapUrl}/anthropic/v1` } : {}),
    defaultHeaders: Object.keys(headers).length > 0 ? headers : undefined,
  });
}
