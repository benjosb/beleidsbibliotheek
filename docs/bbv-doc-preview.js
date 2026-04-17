/**
 * Hover-preview voor documentlinks (.tv-doc-link).
 * — Eigen afbeelding: data-preview-image="https://..."
 * — Anders: Microlink API (screenshot / og:image / logo), geen mShots meer.
 * — Anders: kaart met favicon + titel + host (werkt altijd).
 * Let op: vanaf file:// kan fetch naar Microlink mislukken; gebruik een lokale server (http://localhost).
 */
(function () {
  'use strict';

  var HOVER_DELAY_MS = 280;
  var HIDE_DELAY_MS = 120;
  var showTimer = null;
  var hideTimer = null;
  var currentHref = null;
  var abortCtl = null;

  function esc(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/"/g, '&quot;');
  }

  function faviconForHref(href) {
    try {
      var u = new URL(href, window.location.href);
      if (u.protocol !== 'http:' && u.protocol !== 'https:') return '';
      return 'https://www.google.com/s2/favicons?sz=128&domain=' + encodeURIComponent(u.hostname);
    } catch (e) {
      return '';
    }
  }

  function hostLine(href) {
    try {
      return new URL(href, window.location.href).hostname;
    } catch (e) {
      return '';
    }
  }

  function ensureFloater() {
    var el = document.getElementById('bbv-doc-preview-floater');
    if (el) return el;
    el = document.createElement('div');
    el.id = 'bbv-doc-preview-floater';
    el.setAttribute('role', 'tooltip');
    el.innerHTML =
      '<div class="bbv-dp-frame">' +
      '<div class="bbv-dp-loading">Voorbeeld ophalen…</div>' +
      '<img class="bbv-dp-img" alt="" decoding="async" />' +
      '<div class="bbv-dp-fallback" hidden></div>' +
      '</div>' +
      '<p class="bbv-dp-caption"></p>';
    document.body.appendChild(el);
    return el;
  }

  function placeFloater(anchor) {
    var el = ensureFloater();
    var r = anchor.getBoundingClientRect();
    var fw = Math.min(440, window.innerWidth - 24);
    var left = r.left;
    if (left + fw > window.innerWidth - 12) left = window.innerWidth - fw - 12;
    if (left < 12) left = 12;
    var top = r.bottom + 8;
    var fh = 340;
    if (top + fh > window.innerHeight - 12) {
      top = r.top - fh - 8;
    }
    if (top < 12) top = 12;
    el.style.left = left + 'px';
    el.style.top = top + 'px';
    el.style.width = fw + 'px';
  }

  function setCaption(isImage) {
    var cap = document.querySelector('#bbv-doc-preview-floater .bbv-dp-caption');
    if (!cap) return;
    cap.textContent = isImage
      ? 'Pagina-voorbeeld (Microlink) · kan afwijken · bij PDF/login vaak geen beeld'
      : 'Geen screenshot beschikbaar · site-icoon en titel · open de link voor het volledige document';
  }

  function showRichFallback(fb, href, title) {
    var host = hostLine(href);
    var fav = faviconForHref(href);
    var t = title.length > 220 ? title.slice(0, 217) + '…' : title;
    fb.innerHTML =
      '<div class="bbv-dp-rich">' +
      (fav ? '<img class="bbv-dp-favicon" src="' + esc(fav) + '" width="52" height="52" alt="" />' : '') +
      '<div class="bbv-dp-rich-text">' +
      '<div class="bbv-dp-rich-title">' + esc(t) + '</div>' +
      (host ? '<div class="bbv-dp-rich-host">' + esc(host) + '</div>' : '') +
      '</div></div>';
    fb.hidden = false;
    setCaption(false);
  }

  function fetchPreviewUrl(href, signal) {
    var api =
      'https://api.microlink.io/?url=' +
      encodeURIComponent(href) +
      '&screenshot=true&meta=true&palette=false';
    return fetch(api, { signal: signal, mode: 'cors', credentials: 'omit' }).then(function (r) {
      return r.json();
    }).then(function (j) {
      var empty = { preview: null, pageTitle: '' };
      if (!j || j.status !== 'success' || !j.data) return empty;
      var d = j.data;
      var pageTitle = d.title ? String(d.title) : '';
      var preview = null;
      if (d.screenshot && d.screenshot.url) preview = { url: d.screenshot.url, kind: 'screenshot' };
      else if (d.image && d.image.url) preview = { url: d.image.url, kind: 'image' };
      else if (d.logo && d.logo.url) preview = { url: d.logo.url, kind: 'logo' };
      return { preview: preview, pageTitle: pageTitle };
    });
  }

  function showForAnchor(a) {
    if (!a || !a.getAttribute('href')) return;
    var href = a.getAttribute('href');
    var custom = a.getAttribute('data-preview-image');
    var title = a.getAttribute('data-doc-title') || a.textContent || '';

    if (abortCtl) {
      abortCtl.abort();
      abortCtl = null;
    }

    var el = ensureFloater();
    var img = el.querySelector('.bbv-dp-img');
    var load = el.querySelector('.bbv-dp-loading');
    var fb = el.querySelector('.bbv-dp-fallback');

    placeFloater(a);
    currentHref = href;

    load.style.display = '';
    img.style.display = 'none';
    img.removeAttribute('src');
    fb.hidden = true;
    fb.innerHTML = '';
    setCaption(true);

    if (custom && custom.trim()) {
      img.onload = null;
      img.onerror = null;
      img.referrerPolicy = 'no-referrer';
      img.onload = function () {
        if (currentHref !== href) return;
        load.style.display = 'none';
        img.style.display = 'block';
        fb.hidden = true;
        setCaption(true);
      };
      img.onerror = function () {
        if (currentHref !== href) return;
        load.style.display = 'none';
        img.style.display = 'none';
        showRichFallback(fb, href, title);
      };
      img.src = custom.trim();
      el.classList.add('is-visible');
      return;
    }

    abortCtl = new AbortController();
    var signal = abortCtl.signal;

    fetchPreviewUrl(href, signal)
      .then(function (res) {
        if (currentHref !== href || signal.aborted) return;
        var pv = res && res.preview;
        var metaTitle = (res && res.pageTitle) || '';
        var displayTitle = (title && title.trim()) || metaTitle || href;
        if (!pv || !pv.url) {
          load.style.display = 'none';
          showRichFallback(fb, href, displayTitle);
          el.classList.add('is-visible');
          return;
        }
        img.onload = null;
        img.onerror = null;
        img.referrerPolicy = 'no-referrer';
        img.onload = function () {
          if (currentHref !== href) return;
          load.style.display = 'none';
          img.style.display = 'block';
          fb.hidden = true;
          setCaption(true);
          el.classList.add('is-visible');
        };
        img.onerror = function () {
          if (currentHref !== href) return;
          load.style.display = 'none';
          img.style.display = 'none';
          showRichFallback(fb, href, displayTitle);
          el.classList.add('is-visible');
        };
        img.src = pv.url;
      })
      .catch(function () {
        if (currentHref !== href || signal.aborted) return;
        load.style.display = 'none';
        var displayTitle = (title && title.trim()) || href;
        showRichFallback(fb, href, displayTitle);
        el.classList.add('is-visible');
      });

    el.classList.add('is-visible');
  }

  function hideFloater() {
    if (abortCtl) {
      abortCtl.abort();
      abortCtl = null;
    }
    var el = document.getElementById('bbv-doc-preview-floater');
    if (el) el.classList.remove('is-visible');
    currentHref = null;
  }

  function onOver(e) {
    if (window.matchMedia('(hover: none)').matches) return;
    var a = e.target && e.target.closest && e.target.closest('a.tv-doc-link[href]');
    if (!a) return;
    clearTimeout(hideTimer);
    clearTimeout(showTimer);
    showTimer = setTimeout(function () {
      showForAnchor(a);
    }, HOVER_DELAY_MS);
  }

  function onOut(e) {
    if (window.matchMedia('(hover: none)').matches) return;
    var a = e.target && e.target.closest && e.target.closest('a.tv-doc-link');
    var rel = e.relatedTarget;
    if (a && rel && a.contains(rel)) return;
    clearTimeout(showTimer);
    hideTimer = setTimeout(hideFloater, HIDE_DELAY_MS);
  }

  function bind() {
    if (window.__bbvDocPreviewBound) return;
    window.__bbvDocPreviewBound = true;
    document.addEventListener('mouseover', onOver, true);
    document.addEventListener('mouseout', onOut, true);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bind);
  } else {
    bind();
  }

  window.BBV_refreshDocPreview = function () {};
})();
