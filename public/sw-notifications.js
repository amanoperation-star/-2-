/* Service Worker Interactive Notification Handlers for Al-Mawaqeet */

self.addEventListener('notificationclick', function (event) {
  var notification = event.notification;
  var data = (notification && notification.data) || {};
  var prayerKey = data.prayerKey || 'dhuhr';
  var dateKey = data.dateKey || '';
  var action = event.action || 'open_details';

  if (notification && typeof notification.close === 'function') {
    notification.close();
  }

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then(function (clientList) {
        var targetUrl =
          '/?checkin_action=' +
          encodeURIComponent(action) +
          '&prayer=' +
          encodeURIComponent(prayerKey) +
          (dateKey ? '&date=' + encodeURIComponent(dateKey) : '');

        if (clientList && clientList.length > 0) {
          var firstClient = clientList[0];
          clientList.forEach(function (client) {
            try {
              client.postMessage({
                type: 'POST_PRAYER_ACTION',
                action: action,
                prayerKey: prayerKey,
                dateKey: dateKey,
              });
            } catch (e) {
              // ignore postMessage errors
            }
          });
          if (action !== 'complete_all' && typeof firstClient.focus === 'function') {
            return firstClient.focus();
          }
          return Promise.resolve();
        }

        if (self.clients && typeof self.clients.openWindow === 'function') {
          return self.clients.openWindow(targetUrl);
        }
        return Promise.resolve();
      })
  );
});
