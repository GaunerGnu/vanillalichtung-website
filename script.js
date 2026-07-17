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

  const updateHeader = () => header?.classList.toggle('scrolled', window.scrollY > 16);
  updateHeader();
  window.addEventListener('scroll', updateHeader, { passive: true });

  navToggle?.addEventListener('click', () => {
    const isOpen = nav?.classList.toggle('open');
    navToggle.classList.toggle('active', Boolean(isOpen));
    navToggle.setAttribute('aria-expanded', String(Boolean(isOpen)));
    navToggle.setAttribute('aria-label', isOpen ? 'Menü schließen' : 'Menü öffnen');
  });

  nav?.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
    nav.classList.remove('open');
    navToggle?.classList.remove('active');
    navToggle?.setAttribute('aria-expanded', 'false');
    navToggle?.setAttribute('aria-label', 'Menü öffnen');
  }));

  let toastTimer;
  const showToast = (message) => {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2100);
  };

  const copyText = async value => {
    try {
      await navigator.clipboard.writeText(value);
      showToast('Serveradresse kopiert');
    } catch {
      const field = document.createElement('textarea');
      field.value = value;
      field.setAttribute('readonly', '');
      field.style.position = 'fixed';
      field.style.opacity = '0';
      document.body.appendChild(field);
      field.select();
      const copied = document.execCommand('copy');
      field.remove();
      showToast(copied ? 'Serveradresse kopiert' : `Adresse: ${value}`);
    }
  };

  document.querySelectorAll('.copy-address').forEach(button => button.addEventListener('click', async () => {
    const label = button.querySelector('.copy-label');
    const original = label?.textContent;
    await copyText(button.dataset.copy || SERVER_ADDRESS);
    if (label && original) {
      label.textContent = 'Kopiert';
      setTimeout(() => { label.textContent = original; }, 1500);
    }
  }));

  const renderStatus = data => {
    if (!statusCard) return;
    const dot = statusCard.querySelector('.status-dot');
    const title = statusCard.querySelector('.status-copy strong');
    const subtitle = statusCard.querySelector('.status-copy small');
    dot?.classList.remove('status-idle', 'status-online', 'status-offline');

    if (data.online) {
      dot?.classList.add('status-online');
      const current = Number.isFinite(data.players?.online) ? data.players.online : '?';
      const max = Number.isFinite(data.players?.max) ? data.players.max : '?';
      if (title) title.textContent = 'Server ist online';
      if (subtitle) subtitle.textContent = `${current} von ${max} Spielern · ${data.version?.name_clean || 'Minecraft Java'}`;
      if (statusButton) statusButton.textContent = 'Aktualisieren';
    } else {
      dot?.classList.add('status-offline');
      if (title) title.textContent = 'Server derzeit nicht erreichbar';
      if (subtitle) subtitle.textContent = 'Möglicherweise Neustart oder Wartung.';
      if (statusButton) statusButton.textContent = 'Erneut prüfen';
    }
  };

  statusButton?.addEventListener('click', async () => {
    statusButton.disabled = true;
    statusButton.textContent = 'Wird geprüft …';
    try {
      const response = await fetch(STATUS_ENDPOINT, { headers: { Accept: 'application/json' } });
      if (!response.ok) throw new Error(`Status ${response.status}`);
      renderStatus(await response.json());
    } catch (error) {
      console.warn('Serverstatus konnte nicht geladen werden:', error);
      renderStatus({ online: false });
      const subtitle = statusCard?.querySelector('.status-copy small');
      if (subtitle) subtitle.textContent = 'Die externe Statusabfrage konnte nicht geladen werden.';
    } finally {
      statusButton.disabled = false;
    }
  });

  const observer = 'IntersectionObserver' in window
    ? new IntersectionObserver((entries, instance) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            instance.unobserve(entry.target);
          }
        });
      }, { threshold: 0.1, rootMargin: '0px 0px -45px' })
    : null;

  document.querySelectorAll('.reveal').forEach(element => {
    if (element.classList.contains('visible')) return;
    if (observer) observer.observe(element);
    else element.classList.add('visible');
  });

  const lightbox = document.getElementById('image-lightbox');
  const lightboxImage = lightbox?.querySelector('img');
  const lightboxCaption = lightbox?.querySelector('figcaption');
  const closeButton = lightbox?.querySelector('.lightbox-close');

  const closeLightbox = () => {
    if (!lightbox) return;
    lightbox.hidden = true;
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('lightbox-open');
  };

  document.querySelectorAll('[data-lightbox]').forEach(button => button.addEventListener('click', () => {
    if (!lightbox || !lightboxImage) return;
    lightboxImage.src = button.dataset.lightbox || '';
    lightboxImage.alt = button.closest('.editorial-image, .world-panel')?.querySelector('img')?.alt || '';
    if (lightboxCaption) lightboxCaption.textContent = button.dataset.caption || '';
    lightbox.hidden = false;
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.classList.add('lightbox-open');
    closeButton?.focus();
  }));

  closeButton?.addEventListener('click', closeLightbox);
  lightbox?.addEventListener('click', event => { if (event.target === lightbox) closeLightbox(); });
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && lightbox && !lightbox.hidden) closeLightbox(); });

  const year = document.getElementById('current-year');
  if (year) year.textContent = String(new Date().getFullYear());
})();
