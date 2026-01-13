self.addEventListener('fetch', (event) => {
  // Bạn có thể tùy chỉnh phản hồi nếu muốn:
  event.respondWith(
    fetch(event.request).then(response => {
      //check coccoc
      // Gửi thông điệp đến ứng dụng
      self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({ urls: event.request.url });
        });
      });
      console.log(event.request.url);
      if (event.request.url.includes('common.css') || event.request.url.includes('logo_cc.svg')) {
        // Gửi thông điệp đến ứng dụng
        self.clients.matchAll().then(clients => {
          clients.forEach(client => {
            client.postMessage({ type: 'FORBIDDEN' });
          });
        });

        // Trả về phản hồi 403
        return new Response('Forbidden', {
          status: 403,
          statusText: 'Forbidden',
          headers: { 'Content-Type': 'text/plain' }
        });
      }
      return response;
    }).catch(error => {
      // console.error('Fetch failed:', error);
      return new Response('Failed to fetch data');
    })
  );
});