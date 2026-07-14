(() => {
  'use strict';

  const SERVER_ADDRESS = 'VanillaLichtung.de';
  const STATUS_ENDPOINT = `https://api.mcstatus.io/v2/status/java/${encodeURIComponent(SERVER_ADDRESS)}?query=false`;

  const header = document.querySelector('.site-header');
  const navToggle = document.querySelector('.nav-toggle');
  const nav = document.querySelector('.main-nav');
  const toast = document.getElementById('copy-toast');
  const statusButton = document.getElementById('load-status');
  const statusCard = document.getElementById('server-status');

  const updateHeader = () => header?.classList.toggle('scrolled', window.scrollY > 8);
  updateHeader();
  window.addEventListener('scroll', updateHeader, { passive: true });

  navToggle?.addEventListener('click', () => {
    const isOpen = nav?.classList.toggle('open');
    navToggle.classList.toggle('active', Boolean(isOpen));
    navToggle.setAttribute('aria-expanded', String(Boolean(isOpen)));
    navToggle.setAttribute('aria-label', isOpen ? 'Menü schließen' : 'Menü öffnen');
  });

  nav?.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      nav.classList.remove('open');
      navToggle?.classList.remove('active');
      navToggle?.setAttribute('aria-expanded', 'false');
      navToggle?.setAttribute('aria-label', 'Menü öffnen');
    });
  });

  let toastTimer;
  const showToast = (message) => {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toast.classList.remove('show'), 2200);
  };

  const copyText = async (value) => {
    try {
      await navigator.clipboard.writeText(value);
      showToast('Serveradresse kopiert');
    } catch {
      const input = document.createElement('textarea');
      input.value = value;
      input.setAttribute('readonly', '');
      input.style.position = 'fixed';
      input.style.opacity = '0';
      document.body.appendChild(input);
      input.select();
      const success = document.execCommand('copy');
      input.remove();
      showToast(success ? 'Serveradresse kopiert' : `Adresse: ${value}`);
    }
  };

  document.querySelectorAll('.copy-address').forEach(button => {
    button.addEventListener('click', async () => {
      const original = button.querySelector('.copy-label')?.textContent;
      await copyText(button.dataset.copy || SERVER_ADDRESS);
      const label = button.querySelector('.copy-label');
      if (label && original) {
        label.textContent = 'Kopiert!';
        window.setTimeout(() => { label.textContent = original; }, 1600);
      }
    });
  });

  const renderStatus = ({ online, players, version }) => {
    if (!statusCard) return;
    const dot = statusCard.querySelector('.status-dot');
    const title = statusCard.querySelector('.status-main strong');
    const subtitle = statusCard.querySelector('.status-main small');

    dot?.classList.remove('status-idle', 'status-online', 'status-offline');
    if (online) {
      dot?.classList.add('status-online');
      const current = Number.isFinite(players?.online) ? players.online : '?';
      const max = Number.isFinite(players?.max) ? players.max : '?';
      if (title) title.textContent = 'Server ist online';
      if (subtitle) subtitle.textContent = `${current} von ${max} Spielern · ${version?.name_clean || 'Minecraft Java'}`;
      if (statusButton) statusButton.textContent = 'Aktualisieren';
    } else {
      dot?.classList.add('status-offline');
      if (title) title.textContent = 'Server derzeit nicht erreichbar';
      if (subtitle) subtitle.textContent = 'Möglicherweise Neustart oder Wartung. Versuche es später erneut.';
      if (statusButton) statusButton.textContent = 'Erneut prüfen';
    }
  };

  statusButton?.addEventListener('click', async () => {
    statusButton.disabled = true;
    statusButton.textContent = 'Wird geprüft …';
    try {
      const response = await fetch(STATUS_ENDPOINT, { headers: { 'Accept': 'application/json' } });
      if (!response.ok) throw new Error(`Status ${response.status}`);
      renderStatus(await response.json());
    } catch (error) {
      console.warn('Serverstatus konnte nicht geladen werden:', error);
      renderStatus({ online: false });
      const subtitle = statusCard?.querySelector('.status-main small');
      if (subtitle) subtitle.textContent = 'Die externe Statusabfrage konnte nicht geladen werden.';
    } finally {
      statusButton.disabled = false;
    }
  });

  const observer = 'IntersectionObserver' in window
    ? new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            obs.unobserve(entry.target);
          }
        });
      }, { threshold: 0.1, rootMargin: '0px 0px -40px' })
    : null;

  document.querySelectorAll('.reveal').forEach(element => {
    if (observer) observer.observe(element);
    else element.classList.add('visible');
  });

  const year = document.getElementById('current-year');
  if (year) year.textContent = String(new Date().getFullYear());
})();
