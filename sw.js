// Service Worker — HelloArabic
// TODO: Phase 6 — implémenter cache-first / network-first / stale-while-revalidate

const CACHE_VERSION = 'v1.0.0';
const CACHE_NAME = `helloarabic-${CACHE_VERSION}`;

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', () => self.clients.claim());
