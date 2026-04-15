import { env } from '$env/dynamic/private';

// ---------------------------------------------------------------------------
// Low-level transports
// ---------------------------------------------------------------------------

async function sendEmail(params: {
	to: string;
	subject: string;
	htmlBody: string;
	textBody?: string;
	tag?: string;
	from?: string;
}) {
	const apiKey = env.POSTMARK_API_KEY;
	if (!apiKey) {
		console.warn('POSTMARK_API_KEY not set — skipping email');
		return null;
	}

	const res = await fetch('https://api.postmarkapp.com/email', {
		method: 'POST',
		headers: {
			Accept: 'application/json',
			'Content-Type': 'application/json',
			'X-Postmark-Server-Token': apiKey,
		},
		body: JSON.stringify({
			From: params.from ?? env.POSTMARK_FROM_EMAIL ?? 'notifications@hometrack.co',
			To: params.to,
			Subject: params.subject,
			HtmlBody: params.htmlBody,
			TextBody: params.textBody,
			Tag: params.tag,
		}),
	});
	return res.json();
}

async function sendSMS(params: { to: string; body: string }) {
	const accountSid = env.TWILIO_ACCOUNT_SID;
	const authToken = env.TWILIO_AUTH_TOKEN;
	const fromNumber = env.TWILIO_FROM_NUMBER;
	if (!accountSid || !authToken || !fromNumber) {
		console.warn('Twilio not configured — skipping SMS');
		return null;
	}

	const res = await fetch(
		`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
		{
			method: 'POST',
			headers: {
				Authorization: 'Basic ' + btoa(`${accountSid}:${authToken}`),
				'Content-Type': 'application/x-www-form-urlencoded',
			},
			body: new URLSearchParams({
				From: fromNumber,
				To: params.to,
				Body: params.body,
			}),
		},
	);
	return res.json();
}

// ---------------------------------------------------------------------------
// High-level notification sender
// ---------------------------------------------------------------------------

export type NotificationType =
	| 'phase_change'
	| 'new_document'
	| 'showing_scheduled'
	| 'offer_received'
	| 'task_complete'
	| 'weekly_summary';

export async function sendNotification(params: {
	type: NotificationType;
	recipientEmail: string;
	recipientPhone?: string;
	emailEnabled: boolean;
	smsEnabled: boolean;
	subject: string;
	htmlBody: string;
	smsBody: string;
	tag?: string;
}) {
	const results: { email?: unknown; sms?: unknown } = {};

	if (params.emailEnabled) {
		results.email = await sendEmail({
			to: params.recipientEmail,
			subject: params.subject,
			htmlBody: params.htmlBody,
			tag: params.tag ?? params.type,
		});
	}

	if (params.smsEnabled && params.recipientPhone) {
		results.sms = await sendSMS({
			to: params.recipientPhone,
			body: params.smsBody,
		});
	}

	return results;
}

// ---------------------------------------------------------------------------
// Portal invite email
// ---------------------------------------------------------------------------

export async function sendPortalInvite(params: {
	clientEmail: string;
	clientName: string;
	teamName: string;
	portalUrl: string;
	listingAddress: string;
}) {
	return sendEmail({
		to: params.clientEmail,
		subject: `${params.teamName} shared a listing update with you`,
		htmlBody: buildPortalInviteEmail(params),
		tag: 'portal_invite',
	});
}

// ---------------------------------------------------------------------------
// Phase change notification
// ---------------------------------------------------------------------------

export async function sendPhaseChangeNotification(params: {
	recipientEmail: string;
	recipientPhone?: string;
	emailEnabled: boolean;
	smsEnabled: boolean;
	clientName: string;
	teamName: string;
	listingAddress: string;
	newPhase: string;
	portalUrl: string;
}) {
	const phaseLabel = params.newPhase.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

	return sendNotification({
		type: 'phase_change',
		recipientEmail: params.recipientEmail,
		recipientPhone: params.recipientPhone,
		emailEnabled: params.emailEnabled,
		smsEnabled: params.smsEnabled,
		subject: `${params.listingAddress} — Phase updated to ${phaseLabel}`,
		htmlBody: buildPhaseChangeEmail({
			clientName: params.clientName,
			teamName: params.teamName,
			listingAddress: params.listingAddress,
			phaseLabel,
			portalUrl: params.portalUrl,
		}),
		smsBody: `${params.teamName}: Your listing at ${params.listingAddress} has moved to ${phaseLabel}. View details: ${params.portalUrl}`,
	});
}

// ---------------------------------------------------------------------------
// Email templates
// ---------------------------------------------------------------------------

function emailWrapper(content: string): string {
	return `
<div style="font-family: Inter, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
  <h1 style="font-family: 'DM Serif Display', Georgia, serif; color: #1c1917; font-size: 24px; margin-bottom: 32px;">HomeTrack</h1>
  ${content}
  <p style="color: #a8a29e; font-size: 12px; margin-top: 40px; border-top: 1px solid #e7e5e4; padding-top: 16px;">
    Sent via HomeTrack
  </p>
</div>`;
}

function buildPortalInviteEmail(params: {
	clientName: string;
	teamName: string;
	portalUrl: string;
	listingAddress: string;
}): string {
	return emailWrapper(`
  <p style="color: #57534e; font-size: 16px; line-height: 1.6;">Hi ${params.clientName},</p>
  <p style="color: #57534e; font-size: 16px; line-height: 1.6;">
    ${params.teamName} has invited you to view updates on your property at <strong>${params.listingAddress}</strong>.
  </p>
  <a href="${params.portalUrl}" style="display: inline-block; background: #C4704B; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 20px 0;">
    View Your Portal
  </a>
  <p style="color: #a8a29e; font-size: 13px;">
    This link was sent by ${params.teamName} via HomeTrack.
  </p>`);
}

function buildPhaseChangeEmail(params: {
	clientName: string;
	teamName: string;
	listingAddress: string;
	phaseLabel: string;
	portalUrl: string;
}): string {
	return emailWrapper(`
  <p style="color: #57534e; font-size: 16px; line-height: 1.6;">Hi ${params.clientName},</p>
  <p style="color: #57534e; font-size: 16px; line-height: 1.6;">
    Your listing at <strong>${params.listingAddress}</strong> has moved to a new phase:
  </p>
  <div style="background: #fafaf9; border: 1px solid #e7e5e4; border-radius: 8px; padding: 16px; margin: 16px 0; text-align: center;">
    <p style="font-size: 18px; font-weight: 600; color: #1c1917; margin: 0;">${params.phaseLabel}</p>
  </div>
  <a href="${params.portalUrl}" style="display: inline-block; background: #C4704B; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 20px 0;">
    View Your Portal
  </a>
  <p style="color: #a8a29e; font-size: 13px;">
    Sent by ${params.teamName} via HomeTrack.
  </p>`);
}

export { sendEmail, sendSMS };
