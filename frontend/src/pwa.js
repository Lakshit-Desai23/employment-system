export function registerPWA() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('PWA ServiceWorker registered successfully:', registration.scope);
        })
        .catch((err) => {
          console.error('PWA ServiceWorker registration failed:', err);
        });
    });
  }
}
