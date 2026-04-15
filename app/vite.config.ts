import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { readFileSync, existsSync } from 'fs';
import { defineConfig } from 'vite';

const certPath = '.certs/cert.pem';
const keyPath = '.certs/key.pem';
const hasCerts = existsSync(certPath) && existsSync(keyPath);

export default defineConfig({
	plugins: [tailwindcss(), sveltekit()],
	server: {
		host: 'local.hometrack.co',
		port: 5174,
		https: hasCerts
			? { cert: readFileSync(certPath), key: readFileSync(keyPath) }
			: undefined,
	},
});
