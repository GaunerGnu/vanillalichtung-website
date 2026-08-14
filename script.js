(() => {
  'use strict';

  const SERVER_ADDRESS = 'vanillalichtung.de';
  const STATUS_ENDPOINT = `https://api.mcstatus.io/v2/status/java/${encodeURIComponent(SERVER_ADDRESS)}?query=false`;
  const header = document.querySelector('.site-header');
  const navToggle = document.querySelector('.nav-toggle');
  const nav = document.querySelector('.main-nav');
  const toast = document.getElementById('copy-toast');
  const statusButton = document.getElementById('load-status');
  const statusCard = document.getElementById('server-status');

  const updateHeader = () => header?.classList.toggle('scrolled', window.scrollY > 18);
  updateHeader();
  window.addEventListener('scroll', updateHeader, { passive: true });

  const closeNavigation = () => {
    nav?.classList.remove('open');
    navToggle?.classList.remove('active');
    navToggle?.setAttribute('aria-expanded', 'false');
    navToggle?.setAttribute('aria-label', 'Menü öffnen');
    document.body.classList.remove('nav-open');
  };

  navToggle?.addEventListener('click', () => {
    const isOpen = !nav?.classList.contains('open');
    nav?.classList.toggle('open', isOpen);
    navToggle.classList.toggle('active', isOpen);
    navToggle.setAttribute('aria-expanded', String(isOpen));
    navToggle.setAttribute('aria-label', isOpen ? 'Menü schließen' : 'Menü öffnen');
    document.body.classList.toggle('nav-open', isOpen);
  });

  nav?.querySelectorAll('a').forEach(link => link.addEventListener('click', closeNavigation));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && nav?.classList.contains('open')) {
      closeNavigation();
      navToggle?.focus();
    }
  });

  let toastTimer;
  const showToast = message => {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toast.classList.remove('show'), 2200);
  };

  const copyText = async value => {
    try {
      await navigator.clipboard.writeText(value);
      showToast('Serveradresse kopiert');
      return true;
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
      return copied;
    }
  };

  document.querySelectorAll('.copy-address').forEach(button => button.addEventListener('click', async () => {
    const label = button.querySelector('.button-label, .copy-hint');
    const original = label?.textContent;
    const copied = await copyText(button.dataset.copy || SERVER_ADDRESS);
    if (copied && label && original) {
      label.textContent = 'Kopiert ✓';
      window.setTimeout(() => { label.textContent = original; }, 1600);
    }
  }));

  const renderStatus = data => {
    if (!statusCard) return;
    const dot = statusCard.querySelector('.status-dot');
    const title = statusCard.querySelector('.live-status strong');
    const subtitle = statusCard.querySelector('.live-status small');
    dot?.classList.remove('status-idle', 'status-online', 'status-offline');

    if (data.online) {
      dot?.classList.add('status-online');
      const current = Number.isFinite(data.players?.online) ? data.players.online : '?';
      const maximum = Number.isFinite(data.players?.max) ? data.players.max : '?';
      if (title) title.textContent = 'Server ist online';
      if (subtitle) subtitle.textContent = `${current} von ${maximum} Spielern · ${data.version?.name_clean || 'Minecraft Java'}`;
      if (statusButton) statusButton.textContent = 'Aktualisieren';
    } else {
      dot?.classList.add('status-offline');
      if (title) title.textContent = 'Gerade nicht erreichbar';
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
      const subtitle = statusCard?.querySelector('.live-status small');
      if (subtitle) subtitle.textContent = 'Die externe Statusabfrage ist fehlgeschlagen.';
    } finally {
      statusButton.disabled = false;
    }
  });

  const countdown = document.getElementById('countdown');
  if (countdown) {
    const target = new Date(countdown.dataset.target || '').getTime();
    const fields = {
      days: countdown.querySelector('[data-days]'),
      hours: countdown.querySelector('[data-hours]'),
      minutes: countdown.querySelector('[data-minutes]'),
      seconds: countdown.querySelector('[data-seconds]')
    };
    const pad = value => String(value).padStart(2, '0');
    let countdownTimer;

    const updateCountdown = () => {
      const distance = target - Date.now();
      if (!Number.isFinite(target) || distance <= 0) {
        countdown.classList.add('open');
        countdown.setAttribute('aria-label', 'Das End ist geöffnet');
        window.clearInterval(countdownTimer);
        return;
      }
      const days = Math.floor(distance / 86400000);
      const hours = Math.floor((distance % 86400000) / 3600000);
      const minutes = Math.floor((distance % 3600000) / 60000);
      const seconds = Math.floor((distance % 60000) / 1000);
      if (fields.days) fields.days.textContent = pad(days);
      if (fields.hours) fields.hours.textContent = pad(hours);
      if (fields.minutes) fields.minutes.textContent = pad(minutes);
      if (fields.seconds) fields.seconds.textContent = pad(seconds);
      countdown.setAttribute('aria-label', `${days} Tage, ${hours} Stunden und ${minutes} Minuten bis zur End-Öffnung`);
    };

    updateCountdown();
    countdownTimer = window.setInterval(updateCountdown, 1000);
  }

  const revealObserver = 'IntersectionObserver' in window
    ? new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        });
      }, { threshold: 0.08, rootMargin: '0px 0px -50px' })
    : null;

  document.querySelectorAll('.reveal').forEach(element => {
    if (revealObserver) revealObserver.observe(element);
    else element.classList.add('visible');
  });

  const sections = [...document.querySelectorAll('main section[id]')];
  const navLinks = [...document.querySelectorAll('.main-nav a[href^="#"]')];
  if ('IntersectionObserver' in window && sections.length) {
    const sectionObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        navLinks.forEach(link => link.classList.toggle('active', link.getAttribute('href') === `#${entry.target.id}`));
      });
    }, { rootMargin: '-35% 0px -58% 0px', threshold: 0 });
    sections.forEach(section => sectionObserver.observe(section));
  }

  document.querySelectorAll('.faq-list details').forEach(item => item.addEventListener('toggle', () => {
    if (!item.open) return;
    document.querySelectorAll('.faq-list details[open]').forEach(other => {
      if (other !== item) other.open = false;
    });
  }));

  const lightbox = document.getElementById('image-lightbox');
  const lightboxImage = lightbox?.querySelector('img');
  const lightboxCaption = lightbox?.querySelector('figcaption');
  const closeButton = lightbox?.querySelector('.lightbox-close');
  let lightboxTrigger;

  const closeLightbox = () => {
    if (!lightbox) return;
    lightbox.hidden = true;
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('lightbox-open');
    lightboxTrigger?.focus();
  };

  document.querySelectorAll('[data-lightbox]').forEach(button => button.addEventListener('click', () => {
    if (!lightbox || !lightboxImage) return;
    lightboxTrigger = button;
    lightboxImage.src = button.dataset.lightbox || '';
    const nearbyImage = button.closest('figure')?.querySelector('img');
    lightboxImage.alt = nearbyImage?.alt || '';
    if (lightboxCaption) lightboxCaption.textContent = button.dataset.caption || '';
    lightbox.hidden = false;
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.classList.add('lightbox-open');
    closeButton?.focus();
  }));

  closeButton?.addEventListener('click', closeLightbox);
  lightbox?.addEventListener('click', event => {
    if (event.target === lightbox) closeLightbox();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && lightbox && !lightbox.hidden) closeLightbox();
  });

  const year = document.getElementById('current-year');
  if (year) year.textContent = String(new Date().getFullYear());
})();
