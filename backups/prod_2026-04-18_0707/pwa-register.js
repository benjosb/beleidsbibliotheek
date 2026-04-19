/**
 * Registreert service worker voor PWA-lite (manifest staat in <link rel="manifest">).
 * Werkt op HTTPS en op http://localhost voor lokaal testen.
 */
(function () {
  if (!('serviceWorker' in navigator)) return;

  var host = location.hostname || '';
  var okProto = location.protocol === 'https:' ||
    host === 'localhost' ||
    host === '127.0.0.1' ||
    host === '[::1]';
  if (!okProto) return;

  function baseFromScript() {
    var el = document.querySelector('script[data-pwa-register][src]');
    if (el && el.src) {
      try {
        return new URL('.', el.src).href;
      } catch (e) { /* ignore */ }
    }
    return location.origin + location.pathname.replace(/[^/]*$/, '');
  }

  window.addEventListener('load', function () {
    var base = baseFromScript();
    var swUrl = new URL('sw.js', base).href;
    var scopeUrl = new URL('./', base).href;
    navigator.serviceWorker.register(swUrl, { scope: scopeUrl }).catch(function () {
      /* stil falen — site blijft gewoon werken */
    });
  });
})();
