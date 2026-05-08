import type { RequestHandler } from './$types';
import { getAnthropicClient } from '$lib/server/llm.js';

export const POST: RequestHandler = async ({ locals, request }) => {
  if (!locals.user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const { text } = await request.json();
  if (!text?.trim()) {
    return new Response(JSON.stringify({ error: 'text is required' }), { status: 400 });
  }

  try {
    const client = getAnthropicClient(locals.user.id, 'quote-parse');
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system: `You extract structured quote data from free-form text. The user will provide raw quote information (pasted email, description, etc.) and you must return a JSON object with:
{
  "amount": <total number or null>,
  "lineItems": [{"description": "string", "amount": number}],
  "vendorNotes": "string or null"
}

Rules:
- Extract individual line items with descriptions and amounts
- Calculate total amount as sum of line items if not explicitly stated
- If only a total is given with no breakdown, return a single line item
- Return ONLY valid JSON, no markdown fences or extra text`,
      messages: [{ role: 'user', content: text }],
    });

    const textBlock = response.content.find((b) => b.type === 'text');
    if (!textBlock || textBlock.type !== 'text') {
      throw new Error('No text response from LLM');
    }

    let jsonStr = textBlock.text.trim();
    if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    }

    const result = JSON.parse(jsonStr);

    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Quote parse error:', err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Parse failed' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
};
