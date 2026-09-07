(() => {
  'use strict';

  const form = document.getElementById('support-form');
  const usernameInput = document.getElementById('minecraft-name');
  const submitButton = document.getElementById('support-submit');
  const status = document.getElementById('support-status');
  const manageButton = document.getElementById('manage-subscription');

  const config = window.VL_TEBEX || {};
  const API = 'https://headless.tebex.io/api';
  const PACKAGE_ID = '7661046';

  const token = () => String(config.publicToken || '').trim();

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
    if (label) {
      label.textContent = busy ? 'Checkout wird vorbereitet …' : 'Sicher zum Checkout';
    }
  };

  const describeError = value => {
    if (value instanceof Error && value.message) return value.message;
    if (typeof value === 'string' && value.trim()) return value.trim();
    try {
      const text = JSON.stringify(value);
      if (text && text !== '{}') return text;
    } catch (_) {}
    return 'Unbekannter Fehler';
  };

  const requestJson = async (url, options = {}) => {
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
      throw new Error(`Verbindung zu Tebex fehlgeschlagen: ${describeError(error)}`);
    }

    const raw = await response.text();
    let payload = null;

    if (raw) {
      try {
        payload = JSON.parse(raw);
      } catch (_) {
        payload = raw;
      }
    }

    if (!response.ok) {
      let detail = '';

      if (payload && typeof payload === 'object') {
        detail = payload.detail || payload.message || payload.error || '';
        if (!detail && payload.errors) {
          try {
            detail = JSON.stringify(payload.errors);
          } catch (_) {}
        }
      } else if (typeof payload === 'string') {
        detail = payload;
      }

      throw new Error(`Tebex HTTP ${response.status}${detail ? `: ${detail}` : ''}`);
    }

    return payload?.data ?? payload;
  };

  // Exact Minecraft login flow used by Tebex's official Headless Template:
  // POST /accounts/{token}/baskets with { username }
  const createMinecraftBasket = async username => {
    const basket = await requestJson(
      `${API}/accounts/${encodeURIComponent(token())}/baskets`,
      {
        method: 'POST',
        body: JSON.stringify({ username })
      }
    );

    if (!basket?.ident) {
      throw new Error('Tebex hat keinen gültigen Warenkorb erstellt.');
    }

    if (!basket?.username_id) {
      throw new Error(
        'Der Minecraft-Java-Name konnte von Tebex nicht eindeutig zugeordnet werden.'
      );
    }

    return basket;
  };

  // Exact package-add flow used by Tebex's official Headless Template:
  // POST /baskets/{ident}/packages with package_id + quantity.
  const addFoerdererPackage = async basket => {
    const updatedBasket = await requestJson(
      `${API}/baskets/${encodeURIComponent(basket.ident)}/packages`,
      {
        method: 'POST',
        body: JSON.stringify({
          package_id: PACKAGE_ID,
          quantity: 1
        })
      }
    );

    if (!updatedBasket?.ident) {
      throw new Error('Tebex konnte den Förderer nicht zum Warenkorb hinzufügen.');
    }

    return updatedBasket;
  };

  const openCheckout = basket => {
    const checkoutUrl = basket?.links?.checkout;

    if (!checkoutUrl) {
      throw new Error('Tebex hat keinen Checkout-Link zurückgegeben.');
    }

    window.location.assign(checkoutUrl);
  };

  form?.addEventListener('submit', async event => {
    event.preventDefault();

    const username = String(usernameInput?.value || '').trim();

    if (!token() || token().includes('HIER_')) {
      setStatus('Der Tebex Public Token ist nicht korrekt eingetragen.', 'error');
      return;
    }

    if (!/^[A-Za-z0-9_]{3,16}$/.test(username)) {
      setStatus(
        'Bitte gib einen gültigen Minecraft-Java-Namen mit 3–16 Zeichen ein.',
        'error'
      );
      usernameInput?.focus();
      return;
    }

    setBusy(true);
    setStatus('Minecraft-Account wird bei Tebex geprüft …');

    try {
      const basket = await createMinecraftBasket(username);
      const updatedBasket = await addFoerdererPackage(basket);
      setStatus('Weiterleitung zum sicheren Tebex-Checkout …', 'success');
      openCheckout(updatedBasket);
    } catch (error) {
      console.error('Tebex Förderer-Checkout:', error);
      setStatus(
        `Checkout konnte nicht gestartet werden: ${describeError(error)}`,
        'error'
      );
      setBusy(false);
    }
  });

  // Existing Tebex payment/subscription portal.
  let tebexLoader = null;

  const loadTebex = () => {
    if (window.Tebex) return Promise.resolve(window.Tebex);
    if (tebexLoader) return tebexLoader;

    tebexLoader = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://js.tebex.io/v/1.js';
      script.async = true;

      script.onload = () => {
        if (window.Tebex) {
          resolve(window.Tebex);
        } else {
          reject(new Error('Tebex.js wurde nicht initialisiert.'));
        }
      };

      script.onerror = () => reject(new Error('Tebex.js konnte nicht geladen werden.'));
      document.head.appendChild(script);
    });

    return tebexLoader;
  };

  manageButton?.addEventListener('click', async () => {
    if (!token() || token().includes('HIER_')) {
      setStatus('Der Tebex Public Token ist nicht korrekt eingetragen.', 'error');
      return;
    }

    manageButton.disabled = true;

    try {
      const Tebex = await loadTebex();
      Tebex.portal.init({
        token: token(),
        theme: 'dark'
      });
      Tebex.portal.launch();
    } catch (error) {
      setStatus(
        `Abo-Verwaltung konnte nicht geöffnet werden: ${describeError(error)}`,
        'error'
      );
    } finally {
      manageButton.disabled = false;
    }
  });
})();
