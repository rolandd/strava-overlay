/// <reference types="@sveltejs/kit" />
/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />

import { build, files, version } from '$service-worker';

declare const self: ServiceWorkerGlobalScope;

const CACHE_NAME = `ride-overlay-v${version}`;
const ASSETS_TO_CACHE = [...build, ...files];

self.addEventListener('install', (event) => {
	event.waitUntil(
		caches.open(CACHE_NAME).then((cache) => {
			return cache.addAll(ASSETS_TO_CACHE);
		})
	);
	self.skipWaiting();
});

self.addEventListener('activate', (event) => {
	event.waitUntil(
		caches.keys().then((keys) => {
			return Promise.all(
				keys.map((key) => {
					if (key !== CACHE_NAME && key !== 'incoming-shares') {
						return caches.delete(key);
					}
				})
			);
		})
	);
	self.clients.claim();
});

self.addEventListener('fetch', (event) => {
	const url = new URL(event.request.url);

	// Intercept Android OS Share Target POST payload
	if (event.request.method === 'POST' && url.pathname === '/share-target') {
		event.respondWith(
			(async () => {
				try {
					const formData = await event.request.formData();
					const filesList: File[] = [];

					// Gather all uploaded files from form data
					for (const [, value] of formData.entries()) {
						if (value instanceof File && value.size > 0) {
							filesList.push(value);
						}
					}

					if (filesList.length > 0) {
						const cache = await caches.open('incoming-shares');
						// Clear previous pending shares
						const existingKeys = await cache.keys();
						await Promise.all(existingKeys.map((k) => cache.delete(k)));

						// Store files with index
						for (let i = 0; i < filesList.length; i++) {
							const file = filesList[i];
							const headers = new Headers();
							headers.set('content-type', file.type || 'image/png');
							headers.set('x-file-name', encodeURIComponent(file.name || `shared-${i}`));
							
							await cache.put(
								`/shared-file-${i}`,
								new Response(file, { headers })
							);
						}

						await cache.put(
							'/shared-meta',
							new Response(JSON.stringify({ count: filesList.length, timestamp: Date.now() }), {
								headers: { 'content-type': 'application/json' }
							})
						);
					}

					// HTTP 303 forces redirect from POST to GET
					return Response.redirect('/?incoming_share=true', 303);
				} catch (err) {
					console.error('Service worker share target handler failed:', err);
					return Response.redirect('/?incoming_share_error=true', 303);
				}
			})()
		);
		return;
	}

	// Cache-first runtime asset strategy for GET requests
	if (event.request.method === 'GET') {
		// Ignore non-http/https schemes (e.g. chrome-extension)
		if (!url.protocol.startsWith('http')) return;

		event.respondWith(
			caches.match(event.request).then((cachedResponse) => {
				if (cachedResponse) {
					return cachedResponse;
				}

				return fetch(event.request)
					.then((response) => {
						// Don't cache non-ok responses or non-GET requests
						if (!response || response.status !== 200 || response.type !== 'basic') {
							return response;
						}

						// Cache fetched static assets on the fly
						const responseToCache = response.clone();
						caches.open(CACHE_NAME).then((cache) => {
							cache.put(event.request, responseToCache);
						});

						return response;
					})
					.catch(() => {
						// Fallback for navigation requests when offline
						if (event.request.mode === 'navigate') {
							return caches.match('/index.html') as Promise<Response>;
						}
						return new Response('Network error and not in cache', { status: 408 });
					});
			})
		);
	}
});
