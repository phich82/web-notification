console.log("[ServiceWorker] => Loaded...");

self.addEventListener("push", e => {
    const data = e.data ? e.data.json() : {};
    console.log("[ServiceWorker] => Push Recieved...");
    console.log("[ServiceWorker][Data] => ", data);
    console.log("[ServiceWorker] => Show the notifications to all clients.");
    self.registration.showNotification(data.title || '', {
        body: data.body || '',
        icon: data.icon || "http://image.ibb.co/frYOFd/tmlogo.png"
    });
});
