self.addEventListener('push', function (event) {
	if (!event.data) return;

	var data = event.data.json();

	var options = {
		body: data.body,
		icon: data.icon || '/icon-192x192.png',
		badge: '/icon-192x192.png',
		data: { url: data.url || '/' },
	};

	event.waitUntil(self.registration.showNotification(data.title, options));
});

self.addEventListener('notificationclick', function (event) {
	event.notification.close();

	var url = event.notification.data && event.notification.data.url ? event.notification.data.url : '/';

	event.waitUntil(
		self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
			for (var i = 0; i < clientList.length; i++) {
				if (clientList[i].url.indexOf(url) !== -1 && 'focus' in clientList[i]) {
					return clientList[i].focus();
				}
			}
			return self.clients.openWindow(url);
		})
	);
});
