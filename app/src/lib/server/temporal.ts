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

export interface MarketAnalysisInput {
	analysisId: string;
	listingId: string;
	teamId: string;
	address: string;
	city: string;
	state: string;
	zip: string;
	lat: number | null;
	lng: number | null;
	beds: number | null;
	baths: number | null;
	sqft: number | null;
	propertyType: string | null;
	searchParams: Record<string, unknown>;
	prompt?: string;
}

export async function startMarketAnalysisWorkflow(input: MarketAnalysisInput) {
	const client = await getTemporalClient();
	if (!client) return null;

	try {
		const handle = await client.workflow.start('MarketAnalysis', {
			taskQueue: 'field-media-processing',
			workflowId: `market-analysis-${input.analysisId}`,
			args: [input],
		});

		console.log(`Started market analysis workflow: ${handle.workflowId}`);
		return { workflowId: handle.workflowId };
	} catch (err) {
		console.error('Failed to start market analysis workflow:', err);
		return null;
	}
}

export async function startFieldMediaWorkflow(input: FieldMediaInput) {
	const client = await getTemporalClient();
	if (!client) return null;

	try {
		const handle = await client.workflow.start('ProcessFieldMedia', {
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
