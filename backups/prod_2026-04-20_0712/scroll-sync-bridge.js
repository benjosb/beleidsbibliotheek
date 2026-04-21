/**
 * Scroll-sync voor docs/vergelijk.html (ACC ↔ PROD naast elkaar).
 * Alleen actief als deze pagina in een iframe zit; stuurt scrollpositie als ratio naar parent.
 */
(function () {
  'use strict';
  if (window.parent === window) return;

  var ignoreUntil = 0;

  function maxScroll() {
    var el = document.documentElement;
    return Math.max(0, el.scrollHeight - el.clientHeight);
  }

  function sendRatio() {
    if (Date.now() < ignoreUntil) return;
    var m = maxScroll();
    var ratio = m > 0 ? window.scrollY / m : 0;
    try {
      parent.postMessage({ type: 'bb-scroll-sync', ratio: ratio }, '*');
    } catch (e) {}
  }

  var scrollTimer;
  window.addEventListener(
    'scroll',
    function () {
      clearTimeout(scrollTimer);
      scrollTimer = setTimeout(sendRatio, 32);
    },
    { passive: true }
  );

  window.addEventListener('message', function (e) {
    if (e.source !== window.parent) return;
    var d = e.data;
    if (!d || d.type !== 'bb-scroll-sync-apply' || typeof d.ratio !== 'number') return;
    ignoreUntil = Date.now() + 220;
    var m = maxScroll();
    var top = Math.max(0, Math.min(m, d.ratio * m));
    window.scrollTo({ top: top, left: 0, behavior: 'auto' });
  });
})();
