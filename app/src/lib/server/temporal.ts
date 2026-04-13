import { Client, Connection } from '@temporalio/client';
import { env } from '$env/dynamic/private';

const TEMPORAL_ADDRESS = env.TEMPORAL_ADDRESS ?? 'us-west-2.aws.api.temporal.io:7233';
const TEMPORAL_NAMESPACE = env.TEMPORAL_NAMESPACE ?? 'quickstart-hometrack.w8bgj';
const TEMPORAL_API_KEY = env.TEMPORAL_API_KEY ?? '';

let _client: Client | null = null;

async function getTemporalClient(): Promise<Client | null> {
	if (!TEMPORAL_API_KEY) {
		console.warn('TEMPORAL_API_KEY not set — skipping workflow trigger');
		return null;
	}
	if (_client) return _client;

	const connection = await Connection.connect({
		address: TEMPORAL_ADDRESS,
		apiKey: TEMPORAL_API_KEY,
		tls: true,
	});

	_client = new Client({ connection, namespace: TEMPORAL_NAMESPACE });
	return _client;
}

export interface FieldMediaInput {
	mediaType: 'video' | 'voice_memo' | 'text';
	storagePath: string;
	listingId: string;
	teamId: string;
	authorId: string;
	authorName: string;
	metadata?: Record<string, unknown>;
}

export async function startFieldMediaWorkflow(input: FieldMediaInput) {
	const client = await getTemporalClient();
	if (!client) return null;

	const handle = await client.workflow.start('process_field_media', {
		taskQueue: 'field-media-processing',
		workflowId: `field-media-${input.mediaType}-${Date.now()}`,
		args: [input],
	});

	return { workflowId: handle.workflowId };
}
