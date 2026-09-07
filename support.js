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
  const PENDING_KEY = 'vl_tebex_pending_checkout_v1';
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
    if (label) label.textContent = busy ? 'Checkout wird vorbereitet …' : 'Sicher zum Checkout';
  };

  const token = () => String(config.publicToken || '').trim();

  const isConfigured = () =>
    token() && !token().includes('HIER_');

  const fetchJson = async (url, options = {}) => {
    const response = await fetch(url, {
      ...options,
      headers: {
        Accept: 'application/json',
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...(options.headers || {})
      }
    });

    let payload = null;
    try {
      payload = await response.json();
    } catch {
      payload = null;
    }

    if (!response.ok) {
      const detail =
        payload?.detail ??
        payload?.message ??
        payload?.error ??
        payload?.errors ??
        `HTTP ${response.status}`;
      throw new Error(typeof detail === 'string' ? detail : JSON.stringify(detail));
    }

    return payload;
  };

  const unwrap = payload => payload?.data ?? payload;

  const loadPackage = async () => {
    const payload = await fetchJson(
      `${API}/accounts/${encodeURIComponent(token())}/packages`
    );
    const packages = unwrap(payload);
    const list = Array.isArray(packages) ? packages : [];

    const slug = String(config.packageSlug || 'foerderer').toLowerCase();
    const found =
      list.find(pkg => String(pkg?.slug || '').toLowerCase() === slug) ||
      list.find(pkg => Number(pkg?.id) === 7661046) ||
      (list.length === 1 ? list[0] : null);

    if (!found?.id) {
      throw new Error('Das Förderer-Paket wurde bei Tebex nicht gefunden.');
    }

    return found;
  };

  const createMinecraftBasket = async username => {
    const payload = await fetchJson(
      `${API}/accounts/${encodeURIComponent(token())}/baskets`,
      {
        method: 'POST',
        body: JSON.stringify({
          username,
          complete_url: COMPLETE_URL,
          cancel_url: CANCEL_URL,
          complete_auto_redirect: true,
          custom: { source: 'vanillalichtung.de' }
        })
      }
    );

    const basket = unwrap(payload);
    if (!basket?.ident) {
      throw new Error('Tebex konnte keinen Warenkorb erstellen.');
    }
    return basket;
  };

  const getBasket = async ident => {
    const payload = await fetchJson(
      `${API}/accounts/${encodeURIComponent(token())}/baskets/${encodeURIComponent(ident)}`
    );
    const basket = unwrap(payload);
    if (!basket?.ident) {
      throw new Error('Der Tebex-Warenkorb konnte nicht geladen werden.');
    }
    return basket;
  };

  const getAuthUrl = async ident => {
    const payload = await fetchJson(
      `${API}/accounts/${encodeURIComponent(token())}/baskets/${encodeURIComponent(ident)}/auth?returnUrl=${encodeURIComponent(RETURN_URL)}`
    );

    const authMethods = unwrap(payload);
    const list = Array.isArray(authMethods) ? authMethods : [];

    const method =
      list.find(item => /minecraft|mojang|java/i.test(String(item?.name || ''))) ||
      list[0];

    if (!method?.url) {
      throw new Error('Tebex hat keine Minecraft-Authentifizierung zurückgegeben.');
    }

    return method.url;
  };

  const addPackage = async (basket, packageId) => {
    if (!basket?.username_id) {
      throw new Error('Der Minecraft-Account ist bei Tebex noch nicht authentifiziert.');
    }

    const payload = await fetchJson(
      `${API}/baskets/${encodeURIComponent(basket.ident)}/packages`,
      {
        method: 'POST',
        body: JSON.stringify({
          package_id: String(packageId),
          quantity: 1,
          variable_data: {
            username_id: String(basket.username_id)
          }
        })
      }
    );

    return unwrap(payload) || {};
  };

  let tebexLoader = null;
  const loadTebex = () => {
    if (window.Tebex) return Promise.resolve(window.Tebex);
    if (tebexLoader) return tebexLoader;

    tebexLoader = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = TEBEX_JS;
      script.async = true;
      script.onload = () =>
        window.Tebex
          ? resolve(window.Tebex)
          : reject(new Error('Tebex.js wurde nicht initialisiert.'));
      script.onerror = () =>
        reject(new Error('Der Tebex-Checkout konnte nicht geladen werden.'));
      document.head.appendChild(script);
    });

    return tebexLoader;
  };

  const launchCheckout = async basket => {
    const checkoutUrl = basket?.links?.checkout;

    try {
      const Tebex = await loadTebex();
      Tebex.checkout.init({
        ident: basket.ident,
        locale: 'de_DE',
        theme: 'dark',
        closeOnPaymentComplete: false
      });
      Tebex.checkout.launch();
      setStatus('Der sichere Tebex-Checkout wurde geöffnet.', 'success');
    } catch (error) {
      console.warn('Tebex.js konnte nicht gestartet werden:', error);
      if (checkoutUrl) {
        window.location.assign(checkoutUrl);
        return;
      }
      throw error;
    }
  };

  const savePending = data => {
    sessionStorage.setItem(PENDING_KEY, JSON.stringify({
      ...data,
      createdAt: Date.now()
    }));
  };

  const readPending = () => {
    try {
      const raw = sessionStorage.getItem(PENDING_KEY);
      if (!raw) return null;
      const data = JSON.parse(raw);

      // stale checkout after 30 minutes
      if (!data?.basketIdent || Date.now() - Number(data.createdAt || 0) > 30 * 60 * 1000) {
        sessionStorage.removeItem(PENDING_KEY);
        return null;
      }
      return data;
    } catch {
      sessionStorage.removeItem(PENDING_KEY);
      return null;
    }
  };

  const clearPending = () => {
    sessionStorage.removeItem(PENDING_KEY);
  };

  const finishAuthenticatedBasket = async pending => {
    setBusy(true);
    setStatus('Minecraft-Account wurde bestätigt. Checkout wird geöffnet …');

    try {
      const basket = await getBasket(pending.basketIdent);

      if (!basket.username_id) {
        throw new Error('Minecraft-Authentifizierung wurde von Tebex nicht bestätigt.');
      }

      const updated = await addPackage(basket, pending.packageId);
      clearPending();

      // remove auth marker from the visible URL
      if (window.history?.replaceState) {
        window.history.replaceState({}, '', '/unterstuetzen.html');
      }

      await launchCheckout(updated?.ident ? updated : basket);
    } catch (error) {
      console.error('Tebex Checkout nach Auth fehlgeschlagen:', error);
      clearPending();
      setStatus(
        `Checkout konnte nicht abgeschlossen werden: ${error.message}`,
        'error'
      );
    } finally {
      setBusy(false);
    }
  };

  form?.addEventListener('submit', async event => {
    event.preventDefault();

    const username = String(usernameInput?.value || '').trim();

    if (!/^[A-Za-z0-9_]{3,16}$/.test(username)) {
      setStatus('Bitte gib einen gültigen Minecraft-Java-Namen mit 3–16 Zeichen ein.', 'error');
      usernameInput?.focus();
      return;
    }

    if (!isConfigured()) {
      setStatus('Der Förderer-Checkout ist noch nicht vollständig konfiguriert.', 'error');
      return;
    }

    setBusy(true);
    setStatus('Minecraft-Account wird bei Tebex vorbereitet …');

    try {
      const pkg = await loadPackage();
      const basket = await createMinecraftBasket(username);

      // Some Minecraft projects resolve the username immediately.
      if (basket.username_id) {
        const updated = await addPackage(basket, pkg.id);
        await launchCheckout(updated?.ident ? updated : basket);
        return;
      }

      // If Tebex requires authentication, use Tebex's official basket auth flow.
      savePending({
        basketIdent: basket.ident,
        packageId: pkg.id,
        username
      });

      const authUrl = await getAuthUrl(basket.ident);
      setStatus('Du wirst kurz zu Tebex weitergeleitet, um deinen Minecraft-Account zu bestätigen …');
      window.location.assign(authUrl);
    } catch (error) {
      console.error('Förderer-Checkout fehlgeschlagen:', error);
      clearPending();
      setStatus(
        `Checkout konnte nicht gestartet werden: ${error.message}`,
        'error'
      );
    } finally {
      setBusy(false);
    }
  });

  manageButton?.addEventListener('click', async () => {
    if (!isConfigured()) {
      setStatus('Die Abo-Verwaltung ist noch nicht vollständig konfiguriert.', 'error');
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
      console.error('Tebex Payment Portal konnte nicht geöffnet werden:', error);
      setStatus('Die Abo-Verwaltung konnte gerade nicht geöffnet werden.', 'error');
    } finally {
      manageButton.disabled = false;
    }
  });

  // Resume automatically after Tebex returned from Minecraft authentication.
  const params = new URLSearchParams(window.location.search);
  if (params.get('tebex_auth') === '1') {
    const pending = readPending();
    if (pending) {
      finishAuthenticatedBasket(pending);
    } else {
      setStatus('Die Tebex-Anmeldung ist abgelaufen. Bitte starte den Checkout erneut.', 'error');
    }
  }
})();
