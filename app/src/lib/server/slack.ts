import { adminDb } from '$lib/server/db/index.js';
import { integrations } from '$lib/server/db/schema/index.js';
import { eq, and } from 'drizzle-orm';

interface SlackBlock {
	type: string;
	text?: { type: string; text: string };
	[key: string]: unknown;
}

interface SlackMessage {
	text: string;
	blocks?: SlackBlock[];
}

interface SlackConfig {
	enabled: boolean;
	webhookUrl: string;
	channel?: string;
	connectedAt?: string;
	connectedBy?: string;
}

/**
 * Send a notification to a team's Slack channel (fire-and-forget).
 * Returns silently if Slack is not configured for the team.
 */
export async function sendSlackNotification(teamId: string, message: SlackMessage) {
	try {
		const integration = await adminDb.query.integrations.findFirst({
			where: and(
				eq(integrations.teamId, teamId),
				eq(integrations.name, 'Slack'),
				eq(integrations.status, 'connected'),
			),
		});

		if (!integration) return;

		const config = integration.config as SlackConfig | null;
		if (!config?.enabled || !config.webhookUrl) return;

		const res = await fetch(config.webhookUrl, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(message),
		});

		if (!res.ok) {
			console.error(`Slack notification failed (${res.status}) for team ${teamId}`);
		}
	} catch (err) {
		console.error('Slack notification error:', err);
	}
}

// ── Message formatting helpers ──────────────────────────────────────────────

export function slackTaskCreated(title: string, listingAddress?: string): SlackMessage {
	const where = listingAddress ? ` on ${listingAddress}` : '';
	const text = `Task created: ${title}${where}`;
	return {
		text,
		blocks: [{ type: 'section', text: { type: 'mrkdwn', text: `*Task created:* ${title}${where}` } }],
	};
}

export function slackTaskCompleted(title: string, listingAddress?: string): SlackMessage {
	const where = listingAddress ? ` on ${listingAddress}` : '';
	const text = `Task completed: ${title}${where}`;
	return {
		text,
		blocks: [{ type: 'section', text: { type: 'mrkdwn', text: `*Task completed:* ${title}${where}` } }],
	};
}

export function slackQuoteReceived(vendorName: string, amount: string, listingAddress?: string): SlackMessage {
	const where = listingAddress ? ` for ${listingAddress}` : '';
	const text = `Quote received from ${vendorName}${where} — $${amount}`;
	return {
		text,
		blocks: [{ type: 'section', text: { type: 'mrkdwn', text: `*Quote received* from ${vendorName}${where} — $${amount}` } }],
	};
}

export function slackQuoteApproved(vendorName: string, amount: string, listingAddress?: string): SlackMessage {
	const where = listingAddress ? ` for ${listingAddress}` : '';
	const text = `Quote approved: ${vendorName}${where} — $${amount}`;
	return {
		text,
		blocks: [{ type: 'section', text: { type: 'mrkdwn', text: `*Quote approved:* ${vendorName}${where} — $${amount}` } }],
	};
}

export function slackCostTracked(title: string, amount: string, listingAddress?: string): SlackMessage {
	const where = listingAddress ? ` on ${listingAddress}` : '';
	const text = `Cost tracked: ${title} — $${amount}${where}`;
	return {
		text,
		blocks: [{ type: 'section', text: { type: 'mrkdwn', text: `*Cost tracked:* ${title} — $${amount}${where}` } }],
	};
}

export function slackFieldNoteProcessed(summary: string, listingAddress?: string): SlackMessage {
	const where = listingAddress ? ` on ${listingAddress}` : '';
	const text = `Field note processed: ${summary}${where}`;
	return {
		text,
		blocks: [{ type: 'section', text: { type: 'mrkdwn', text: `*Field note processed:* ${summary}${where}` } }],
	};
}

export function slackGenericActivity(content: string): SlackMessage {
	return {
		text: content,
		blocks: [{ type: 'section', text: { type: 'mrkdwn', text: content } }],
	};
}
