import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import fs from 'fs';
import path from 'path';

export default defineConfig({
	plugins: [sveltekit()],
	ssr: {
		noExternal: ['chart.js']
	},
	server: {
		https: {
			key: fs.readFileSync('/home/pi/192.168.116.60-key.pem'),
			cert: fs.readFileSync('/home/pi/192.168.116.60.pem')
		}
	}
});
