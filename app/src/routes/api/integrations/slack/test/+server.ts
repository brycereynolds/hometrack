import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const body = await request.json();
	const webhookUrl = body.webhookUrl as string;

	if (!webhookUrl || !webhookUrl.startsWith('https://hooks.slack.com/')) {
		return json({ error: 'Invalid webhook URL' }, { status: 400 });
	}

	try {
		const res = await fetch(webhookUrl, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				blocks: [
					{
						type: 'section',
						text: {
							type: 'mrkdwn',
							text: '*HomeTrack is connected!*\nYou\'ll receive updates about quotes, tasks, and property activity right here.\n\n_This is a test message — if you see this, you\'re all set!_',
						},
					},
				],
			}),
		});

		if (!res.ok) {
			const text = await res.text();
			return json({ error: `Slack returned ${res.status}: ${text}` }, { status: 502 });
		}

		return json({ success: true });
	} catch (err) {
		console.error('Slack test message failed:', err);
		return json({ error: 'Failed to reach Slack' }, { status: 502 });
	}
};
