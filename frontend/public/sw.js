/* Cleanup service worker
 *
 * If a previous app registered a service worker on localhost, it can cache
 * webpack chunks and cause runtime errors like "Cannot read properties of
 * undefined (reading 'call')".
 *
 * This service worker installs, clears caches, unregisters itself, and then
 * refreshes any controlled pages.
 */

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      try {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      } catch {
        // ignore
      }

      try {
        await self.registration.unregister();
      } catch {
        // ignore
      }

      try {
        await self.clients.claim();
        const clients = await self.clients.matchAll({ type: 'window' });
        for (const client of clients) {
          client.navigate(client.url);
        }
      } catch {
        // ignore
      }
    })(),
  );
});
