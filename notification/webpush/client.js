const publicVapidKey = "BJthRQ5myDgc7OSXzPCMftGw-n16F7zQBEN7EUD6XxcfTTvrLGWSIG7y_JxiWtVlCFua0S8MTB5rPziBqNx1qIo";

// Register SW, Register Push, Send Push
async function pushNotification() {
  if (!("serviceWorker" in navigator)) {
    return;
  }
  // Register Service Worker
  console.log("Registering service worker...");
  const serviceWorkerRegistration = await navigator.serviceWorker.register("/service-worker.js", {
    scope: "/"
  });
  console.log("Service Worker Registered...");

  // Register Push
  console.log("Registering Push...");
  /**
   * pushSubscription {
   *  endpoint: <string>,
   *  expirationTime: <number>,
   *  options: <object>,
   *  subscriptionId: <string>
   * }
   */
  const subscription = await serviceWorkerRegistration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
  });
  console.log("Push Registered...");

  // Send Push Notification
  console.log("Sending Push...");
  await fetch("http://localhost:5000/subscribe", {
    method: "POST",
    body: JSON.stringify(subscription),
    headers: {
      "content-type": "application/json"
    }
  });
  console.log("Push Sent...");
}

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, "+")
    .replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

document.querySelector('.trigger-push').addEventListener('click', () => {
  pushNotification().catch(error => console.error(error));
});
