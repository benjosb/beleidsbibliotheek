/**
 * BeleidsBibliotheek — PWA-lite service worker
 * Geen offline-cache: altijd netwerk (frisse data). Wél voldoet dit aan “installable”-eisen in Chromium.
 * Bij wijzigingen: verhoog SW_VERSION zodat clients de nieuwe SW ophalen.
 */
const SW_VERSION = 'beleidsbib-pwa-1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  event.respondWith(fetch(event.request));
});
