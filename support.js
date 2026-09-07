(() => {
  'use strict';

  const form = document.getElementById('support-form');
  const usernameInput = document.getElementById('minecraft-name');
  const submitButton = document.getElementById('support-submit');
  const status = document.getElementById('support-status');
  const manageButton = document.getElementById('manage-subscription');
  const config = window.VL_TEBEX || {};
  const API = 'https://headless.tebex.io/api';
  const TEBEX_JS = 'https://js.tebex.io/v/1.js';

  const isConfigured = () => {
    const token = String(config.publicToken || '').trim();
    return token && !token.includes('HIER_');
  };

  const setStatus = (message, type = 'info') => {
    if (!status) return;
    status.textContent = message;
    status.dataset.type = type;
  };

  const setBusy = busy => {
    if (!submitButton) return;
    submitButton.disabled = busy;
    submitButton.setAttribute('aria-busy', String(busy));
    const label = submitButton.querySelector('.button-label');
    if (label) label.textContent = busy ? 'Checkout wird vorbereitet …' : 'Sicher zum Checkout';
  };

  const getJson = async (url, options = {}) => {
    const response = await fetch(url, {
      ...options,
      headers: {
        Accept: 'application/json',
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...(options.headers || {})
      }
    });
    let payload = null;
    try { payload = await response.json(); } catch { /* no JSON body */ }
    if (!response.ok) {
      const detail = payload?.detail || payload?.message || payload?.error || `HTTP ${response.status}`;
      throw new Error(String(detail));
    }
    return payload;
  };

  const unwrap = payload => payload?.data ?? payload;

  const getPackage = async token => {
    const payload = await getJson(`${API}/accounts/${encodeURIComponent(token)}/packages/${encodeURIComponent(config.packageSlug || 'foerderer')}`);
    const data = unwrap(payload);
    const item = Array.isArray(data) ? data[0] : data;
    if (!item?.id) throw new Error('Das Förderer-Paket konnte bei Tebex nicht gefunden werden.');
    return item;
  };

  const createBasket = async (token, username) => {
    const payload = await getJson(`${API}/accounts/${encodeURIComponent(token)}/baskets`, {
      method: 'POST',
      body: JSON.stringify({
        username,
        complete_url: 'https://www.vanillalichtung.de/unterstuetzen-danke.html',
        cancel_url: 'https://www.vanillalichtung.de/unterstuetzen.html',
        complete_auto_redirect: true,
        custom: { source: 'vanillalichtung.de' }
      })
    });
    const basket = unwrap(payload);
    if (!basket?.ident) throw new Error('Tebex konnte keinen Warenkorb erstellen.');
    return basket;
  };

  const addPackage = async (basketIdent, packageId) => {
    const payload = await getJson(`${API}/baskets/${encodeURIComponent(basketIdent)}/packages`, {
      method: 'POST',
      body: JSON.stringify({ package_id: String(packageId), quantity: 1 })
    });
    return unwrap(payload) || {};
  };

  let tebexLoader;
  const loadTebex = () => {
    if (window.Tebex) return Promise.resolve(window.Tebex);
    if (tebexLoader) return tebexLoader;
    tebexLoader = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = TEBEX_JS;
      script.async = true;
      script.onload = () => window.Tebex ? resolve(window.Tebex) : reject(new Error('Tebex.js wurde nicht initialisiert.'));
      script.onerror = () => reject(new Error('Der sichere Tebex-Checkout konnte nicht geladen werden.'));
      document.head.appendChild(script);
    });
    return tebexLoader;
  };

  const launchCheckout = async (basket, updatedBasket) => {
    const checkoutUrl = updatedBasket?.links?.checkout || basket?.links?.checkout || `https://pay.tebex.io/${encodeURIComponent(basket.ident)}`;
    try {
      const Tebex = await loadTebex();
      Tebex.checkout.init({
        ident: basket.ident,
        locale: 'de_DE',
        theme: 'dark',
        colors: [
          { name: 'primary', color: '#d3ee73' },
          { name: 'secondary', color: '#101a12' }
        ],
        closeOnPaymentComplete: false
      });
      Tebex.checkout.launch();
      setStatus('Der sichere Tebex-Checkout wurde geöffnet.', 'success');
    } catch (error) {
      console.warn('Tebex.js konnte nicht gestartet werden, Weiterleitung zum Checkout:', error);
      window.location.assign(checkoutUrl);
    }
  };

  form?.addEventListener('submit', async event => {
    event.preventDefault();
    const username = String(usernameInput?.value || '').trim();

    if (!/^[A-Za-z0-9_]{3,16}$/.test(username)) {
      setStatus('Bitte gib deinen Minecraft-Java-Namen mit 3–16 Zeichen ein.', 'error');
      usernameInput?.focus();
      return;
    }
    if (!isConfigured()) {
      setStatus('Der Förderer-Checkout wird gerade eingerichtet. Bitte versuche es später erneut.', 'error');
      return;
    }

    setBusy(true);
    setStatus('Minecraft-Account und Paket werden bei Tebex vorbereitet …');

    try {
      const token = String(config.publicToken).trim();
      const [pkg, basket] = await Promise.all([
        getPackage(token),
        createBasket(token, username)
      ]);
      const updatedBasket = await addPackage(basket.ident, pkg.id);
      await launchCheckout(basket, updatedBasket);
    } catch (error) {
      console.error('Förderer-Checkout fehlgeschlagen:', error);
      const message = /username|player|minecraft/i.test(error.message)
        ? 'Dieser Minecraft-Name konnte nicht bestätigt werden. Prüfe die Schreibweise und versuche es erneut.'
        : 'Der Checkout konnte gerade nicht gestartet werden. Bitte versuche es in einem Moment erneut.';
      setStatus(message, 'error');
    } finally {
      setBusy(false);
    }
  });

  manageButton?.addEventListener('click', async () => {
    if (!isConfigured()) {
      setStatus('Die Abo-Verwaltung wird gerade eingerichtet. Bitte versuche es später erneut.', 'error');
      return;
    }
    manageButton.disabled = true;
    try {
      const Tebex = await loadTebex();
      Tebex.portal.init({
        token: String(config.publicToken).trim(),
        theme: 'dark',
        colors: [
          { name: 'primary', color: '#d3ee73' },
          { name: 'secondary', color: '#101a12' }
        ]
      });
      Tebex.portal.launch();
    } catch (error) {
      console.error('Tebex Payment Portal konnte nicht geöffnet werden:', error);
      setStatus('Die Abo-Verwaltung konnte gerade nicht geöffnet werden.', 'error');
    } finally {
      manageButton.disabled = false;
    }
  });
})();
