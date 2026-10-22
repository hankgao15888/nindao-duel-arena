/* Shared browser presence runs even while the chat window is closed. */
(() => {
  'use strict';
  const badges = [...document.querySelectorAll('[data-online-count]')];
  if (!badges.length) return;
  const api = /^(localhost|127\.0\.0\.1)$/.test(location.hostname)
    ? 'http://127.0.0.1:5173'
    : location.hostname.endsWith('.chatgpt.site') ? location.origin
    : 'https://nindao-duel-arena.blushcharm258.chatgpt.site';
  const endpoint = api + '/api/chat/presence';
  const key = 'arena-presence-visitor', tab = crypto.randomUUID();
  const uuid = /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
  let visitor = crypto.randomUUID(), active = true, controller, timer, lastSuccess = 0;
  function browserId() {
    try {
      const stored = localStorage.getItem(key);
      if (uuid.test(stored || '')) visitor = stored;
      else localStorage.setItem(key, visitor);
    } catch { /* Restricted storage still allows this page to participate. */ }
    return visitor;
  }
  function paint(count) {
    for (const badge of badges) {
      badge.querySelector('b').textContent = Number.isSafeInteger(count) ? count.toLocaleString('zh-CN') : '—';
      badge.classList.toggle('is-connected', Number.isSafeInteger(count));
      badge.title = Number.isSafeInteger(count)
        ? '约每 25 秒更新；同一浏览器多个页面计一人，断线约 90 秒后移除'
        : '在线人数暂时无法获取，恢复网络后会自动重试';
    }
  }
  async function heartbeat() {
    if (!active || controller) return;
    clearTimeout(timer);
    const pending = new AbortController(); controller = pending;
    const timeout = setTimeout(() => pending.abort(), 10000);
    try {
      const response = await fetch(endpoint, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visitor: browserId(), tab, action: 'ping' }),
        signal: pending.signal, credentials: 'omit', cache: 'no-store'
      });
      if (!response.ok) throw new Error('Presence unavailable');
      const data = await response.json();
      if (!Number.isSafeInteger(data.online) || data.online < 0) throw new Error('Invalid count');
      if (active) { lastSuccess = Date.now(); paint(data.online); }
    } catch {
      if (active && Date.now() - lastSuccess > 60000) paint(null);
    } finally {
      clearTimeout(timeout); controller = null;
      if (active) timer = setTimeout(heartbeat, 25000);
    }
  }
  addEventListener('pagehide', () => {
    active = false; clearTimeout(timer); controller?.abort();
    const body = JSON.stringify({ visitor: browserId(), tab, action: 'leave' });
    const sent = navigator.sendBeacon?.(endpoint, new Blob([body], { type: 'text/plain;charset=UTF-8' }));
    if (!sent) fetch(endpoint, { method: 'POST', body, keepalive: true, credentials: 'omit' }).catch(() => {});
  });
  addEventListener('pageshow', () => { active = true; heartbeat(); });
  addEventListener('online', heartbeat);
  addEventListener('offline', () => paint(null));
  document.addEventListener('visibilitychange', () => { if (!document.hidden) heartbeat(); });
  heartbeat();
})();
