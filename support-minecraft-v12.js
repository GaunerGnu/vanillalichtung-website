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
      const text = JSON.stringify(value);
      if (text && text !== '{}') return text;
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
      throw new Error('Netzwerkfehler: ' + describeError(error));
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
        detail =
          payload.detail ||
          payload.message ||
          payload.error ||
          payload.title ||
          '';
        if (!detail && payload.errors) {
          try { detail = JSON.stringify(payload.errors); } catch (_) {}
        }
      } else if (typeof payload === 'string') {
        detail = payload.trim();
      }

      throw new Error(`HTTP ${response.status}${detail ? ': ' + detail : ''}`);
    }

    return payload?.data ?? payload;
  }

  async function createMinecraftBasket(username) {
    // Minimal Minecraft basket request: only username is required.
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
      throw new Error('Tebex konnte den Minecraft-Java-Namen nicht zuordnen.');
    }

    return basket;
  }

  async function addPackage(basket, paymentType) {
    // The package supports BOTH one-off and recurring payments.
    // For that reason the payment type is sent explicitly.
    const updated = await requestJson(
      `${API}/baskets/${encodeURIComponent(basket.ident)}/packages`,
      {
        method: 'POST',
        body: JSON.stringify({
          package_id: PACKAGE_ID,
          quantity: 1,
          type: paymentType,
          variable_data: {
            username_id: String(basket.username_id)
          }
        })
      }
    );

    if (!updated?.ident) {
      throw new Error('Tebex konnte das Förderer-Paket nicht hinzufügen.');
    }

    return updated;
  }

  function openCheckout(basket) {
    const checkout = basket?.links?.checkout;
    if (!checkout) {
      throw new Error('Tebex hat keinen Checkout-Link zurückgegeben.');
    }
    window.location.assign(checkout);
  }

  form?.addEventListener('submit', async event => {
    event.preventDefault();

    const username = String(usernameInput?.value || '').trim();
    const selectedType =
      document.querySelector('input[name="foerderer-payment"]:checked')?.value ||
      'subscription';

    if (!token() || token().includes('HIER_')) {
      setStatus('Der Tebex Public Token ist nicht korrekt eingetragen.', 'error');
      return;
    }

    if (!/^[A-Za-z0-9_]{3,16}$/.test(username)) {
      setStatus('Bitte gib einen gültigen Minecraft-Java-Namen mit 3–16 Zeichen ein.', 'error');
      usernameInput?.focus();
      return;
    }

    if (!['single', 'subscription'].includes(selectedType)) {
      setStatus('Bitte wähle eine Zahlungsart.', 'error');
      return;
    }

    setBusy(true);
    setStatus('Minecraft-Account wird bei Tebex geprüft …');

    let basket;
    try {
      basket = await createMinecraftBasket(username);
    } catch (error) {
      setBusy(false);
      setStatus(
        'Checkout konnte nicht gestartet werden – Schritt 1 (Minecraft-Basket): ' +
          describeError(error),
        'error'
      );
      return;
    }

    let updated;
    try {
      updated = await addPackage(basket, selectedType);
    } catch (error) {
      setBusy(false);
      setStatus(
        'Checkout konnte nicht gestartet werden – Schritt 2 (Förderer-Paket): ' +
          describeError(error),
        'error'
      );
      return;
    }

    try {
      setStatus('Weiterleitung zum sicheren Tebex-Checkout …', 'success');
      openCheckout(updated);
    } catch (error) {
      setBusy(false);
      setStatus(
        'Checkout konnte nicht gestartet werden – Schritt 3 (Weiterleitung): ' +
          describeError(error),
        'error'
      );
    }
  });
})();
