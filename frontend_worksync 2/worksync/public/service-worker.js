const CACHE_NAME = 'worksync-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('push', (event) => {
  if (!event.data) return;

  try {
    const data = event.data.json();
    
    const notificationOptions = {
      body: data.message,
      icon: '/logo192.png',
      badge: '/favicon.ico',
      tag: data.notificationId || 'default',
      data: {
        url: data.url || '/',
        taskId: data.taskId
      },
      actions: data.taskId ? [
        { action: 'view', title: 'View Task' },
        { action: 'complete', title: 'Mark Complete' }
      ] : []
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title, notificationOptions)
    );
  } catch (err) {
    console.error('Error handling push notification:', err);
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const notificationData = event.notification.data;
  const urlToOpen = notificationData.url || '/';
  
  if (event.action === 'complete' && notificationData.taskId) {
    event.waitUntil(
      fetch(`/api/tasks/${notificationData.taskId}/complete`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      }).then(() => {
        self.registration.showNotification('Task Completed', {
          body: 'The task has been marked as complete!',
          icon: '/logo192.png',
          tag: 'task-action-confirmation'
        });
      })
    );
    return;
  }
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((windowClients) => {
        const matchingClient = windowClients.find(
          client => client.url.includes(urlToOpen)
        );
        
        if (matchingClient) {
          return matchingClient.focus();
        }
        return clients.openWindow(urlToOpen);
      })
  );
});