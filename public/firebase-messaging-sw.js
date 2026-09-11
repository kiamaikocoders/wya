/* Firebase web push — must stay at /firebase-messaging-sw.js */
importScripts('https://www.gstatic.com/firebasejs/11.0.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/11.0.2/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'AIzaSyCb2uPNDKbB1SDBvdyVdjzC9BNVwQSRKwQ',
  authDomain: 'wya254.firebaseapp.com',
  projectId: 'wya254',
  storageBucket: 'wya254.firebasestorage.app',
  messagingSenderId: '999495041218',
  appId: '1:999495041218:web:a3a1acd70a0ad9621dfb5b',
  measurementId: 'G-0VMRDVHDCD',
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || payload.data?.title || 'WYA';
  const body = payload.notification?.body || payload.data?.body || '';
  const link = payload.data?.link || '/notifications';
  return self.registration.showNotification(title, {
    body,
    icon: '/favicon.ico',
    data: { link },
  });
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const link = event.notification.data?.link || '/notifications';
  const url = new URL(link, self.location.origin).href;
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.url.startsWith(self.location.origin) && 'focus' in client) {
          client.navigate?.(url);
          return client.focus();
        }
      }
      return self.clients.openWindow(url);
    }),
  );
});
