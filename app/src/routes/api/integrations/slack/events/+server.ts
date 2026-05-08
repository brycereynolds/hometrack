import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';
import { adminDb } from '$lib/server/db/index.js';
import { integrations, teamMembers, teams } from '$lib/server/db/schema/index.js';
import { eq, and } from 'drizzle-orm';
import { getAnthropicClient } from '$lib/server/llm.js';
import { chatTools, executeToolCall } from '$lib/server/chat-tools.js';
import { createHmac, timingSafeEqual } from 'crypto';

function verifySlackSignature(
	signingSecret: string,
	signature: string,
	timestamp: string,
	body: string,
): boolean {
	// Reject requests older than 5 minutes to prevent replay attacks
	const now = Math.floor(Date.now() / 1000);
	if (Math.abs(now - parseInt(timestamp, 10)) > 300) return false;

	const basestring = `v0:${timestamp}:${body}`;
	const hmac = createHmac('sha256', signingSecret).update(basestring).digest('hex');
	const expected = `v0=${hmac}`;

	try {
		return timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
	} catch {
		return false;
	}
}

interface SlackConfig {
	enabled: boolean;
	method?: string;
	botToken?: string;
	workspaceId?: string;
	workspaceName?: string;
	webhookUrl?: string;
	connectedAt?: string;
	agentMemberId?: string;
	agentUserId?: string;
}

async function findTeamByWorkspace(
	workspaceId: string,
): Promise<{ integration: typeof integrations.$inferSelect; botTokenOverride?: string } | null> {
	const rows = await adminDb.query.integrations.findMany({
		where: and(eq(integrations.name, 'Slack'), eq(integrations.status, 'connected')),
	});

	// 1. Exact workspace ID match
	for (const row of rows) {
		const config = row.config as SlackConfig | null;
		if (config?.workspaceId === workspaceId) {
			return { integration: row };
		}
	}

	// 2. Any connected Slack integration (single-team setups)
	if (rows.length > 0) {
		console.warn(
			`[Slack Events] No integration matched workspace ${workspaceId}, falling back to first connected integration`,
		);
		return { integration: rows[0] };
	}

	// 3. Fall back to SLACK_BOT_TOKEN env var + first team in DB
	if (env.SLACK_BOT_TOKEN) {
		const firstTeam = await adminDb.query.teams.findFirst();
		if (firstTeam) {
			console.warn(
				`[Slack Events] No Slack integration found, using SLACK_BOT_TOKEN env var for team ${firstTeam.id}`,
			);
			// Build a synthetic integration row for the first team
			const syntheticIntegration = {
				id: 'env-fallback',
				teamId: firstTeam.id,
				name: 'Slack',
				status: 'connected',
				config: {} as SlackConfig,
				connectedById: null,
				createdAt: new Date(),
				updatedAt: new Date(),
			} as typeof integrations.$inferSelect;
			return { integration: syntheticIntegration, botTokenOverride: env.SLACK_BOT_TOKEN };
		}
	}

	return null;
}

function getBotToken(integration: typeof integrations.$inferSelect): string | undefined {
	const config = integration.config as SlackConfig | null;
	// Prefer per-team OAuth bot token, fall back to env for dev
	return config?.botToken || env.SLACK_BOT_TOKEN || undefined;
}

async function fetchThreadMessages(
	channel: string,
	threadTs: string,
	botToken: string,
): Promise<Array<{ user?: string; bot_id?: string; text: string; ts: string }>> {
	try {
		const resp = await fetch(
			`https://slack.com/api/conversations.replies?channel=${channel}&ts=${threadTs}`,
			{ headers: { Authorization: `Bearer ${botToken}` } },
		);
		const data = await resp.json();
		if (!data.ok || !data.messages) return [];
		return data.messages;
	} catch (err) {
		console.error('[Slack Events] Failed to fetch thread replies:', err);
		return [];
	}
}

async function isBotInThread(
	channel: string,
	threadTs: string,
	botToken: string,
): Promise<boolean> {
	const messages = await fetchThreadMessages(channel, threadTs, botToken);
	return messages.some((msg) => !!msg.bot_id);
}

function buildConversationHistory(
	threadMessages: Array<{ user?: string; bot_id?: string; text: string; ts: string }>,
): Array<{ role: 'user' | 'assistant'; content: string }> {
	const MAX_THREAD_MESSAGES = 20;
	const recent = threadMessages.slice(-MAX_THREAD_MESSAGES);

	return recent.map((msg) => ({
		role: msg.bot_id ? ('assistant' as const) : ('user' as const),
		content: msg.text.replace(/<@[A-Z0-9]+>/g, '').trim(),
	}));
}

async function processAppMention(
	event: {
		text: string;
		user: string;
		channel: string;
		thread_ts?: string;
		ts: string;
		team: string;
		channel_type?: string;
		files?: Array<{ url_private: string; name: string; mimetype: string }>;
	},
	integration: typeof integrations.$inferSelect,
	botTokenOverride?: string,
) {
	const botToken = botTokenOverride || getBotToken(integration);
	if (!botToken) {
		console.error('[Slack Events] No bot token available for team', integration.teamId);
		return;
	}

	// Strip the @mention from the text
	const userMessage = event.text.replace(/<@[A-Z0-9]+>/g, '').trim();
	if (!userMessage) return;

	// Prefer agent userId from integration config (RLS-compliant bot identity)
	const config = integration.config as SlackConfig | null;
	let userId: string | null = config?.agentUserId ?? null;
	let teamId = integration.teamId;

	// Fall back to connectedBy member or first team member
	if (!userId) {
		const member = integration.connectedById
			? await adminDb.query.teamMembers.findFirst({
					where: eq(teamMembers.id, integration.connectedById),
				})
			: await adminDb.query.teamMembers.findFirst({
					where: eq(teamMembers.teamId, integration.teamId),
				});

		if (!member || !member.userId) {
			console.error('[Slack Events] No team member found for team', integration.teamId);
			return;
		}
		userId = member.userId;
	}

	try {
		const client = getAnthropicClient(userId, `slack-${event.channel}-${event.ts}`);

		const systemPrompt = `You are HomeTrack's AI assistant responding in Slack. Be concise and helpful. Format responses using Slack mrkdwn (use *bold*, _italic_, \`code\`, and bullet points with -).

You have tools to look up listings, field notes, tasks, contacts, vendors, and search listings. Use them when the user asks about specific data.

You can look up data AND take actions on behalf of the team. Available actions: update task status, update task due dates, track costs, mark tasks as done. Always confirm what you did after taking an action.`;

		// Build conversation history from thread if available
		const threadTs = event.thread_ts;
		let messages: Array<{ role: 'user' | 'assistant'; content: any }>;

		if (threadTs) {
			const threadMessages = await fetchThreadMessages(event.channel, threadTs, botToken);
			if (threadMessages.length > 1) {
				messages = buildConversationHistory(threadMessages);
			} else {
				messages = [{ role: 'user', content: userMessage }];
			}
		} else {
			messages = [{ role: 'user', content: userMessage }];
		}

		// Tool-use loop (same pattern as chat API)
		const MAX_ROUNDS = 5;
		let round = 0;
		let finalText = '';

		while (round < MAX_ROUNDS) {
			round++;

			const response = await client.messages.create({
				model: 'claude-sonnet-4-6',
				max_tokens: 2048,
				system: systemPrompt,
				messages,
				tools: chatTools,
			});

			// Extract text content
			for (const block of response.content) {
				if (block.type === 'text') {
					finalText += block.text;
				}
			}

			// Check for tool use
			const toolUseBlocks = response.content.filter(
				(b): b is Extract<typeof b, { type: 'tool_use' }> => b.type === 'tool_use',
			);

			if (toolUseBlocks.length > 0 && response.stop_reason === 'tool_use') {
				messages.push({ role: 'assistant', content: response.content as any });

				const toolResults: any[] = [];
				for (const block of toolUseBlocks) {
					const result = await executeToolCall(
						block.name,
						block.input as Record<string, string>,
						userId,
						teamId,
					);
					toolResults.push({
						type: 'tool_result',
						tool_use_id: block.id,
						content: result,
					});
				}

				messages.push({ role: 'user', content: toolResults });
				finalText = ''; // Reset — we want only the final text response
			} else {
				break;
			}
		}

		if (!finalText) {
			finalText = "I couldn't generate a response. Please try again.";
		}

		// Post response back to Slack (in thread if applicable)
		await fetch('https://slack.com/api/chat.postMessage', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${botToken}`,
			},
			body: JSON.stringify({
				channel: event.channel,
				text: finalText,
				thread_ts: event.thread_ts || event.ts,
			}),
		});
	} catch (err) {
		console.error('[Slack Events] Error processing mention:', err);

		// Try to post an error message back
		const botToken2 = botTokenOverride || getBotToken(integration);
		if (botToken2) {
			await fetch('https://slack.com/api/chat.postMessage', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${botToken2}`,
				},
				body: JSON.stringify({
					channel: event.channel,
					text: 'Sorry, I ran into an error processing your message. Please try again.',
					thread_ts: event.thread_ts || event.ts,
				}),
			}).catch(() => {});
		}
	}
}

export const POST: RequestHandler = async ({ request }) => {
	const signingSecret = env.SLACK_SIGNING_SECRET;

	const rawBody = await request.text();
	const body = JSON.parse(rawBody);

	// URL Verification (Slack handshake) — no signature check needed for this
	if (body.type === 'url_verification') {
		return json({ challenge: body.challenge });
	}

	// Verify request signature
	if (signingSecret) {
		const signature = request.headers.get('x-slack-signature') || '';
		const timestamp = request.headers.get('x-slack-request-timestamp') || '';

		if (!verifySlackSignature(signingSecret, signature, timestamp, rawBody)) {
			console.error('[Slack Events] Invalid signature');
			return json({ error: 'Invalid signature' }, { status: 401 });
		}
	}

	// Process events
	if (body.type === 'event_callback') {
		const event = body.event;

		// Ignore bot's own messages
		if (event?.bot_id || event?.subtype === 'bot_message') {
			return json({ ok: true });
		}

		const isMention = event?.type === 'app_mention';
		const isDM = event?.type === 'message' && event?.channel_type === 'im';
		const isChannelThreadReply =
			event?.type === 'message' &&
			event?.channel_type !== 'im' &&
			event?.thread_ts &&
			event?.thread_ts !== event?.ts;

		let shouldProcess = isMention || isDM;

		// For channel thread replies, check if the bot is already in the thread
		if (!shouldProcess && isChannelThreadReply) {
			const workspaceId = body.team_id;
			const result = await findTeamByWorkspace(workspaceId);
			if (result) {
				const botToken =
					result.botTokenOverride || getBotToken(result.integration);
				if (botToken) {
					const botInThread = await isBotInThread(
						event.channel,
						event.thread_ts,
						botToken,
					);
					if (botInThread) {
						shouldProcess = true;
					}
				}
			}
		}

		if (shouldProcess) {
			const workspaceId = body.team_id;

			const result = await findTeamByWorkspace(workspaceId);
			if (result) {
				// Fire and forget — don't await
				processAppMention(event, result.integration, result.botTokenOverride).catch((err) => {
					console.error('[Slack Events] Background processing error:', err);
				});
			} else {
				console.warn('[Slack Events] No integration or fallback found for workspace', workspaceId);
			}
		}
	}

	// Always respond with 200 quickly
	return json({ ok: true });
};
