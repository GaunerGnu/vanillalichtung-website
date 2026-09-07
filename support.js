(() => {
  'use strict';

  const TOKEN = String(window.VL_TEBEX?.publicToken || '').trim();
  const PACKAGE_ID = '7661046';
  const API = 'https://headless.tebex.io/api';

  const form = document.getElementById('support-form');
  const submitButton = document.getElementById('support-submit');
  const status = document.getElementById('support-status');
  const manageButton = document.getElementById('manage-subscription');

  const PENDING_KEY = 'vl_tebex_basket_v2';
  const RETURN_URL = 'https://www.vanillalichtung.de/unterstuetzen.html?tebex_auth=1';
  const COMPLETE_URL = 'https://www.vanillalichtung.de/unterstuetzen-danke.html';
  const CANCEL_URL = 'https://www.vanillalichtung.de/unterstuetzen.html';

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
    if (label) label.textContent = busy ? 'Tebex wird geöffnet …' : 'Förderer werden';
  };

  const describe = value => {
    if (value instanceof Error && value.message) return value.message;
    if (typeof value === 'string' && value.trim()) return value.trim();
    try {
      const json = JSON.stringify(value);
      if (json && json !== '{}') return json;
    } catch {}
    return 'Unbekannter Fehler';
  };

  async function request(url, options = {}) {
    let response;
    try {
      response = await fetch(url, {
        ...options,
        headers: {
          Accept: 'application/json',
          ...(options.body ? { 'Content-Type': 'application/json' } : {}),
          ...(options.headers || {})
        }
      });
    } catch (error) {
      throw new Error(`Verbindung zu Tebex fehlgeschlagen (${describe(error)})`);
    }

    const raw = await response.text();
    let payload = null;
    if (raw) {
      try {
        payload = JSON.parse(raw);
      } catch {
        payload = raw;
      }
    }

    if (!response.ok) {
      let detail = '';
      if (payload && typeof payload === 'object') {
        detail = payload.detail || payload.message || payload.error || '';
        if (!detail && payload.errors) {
          try { detail = JSON.stringify(payload.errors); } catch {}
        }
      } else if (typeof payload === 'string') {
        detail = payload;
      }

      throw new Error(`Tebex HTTP ${response.status}${detail ? `: ${detail}` : ''}`);
    }

    return payload?.data ?? payload;
  }

  async function createBasket() {
    // Current official Tebex Headless CreateBasketRequest:
    // only complete_url, cancel_url, custom and complete_auto_redirect.
    const basket = await request(
      `${API}/accounts/${encodeURIComponent(TOKEN)}/baskets`,
      {
        method: 'POST',
        body: JSON.stringify({
          complete_url: COMPLETE_URL,
          cancel_url: CANCEL_URL,
          complete_auto_redirect: true,
          custom: {
            source: 'vanillalichtung.de',
            product: 'foerderer'
          }
        })
      }
    );

    if (!basket?.ident) {
      throw new Error('Tebex hat keinen gültigen Warenkorb erstellt.');
    }
    return basket;
  }

  async function getAuthUrl(ident) {
    const auth = await request(
      `${API}/accounts/${encodeURIComponent(TOKEN)}/baskets/${encodeURIComponent(ident)}/auth?returnUrl=${encodeURIComponent(RETURN_URL)}`
    );

    const methods = Array.isArray(auth) ? auth : [];
    const method =
      methods.find(item => /minecraft|mojang|java/i.test(String(item?.name || ''))) ||
      methods[0];

    if (!method?.url) {
      throw new Error('Tebex hat keine Minecraft-Anmeldung zurückgegeben.');
    }
    return method.url;
  }

  async function getBasket(ident) {
    const basket = await request(
      `${API}/accounts/${encodeURIComponent(TOKEN)}/baskets/${encodeURIComponent(ident)}`
    );
    if (!basket?.ident) {
      throw new Error('Der Tebex-Warenkorb konnte nach der Anmeldung nicht geladen werden.');
    }
    return basket;
  }

  async function addPackage(ident) {
    // Current official AddBasketPackageRequest only contains package_id + quantity.
    const basket = await request(
      `${API}/baskets/${encodeURIComponent(ident)}/packages`,
      {
        method: 'POST',
        body: JSON.stringify({
          package_id: PACKAGE_ID,
          quantity: 1
        })
      }
    );

    if (!basket?.ident) {
      throw new Error('Tebex konnte den Förderer nicht zum Warenkorb hinzufügen.');
    }
    return basket;
  }

  function openCheckout(basket) {
    const checkout = basket?.links?.checkout;
    if (!checkout) {
      throw new Error('Tebex hat keinen Checkout-Link zurückgegeben.');
    }
    window.location.assign(checkout);
  }

  async function startCheckout() {
    if (!TOKEN || TOKEN.includes('HIER_')) {
      setStatus('Der Tebex Public Token fehlt.', 'error');
      return;
    }

    setBusy(true);
    setStatus('Sicherer Tebex-Checkout wird vorbereitet …');

    try {
      const basket = await createBasket();
      sessionStorage.setItem(PENDING_KEY, basket.ident);

      const authUrl = await getAuthUrl(basket.ident);
      setStatus('Weiterleitung zu Tebex …', 'success');
      window.location.assign(authUrl);
    } catch (error) {
      sessionStorage.removeItem(PENDING_KEY);
      setBusy(false);
      setStatus(`Checkout konnte nicht gestartet werden: ${describe(error)}`, 'error');
    }
  }

  async function continueAfterAuth() {
    const ident = sessionStorage.getItem(PENDING_KEY);
    if (!ident) {
      setStatus('Die Tebex-Sitzung ist abgelaufen. Bitte starte den Checkout erneut.', 'error');
      return;
    }

    setBusy(true);
    setStatus('Minecraft-Account bestätigt. Checkout wird geöffnet …');

    try {
      const basket = await getBasket(ident);

      if (!basket.username_id) {
        throw new Error('Tebex hat keinen Minecraft-Account mit dem Warenkorb verknüpft.');
      }

      const updatedBasket = await addPackage(ident);
      sessionStorage.removeItem(PENDING_KEY);
      openCheckout(updatedBasket);
    } catch (error) {
      sessionStorage.removeItem(PENDING_KEY);
      setBusy(false);
      setStatus(`Checkout konnte nicht fortgesetzt werden: ${describe(error)}`, 'error');
    }
  }

  form?.addEventListener('submit', event => {
    event.preventDefault();
    startCheckout();
  });

  // Existing purchase/subscription management remains available via Tebex's portal.
  let tebexLoader = null;
  const loadTebex = () => {
    if (window.Tebex) return Promise.resolve(window.Tebex);
    if (tebexLoader) return tebexLoader;

    tebexLoader = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://js.tebex.io/v/1.js';
      script.async = true;
      script.onload = () => window.Tebex
        ? resolve(window.Tebex)
        : reject(new Error('Tebex.js wurde nicht initialisiert.'));
      script.onerror = () => reject(new Error('Tebex.js konnte nicht geladen werden.'));
      document.head.appendChild(script);
    });
    return tebexLoader;
  };

  manageButton?.addEventListener('click', async () => {
    manageButton.disabled = true;
    try {
      const Tebex = await loadTebex();
      Tebex.portal.init({ token: TOKEN, theme: 'dark' });
      Tebex.portal.launch();
    } catch (error) {
      setStatus(`Abo-Verwaltung konnte nicht geöffnet werden: ${describe(error)}`, 'error');
    } finally {
      manageButton.disabled = false;
    }
  });

  const params = new URLSearchParams(window.location.search);
  if (params.get('tebex_auth') === '1') {
    continueAfterAuth();
  }
})();
