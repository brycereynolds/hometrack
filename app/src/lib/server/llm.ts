import Anthropic from '@anthropic-ai/sdk';
import { env } from '$env/dynamic/private';

export function getAnthropicClient(userId?: string, sessionId?: string) {
  const apiKey = env.ANTHROPIC_API_KEY ?? '';
  const tokentapUrl = env.TOKENTAP_URL;
  const tokentapKey = env.TOKENTAP_KEY;

  const headers: Record<string, string> = {};
  if (tokentapKey) headers['X-TokenTap-Key'] = tokentapKey;
  if (userId) headers['X-TokenTap-User'] = userId;
  if (sessionId) headers['X-TokenTap-Session'] = sessionId;

  return new Anthropic({
    apiKey,
    ...(tokentapUrl ? { baseURL: `${tokentapUrl}/anthropic/v1` } : {}),
    defaultHeaders: Object.keys(headers).length > 0 ? headers : undefined,
  });
}
