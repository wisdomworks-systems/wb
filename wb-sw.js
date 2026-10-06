





'use strict';
self.addEventListener('install', function () { self.skipWaiting(); });
self.addEventListener('activate', function (e) { e.waitUntil(self.clients.claim()); });

self.addEventListener('push', function (e) {
  var d = {};
  try { d = e.data ? e.data.json() : {}; } catch (x) { d = { body: e.data ? e.data.text() : '' }; }
  var o = {
    body: String(d.body || ''),
    icon: 'icons/apple-touch-icon.png',
    data: { url: String(d.url || '') },
    requireInteraction: /^wbEnchou/.test(String(d.tag || ''))
  };
  if (d.tag) { o.tag = String(d.tag); o.renotify = true; }

  e.waitUntil(self.registration.showNotification(String(d.title || 'WorksBoard'), o));
});

self.addEventListener('notificationclick', function (e) {
  e.notification.close();
  var moto = self.registration.scope;
  var url = moto;
  try {
    var u = new URL((e.notification.data && e.notification.data.url) || '', moto);
    if (u.href.indexOf(moto) === 0) url = u.href;
  } catch (x) {  }
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (list) {
    for (var i = 0; i < list.length; i++) {
      var c = list[i];
      if (c.url.indexOf(moto) === 0 && 'focus' in c) return c.focus();
    }
    return self.clients.openWindow ? self.clients.openWindow(url) : null;
  }));
});
