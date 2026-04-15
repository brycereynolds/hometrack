import { Client, Connection } from '@temporalio/client';
import { env } from '$env/dynamic/private';

let _client: Client | null = null;

async function getTemporalClient(): Promise<Client | null> {
	const apiKey = env.TEMPORAL_API_KEY ?? '';
	if (!apiKey) {
		console.warn('TEMPORAL_API_KEY not set — skipping workflow trigger');
		return null;
	}
	if (_client) return _client;

	const address = env.TEMPORAL_ADDRESS ?? 'us-west-2.aws.api.temporal.io:7233';
	const namespace = env.TEMPORAL_NAMESPACE ?? 'quickstart-hometrack.w8bgj';

	try {
		const connection = await Connection.connect({
			address,
			apiKey,
			tls: true,
		});

		_client = new Client({ connection, namespace });
		console.log(`Temporal client connected to ${namespace}`);
		return _client;
	} catch (err) {
		console.error('Failed to connect to Temporal:', err);
		return null;
	}
}

export interface FieldMediaInput {
	mediaType: 'video' | 'voice_memo' | 'text';
	storagePath: string;
	listingId: string | null;
	teamId: string;
	authorId: string;
	authorName: string;
	metadata?: Record<string, unknown>;
}

export async function startFieldMediaWorkflow(input: FieldMediaInput) {
	const client = await getTemporalClient();
	if (!client) return null;

	try {
		const handle = await client.workflow.start('process_field_media', {
			taskQueue: 'field-media-processing',
			workflowId: `field-media-${input.mediaType}-${Date.now()}`,
			args: [input],
		});

		console.log(`Started workflow: ${handle.workflowId}`);
		return { workflowId: handle.workflowId };
	} catch (err) {
		console.error('Failed to start workflow:', err);
		return null;
	}
}
