/*
 Copyright 2016 Google Inc. All Rights Reserved.
 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at
 http://www.apache.org/licenses/LICENSE-2.0
 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */

// Names of the two caches used in this version of the service worker.
// Change to v2, etc. when you update any of the local resources, which will
// in turn trigger the install event again.
const PRECACHE = 'precache-v1';
const RUNTIME = 'runtime';
const ROOT_URL = 'notification.html';
// A list of local resources we always want to be cached.
const PRECACHE_URLS = [
    ROOT_URL,
    //   './', // Alias for index.html
    //   'styles.css',
    //   '../../styles/main.css',
    //   'demo.js'
];

// The install handler takes care of precaching the resources we always need.
self.addEventListener('install', e => {
    // Wait until promise is finished
    e.waitUntil(
        caches.open(PRECACHE)
            .then(cache => {
                console.log(`Service Worker: Caching Files: ${cache}`);
                cache.addAll(PRECACHE_URLS)
                    // When everything is set
                    .then(() => self.skipWaiting())
            })
    );
})

// The activate handler takes care of cleaning up old caches.
self.addEventListener('activate', event => {
    const currentCaches = [PRECACHE, RUNTIME];
    // Clean up old caches by looping through all of the
    // caches and deleting any old caches or caches that
    // are not defined in the list
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return cacheNames.filter(cacheName => !currentCaches.includes(cacheName));
        }).then(cachesToDelete => {
            return Promise.all(cachesToDelete.map(cacheToDelete => {
                return caches.delete(cacheToDelete);
            }));
        }).then(() => self.clients.claim())
    );
});

// The fetch handler serves responses for same-origin resources from a cache.
// If no response is found, it populates the runtime cache with the response
// from the network before returning it to the page.
self.addEventListener('fetch', event => {
    // Skip cross-origin requests, like those for Google Analytics.
    if (event.request.url.startsWith(self.location.origin)) {
        console.log('Service Worker: Fetching');
        event.respondWith(
            caches.match(event.request).then(cachedResponse => {
                if (cachedResponse) {
                    return cachedResponse;
                }
                return caches.open(RUNTIME).then(cache => {
                    // The response is a stream and in order the browser
                    // to consume the response and in the same time the
                    // cache consuming the response it needs to be
                    // cloned in order to have two streams.
                    return fetch(event.request).then(response => {
                        // Put a copy of the response in the runtime cache.
                        return cache.put(event.request, response.clone()).then(() => {
                            return response;
                        });
                    }).catch(err => caches.match(e.request).then(res => res));
                });
            })
        );
    }
});

/**
 * The message will receive messages sent from the application.
 * This can be useful for updating a service worker or messaging
 * other clients (browser restrictions currently exist)
 * https://developer.mozilla.org/en-US/docs/Web/API/Client/postMessage
 */
self.addEventListener('message', (event) => {
    console.log('[Service Worker] Message Event: ', event.data);
    // Process message sent from client here
});

/**
 * Listen for incoming Push events and notify to all clients
 */
self.addEventListener('push', (event) => {
    console.log('[ServiceWorker][OnPush] => Received.');
    console.log('[ServiceWorker][OnPush][Data] =>', event.data);
    if (!(self.Notification && self.Notification.permission === 'granted')) {
        return;
    }
    var data = event.data ? event.data.json() : {};
    var title = data.title || '';
    var message = data.message || '';
    var icon = "images/notification.png";
    var badge = 'images/badge.png';
    var options = {
        body: message,
        icon: icon,
        badge: badge
    };
    // Show notification on all clients
    event.waitUntil(self.registration.showNotification(title, options));
});

/**
 * Handle a notification click
 */
self.addEventListener('notificationclick', (event) => {
    console.log('[ServiceWorker][OnNotificationClick] => Start');
    console.log('[ServiceWorker][OnNotificationClick][Event] => ', event);

    // Close notification popup
    event.notification.close();

    // Open existing browser and focus it. Otherwise, open new tab with root scope url of service worker
    // Post message to client
    event.waitUntil(
        self.clients.matchAll({ type: 'window' }).then((clientList) => {
            if (clientList && clientList.length) {
                for (var i = 0; i < clientList.length; i++) {
                    var client = clientList[i];
                    if (client.url == (self.registration.scope + ROOT_URL) && 'focus' in client) {
                        console.log('[ServiceWorker][OnNotificationClick] => Focusing on the existing browser')
                        client.postMessage({
                            signal: event.notification.data.signal,
                            action: event.action || '',
                            location: `${self.location.protocol}//${self.location.host}`,
                            timestamp: new Date().getTime(),
                        });
                        console.log('[ServiceWorker][OnNotificationClick] => Message sent to client');
                        console.log('[ServiceWorker][OnNotificationClick] => End');
                        return client.focus();
                    }
                }
            }
            if (self.clients.openWindow) {
                console.log('[ServiceWorker][OnNotificationClick] => Opening new window');
                self.clients.openWindow(self.registration.scope + ROOT_URL).then(function(newWindowClient) {
                    var params = {
                        signal:  event.notification.data.signal,
                        action: event.action || '',
                        location: `${self.location.protocol}//${self.location.host}`,
                        timestamp: new Date().getTime()
                    };

                    console.log('[ServiceWorker][OnNotificationClick][NewWindow][OnLoad] => Post message to new window client');
                    console.log('[ServiceWorker][OnNotificationClick][NewWindow][OnLoad][PostMessage][Params] => ', params);

                    newWindowClient.postMessage(params);
                    console.log('[ServiceWorker][OnNotificationClick][NewWindow][OnLoad] => End');
                    console.log('[ServiceWorker][OnNotificationClick] => End');
                });
            } else {
                console.log('[ServiceWorker][OnNotificationClick] => Function [self.clients.openWindow] not exist.');
                console.log('[ServiceWorker][OnNotificationClick] => End');
            }
        })
    );
});
