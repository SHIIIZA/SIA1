document.addEventListener('DOMContentLoaded', () => {

  const currentUser = (() => {
    try { return JSON.parse(localStorage.getItem('tripmate_user') || 'null'); } catch { return null; }
  })();
  if (!currentUser || currentUser.role !== 'admin' || !localStorage.getItem('tripmate_access_token')) {
    window.location.replace('login.html?redirect=admin.html');
    return;
  }

  /* =========================================================
     STORAGE KEYS — nothing is pre-seeded. This workspace starts
     empty so the first person to use it is genuinely the first test.
  ========================================================= */
  const LISTINGS_KEY = 'tripmate_admin_listings';
  const BOOKINGS_KEY = 'tripmate_admin_bookings';
  const USERS_KEY = 'tripmate_users'; // shared with signup.html / auth.js
  const PROFILE_KEY = 'tripmate_admin_profile';
  const SINCE_KEY = 'tripmate_admin_since';
  const SETTINGS_KEY = 'tripmate_admin_settings';

  const DEFAULT_AMENITIES = ['Free WiFi', 'Air Conditioning', 'Hot Shower', '24/7 Front Desk'];
  const COMMISSION_RATE = 0.12;
  const TAX_RATE = 0.12;

  const FALLBACK_IMAGE =
    'data:image/svg+xml;utf8,' + encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="250"><rect width="100%" height="100%" fill="#eaf1ff"/><text x="50%" y="50%" font-family="sans-serif" font-size="16" fill="#2563eb" text-anchor="middle" dy=".3em">No image</text></svg>`
    );

  // Destination photos reused from the TripMate homepage / landing page hero carousels.
  const LOCATION_IMAGE_MAP = {
    'baguio': 'https://visita.baguio.gov.ph/_next/image?url=%2Flanding%2Ftours.jpg&w=1920&q=75',
    'tagaytay': 'https://www.thebrokebackpacker.com/wp-content/uploads/2024/07/tagaytay-taal-lake.jpg',
    'la union': 'https://media-cdn.tripadvisor.com/media/photo-c/1280x250/0d/cb/a6/63/re-discovering-my-fave.jpg',
    'bohol': 'https://d1qvryx77qeesd.cloudfront.net/2024/10/edited-R7_Bohol_Carmen_Chocolate-Hills-4_1-scaled.jpg',
    'siargao': 'https://media.digitalnomads.world/wp-content/uploads/2021/01/20120637/siargao-digital-nomads.jpg',
  };

  const resolveLocationImage = (location) => {
    const loc = String(location || '').toLowerCase();
    const key = Object.keys(LOCATION_IMAGE_MAP).find((k) => loc.includes(k));
    return key ? LOCATION_IMAGE_MAP[key] : null;
  };

  const getEffectiveImages = (listing) => {
    if (!listing) return [FALLBACK_IMAGE];
    if (listing.images && listing.images.length) return listing.images;
    const matched = resolveLocationImage(listing.location);
    return matched ? [matched] : [FALLBACK_IMAGE];
  };

  /* =========================================================
     STORAGE HELPERS
  ========================================================= */
  const loadJSON = (key, fallback) => {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : fallback;
    } catch {
      return fallback;
    }
  };

  const loadObject = (key, fallback) => {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      const parsed = JSON.parse(raw);
      return (parsed && typeof parsed === 'object') ? parsed : fallback;
    } catch {
      return fallback;
    }
  };

  const save = (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* storage unavailable — fail silently, UI still works in-memory */
    }
  };

  let listings = loadJSON(LISTINGS_KEY, []);
  let bookings = loadJSON(BOOKINGS_KEY, []);

  let syncTimer = null;
  const syncAdminData = () => {
    if (localStorage.getItem('tripmate_access_token') === 'local-demo-admin') return;
    clearTimeout(syncTimer);
    syncTimer = setTimeout(async () => {
      try {
        await apiRequest('/admin/sync', { method: 'POST', body: JSON.stringify({ listings, bookings }) });
        const fresh = await apiRequest('/admin/data');
        listings = fresh.listings || [];
        bookings = fresh.bookings || [];
        save(LISTINGS_KEY, listings);
        save(BOOKINGS_KEY, bookings);
        renderDashboard();
        renderInventory();
        renderVerification();
        renderTransactions();
      } catch (error) {
        showToast(error.message || 'Unable to sync admin changes.', 'error');
      }
    }, 120);
  };
  const persistListings = () => { save(LISTINGS_KEY, listings); syncAdminData(); };
  const persistBookings = () => { save(BOOKINGS_KEY, bookings); syncAdminData(); };

  const hydrateAdminData = async () => {
    if (localStorage.getItem('tripmate_access_token') === 'local-demo-admin') return;
    try {
      const data = await apiRequest('/admin/data');
      if (Array.isArray(data.listings)) listings = data.listings;
      if (Array.isArray(data.bookings)) bookings = data.bookings;
      save(LISTINGS_KEY, listings);
      save(BOOKINGS_KEY, bookings);
    } catch (error) {
      showToast(error.message || 'Unable to load admin data.', 'error');
    }
  };

  const getUsers = () => loadJSON(USERS_KEY, []);
  const saveUsers = (users) => save(USERS_KEY, users);

  let adminProfile = loadObject(PROFILE_KEY, {
    fullName: 'Admin', email: '', phone: '', emailNotifications: true, smsAlerts: false,
  });
  const persistProfile = () => save(PROFILE_KEY, adminProfile);

  const DEFAULT_ROWS_PER_PAGE = 8;
  let adminSettings = loadObject(SETTINGS_KEY, {
    tableDensity: 'comfortable',        // 'comfortable' | 'compact'
    rowsPerPage: DEFAULT_ROWS_PER_PAGE, // used by Inventory & Transactions pagination
    showVerificationAlerts: true,       // sidebar badge + topbar notification dot
  });
  const persistSettings = () => save(SETTINGS_KEY, adminSettings);

  // First time this admin panel is opened on this browser, record it —
  // genuinely "member since" the moment testing started, not a fake date.
  let adminSince = Number(localStorage.getItem(SINCE_KEY));
  if (!adminSince) {
    adminSince = Date.now();
    try { localStorage.setItem(SINCE_KEY, String(adminSince)); } catch { /* ignore */ }
  }

  /* =========================================================
     GENERAL HELPERS
  ========================================================= */
  const formatPeso = (value) => '₱' + Math.round(Number(value) || 0).toLocaleString('en-PH');

  const formatDate = (isoStr) => {
    const d = new Date(isoStr + 'T00:00:00');
    if (isNaN(d)) return isoStr;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const escapeHTML = (str) => String(str ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));

  const listingById = (id) => listings.find((l) => l.id === id);
  const bookingById = (id) => bookings.find((b) => b.id === id);

  const genId = (prefix) => `${prefix}${Date.now().toString(36)}${Math.floor(Math.random() * 1000)}`;

  const nightsBetween = (checkIn, checkOut) => {
    const inD = new Date(checkIn + 'T00:00:00');
    const outD = new Date(checkOut + 'T00:00:00');
    const diff = Math.round((outD - inD) / 86400000);
    return diff > 0 ? diff : 1;
  };

  const getInitials = (name) => {
    const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return '?';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const AVATAR_PALETTE = ['#2563eb', '#16a34a', '#b45309', '#7c3aed', '#0f766e', '#c2410c'];
  const avatarColorFor = (str) => {
    let hash = 0;
    for (let i = 0; i < String(str).length; i++) hash = String(str).charCodeAt(i) + ((hash << 5) - hash);
    return AVATAR_PALETTE[Math.abs(hash) % AVATAR_PALETTE.length];
  };

  const timeAgo = (ts) => {
    if (!ts) return '—';
    const diffMs = Date.now() - ts;
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  };

  // Transaction math: base rate (nights × nightly price) plus taxes/fees and
  // platform commission, each 12% of the base — mirrors the booking checkout math.
  const transactionBreakdown = (booking) => {
    const base = Number(booking.amount) || 0;
    const taxesFees = base * TAX_RATE;
    const commission = base * COMMISSION_RATE;
    const total = base + taxesFees + commission;
    return { base, taxesFees, commission, total };
  };

  const TX_STATUS_META = {
    Confirmed: { label: 'Completed', cls: 'green' },
    Pending: { label: 'Pending Review', cls: 'amber' },
    Cancelled: { label: 'Action Required', cls: 'red' },
  };

  const LISTING_STATUS_META = {
    'Verified': { cls: 'green' },
    'Pending Review': { cls: 'amber' },
    'Action Required': { cls: 'red' },
  };

  const statusBadgeHTML = (label, cls) => `<span class="badge badge-${cls}"><span class="badge-dot"></span>${escapeHTML(label)}</span>`;

  // Builds and downloads a CSV file from real, currently-visible data — no fabricated rows.
  const downloadCSV = (filename, headers, rows) => {
    const escapeCell = (val) => {
      const str = String(val ?? '');
      return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
    };
    const lines = [headers.map(escapeCell).join(','), ...rows.map((r) => r.map(escapeCell).join(','))];
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  /* =========================================================
     TOAST
  ========================================================= */
  const toastEl = document.getElementById('toast');
  let toastTimer = null;
  const showToast = (message, type = 'info') => {
    toastEl.textContent = message;
    toastEl.classList.remove('is-error', 'is-success');
    if (type === 'error') toastEl.classList.add('is-error');
    if (type === 'success') toastEl.classList.add('is-success');
    toastEl.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('is-visible'), 2800);
  };

  const notImplemented = () => showToast("This isn't part of this prototype yet.");

  document.getElementById('footerYear').textContent = new Date().getFullYear();

  /* =========================================================
     SIDEBAR NAV / VIEW SWITCHING
  ========================================================= */
  const navItems = document.querySelectorAll('.nav-item[data-view]');
  const views = document.querySelectorAll('.view');
  const sidebar = document.getElementById('sidebar');
  const sidebarScrim = document.getElementById('sidebarScrim');
  const menuToggle = document.getElementById('menuToggle');

  const closeSidebar = () => {
    sidebar.classList.remove('is-open');
    sidebarScrim.classList.remove('is-visible');
  };

  const RENDERERS = {}; // view -> render function, filled in below

  const goToView = (view) => {
    navItems.forEach((btn) => btn.classList.toggle('is-active', btn.dataset.view === view));
    views.forEach((section) => section.classList.toggle('is-active', section.id === `view-${view}`));
    closeSidebar();
    closeAnyDropdown();
    if (typeof closeAccountMenu === 'function') closeAccountMenu();
    const search = document.getElementById('globalSearch');
    if (search && SEARCH_PLACEHOLDERS[view]) search.placeholder = SEARCH_PLACEHOLDERS[view];
    if (typeof RENDERERS[view] === 'function') RENDERERS[view]();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  navItems.forEach((btn) => btn.addEventListener('click', () => goToView(btn.dataset.view)));
  document.querySelectorAll('[data-goto]').forEach((btn) => {
    btn.addEventListener('click', () => goToView(btn.dataset.goto));
  });

  menuToggle.addEventListener('click', () => {
    sidebar.classList.add('is-open');
    sidebarScrim.classList.add('is-visible');
  });
  sidebarScrim.addEventListener('click', closeSidebar);

  document.getElementById('topbarBrandBtn').addEventListener('click', () => goToView('dashboard'));
  document.getElementById('settingsBtn').addEventListener('click', () => goToView('settings'));
  document.querySelectorAll('[data-action="footer-link"]').forEach((a) => {
    a.addEventListener('click', (e) => { e.preventDefault(); notImplemented(); });
  });

  const NOTIF_SEEN_KEY = 'tripmate_admin_seen_notifications';
  let seenNotificationIds = new Set(loadJSON(NOTIF_SEEN_KEY, []));
  const persistSeenNotifications = () => save(NOTIF_SEEN_KEY, [...seenNotificationIds]);

  // Real, derived notifications — nothing fabricated: pending host/listing
  // applications and bookings still awaiting confirmation.
  const getNotifications = () => {
    const items = [];

    getPendingApplications().forEach((application) => {
      items.push({
        id: `app-${application.kind}-${application.key}`,
        kind: 'application',
        title: application.kind === 'listing' ? 'Listing pending review' : 'New host application',
        subtitle: application.kind === 'listing'
          ? `${application.listing.name} · ${application.applicantName}`
          : `${application.applicantName} · ${application.propertyType}`,
        time: application.firstSeenAt,
        goto: 'verification',
        highlightId: applicationDomId(application.kind, application.key),
      });
    });

    bookings.filter((b) => b.status === 'Pending').forEach((b) => {
      const listing = listingById(b.listingId);
      items.push({
        id: `booking-${b.id}`,
        kind: 'booking',
        title: 'Booking awaiting confirmation',
        subtitle: `${b.guestName} · ${listing ? listing.name : 'Unknown property'}`,
        time: b.createdAt,
        goto: 'transactions',
        bookingId: b.id,
      });
    });

    return items.sort((a, b) => (b.time || 0) - (a.time || 0));
  };

  const bellBtn = document.getElementById('bellBtn');
  const notifMenu = document.getElementById('notifMenu');
  const notifList = document.getElementById('notifList');
  const notifDot = document.getElementById('notifDot');

  const renderNotifications = () => {
    const items = getNotifications();
    const unreadCount = items.filter((it) => !seenNotificationIds.has(it.id)).length;
    notifDot.hidden = unreadCount === 0 || !adminSettings.showVerificationAlerts;

    if (!items.length) {
      notifList.innerHTML = `<div class="notif-empty">You're all caught up.</div>`;
      return;
    }

    notifList.innerHTML = items.map((it) => {
      const unread = !seenNotificationIds.has(it.id);
      const iconSVG = it.kind === 'booking'
        ? '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 2v3"/><path d="M16 2v3"/><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M3 10h18"/></svg>'
        : '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.8 17 5 19 5a1 1 0 0 1 1 1z"/></svg>';
      return `
        <button type="button" class="notif-item" data-id="${escapeHTML(it.id)}">
          <span class="notif-item-icon ${it.kind === 'booking' ? 'is-booking' : ''}">${iconSVG}</span>
          <span class="notif-item-body">
            <span class="notif-item-title">${escapeHTML(it.title)}</span>
            <span class="notif-item-sub">${escapeHTML(it.subtitle)}</span>
            <span class="notif-item-time">${timeAgo(it.time)}</span>
          </span>
          ${unread ? '<span class="notif-unread-dot"></span>' : ''}
        </button>`;
    }).join('');
  };

  const closeNotifMenu = () => {
    notifMenu.hidden = true;
    bellBtn.setAttribute('aria-expanded', 'false');
  };

  bellBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const willOpen = notifMenu.hidden;
    if (willOpen) renderNotifications();
    notifMenu.hidden = !willOpen;
    bellBtn.setAttribute('aria-expanded', String(willOpen));
  });
  notifMenu.addEventListener('click', (e) => e.stopPropagation());

  document.getElementById('notifMarkAllBtn').addEventListener('click', () => {
    getNotifications().forEach((it) => seenNotificationIds.add(it.id));
    persistSeenNotifications();
    renderNotifications();
  });

  notifList.addEventListener('click', (e) => {
    const item = e.target.closest('.notif-item');
    if (!item) return;
    const notif = getNotifications().find((it) => it.id === item.dataset.id);
    if (!notif) return;

    seenNotificationIds.add(notif.id);
    persistSeenNotifications();
    closeNotifMenu();
    goToView(notif.goto);

    if (notif.highlightId) {
      const card = document.getElementById(notif.highlightId);
      if (card) {
        card.scrollIntoView({ behavior: 'smooth', block: 'center' });
        card.classList.add('is-highlighted');
        setTimeout(() => card.classList.remove('is-highlighted'), 1600);
      }
    }
    if (notif.bookingId) openTransactionDetail(notif.bookingId);

    renderNotifications();
  });

  const topbarAvatarBtn = document.getElementById('topbarAvatarBtn');
  const accountMenu = document.getElementById('accountMenu');

  const closeAccountMenu = () => {
    accountMenu.hidden = true;
    topbarAvatarBtn.setAttribute('aria-expanded', 'false');
  };

  topbarAvatarBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const willOpen = accountMenu.hidden;
    if (willOpen) {
      document.getElementById('accountMenuName').textContent = adminProfile.fullName || 'Admin';
      document.getElementById('accountMenuEmail').textContent = adminProfile.email || 'No email set';
    }
    accountMenu.hidden = !willOpen;
    topbarAvatarBtn.setAttribute('aria-expanded', String(willOpen));
  });
  accountMenu.addEventListener('click', (e) => e.stopPropagation());

  accountMenu.querySelector('[data-action="home-page"]').addEventListener('click', () => {
    closeAccountMenu();
    window.location.href = 'homepage.html';
  });
  accountMenu.querySelector('[data-action="account-logout"]').addEventListener('click', () => {
    closeAccountMenu();
    showToast('Logged out (demo only — no backend session).');
  });

  document.addEventListener('click', (e) => {
    if (!accountMenu.hidden && !accountMenu.contains(e.target) && !topbarAvatarBtn.contains(e.target)) {
      closeAccountMenu();
    }
    if (!notifMenu.hidden && !notifMenu.contains(e.target) && !bellBtn.contains(e.target)) {
      closeNotifMenu();
    }
  });

  // Counts items created in the last N days — used for honest "this week"-style
  // deltas on stat cards instead of invented percentages.
  const countCreatedWithin = (items, days) => {
    const cutoff = Date.now() - days * 86400000;
    return items.filter((it) => (it.createdAt || 0) >= cutoff).length;
  };

  const trendLabel = (count, noun) => {
    if (count === 0) return { text: `No new ${noun} this week`, cls: '' };
    return { text: `+${count} ${noun} this week`, cls: 'is-up' };
  };

  const trendArrowSVG = '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17 17 7"/><path d="M7 7h10v10"/></svg>';

  const applyTrend = (el, count, noun) => {
    const { text, cls } = trendLabel(count, noun);
    el.className = `stat-delta ${cls}`;
    el.innerHTML = cls === 'is-up' ? `${trendArrowSVG}${text}` : text;
  };

  /* =========================================================
     SHARED ROW DROPDOWN (⋮ menu used by Inventory)
  ========================================================= */
  const rowMenu = document.getElementById('rowMenu');
  let rowMenuContext = null; // { onEdit, onDelete }

  const closeAnyDropdown = () => { rowMenu.hidden = true; rowMenuContext = null; };

  const openRowMenu = (triggerEl, context) => {
    rowMenuContext = context;
    rowMenu.hidden = false;
    const rect = triggerEl.getBoundingClientRect();
    const menuWidth = 170;
    let left = rect.right - menuWidth;
    if (left < 8) left = 8;
    rowMenu.style.left = `${left}px`;
    rowMenu.style.top = `${rect.bottom + 6}px`;
  };

  rowMenu.querySelector('[data-action="edit"]').addEventListener('click', () => {
    const ctx = rowMenuContext;
    closeAnyDropdown();
    if (ctx && ctx.onEdit) ctx.onEdit();
  });
  rowMenu.querySelector('[data-action="delete"]').addEventListener('click', () => {
    const ctx = rowMenuContext;
    closeAnyDropdown();
    if (ctx && ctx.onDelete) ctx.onDelete();
  });

  document.addEventListener('click', (e) => {
    if (!rowMenu.hidden && !rowMenu.contains(e.target) && !e.target.closest('.row-menu-btn')) {
      closeAnyDropdown();
    }
  });

  /* =========================================================
     GENERIC CONFIRM MODAL
  ========================================================= */
  const confirmModalOverlay = document.getElementById('confirmModalOverlay');
  const confirmModalTitle = document.getElementById('confirmModalTitle');
  const confirmModalText = document.getElementById('confirmModalText');
  const confirmOkBtn = document.getElementById('confirmOkBtn');
  const confirmCancelBtn = document.getElementById('confirmCancelBtn');
  let pendingConfirmAction = null;

  const openConfirmModal = (title, text, onConfirm) => {
    confirmModalTitle.textContent = title;
    confirmModalText.textContent = text;
    pendingConfirmAction = onConfirm;
    confirmModalOverlay.hidden = false;
    confirmOkBtn.focus();
  };
  const closeConfirmModal = () => { confirmModalOverlay.hidden = true; pendingConfirmAction = null; };

  confirmOkBtn.addEventListener('click', () => {
    if (typeof pendingConfirmAction === 'function') pendingConfirmAction();
    closeConfirmModal();
  });
  confirmCancelBtn.addEventListener('click', closeConfirmModal);
  confirmModalOverlay.addEventListener('click', (e) => { if (e.target === confirmModalOverlay) closeConfirmModal(); });

  /* =========================================================
     PAGINATION (shared)
  ========================================================= */
  const renderPagination = (containerEl, total, pageSize, currentPage, onChange) => {
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const page = Math.min(Math.max(1, currentPage), totalPages);
    const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
    const end = Math.min(total, page * pageSize);

    const pageNumbers = [];
    const windowSize = 2;
    for (let p = 1; p <= totalPages; p++) {
      if (p === 1 || p === totalPages || (p >= page - windowSize && p <= page + windowSize)) {
        pageNumbers.push(p);
      } else if (pageNumbers[pageNumbers.length - 1] !== '…') {
        pageNumbers.push('…');
      }
    }

    containerEl.innerHTML = `
      <span class="pagination-summary">Showing ${start}-${end} of ${total} ${total === 1 ? 'entry' : 'entries'}</span>
      <div class="pagination-controls">
        <button type="button" class="pagination-btn" data-page="${page - 1}" ${page <= 1 ? 'disabled' : ''} aria-label="Previous page">
          <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </button>
        ${pageNumbers.map((p) => p === '…'
          ? `<span class="pagination-btn" style="cursor:default">…</span>`
          : `<button type="button" class="pagination-btn ${p === page ? 'is-active' : ''}" data-page="${p}">${p}</button>`
        ).join('')}
        <button type="button" class="pagination-btn" data-page="${page + 1}" ${page >= totalPages ? 'disabled' : ''} aria-label="Next page">
          <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
        </button>
      </div>`;

    containerEl.querySelectorAll('.pagination-btn[data-page]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const p = Number(btn.dataset.page);
        if (p >= 1 && p <= totalPages) onChange(p);
      });
    });

    return page;
  };

  /* =========================================================
     DASHBOARD
  ========================================================= */
  const renderDashboard = () => {
    const users = getUsers();
    const pendingApplications = getPendingApplications();
    const nonCancelled = bookings.filter((b) => b.status !== 'Cancelled');
    const totalVolume = nonCancelled.reduce((sum, b) => sum + transactionBreakdown(b).total, 0);
    const pendingListings = listings.filter((l) => l.status === 'Pending Review').length;

    document.getElementById('dashListings').textContent = listings.length;
    document.getElementById('dashListingsDelta').textContent = `${pendingListings} pending review`;
    document.getElementById('dashBookings').textContent = nonCancelled.length;
    document.getElementById('dashBookingsDelta').textContent = `${bookings.length} total on record`;
    document.getElementById('dashVerification').textContent = pendingApplications.length;
    document.getElementById('dashVolume').textContent = formatPeso(totalVolume);
    document.getElementById('dashVolumeDelta').textContent = `Across ${nonCancelled.length} booking${nonCancelled.length === 1 ? '' : 's'}`;

    // nav badges
    document.getElementById('navInventoryCount').textContent = listings.length;
    const vCount = document.getElementById('navVerificationCount');
    vCount.textContent = pendingApplications.length;
    vCount.hidden = pendingApplications.length === 0 || !adminSettings.showVerificationAlerts;
    renderNotifications();

    // recent transactions preview
    const recentTx = [...bookings].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)).slice(0, 4);
    document.getElementById('dashTransactionsBody').innerHTML = recentTx.length ? recentTx.map((b) => {
      const listing = listingById(b.listingId);
      const { total } = transactionBreakdown(b);
      const meta = TX_STATUS_META[b.status] || TX_STATUS_META.Pending;
      const host = (listing && listing.host) || (listing ? listing.name : 'Unknown');
      return `
        <tr>
          <td class="cell-primary">#TRX-${b.id.slice(-5).toUpperCase()}</td>
          <td class="cell-with-avatar">
            <span class="row-avatar" style="background:${avatarColorFor(host)}">${escapeHTML(getInitials(host))}</span>
            ${escapeHTML(host)}
          </td>
          <td>${formatPeso(total)}</td>
          <td>${statusBadgeHTML(meta.label, meta.cls)}</td>
        </tr>`;
    }).join('') : `<tr><td colspan="4" class="empty-state">No transactions yet.</td></tr>`;

    // pending applications preview
    const previewItems = pendingApplications.slice(0, 4);
    document.getElementById('dashVerificationBody').innerHTML = previewItems.length ? previewItems.map((it) => `
      <tr>
        <td class="cell-with-avatar">
          <span class="row-avatar" style="background:${avatarColorFor(it.key || it.applicantName)}">${escapeHTML(getInitials(it.applicantName))}</span>
          ${escapeHTML(it.applicantName)}
        </td>
        <td>${statusBadgeHTML(it.identity.label, it.identity.cls)}</td>
        <td>${statusBadgeHTML(it.inspection.label, it.inspection.cls)}</td>
      </tr>`).join('') : `<tr><td colspan="3" class="empty-state">No pending applications.</td></tr>`;
  };
  RENDERERS.dashboard = renderDashboard;

  /* =========================================================
     INVENTORY
  ========================================================= */
  const inventorySearchInput = document.getElementById('inventorySearch');
  const inventoryBody = document.getElementById('inventoryBody');
  const inventoryEmpty = document.getElementById('inventoryEmpty');
  const inventoryPaginationEl = document.getElementById('inventoryPagination');
  const inventorySelectAll = document.getElementById('inventorySelectAll');
  const inventoryBulkBar = document.getElementById('inventoryBulkBar');
  let inventoryPage = 1;
  let inventoryStatusFilters = []; // empty = all statuses
  const inventorySelected = new Set();

  // Stable, human-friendly IDs derived from real creation order — not fabricated data,
  // just a display numbering scheme for actual listings (#INV-1001, #INV-1002, …).
  const propertyDisplayId = (listing) => {
    const ordered = [...listings].sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
    const idx = ordered.findIndex((l) => l.id === listing.id);
    return `#INV-${1000 + (idx === -1 ? ordered.length : idx) + 1}`;
  };

  const getFilteredListings = () => {
    const query = inventorySearchInput.value.trim().toLowerCase();
    return listings.filter((l) => {
      const matchesStatus = !inventoryStatusFilters.length || inventoryStatusFilters.includes(l.status);
      const haystack = `${l.name} ${l.location} ${l.host || ''} ${propertyDisplayId(l)}`.toLowerCase();
      const matchesQuery = !query || haystack.includes(query);
      return matchesStatus && matchesQuery;
    });
  };

  const renderInventory = () => {
    const pendingApplications = getPendingApplications();
    document.getElementById('invTotalListings').textContent = listings.length;
    applyTrend(document.getElementById('invTotalListingsDelta'), countCreatedWithin(listings, 7), 'listings');
    const activeBookings = bookings.filter((b) => b.status !== 'Cancelled');
    document.getElementById('invActiveBookings').textContent = activeBookings.length;
    applyTrend(document.getElementById('invActiveBookingsDelta'), countCreatedWithin(activeBookings, 7), 'bookings');
    document.getElementById('invVerificationQueue').textContent = pendingApplications.length;
    document.getElementById('invVerificationLink').hidden = pendingApplications.length === 0;

    const filtered = getFilteredListings();

    inventoryEmpty.hidden = listings.length !== 0;
    inventoryBody.closest('table').hidden = listings.length === 0;
    inventoryPaginationEl.hidden = filtered.length === 0;

    const page = renderPagination(inventoryPaginationEl, filtered.length, adminSettings.rowsPerPage, inventoryPage, (p) => {
      inventoryPage = p;
      renderInventory();
    });
    inventoryPage = page;

    const pageItems = filtered.slice((page - 1) * adminSettings.rowsPerPage, page * adminSettings.rowsPerPage);

    // drop selections for listings no longer visible in the full filtered set (e.g. deleted)
    const filteredIds = new Set(filtered.map((l) => l.id));
    [...inventorySelected].forEach((id) => { if (!filteredIds.has(id)) inventorySelected.delete(id); });

    inventoryBody.innerHTML = pageItems.length ? pageItems.map((l) => {
      const meta = LISTING_STATUS_META[l.status] || LISTING_STATUS_META['Pending Review'];
      const thumb = getEffectiveImages(l)[0];
      const checked = inventorySelected.has(l.id) ? 'checked' : '';
      return `
        <tr data-id="${l.id}">
          <td class="td-checkbox"><input type="checkbox" data-row-select="${l.id}" ${checked}></td>
          <td class="cell-muted">${propertyDisplayId(l)}</td>
          <td>
            <div class="cell-with-thumb">
              <img class="row-thumb" src="${escapeHTML(thumb)}" alt="">
              <div class="cell-detail-text">
                <span class="cell-primary">${escapeHTML(l.name)}</span>
                <span class="cell-detail-loc">
                  <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/></svg>
                  ${escapeHTML(l.location)}
                </span>
              </div>
            </div>
          </td>
          <td class="cell-muted">${escapeHTML(l.host || '—')}</td>
          <td>${statusBadgeHTML(l.status, meta.cls)}</td>
          <td>
            <button type="button" class="row-menu-btn" data-action="row-menu" data-id="${l.id}" aria-label="More actions">
              <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="5" r="1.2"/><circle cx="12" cy="12" r="1.2"/><circle cx="12" cy="19" r="1.2"/></svg>
            </button>
          </td>
        </tr>`;
    }).join('') : `<tr><td colspan="6" class="empty-state">No listings match your filters.</td></tr>`;

    inventorySelectAll.checked = pageItems.length > 0 && pageItems.every((l) => inventorySelected.has(l.id));
    inventoryBulkBar.hidden = inventorySelected.size === 0;
    document.getElementById('inventoryBulkCount').textContent = `${inventorySelected.size} selected`;
  };
  RENDERERS.inventory = renderInventory;

  inventorySearchInput.addEventListener('input', () => { inventoryPage = 1; renderInventory(); });

  inventorySelectAll.addEventListener('change', () => {
    const rows = inventoryBody.querySelectorAll('[data-row-select]');
    rows.forEach((cb) => {
      const id = cb.dataset.rowSelect;
      if (inventorySelectAll.checked) inventorySelected.add(id); else inventorySelected.delete(id);
    });
    renderInventory();
  });

  inventoryBody.addEventListener('change', (e) => {
    const cb = e.target.closest('[data-row-select]');
    if (!cb) return;
    if (cb.checked) inventorySelected.add(cb.dataset.rowSelect); else inventorySelected.delete(cb.dataset.rowSelect);
    renderInventory();
  });

  document.getElementById('inventoryBulkDeleteBtn').addEventListener('click', () => {
    const count = inventorySelected.size;
    if (!count) return;
    openConfirmModal(
      'Delete selected listings?',
      `This will permanently remove ${count} listing${count === 1 ? '' : 's'}. Any associated bookings will remain but show as "Unknown property."`,
      () => {
        listings = listings.filter((l) => !inventorySelected.has(l.id));
        inventorySelected.clear();
        persistListings();
        renderInventory();
        renderDashboard();
        showToast(`${count} listing${count === 1 ? '' : 's'} deleted.`, 'success');
      }
    );
  });

  /* ---- custom "Filter" dropdown for status ---- */
  const inventoryFilterBtn = document.getElementById('inventoryFilterBtn');
  const inventoryFilterPanel = document.getElementById('inventoryFilterPanel');
  const inventoryFilterCount = document.getElementById('inventoryFilterCount');

  const closeInventoryFilterPanel = () => { inventoryFilterPanel.hidden = true; };

  inventoryFilterBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    inventoryFilterPanel.hidden = !inventoryFilterPanel.hidden;
  });
  inventoryFilterPanel.addEventListener('click', (e) => e.stopPropagation());

  document.getElementById('inventoryFilterApply').addEventListener('click', () => {
    inventoryStatusFilters = [...inventoryFilterPanel.querySelectorAll('input[type="checkbox"]:checked')].map((cb) => cb.value);
    inventoryFilterCount.hidden = inventoryStatusFilters.length === 0;
    inventoryFilterCount.textContent = inventoryStatusFilters.length;
    inventoryPage = 1;
    closeInventoryFilterPanel();
    renderInventory();
  });

  document.getElementById('inventoryFilterClear').addEventListener('click', () => {
    inventoryFilterPanel.querySelectorAll('input[type="checkbox"]').forEach((cb) => { cb.checked = false; });
    inventoryStatusFilters = [];
    inventoryFilterCount.hidden = true;
    inventoryPage = 1;
    closeInventoryFilterPanel();
    renderInventory();
  });

  document.addEventListener('click', (e) => {
    if (!inventoryFilterPanel.hidden && !inventoryFilterPanel.contains(e.target) && e.target !== inventoryFilterBtn) {
      closeInventoryFilterPanel();
    }
  });

  inventoryBody.addEventListener('click', (e) => {
    const menuBtn = e.target.closest('[data-action="row-menu"]');
    if (!menuBtn) return;
    const listing = listingById(menuBtn.dataset.id);
    if (!listing) return;
    openRowMenu(menuBtn, {
      onEdit: () => openListingModal(listing),
      onDelete: () => {
        const linkedBookings = bookings.filter((b) => b.listingId === listing.id).length;
        const extra = linkedBookings
          ? ` This listing has ${linkedBookings} associated booking${linkedBookings === 1 ? '' : 's'}, which will remain but show as "Unknown property."`
          : '';
        openConfirmModal('Delete listing?', `This will permanently remove "${listing.name}".${extra}`, () => {
          listings = listings.filter((l) => l.id !== listing.id);
          persistListings();
          renderInventory();
          renderDashboard();
          showToast('Listing deleted.', 'success');
        });
      },
    });
  });

  document.getElementById('addListingBtn').addEventListener('click', () => openListingModal(null));
  document.getElementById('inventoryEmptyAddBtn').addEventListener('click', () => openListingModal(null));
  document.getElementById('exportInventoryBtn').addEventListener('click', () => {
    const filtered = getFilteredListings();
    if (!filtered.length) {
      showToast('There\'s nothing to export yet.', 'error');
      return;
    }
    downloadCSV(
      `tripmate-inventory-${new Date().toISOString().split('T')[0]}.csv`,
      ['Property ID', 'Name', 'Location', 'Type', 'Host', 'Price per night', 'Status'],
      filtered.map((l) => [propertyDisplayId(l), l.name, l.location, l.type, l.host || '', l.price, l.status])
    );
    showToast(`Exported ${filtered.length} listing${filtered.length === 1 ? '' : 's'}.`, 'success');
  });

  /* ---- Add / edit listing modal ---- */
  const listingModalOverlay = document.getElementById('listingModalOverlay');
  const listingModalTitle = document.getElementById('listingModalTitle');
  const listingForm = document.getElementById('listingForm');
  const listingIdInput = document.getElementById('listingId');
  const listingNameInput = document.getElementById('listingName');
  const listingLocationInput = document.getElementById('listingLocation');
  const listingTypeInput = document.getElementById('listingType');
  const listingHostInput = document.getElementById('listingHost');
  const listingPriceInput = document.getElementById('listingPrice');
  const listingStatusInput = document.getElementById('listingStatus');
  const listingImagesInput = document.getElementById('listingImages');
  const listingAmenitiesInput = document.getElementById('listingAmenities');
  const listingImageHint = document.getElementById('listingImageHint');
  const listingImagePreview = document.getElementById('listingImagePreview');

  const splitCSV = (str) => String(str || '').split(',').map((s) => s.trim()).filter(Boolean);

  const updateListingPreview = () => {
    const typedImages = splitCSV(listingImagesInput.value);
    if (typedImages.length) {
      listingImagePreview.src = typedImages[0];
      listingImagePreview.hidden = false;
      listingImageHint.textContent = 'Using the photo(s) you entered above.';
      return;
    }
    const matched = resolveLocationImage(listingLocationInput.value);
    if (matched) {
      listingImagePreview.src = matched;
      listingImagePreview.hidden = false;
      listingImageHint.textContent = 'No photo entered — matched a destination photo from the location.';
    } else {
      listingImagePreview.hidden = true;
      listingImagePreview.src = '';
      listingImageHint.textContent = "Leave this blank and we'll match a destination photo to the location above.";
    }
  };

  const clearListingErrors = () => {
    ['listingName', 'listingLocation', 'listingPrice'].forEach((id) => {
      document.getElementById(id).classList.remove('has-error');
      document.getElementById(`${id}Error`).textContent = '';
    });
  };

  const openListingModal = (listing) => {
    clearListingErrors();
    listingForm.reset();
    if (listing) {
      listingModalTitle.textContent = 'Edit Listing';
      listingIdInput.value = listing.id;
      listingNameInput.value = listing.name;
      listingLocationInput.value = listing.location;
      listingTypeInput.value = listing.type;
      listingHostInput.value = listing.host || '';
      listingPriceInput.value = listing.price;
      listingStatusInput.value = listing.status;
      listingImagesInput.value = (listing.images || []).join(', ');
      listingAmenitiesInput.value = (listing.amenities || []).join(', ');
    } else {
      listingModalTitle.textContent = 'Add Listing';
      listingIdInput.value = '';
      listingStatusInput.value = 'Verified';
      listingTypeInput.value = 'House Rental';
      listingImagesInput.value = '';
      listingAmenitiesInput.value = '';
    }
    updateListingPreview();
    listingModalOverlay.hidden = false;
    listingNameInput.focus();
  };
  const closeListingModal = () => { listingModalOverlay.hidden = true; };

  listingLocationInput.addEventListener('input', updateListingPreview);
  listingImagesInput.addEventListener('input', updateListingPreview);
  document.getElementById('listingModalClose').addEventListener('click', closeListingModal);
  document.getElementById('listingCancelBtn').addEventListener('click', closeListingModal);
  listingModalOverlay.addEventListener('click', (e) => { if (e.target === listingModalOverlay) closeListingModal(); });

  listingForm.addEventListener('submit', (e) => {
    e.preventDefault();
    clearListingErrors();

    let hasError = false;
    const name = listingNameInput.value.trim();
    const location = listingLocationInput.value.trim();
    const price = Number(listingPriceInput.value);

    if (!name) {
      listingNameInput.classList.add('has-error');
      document.getElementById('listingNameError').textContent = 'Enter a property name.';
      hasError = true;
    }
    if (!location) {
      listingLocationInput.classList.add('has-error');
      document.getElementById('listingLocationError').textContent = 'Enter a location.';
      hasError = true;
    }
    if (!listingPriceInput.value || isNaN(price) || price <= 0) {
      listingPriceInput.classList.add('has-error');
      document.getElementById('listingPriceError').textContent = 'Enter a valid price.';
      hasError = true;
    }
    if (hasError) return;

    const payload = {
      name,
      location,
      type: listingTypeInput.value,
      host: listingHostInput.value.trim(),
      price,
      status: listingStatusInput.value,
      images: splitCSV(listingImagesInput.value),
      amenities: splitCSV(listingAmenitiesInput.value),
    };

    if (listingIdInput.value) {
      const listing = listingById(listingIdInput.value);
      if (listing) Object.assign(listing, payload);
      showToast('Listing updated.', 'success');
    } else {
      listings.unshift({ id: genId('l'), createdAt: Date.now(), ...payload });
      showToast('Listing added.', 'success');
    }

    persistListings();
    closeListingModal();
    renderInventory();
    renderDashboard();
  });

  /* =========================================================
     VERIFICATION (host applications)
  ========================================================= */
  let verificationSearchQuery = '';

  const getPendingHosts = () => {
    const users = getUsers();
    const pending = users.filter((u) => u.type === 'host' && !u.verified && !u.declined);
    let touched = false;
    pending.forEach((u) => {
      if (!u.firstSeenAt) { u.firstSeenAt = Date.now(); touched = true; }
    });
    if (touched) saveUsers(users);
    return pending;
  };

  const propertyTypeForHost = (fullName) => {
    const match = listings.find((l) => (l.host || '').toLowerCase() === String(fullName || '').toLowerCase());
    return match ? match.type : 'Not linked to a listing yet';
  };

  // A host's real account, if one was ever signed up under this name — used to give
  // a listing-based queue item an honest identity status instead of a guess.
  const identityStatusForHostName = (name) => {
    const match = getUsers().find((u) => u.type === 'host' && (u.fullName || '').toLowerCase() === String(name || '').toLowerCase());
    if (!match) return { label: 'No Account', cls: 'gray' };
    return match.verified ? { label: 'Verified', cls: 'green' } : { label: 'Pending Review', cls: 'amber' };
  };

  // The Verification Queue combines two real, independent sources — nothing fabricated:
  // 1) listings you've marked "Pending Review" / "Action Required" in Inventory
  // 2) new host sign-ups from the TripMate site who haven't been approved yet
  // A host whose listing is already covered above isn't duplicated as a separate row.
  const getPendingApplications = () => {
    const listingItems = listings
      .filter((l) => l.status === 'Pending Review' || l.status === 'Action Required')
      .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
      .map((l) => {
        const meta = LISTING_STATUS_META[l.status] || LISTING_STATUS_META['Pending Review'];
        return {
          kind: 'listing',
          key: l.id,
          applicantName: l.host || l.name,
          firstSeenAt: l.createdAt,
          propertyType: l.type,
          identity: identityStatusForHostName(l.host),
          inspection: { label: l.status, cls: meta.cls },
          listing: l,
        };
      });

    const coveredNames = new Set(listingItems.map((it) => String(it.applicantName || '').toLowerCase()));

    const hostItems = getPendingHosts()
      .filter((u) => !coveredNames.has(String(u.fullName || '').toLowerCase()))
      .map((u) => ({
        kind: 'host',
        key: u.email,
        applicantName: u.fullName || 'Unnamed',
        firstSeenAt: u.firstSeenAt,
        propertyType: propertyTypeForHost(u.fullName),
        identity: { label: 'Verified', cls: 'green' },
        inspection: { label: 'Pending Review', cls: 'amber' },
        user: u,
      }));

    return [...listingItems, ...hostItems];
  };

  // A DOM-safe id for a given application, used to scroll/highlight its badge card.
  const applicationDomId = (kind, key) => `badge-card-${kind}-${encodeURIComponent(key || '')}`;

  const verificationBody = document.getElementById('verificationBody');
  const verificationEmpty = document.getElementById('verificationEmpty');
  const badgePreviewBody = document.getElementById('badgePreviewBody');
  const badgePreviewCount = document.getElementById('badgePreviewCount');

  const renderVerification = () => {
    const pending = getPendingApplications();
    document.getElementById('verificationPendingPill').textContent = `${pending.length} Pending`;
    verificationEmpty.hidden = pending.length !== 0;
    verificationBody.closest('table').hidden = pending.length === 0;

    const query = verificationSearchQuery.trim().toLowerCase();
    const filtered = query
      ? pending.filter((it) => `${it.applicantName} ${it.propertyType}`.toLowerCase().includes(query))
      : pending;

    verificationBody.innerHTML = filtered.length ? filtered.map((it) => `
      <tr>
        <td>
          <div class="applicant-cell">
            <span class="row-avatar row-avatar-lg" style="background:${avatarColorFor(it.key || it.applicantName)}">${escapeHTML(getInitials(it.applicantName))}</span>
            <div class="applicant-cell-text">
              <span class="applicant-name">${escapeHTML(it.applicantName)}</span>
              <span class="applicant-meta">${it.kind === 'listing' ? 'Listing' : 'Host'} · First seen ${timeAgo(it.firstSeenAt)}</span>
            </div>
          </div>
        </td>
        <td class="cell-muted">${escapeHTML(it.propertyType)}</td>
        <td>${statusBadgeHTML(it.identity.label, it.identity.cls)}</td>
        <td>${statusBadgeHTML(it.inspection.label, it.inspection.cls)}</td>
        <td>
          <button type="button" class="review-btn" data-kind="${it.kind}" data-key="${escapeHTML(it.key || '')}">Review</button>
        </td>
      </tr>`).join('') : (pending.length ? `<tr><td colspan="5" class="empty-state">No applications match your search.</td></tr>` : '');

    renderBadgePreview(pending);
  };
  RENDERERS.verification = renderVerification;

  /* =========================================================
     USERS
  ========================================================= */
  const usersBody = document.getElementById('usersBody');
  const usersEmpty = document.getElementById('usersEmpty');
  const usersSearch = document.getElementById('usersSearch');
  const usersRoleFilter = document.getElementById('usersRoleFilter');
  let adminUsers = [];

  const normalizeAdminUser = (user) => ({
    ...user,
    name: user.name || user.fullName || 'Unnamed user',
    email: user.email || '',
    role: user.role || user.type || 'guest',
    isActive: user.isActive !== false && user.is_active !== false,
    verified: Boolean(user.verified),
    createdAt: user.createdAt || user.created_at || Date.now()
  });

  const loadAdminUsers = async () => {
    if (localStorage.getItem('tripmate_access_token') === 'local-demo-admin') {
      adminUsers = getUsers().map(normalizeAdminUser);
      return;
    }
    adminUsers = (await apiRequest('/admin/users')).map(normalizeAdminUser);
  };

  const renderUsers = async () => {
    try {
      await loadAdminUsers();
    } catch (error) {
      usersBody.innerHTML = `<tr><td colspan="5" class="empty-state">${escapeHTML(error.message || 'Unable to load users.')}</td></tr>`;
      usersEmpty.hidden = true;
      return;
    }
    const query = usersSearch.value.trim().toLowerCase();
    const role = usersRoleFilter.value;
    const filtered = adminUsers.filter((user) => {
      const matchesQuery = !query || `${user.name} ${user.email}`.toLowerCase().includes(query);
      return matchesQuery && (role === 'all' || user.role === role);
    });
    usersEmpty.hidden = filtered.length !== 0;
    usersBody.innerHTML = filtered.map((user) => `
      <tr>
        <td><div class="cell-with-avatar"><span class="row-avatar" style="background:${avatarColorFor(user.email || user.name)}">${escapeHTML(getInitials(user.name))}</span><div><strong>${escapeHTML(user.name)}</strong><div class="cell-muted">${escapeHTML(user.email)}</div></div></div></td>
        <td>${statusBadgeHTML(user.role, user.role === 'admin' ? 'blue' : user.role === 'host' ? 'amber' : 'gray')}</td>
        <td>${statusBadgeHTML(!user.isActive ? 'Inactive' : user.verified ? 'Verified' : 'Active', !user.isActive ? 'red' : user.verified ? 'green' : 'blue')}</td>
        <td class="cell-muted">${escapeHTML(new Date(user.createdAt).toLocaleDateString('en-PH'))}</td>
        <td><div class="row-actions"><button type="button" class="link-btn user-edit-btn" data-id="${escapeHTML(user.id)}">Edit</button><button type="button" class="link-btn user-toggle-btn" data-id="${escapeHTML(user.id)}" data-active="${user.isActive}">${user.isActive ? 'Deactivate' : 'Activate'}</button><button type="button" class="link-btn danger user-delete-btn" data-id="${escapeHTML(user.id)}">Delete</button></div></td>
      </tr>`).join('');
  };
  RENDERERS.users = renderUsers;

  const adminsBody = document.getElementById('adminsBody');
  const adminsEmpty = document.getElementById('adminsEmpty');
  const adminsSearch = document.getElementById('adminsSearch');
  const renderAdmins = async () => {
    try {
      await loadAdminUsers();
    } catch (error) {
      adminsBody.innerHTML = `<tr><td colspan="5" class="empty-state">${escapeHTML(error.message || 'Unable to load admins.')}</td></tr>`;
      adminsEmpty.hidden = true;
      return;
    }
    const query = adminsSearch.value.trim().toLowerCase();
    const admins = adminUsers.filter((user) => user.role === 'admin' && (!query || `${user.name} ${user.email}`.toLowerCase().includes(query)));
    adminsEmpty.hidden = admins.length !== 0;
    adminsBody.innerHTML = admins.map((user) => `
      <tr>
        <td><div class="cell-with-avatar"><span class="row-avatar" style="background:${avatarColorFor(user.email || user.name)}">${escapeHTML(getInitials(user.name))}</span><strong>${escapeHTML(user.name)}</strong></div></td>
        <td class="cell-muted">${escapeHTML(user.email)}</td>
        <td>${statusBadgeHTML('Admin', 'blue')}</td>
        <td>${statusBadgeHTML(user.isActive ? 'Active' : 'Inactive', user.isActive ? 'green' : 'red')}</td>
        <td><button type="button" class="link-btn admin-edit-btn" data-id="${escapeHTML(user.id)}">Edit</button><button type="button" class="link-btn admin-demote-btn" data-id="${escapeHTML(user.id)}">Demote</button></td>
      </tr>`).join('');
  };
  RENDERERS.admins = renderAdmins;

  const updateAdminUser = async (id, updates) => {
    if (localStorage.getItem('tripmate_access_token') === 'local-demo-admin') {
      const users = getUsers();
      const index = users.findIndex((user) => String(user.id) === String(id));
      if (index !== -1) {
        users[index] = { ...users[index], ...updates, isActive: updates.isActive ?? users[index].isActive };
        saveUsers(users);
      }
      return;
    }
    await apiRequest(`/admin/users/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(updates) });
  };

  const createAdminUser = async (payload) => {
    if (localStorage.getItem('tripmate_access_token') === 'local-demo-admin') {
      const users = getUsers();
      users.push({ id: genId('u_'), ...payload, type: payload.role, fullName: payload.name, isActive: payload.isActive });
      saveUsers(users);
      return;
    }
    await apiRequest('/admin/users', { method: 'POST', body: JSON.stringify(payload) });
  };

  const userModalOverlay = document.getElementById('userModalOverlay');
  const userModalTitle = document.getElementById('userModalTitle');
  const userForm = document.getElementById('userForm');
  const userIdInput = document.getElementById('userId');
  const userNameInput = document.getElementById('userName');
  const userEmailInput = document.getElementById('userEmail');
  const userPasswordInput = document.getElementById('userPassword');
  const userRoleInput = document.getElementById('userRole');
  const userVerifiedInput = document.getElementById('userVerified');
  const userActiveInput = document.getElementById('userActive');
  const closeUserModal = () => { userModalOverlay.hidden = true; };
  const openUserModal = (user) => {
    userForm.reset();
    userIdInput.value = user?.id || '';
    userModalTitle.textContent = user?.id ? 'Edit User' : 'Add User';
    userNameInput.value = user?.name || '';
    userEmailInput.value = user?.email || '';
    userRoleInput.value = user?.role || 'guest';
    userVerifiedInput.checked = Boolean(user?.verified);
    userActiveInput.checked = user?.isActive !== false;
    userPasswordInput.required = !user;
    userModalOverlay.hidden = false;
    userNameInput.focus();
  };

  document.getElementById('addUserBtn').addEventListener('click', () => openUserModal(null));
  document.getElementById('addAdminBtn').addEventListener('click', () => openUserModal({ role: 'admin', isActive: true }));
  document.getElementById('userModalClose').addEventListener('click', closeUserModal);
  document.getElementById('userCancelBtn').addEventListener('click', closeUserModal);
  userModalOverlay.addEventListener('click', (event) => { if (event.target === userModalOverlay) closeUserModal(); });
  userForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const payload = {
      name: userNameInput.value.trim(), email: userEmailInput.value.trim(), role: userRoleInput.value,
      verified: userVerifiedInput.checked, isActive: userActiveInput.checked
    };
    if (!payload.name || !/^\S+@\S+\.\S+$/.test(payload.email)) {
      showToast('Enter a valid name and email.', 'error');
      return;
    }
    if (userPasswordInput.value) payload.password = userPasswordInput.value;
    if (!userIdInput.value && !payload.password) {
      showToast('A password is required for new users.', 'error');
      return;
    }
    try {
      if (userIdInput.value) await updateAdminUser(userIdInput.value, payload);
      else await createAdminUser(payload);
      closeUserModal();
      await renderUsers();
      await renderAdmins();
      showToast(userIdInput.value ? 'User updated.' : 'User created.', 'success');
    } catch (error) {
      showToast(error.message || 'Unable to save user.', 'error');
    }
  });

  usersSearch.addEventListener('input', renderUsers);
  usersRoleFilter.addEventListener('change', renderUsers);
  usersBody.addEventListener('click', async (event) => {
    const edit = event.target.closest('.user-edit-btn');
    const toggle = event.target.closest('.user-toggle-btn');
    const remove = event.target.closest('.user-delete-btn');
    const id = edit?.dataset.id || toggle?.dataset.id || remove?.dataset.id;
    if (!id) return;
    try {
      if (edit) {
        const user = adminUsers.find((item) => String(item.id) === String(id));
        if (user) openUserModal(user);
      } else if (toggle) {
        await updateAdminUser(id, { isActive: toggle.dataset.active !== 'true' });
        showToast('User access updated.', 'success');
      } else if (remove) {
        openConfirmModal('Delete user?', 'This permanently removes the account and any linked records.', async () => {
          if (localStorage.getItem('tripmate_access_token') === 'local-demo-admin') {
            saveUsers(getUsers().filter((user) => String(user.id) !== String(id)));
          } else {
            await apiRequest(`/admin/users/${encodeURIComponent(id)}`, { method: 'DELETE' });
          }
          await renderUsers();
          showToast('User deleted.', 'success');
        });
        return;
      }
      await renderUsers();
    } catch (error) {
      showToast(error.message || 'Unable to update user.', 'error');
    }
  });

  adminsSearch.addEventListener('input', renderAdmins);
  adminsBody.addEventListener('click', async (event) => {
    const edit = event.target.closest('.admin-edit-btn');
    const demote = event.target.closest('.admin-demote-btn');
    const id = edit?.dataset.id || demote?.dataset.id;
    if (!id) return;
    const user = adminUsers.find((item) => String(item.id) === String(id));
    if (!user) return;
    if (edit) {
      openUserModal(user);
      return;
    }
    try {
      await updateAdminUser(id, { role: 'guest' });
      await renderAdmins();
      showToast('Admin access removed.', 'success');
    } catch (error) {
      showToast(error.message || 'Unable to change admin access.', 'error');
    }
  });

  // Renders a badge card for every pending application at once — the panel no longer
  // waits for "Review" to be clicked before showing anything.
  const renderBadgePreview = (pendingArg) => {
    const pending = pendingArg || getPendingApplications();
    badgePreviewCount.textContent = `${pending.length} badge${pending.length === 1 ? '' : 's'}`;

    if (!pending.length) {
      badgePreviewBody.innerHTML = `
        <div class="empty-state">
          <svg class="icon empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          <p>No pending applications right now.</p>
        </div>`;
      return;
    }

    badgePreviewBody.innerHTML = `<div class="badge-preview-list">${pending.map((application) => {
      const domId = applicationDomId(application.kind, application.key);
      const mediaHTML = application.kind === 'listing'
        ? `<img class="badge-card-media" src="${escapeHTML(getEffectiveImages(application.listing)[0])}" alt="${escapeHTML(application.listing.name)}">`
        : `<span class="badge-card-media badge-card-avatar" style="background:${avatarColorFor(application.key || application.applicantName)}">${escapeHTML(getInitials(application.applicantName))}</span>`;
      const propertyLabel = application.kind === 'listing' ? application.listing.name : application.propertyType;

      return `
        <div class="badge-card" id="${domId}" data-kind="${application.kind}" data-key="${escapeHTML(application.key || '')}">
          ${mediaHTML}
          <span class="badge-card-name">${escapeHTML(application.applicantName)}</span>
          <span class="badge-card-property">${escapeHTML(propertyLabel)}</span>
          <span class="badge-card-tag">
            <svg class="icon" style="width:12px;height:12px" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 17.75 5.828 21l1.18-6.9L2 9.24l6.914-1.01L12 2l3.086 6.23L22 9.24l-5.008 4.86 1.18 6.9z"/></svg>
            ${application.kind === 'listing' ? 'New Listing' : 'New Host'}
          </span>
          <div class="badge-card-status-row">${statusBadgeHTML(application.inspection.label, application.inspection.cls)}</div>
          <div class="badge-card-actions">
            <button type="button" class="btn-primary btn-block" data-action="approve" data-kind="${application.kind}" data-key="${escapeHTML(application.key || '')}">
              <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
              ${application.kind === 'listing' ? 'Approve Listing' : 'Approve Host'}
            </button>
            <button type="button" class="decline-link" data-action="reject" data-kind="${application.kind}" data-key="${escapeHTML(application.key || '')}">Reject application</button>
          </div>
        </div>`;
    }).join('')}</div>`;
  };

  const approveApplication = (kind, key) => {
    const application = getPendingApplications().find((it) => it.kind === kind && it.key === key);
    if (!application) return;
    if (kind === 'listing') {
      const target = listingById(key);
      if (target) target.status = 'Verified';
      persistListings();
    } else {
      const list = getUsers();
      const target = list.find((u) => u.email === key);
      if (target) target.verified = true;
      saveUsers(list);
    }
    renderVerification();
    renderDashboard();
    renderInventory();
    showToast(`${application.applicantName} approved.`, 'success');
  };

  const rejectApplication = (kind, key) => {
    const application = getPendingApplications().find((it) => it.kind === kind && it.key === key);
    if (!application) return;
    const isListing = kind === 'listing';
    openConfirmModal(
      'Reject application?',
      isListing
        ? `This marks "${application.listing.name}" as Action Required. The listing stays in Inventory.`
        : `This removes "${application.applicantName}" from the verification queue. Their account stays intact.`,
      () => {
        if (isListing) {
          const target = listingById(key);
          if (target) target.status = 'Action Required';
          persistListings();
        } else {
          const list = getUsers();
          const target = list.find((u) => u.email === key);
          if (target) target.declined = true;
          saveUsers(list);
        }
        renderVerification();
        renderDashboard();
        renderInventory();
        showToast('Application rejected.', 'success');
      }
    );
  };

  badgePreviewBody.addEventListener('click', (e) => {
    const approveBtn = e.target.closest('[data-action="approve"]');
    const rejectBtn = e.target.closest('[data-action="reject"]');
    if (approveBtn) approveApplication(approveBtn.dataset.kind, approveBtn.dataset.key);
    if (rejectBtn) rejectApplication(rejectBtn.dataset.kind, rejectBtn.dataset.key);
  });

  // "Review" in the table no longer gates what's visible — everything already shows.
  // It just scrolls to and briefly highlights that application's badge card.
  verificationBody.addEventListener('click', (e) => {
    const btn = e.target.closest('.review-btn');
    if (!btn) return;
    const card = document.getElementById(applicationDomId(btn.dataset.kind, btn.dataset.key));
    if (!card) return;
    card.scrollIntoView({ behavior: 'smooth', block: 'center' });
    card.classList.add('is-highlighted');
    setTimeout(() => card.classList.remove('is-highlighted'), 1600);
  });

  /* =========================================================
    BOOKINGS
  ========================================================= */
  const transactionSearchInput = document.getElementById('transactionSearch');
  const transactionStatusFilter = document.getElementById('transactionStatusFilter');
  const transactionsBody = document.getElementById('transactionsBody');
  const transactionsEmpty = document.getElementById('transactionsEmpty');
  const transactionsPaginationEl = document.getElementById('transactionsPagination');
  let transactionsPage = 1;

  const getFilteredTransactions = () => {
    const statusVal = transactionStatusFilter.value;
    const query = transactionSearchInput.value.trim().toLowerCase();
    return bookings.filter((b) => {
      const listing = listingById(b.listingId);
      const host = (listing && (listing.host || listing.name)) || '';
      const matchesStatus = statusVal === 'all' || b.status === statusVal;
      const haystack = `${host} #trx-${b.id.slice(-5)} ${b.guestName}`.toLowerCase();
      const matchesQuery = !query || haystack.includes(query);
      return matchesStatus && matchesQuery;
    }).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  };

  const renderTransactions = () => {
    const nonCancelled = bookings.filter((b) => b.status !== 'Cancelled');
    const totalVolume = nonCancelled.reduce((sum, b) => sum + transactionBreakdown(b).total, 0);
    const totalCommissions = nonCancelled.reduce((sum, b) => sum + transactionBreakdown(b).commission, 0);
    const pendingBookings = bookings.filter((b) => b.status === 'Pending');
    const pendingTotal = pendingBookings.reduce((sum, b) => sum + transactionBreakdown(b).total, 0);
    const pendingPartners = new Set(pendingBookings.map((b) => {
      const listing = listingById(b.listingId);
      return (listing && (listing.host || listing.name)) || 'unknown';
    })).size;

    document.getElementById('txVolume').textContent = formatPeso(totalVolume);
    document.getElementById('txVolumeDelta').textContent = `Across ${nonCancelled.length} booking${nonCancelled.length === 1 ? '' : 's'}`;
    document.getElementById('txCommissions').textContent = formatPeso(totalCommissions);
    document.getElementById('txPending').textContent = formatPeso(pendingTotal);
    document.getElementById('txPendingPartners').textContent = `${pendingPartners} partner${pendingPartners === 1 ? '' : 's'} awaiting`;

    const filtered = getFilteredTransactions();

    transactionsEmpty.hidden = bookings.length !== 0;
    transactionsBody.closest('table').hidden = bookings.length === 0;
    transactionsPaginationEl.hidden = filtered.length === 0;

    const page = renderPagination(transactionsPaginationEl, filtered.length, adminSettings.rowsPerPage, transactionsPage, (p) => {
      transactionsPage = p;
      renderTransactions();
    });
    transactionsPage = page;

    const pageItems = filtered.slice((page - 1) * adminSettings.rowsPerPage, page * adminSettings.rowsPerPage);

    transactionsBody.innerHTML = pageItems.length ? pageItems.map((b) => {
      const listing = listingById(b.listingId);
      const host = (listing && (listing.host || listing.name)) || 'Unknown partner';
      const { base, taxesFees, commission, total } = transactionBreakdown(b);
      const meta = TX_STATUS_META[b.status] || TX_STATUS_META.Pending;
      return `
        <tr>
          <td class="cell-primary">#TRX-${b.id.slice(-5).toUpperCase()}</td>
          <td class="cell-with-avatar">
            <span class="row-avatar" style="background:${avatarColorFor(host)}">${escapeHTML(getInitials(host))}</span>
            ${escapeHTML(host)}
          </td>
          <td>${formatPeso(base)}</td>
          <td>${formatPeso(taxesFees)}</td>
          <td>${formatPeso(commission)}</td>
          <td class="cell-primary">${formatPeso(total)}</td>
          <td>${statusBadgeHTML(meta.label, meta.cls)}</td>
          <td>
            <button type="button" class="row-menu-btn" data-action="view-tx" data-id="${b.id}" aria-label="View transaction details">
              <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z"/><circle cx="12" cy="12" r="3"/></svg>
            </button>
          </td>
        </tr>`;
    }).join('') : `<tr><td colspan="8" class="empty-state">No transactions match your filters.</td></tr>`;
  };
  RENDERERS.transactions = renderTransactions;

  transactionStatusFilter.addEventListener('change', () => { transactionsPage = 1; renderTransactions(); });
  transactionSearchInput.addEventListener('input', () => { transactionsPage = 1; renderTransactions(); });

  document.getElementById('exportTransactionsBtn').addEventListener('click', () => {
    const filtered = getFilteredTransactions();
    if (!filtered.length) {
      showToast('There\'s nothing to export yet.', 'error');
      return;
    }
    downloadCSV(
      `tripmate-bookings-${new Date().toISOString().split('T')[0]}.csv`,
      ['Transaction ID', 'Partner/Host', 'Guest', 'Check-in', 'Check-out', 'Base Rate', 'Taxes/Fees', 'Commission (12%)', 'Total', 'Status'],
      filtered.map((b) => {
        const listing = listingById(b.listingId);
        const host = (listing && (listing.host || listing.name)) || 'Unknown partner';
        const { base, taxesFees, commission, total } = transactionBreakdown(b);
        const meta = TX_STATUS_META[b.status] || TX_STATUS_META.Pending;
        return [`TRX-${b.id.slice(-5).toUpperCase()}`, host, b.guestName, b.checkIn, b.checkOut, base.toFixed(2), taxesFees.toFixed(2), commission.toFixed(2), total.toFixed(2), meta.label];
      })
    );
    showToast(`Exported ${filtered.length} booking${filtered.length === 1 ? '' : 's'}.`, 'success');
  });

  document.getElementById('generateStatementBtn').addEventListener('click', () => {
    if (!bookings.length) {
      showToast('There\'s no booking history to summarize yet.', 'error');
      return;
    }
    const nonCancelled = bookings.filter((b) => b.status !== 'Cancelled');
    const totalVolume = nonCancelled.reduce((sum, b) => sum + transactionBreakdown(b).total, 0);
    const totalCommissions = nonCancelled.reduce((sum, b) => sum + transactionBreakdown(b).commission, 0);
    const pendingTotal = bookings.filter((b) => b.status === 'Pending').reduce((sum, b) => sum + transactionBreakdown(b).total, 0);

    const summaryRows = [
      ['Statement generated', new Date().toLocaleString('en-US')],
      ['Total platform volume', formatPeso(totalVolume)],
      ['Net commissions (12%)', formatPeso(totalCommissions)],
      ['Pending payouts', formatPeso(pendingTotal)],
      ['Total bookings', String(bookings.length)],
      [],
      ['Transaction ID', 'Partner/Host', 'Base Rate', 'Taxes/Fees', 'Commission', 'Total', 'Status'],
    ];
    bookings.forEach((b) => {
      const listing = listingById(b.listingId);
      const host = (listing && (listing.host || listing.name)) || 'Unknown partner';
      const { base, taxesFees, commission, total } = transactionBreakdown(b);
      const meta = TX_STATUS_META[b.status] || TX_STATUS_META.Pending;
      summaryRows.push([`TRX-${b.id.slice(-5).toUpperCase()}`, host, base.toFixed(2), taxesFees.toFixed(2), commission.toFixed(2), total.toFixed(2), meta.label]);
    });

    downloadCSV(`tripmate-statement-${new Date().toISOString().split('T')[0]}.csv`, [], summaryRows);
    showToast('Statement generated.', 'success');
  });

  document.getElementById('txPendingReviewLink').addEventListener('click', () => {
    goToView('transactions');
    transactionStatusFilter.value = 'Pending';
    transactionsPage = 1;
    renderTransactions();
  });

  /* ---- transaction detail (read-only) modal ---- */
  const transactionDetailOverlay = document.getElementById('transactionDetailOverlay');
  const transactionDetailBody = document.getElementById('transactionDetailBody');
  let transactionDetailBookingId = null;

  const openTransactionDetail = (bookingId) => {
    const b = bookingById(bookingId);
    if (!b) return;
    transactionDetailBookingId = bookingId;
    const listing = listingById(b.listingId);
    const host = (listing && (listing.host || listing.name)) || 'Unknown partner';
    const { base, taxesFees, commission, total } = transactionBreakdown(b);
    const meta = TX_STATUS_META[b.status] || TX_STATUS_META.Pending;

    transactionDetailBody.innerHTML = `
      <div class="tx-detail-row"><span>Transaction ID</span><span>TRX-${b.id.slice(-5).toUpperCase()}</span></div>
      <div class="tx-detail-row"><span>Property</span><span>${escapeHTML(listing ? listing.name : 'Unknown property')}</span></div>
      <div class="tx-detail-row"><span>Partner / Host</span><span>${escapeHTML(host)}</span></div>
      <div class="tx-detail-row"><span>Guest</span><span>${escapeHTML(b.guestName)}</span></div>
      <div class="tx-detail-row"><span>Guest email</span><span>${escapeHTML(b.guestEmail || '—')}</span></div>
      <div class="tx-detail-row"><span>Check-in</span><span>${formatDate(b.checkIn)}</span></div>
      <div class="tx-detail-row"><span>Check-out</span><span>${formatDate(b.checkOut)}</span></div>
      <div class="tx-detail-row"><span>Base rate</span><span>${formatPeso(base)}</span></div>
      <div class="tx-detail-row"><span>Taxes / fees</span><span>${formatPeso(taxesFees)}</span></div>
      <div class="tx-detail-row"><span>Commission (12%)</span><span>${formatPeso(commission)}</span></div>
      <div class="tx-detail-row tx-detail-total"><span>Total</span><span>${formatPeso(total)}</span></div>
      <div class="tx-detail-row"><span>Status</span><span>${statusBadgeHTML(meta.label, meta.cls)}</span></div>`;

    transactionDetailOverlay.hidden = false;
  };
  const closeTransactionDetail = () => { transactionDetailOverlay.hidden = true; transactionDetailBookingId = null; };

  document.getElementById('transactionDetailClose').addEventListener('click', closeTransactionDetail);
  document.getElementById('transactionDetailCloseBtn').addEventListener('click', closeTransactionDetail);
  transactionDetailOverlay.addEventListener('click', (e) => { if (e.target === transactionDetailOverlay) closeTransactionDetail(); });
  document.getElementById('transactionDetailEditBtn').addEventListener('click', () => {
    const id = transactionDetailBookingId;
    closeTransactionDetail();
    const booking = bookingById(id);
    if (booking) openBookingModal(booking);
  });

  transactionsBody.addEventListener('click', (e) => {
    const viewBtn = e.target.closest('[data-action="view-tx"]');
    if (viewBtn) openTransactionDetail(viewBtn.dataset.id);
  });

  /* =========================================================
     ADD / EDIT BOOKING MODAL (used by Transactions + Profile)
  ========================================================= */
  const bookingModalOverlay = document.getElementById('bookingModalOverlay');
  const bookingModalTitle = document.getElementById('bookingModalTitle');
  const bookingForm = document.getElementById('bookingForm');
  const bookingIdInput = document.getElementById('bookingId');
  const bGuestName = document.getElementById('bGuestName');
  const bGuestEmail = document.getElementById('bGuestEmail');
  const bGuestPhone = document.getElementById('bGuestPhone');
  const bListing = document.getElementById('bListing');
  const bCheckIn = document.getElementById('bCheckIn');
  const bCheckOut = document.getElementById('bCheckOut');
  const bGuestsCount = document.getElementById('bGuestsCount');
  const bStatus = document.getElementById('bStatus');
  const bComputedAmount = document.getElementById('bComputedAmount');

  const clearBookingErrors = () => {
    ['bGuestName', 'bGuestEmail', 'bListing', 'bCheckIn', 'bCheckOut'].forEach((id) => {
      document.getElementById(id).classList.remove('has-error');
      const err = document.getElementById(`${id}Error`);
      if (err) err.textContent = '';
    });
  };

  const populateListingSelect = (selectedId) => {
    if (!listings.length) {
      bListing.innerHTML = `<option value="">No listings yet — add one first</option>`;
      return;
    }
    bListing.innerHTML = listings.map((l) =>
      `<option value="${l.id}" ${l.id === selectedId ? 'selected' : ''}>${escapeHTML(l.name)} — ${formatPeso(l.price)}/night</option>`
    ).join('');
  };

  const recomputeBookingAmount = () => {
    const listing = listingById(bListing.value);
    if (!listing || !bCheckIn.value || !bCheckOut.value) {
      bComputedAmount.textContent = formatPeso(0);
      return 0;
    }
    const nights = nightsBetween(bCheckIn.value, bCheckOut.value);
    const amount = nights * Number(listing.price || 0);
    bComputedAmount.textContent = `${formatPeso(amount)} (${nights} night${nights === 1 ? '' : 's'} × ${formatPeso(listing.price)})`;
    return amount;
  };

  const openBookingModal = (booking, presetListingId) => {
    if (!listings.length && !booking) {
      showToast('Add a listing first, then you can add a booking for it.', 'error');
      goToView('inventory');
      return;
    }

    clearBookingErrors();
    bookingForm.reset();
    const todayISO = new Date().toISOString().split('T')[0];

    if (booking) {
      bookingModalTitle.textContent = 'Edit Booking';
      bookingIdInput.value = booking.id;
      bGuestName.value = booking.guestName;
      bGuestEmail.value = booking.guestEmail;
      bGuestPhone.value = booking.guestPhone || '';
      populateListingSelect(booking.listingId);
      bCheckIn.value = booking.checkIn;
      bCheckOut.value = booking.checkOut;
      bGuestsCount.value = booking.guests;
      bStatus.value = booking.status;
    } else {
      bookingModalTitle.textContent = 'New Booking';
      bookingIdInput.value = '';
      populateListingSelect(presetListingId || null);
      bCheckIn.value = todayISO;
      bGuestsCount.value = 2;
      bStatus.value = 'Pending';
    }

    recomputeBookingAmount();
    bookingModalOverlay.hidden = false;
    bGuestName.focus();
  };
  const closeBookingModal = () => { bookingModalOverlay.hidden = true; };

  [bListing, bCheckIn, bCheckOut].forEach((el) => el.addEventListener('change', recomputeBookingAmount));
  bCheckIn.addEventListener('input', recomputeBookingAmount);
  bCheckOut.addEventListener('input', recomputeBookingAmount);

  document.getElementById('addTransactionBtn').addEventListener('click', () => openBookingModal(null));
  document.getElementById('transactionsEmptyAddBtn').addEventListener('click', () => openBookingModal(null));
  document.getElementById('bookingModalClose').addEventListener('click', closeBookingModal);
  document.getElementById('bookingCancelBtn').addEventListener('click', closeBookingModal);
  bookingModalOverlay.addEventListener('click', (e) => { if (e.target === bookingModalOverlay) closeBookingModal(); });

  bookingForm.addEventListener('submit', (e) => {
    e.preventDefault();
    clearBookingErrors();

    let hasError = false;
    const name = bGuestName.value.trim();
    const email = bGuestEmail.value.trim();

    if (!name) {
      bGuestName.classList.add('has-error');
      document.getElementById('bGuestNameError').textContent = 'Enter the guest name.';
      hasError = true;
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      bGuestEmail.classList.add('has-error');
      document.getElementById('bGuestEmailError').textContent = 'Enter a valid email address.';
      hasError = true;
    }
    if (!bListing.value) {
      bListing.classList.add('has-error');
      document.getElementById('bListingError').textContent = 'Select a property.';
      hasError = true;
    }
    if (!bCheckIn.value) {
      bCheckIn.classList.add('has-error');
      document.getElementById('bCheckInError').textContent = 'Pick a check-in date.';
      hasError = true;
    }
    if (!bCheckOut.value) {
      bCheckOut.classList.add('has-error');
      document.getElementById('bCheckOutError').textContent = 'Pick a check-out date.';
      hasError = true;
    } else if (bCheckIn.value && bCheckOut.value <= bCheckIn.value) {
      bCheckOut.classList.add('has-error');
      document.getElementById('bCheckOutError').textContent = 'Check-out must be after check-in.';
      hasError = true;
    }
    if (hasError) return;

    const amount = recomputeBookingAmount();
    const payload = {
      guestName: name,
      guestEmail: email,
      guestPhone: bGuestPhone.value.trim(),
      listingId: bListing.value,
      checkIn: bCheckIn.value,
      checkOut: bCheckOut.value,
      guests: Number(bGuestsCount.value) || 1,
      status: bStatus.value,
      amount,
    };

    if (bookingIdInput.value) {
      const booking = bookingById(bookingIdInput.value);
      if (booking) Object.assign(booking, payload);
      showToast('Booking updated.', 'success');
    } else {
      bookings.unshift({ id: genId('b'), createdAt: Date.now(), ...payload });
      showToast('Booking added.', 'success');
    }

    persistBookings();
    closeBookingModal();
    renderTransactions();
    renderDashboard();
    renderInventory();
    renderProfile();
  });

  /* =========================================================
     PROFILE
  ========================================================= */
  const profileForm = document.getElementById('profileForm');
  const profileNameInput = document.getElementById('profileName');
  const profileEmailInput = document.getElementById('profileEmail');
  const profilePhoneInput = document.getElementById('profilePhone');
  const prefEmailInput = document.getElementById('prefEmail');
  const prefSmsInput = document.getElementById('prefSms');
  let bookingHistoryFilter = 'all';

  const applyAvatarEverywhere = () => {
    const display = adminProfile.fullName || 'Admin';
    const initials = getInitials(display);
    const color = avatarColorFor(adminProfile.email || display);

    const topAvatar = document.getElementById('topbarAvatarInitials');
    topAvatar.textContent = initials;
    topAvatar.parentElement.style.background = color;

    document.getElementById('profileBigAvatar').textContent = initials;
    document.getElementById('profileBigAvatar').style.background = color;
    document.getElementById('profileBigName').textContent = display;
  };

  const renderProfile = () => {
    profileNameInput.value = adminProfile.fullName || '';
    profileEmailInput.value = adminProfile.email || '';
    profilePhoneInput.value = adminProfile.phone || '';
    prefEmailInput.checked = !!adminProfile.emailNotifications;
    prefSmsInput.checked = !!adminProfile.smsAlerts;

    document.getElementById('profileSince').textContent =
      `Member since ${new Date(adminSince).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`;

    applyAvatarEverywhere();
    renderBookingHistory();
  };
  RENDERERS.profile = renderProfile;

  profileForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = profileEmailInput.value.trim();
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showToast('Enter a valid email address.', 'error');
      return;
    }
    adminProfile = {
      fullName: profileNameInput.value.trim() || 'Admin',
      email,
      phone: profilePhoneInput.value.trim(),
      emailNotifications: prefEmailInput.checked,
      smsAlerts: prefSmsInput.checked,
    };
    persistProfile();
    applyAvatarEverywhere();
    showToast('Profile updated.', 'success');
  });

  const bookingHistoryTabs = document.getElementById('bookingHistoryTabs');
  bookingHistoryTabs.addEventListener('click', (e) => {
    const btn = e.target.closest('.pill-tab');
    if (!btn) return;
    bookingHistoryFilter = btn.dataset.filter;
    bookingHistoryTabs.querySelectorAll('.pill-tab').forEach((t) => t.classList.toggle('is-active', t === btn));
    renderBookingHistory();
  });

  const renderBookingHistory = () => {
    const listEl = document.getElementById('bookingHistoryList');
    const emptyEl = document.getElementById('bookingHistoryEmpty');
    const today = new Date(); today.setHours(0, 0, 0, 0);

    const classify = (b) => {
      if (b.status === 'Cancelled') return { key: 'cancelled', label: 'Cancelled', cls: 'red' };
      const checkOutD = new Date(b.checkOut + 'T00:00:00');
      if (checkOutD < today) return { key: 'completed', label: 'Completed', cls: 'green' };
      return { key: 'upcoming', label: 'Upcoming', cls: 'blue' };
    };

    let items = [...bookings].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    if (bookingHistoryFilter === 'upcoming') {
      items = items.filter((b) => classify(b).key === 'upcoming');
    }
    items = items.slice(0, 8);

    emptyEl.hidden = bookings.length !== 0;
    listEl.hidden = items.length === 0;

    listEl.innerHTML = items.map((b) => {
      const listing = listingById(b.listingId);
      const status = classify(b);
      const thumb = getEffectiveImages(listing)[0];
      const actionsHTML = status.key === 'upcoming'
        ? `<button type="button" data-action="manage" data-id="${b.id}">Manage</button>
           <button type="button" class="is-primary" data-action="contact">Contact Host</button>`
        : `<button type="button" class="is-primary" data-action="book-again" data-listing="${b.listingId}">Book Again</button>`;

      return `
        <div class="booking-history-card">
          <img class="booking-history-thumb" src="${escapeHTML(thumb)}" alt="">
          <div class="booking-history-body">
            <div class="booking-history-top">
              <div>
                <h3 class="booking-history-name">${escapeHTML(listing ? listing.name : 'Unknown property')}</h3>
                <p class="booking-history-loc">
                  <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/></svg>
                  ${escapeHTML(listing ? listing.location : '—')}
                </p>
              </div>
              ${statusBadgeHTML(status.label, status.cls)}
            </div>
            <span class="booking-history-dates">${formatDate(b.checkIn)} – ${formatDate(b.checkOut)}</span>
            <div class="booking-history-actions">${actionsHTML}</div>
          </div>
        </div>`;
    }).join('');
  };

  document.getElementById('bookingHistoryList').addEventListener('click', (e) => {
    const manageBtn = e.target.closest('[data-action="manage"]');
    const contactBtn = e.target.closest('[data-action="contact"]');
    const bookAgainBtn = e.target.closest('[data-action="book-again"]');

    if (manageBtn) {
      const booking = bookingById(manageBtn.dataset.id);
      goToView('transactions');
      transactionStatusFilter.value = 'all';
      transactionSearchInput.value = booking ? booking.guestName : '';
      transactionsPage = 1;
      renderTransactions();
    }
    if (contactBtn) notImplemented();
    if (bookAgainBtn) openBookingModal(null, bookAgainBtn.dataset.listing);
  });

  /* =========================================================
     SETTINGS
  ========================================================= */
  const settingsForm = document.getElementById('settingsForm');
  const settingsRowsPerPageSelect = document.getElementById('settingsRowsPerPage');
  const settingsShowAlertsInput = document.getElementById('settingsShowAlerts');

  // Applies the current settings to the live page — called on load and after Save,
  // so density/rows-per-page/alerts are correct immediately, even before this page
  // has ever been visited.
  const applySettingsToDOM = () => {
    document.body.classList.toggle('is-compact-tables', adminSettings.tableDensity === 'compact');
    document.querySelectorAll('input[name="tableDensity"]').forEach((r) => {
      r.checked = r.value === adminSettings.tableDensity;
    });
    settingsRowsPerPageSelect.value = String(adminSettings.rowsPerPage);
    settingsShowAlertsInput.checked = adminSettings.showVerificationAlerts;
  };

  const renderSettings = () => applySettingsToDOM();
  RENDERERS.settings = renderSettings;

  settingsForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const densityInput = document.querySelector('input[name="tableDensity"]:checked');
    const rows = Number(settingsRowsPerPageSelect.value);

    if (!rows || rows < 1) {
      showToast('Choose a valid rows-per-page value.', 'error');
      return;
    }

    adminSettings = {
      tableDensity: densityInput ? densityInput.value : 'comfortable',
      rowsPerPage: rows,
      showVerificationAlerts: settingsShowAlertsInput.checked,
    };
    persistSettings();
    applySettingsToDOM();

    inventoryPage = 1;
    transactionsPage = 1;
    renderInventory();
    renderTransactions();
    renderDashboard();
    showToast('Settings saved.', 'success');
  });

  document.getElementById('settingsBackupBtn').addEventListener('click', () => {
    if (!listings.length && !bookings.length) {
      showToast('There\'s no data to back up yet.', 'error');
      return;
    }
    const payload = {
      exportedAt: new Date().toISOString(),
      listings,
      bookings,
      adminProfile,
      adminSettings,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tripmate-admin-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    showToast('Backup downloaded.', 'success');
  });

  document.getElementById('settingsResetBtn').addEventListener('click', () => {
    if (!listings.length && !bookings.length) {
      showToast('There\'s nothing to reset yet.', 'error');
      return;
    }
    openConfirmModal(
      'Reset all data?',
      'This permanently deletes every listing and booking stored by this admin panel in your browser. Registered user accounts are not affected. This cannot be undone.',
      () => {
        listings = [];
        bookings = [];
        persistListings();
        persistBookings();
        inventoryPage = 1;
        transactionsPage = 1;
        renderInventory();
        renderTransactions();
        renderDashboard();
        renderVerification();
        renderProfile();
        showToast('All listings and bookings were reset.', 'success');
      }
    );
  });

  /* =========================================================
     ESCAPE KEY closes modals / menus
  ========================================================= */
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (!listingModalOverlay.hidden) closeListingModal();
    if (!bookingModalOverlay.hidden) closeBookingModal();
    if (!confirmModalOverlay.hidden) closeConfirmModal();
    if (!transactionDetailOverlay.hidden) closeTransactionDetail();
    if (!accountMenu.hidden) closeAccountMenu();
    if (!notifMenu.hidden) closeNotifMenu();
    closeAnyDropdown();
  });

  /* =========================================================
     INITIAL RENDER
  ========================================================= */
  hydrateAdminData().finally(() => {
    renderDashboard();
    renderInventory();
    renderVerification();
    renderTransactions();
    renderProfile();
    applySettingsToDOM();
  });
});
