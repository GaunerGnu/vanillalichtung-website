(() => {
  'use strict';

  const API = 'https://headless.tebex.io/api';
  const PACKAGE_ID = '7661046';

  const form = document.getElementById('support-form');
  const usernameInput = document.getElementById('minecraft-name');
  const submitButton = document.getElementById('support-submit');
  const status = document.getElementById('support-status');

  const config = window.VL_TEBEX || {};
  const token = () => String(config.publicToken || '').trim();

  function setStatus(message, type = 'info') {
    if (!status) return;
    status.textContent = message;
    status.dataset.type = type;
  }

  function setBusy(busy) {
    if (!submitButton) return;
    submitButton.disabled = busy;
    submitButton.setAttribute('aria-busy', String(busy));
    const label = submitButton.querySelector('.button-label');
    if (label) {
      label.textContent = busy ? 'Checkout wird vorbereitet …' : 'Sicher zum Checkout';
    }
  }

  function describeError(value) {
    if (value instanceof Error && value.message) return value.message;
    if (typeof value === 'string' && value.trim()) return value.trim();
    try {
      const json = JSON.stringify(value);
      if (json && json !== '{}') return json;
    } catch (_) {}
    return 'Unbekannter Fehler';
  }

  async function requestJson(url, options = {}) {
    let response;

    try {
      response = await fetch(url, {
        ...options,
        headers: {
          'Accept': 'application/json',
          ...(options.body ? { 'Content-Type': 'application/json' } : {}),
          ...(options.headers || {})
        }
      });
    } catch (error) {
      throw new Error('Verbindung zu Tebex fehlgeschlagen: ' + describeError(error));
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
          try { detail = JSON.stringify(payload.errors); } catch (_) {}
        }
      } else if (typeof payload === 'string') {
        detail = payload;
      }
      throw new Error(`Tebex HTTP ${response.status}${detail ? ': ' + detail : ''}`);
    }

    return payload?.data ?? payload;
  }

  async function createMinecraftBasket(username) {
    const basket = await requestJson(
      `${API}/accounts/${encodeURIComponent(token())}/baskets`,
      {
        method: 'POST',
        body: JSON.stringify({
          username: username,
          complete_url: 'https://www.vanillalichtung.de/unterstuetzen-danke.html',
          cancel_url: 'https://www.vanillalichtung.de/unterstuetzen.html',
          complete_auto_redirect: true,
          custom: { source: 'vanillalichtung.de' }
        })
      }
    );

    if (!basket?.ident) {
      throw new Error('Tebex hat keinen gültigen Warenkorb erstellt.');
    }

    if (!basket?.username_id) {
      throw new Error(
        'Tebex konnte den Minecraft-Namen nicht zuordnen. Bitte prüfe die Schreibweise.'
      );
    }

    return basket;
  }

  async function addPackage(basket) {
    const updated = await requestJson(
      `${API}/baskets/${encodeURIComponent(basket.ident)}/packages`,
      {
        method: 'POST',
        body: JSON.stringify({
          package_id: PACKAGE_ID,
          quantity: 1,
          variable_data: {
            username_id: String(basket.username_id)
          }
        })
      }
    );

    if (!updated?.ident) {
      throw new Error('Tebex konnte den Förderer nicht zum Warenkorb hinzufügen.');
    }

    return updated;
  }

  function openCheckout(basket) {
    const checkoutUrl = basket?.links?.checkout;
    if (!checkoutUrl) {
      throw new Error('Tebex hat keinen Checkout-Link zurückgegeben.');
    }
    window.location.assign(checkoutUrl);
  }

  form?.addEventListener('submit', async (event) => {
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
      const updatedBasket = await addPackage(basket);
      setStatus('Weiterleitung zum sicheren Tebex-Checkout …', 'success');
      openCheckout(updatedBasket);
    } catch (error) {
      setStatus(
        'Checkout konnte nicht gestartet werden: ' + describeError(error),
        'error'
      );
      setBusy(false);
    }
  });
})();
