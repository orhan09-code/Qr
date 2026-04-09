/**
 * app.js — Aperatif Dükkanı Menü Uygulaması
 * Güvenli DOM işlemleri (XSS korumalı), vanilla JS, statik
 */

'use strict';

/* ============================================================
   DİL ALGILAMA
   ============================================================ */
const LANG = (navigator.language || navigator.userLanguage || 'tr')
  .toLowerCase()
  .startsWith('tr') ? 'tr' : 'en';

const T = {
  tr: {
    bestSellers:     '⭐ En Çok Satanlar',
    dailyLabel:      'GÜNÜN MENÜSÜ',
    dailyName:       'Tavuk Döner',
    dailyDesc:       'Taze malzemeler, özel sos — bugünün favorisi!',
    spicy:           '🌶 Acılı',
    mild:            '🟢 Acısız',
    alwaysSpicy:     '🌶 Sadece Acılı',
    seasonal:        '☀️ Yaz',
    popular:         'Çok Satan',
    orderBtn:        'Sipariş Ver',
    location:        'Ataeymir Mahallesi , Karacasu/Aydın',
    hours:           'Her Gün 10:00 – 23:00',
    copyright:       '© 2025 Aperatif Dükkanı — Tüm hakları saklıdır',
    imgFallback:     'Görsel yüklenemedi',
    empty:           'Bu kategoride ürün bulunamadı.',
    categories: {
      popular:  '⭐ Popüler',
      tost:     '🥪 Tost',
      doner:    '🌯 Döner',
      diger:    '🍽️ Diğer',
      ekstra:   '🍟 Ekstralar',
      icecek:   '🥤 İçecekler',
      dondurma: '🍦 Dondurma',
    },
    sectionTitles: {
      popular:  '⭐ En Çok Satanlar',
      tost:     '🥪 Tost',
      doner:    '🌯 Döner',
      diger:    '🍽️ Diğerleri',
      ekstra:   '🍟 Ekstralar',
      icecek:   '🥤 İçecekler',
      dondurma: '🍦 Dondurma',
    },
  },
  en: {
    bestSellers:     '⭐ Best Sellers',
    dailyLabel:      "TODAY'S SPECIAL",
    dailyName:       'Chicken Doner',
    dailyDesc:       'Fresh ingredients, special sauce — today\'s favourite!',
    spicy:           '🌶 Spicy',
    mild:            '🟢 Mild',
    alwaysSpicy:     '🌶 Spicy Only',
    seasonal:        '☀️ Summer',
    popular:         'Best Seller',
    orderBtn:        'Order Now',
    location:        'Ataeymir Mahallesi , Karacasu/Aydın',
    hours:           'Every day 10:00 – 23:00',
    copyright:       '© 2025 Aperatif — All rights reserved',
    imgFallback:     'Image unavailable',
    empty:           'No items found in this category.',
    categories: {
      popular:  '⭐ Popular',
      tost:     '🥪 Toast',
      doner:    '🌯 Doner',
      diger:    '🍽️ Other',
      ekstra:   '🍟 Extras',
      icecek:   '🥤 Drinks',
      dondurma: '🍦 Ice Cream',
    },
    sectionTitles: {
      popular:  '⭐ Best Sellers',
      tost:     '🥪 Toast',
      doner:    '🌯 Doner',
      diger:    '🍽️ Others',
      ekstra:   '🍟 Extras',
      icecek:   '🥤 Drinks',
      dondurma: '🍦 Ice Cream',
    },
  },
};

const t = T[LANG];

/* ============================================================
   DURUM
   ============================================================ */
let menuData    = null;     // JSON verisi
let activeCategory = 'popular';  // Seçili kategori
let theme       = localStorage.getItem('theme') || 'dark';

/* ============================================================
   YARDIMCI: Güvenli DOM element oluşturma
   ============================================================ */
function el(tag, { cls, text, attrs, html } = {}) {
  const e = document.createElement(tag);
  if (cls)   { cls.split(' ').filter(Boolean).forEach(c => e.classList.add(c)); }
  if (text !== undefined) e.textContent = text;
  if (attrs) Object.entries(attrs).forEach(([k, v]) => e.setAttribute(k, v));
  // html yalnızca güvenilir iç içerik için (ikon SVG'leri gibi)
  if (html !== undefined) e.innerHTML = html;
  return e;
}

/* ============================================================
   TEMA
   ============================================================ */
function applyTheme(t) {
  document.documentElement.setAttribute('data-theme', t);
  const btn = document.getElementById('themeToggle');
  if (btn) btn.textContent = t === 'dark' ? '☀️' : '🌙';
}

function toggleTheme() {
  theme = theme === 'dark' ? 'light' : 'dark';
  localStorage.setItem('theme', theme);
  applyTheme(theme);
}

/* ============================================================
   KATEGORİ SEKME ÇUBUĞU
   ============================================================ */
/* ============================================================
   KATEGORİ SEKME ÇUBUĞU — FIX EDİLDİ
   ============================================================ */
function buildCategoryNav() {
  const scroll = document.getElementById('categoryScroll');
  if (!scroll || !menuData) return;

  // Mevcut butonları tamamen temizle
  scroll.textContent = '';

  // menu.json'daki kategorileri al
  const cats = menuData.categories;

  cats.forEach(cat => {
    // Dil desteğine göre kategori ismini seç
    const label = cat[`name_${LANG}`] || cat.name_tr;
    const btn = el('button', { cls: 'cat-btn', text: label });
    
    // Aktif kategoriyi işaretle
    if (cat.id === activeCategory) btn.classList.add('active');

    btn.addEventListener('click', () => {
      activeCategory = cat.id;
      document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderMenu();
    });

    scroll.appendChild(btn);
  });
}

/* ============================================================
   MENÜ KARTI OLUŞTURMA
   ============================================================ */
function buildCard(item, index) {
  const name = item[`name_${LANG}`] || item.name_tr;
  const desc = item[`description_${LANG}`] || item.description_tr;

  const card = el('article', { cls: 'menu-card' });
  card.style.animationDelay = `${index * 0.05}s`;

  /* --- Görsel --- */
  const imgWrap = el('div', { cls: 'card-image-wrap' });

  const img = el('img', {
    attrs: {
      src:     item.image || '',
      alt:     name,
      loading: 'lazy',
      width:   '110',
      height:  '110',
    },
  });

  // Görsel hata fallback
  img.addEventListener('error', function () {
    this.src = 'data:image/svg+xml;utf8,' + encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="110" height="110" viewBox="0 0 110 110">
        <rect width="110" height="110" fill="%231a1a1a"/>
        <text x="55" y="62" text-anchor="middle" font-size="36" font-family="sans-serif">🍽️</text>
      </svg>`
    );
    this.alt = t.imgFallback;
  });

  imgWrap.appendChild(img);

  // Rozet
  if (item.popular) {
    imgWrap.appendChild(el('span', { cls: 'popular-badge', text: t.popular }));
  } else if (item.seasonal) {
    imgWrap.appendChild(el('span', { cls: 'seasonal-badge', text: t.seasonal }));
  }

  card.appendChild(imgWrap);

  /* --- İçerik --- */
  const body = el('div', { cls: 'card-body' });

  const cardName = el('p', { cls: 'card-name', text: name });
  const cardDesc = el('p', { cls: 'card-desc', text: desc });

  body.appendChild(cardName);
  body.appendChild(cardDesc);

  const footer = el('div', { cls: 'card-footer' });

  // Fiyat
  const priceEl = el('span', { cls: 'card-price', text: `₺${item.price}` });
  footer.appendChild(priceEl);

  // Acı seçeneği
  if (item.always_spicy) {
    // Şalgam & Turşu suyu — SADECE ACILI
    footer.appendChild(el('span', { cls: 'always-spicy-tag', text: t.alwaysSpicy }));
  } else if (item.spicy_option) {
    // Acılı / Acısız toggle
    const toggle = el('div', { cls: 'spicy-toggle' });

    const hotBtn  = el('button', { cls: 'spicy-btn active-hot', text: t.spicy });
    const mildBtn = el('button', { cls: 'spicy-btn', text: t.mild });

    hotBtn.setAttribute('aria-pressed', 'true');
    mildBtn.setAttribute('aria-pressed', 'false');

    hotBtn.addEventListener('click', () => {
      hotBtn.classList.add('active-hot');
      mildBtn.classList.remove('active-mild');
      hotBtn.setAttribute('aria-pressed', 'true');
      mildBtn.setAttribute('aria-pressed', 'false');
    });

    mildBtn.addEventListener('click', () => {
      mildBtn.classList.add('active-mild');
      hotBtn.classList.remove('active-hot');
      mildBtn.setAttribute('aria-pressed', 'true');
      hotBtn.setAttribute('aria-pressed', 'false');
    });

    toggle.appendChild(hotBtn);
    toggle.appendChild(mildBtn);
    footer.appendChild(toggle);
  }

  body.appendChild(footer);
  card.appendChild(body);

  return card;
}

/* ============================================================
   MENÜ RENDER
   ============================================================ */
function renderMenu() {
  const container = document.getElementById('menuContainer');
  if (!container || !menuData) return;

  container.textContent = '';

  let items;

  if (activeCategory === 'popular') {
    // Sadece senin istediğin ID'leri (1: Tost, 2: Tavuk Döner, 23: Küçük Ayran) filtrele
    const targetIds = [1, 2, 23];
    items = menuData.items.filter(i => targetIds.includes(i.id));

    if (items.length === 0) {
      container.appendChild(buildEmpty());
      return;
    }

    // Başlık ekleyerek grid oluştur
    const section = buildSection('popular', items);
    container.appendChild(section);

  } else {
    // Diğer kategoriler normal çalışmaya devam eder
    items = menuData.items.filter(i => i.category === activeCategory);

    if (items.length === 0) {
      container.appendChild(buildEmpty());
      return;
    }

    const section = buildSection(activeCategory, items);
    container.appendChild(section);
  }
}

function buildSection(catId, items) {
  const wrapper = document.createDocumentFragment();

  const title = el('h2', { cls: 'section-title', text: t.sectionTitles[catId] || catId });
  wrapper.appendChild(title);

  const grid = el('div', { cls: 'menu-grid' });
  items.forEach((item, i) => grid.appendChild(buildCard(item, i)));
  wrapper.appendChild(grid);

  return wrapper;
}

function buildEmpty() {
  const div = el('div', { cls: 'empty-state' });
  div.appendChild(el('div', { cls: 'icon', text: '🍽️' }));
  div.appendChild(el('p', { text: t.empty }));
  return div;
}

/* ============================================================
   SKELETON LOADER
   ============================================================ */
function showSkeletons() {
  const container = document.getElementById('menuContainer');
  if (!container) return;
  container.textContent = '';
  const grid = el('div', { cls: 'menu-grid' });
  for (let i = 0; i < 6; i++) {
    grid.appendChild(el('div', { cls: 'skeleton-card' }));
  }
  container.appendChild(grid);
}

/* ============================================================
   GÜNÜN MENÜSÜ
   ============================================================ */
function buildDailySpecial() {
  const wrap = document.getElementById('dailySpecial');
  if (!wrap) return;

  const card = el('div', { cls: 'daily-card' });

  const icon = el('div', { cls: 'daily-icon', text: '🌯' });
  card.appendChild(icon);

  const info = el('div');
  info.appendChild(el('div', { cls: 'daily-label', text: t.dailyLabel }));
  info.appendChild(el('div', { cls: 'daily-name', text: t.dailyName }));
  info.appendChild(el('div', { cls: 'daily-desc', text: t.dailyDesc }));
  card.appendChild(info);

  wrap.appendChild(card);
}



/* ============================================================
   FOOTER
   ============================================================ */
function buildFooter() {
  const loc   = document.getElementById('footerLocation');
  const hours = document.getElementById('footerHours');
  const copy  = document.getElementById('footerCopy');

  if (loc)   loc.textContent   = t.location;
  if (hours) hours.textContent = t.hours;
  if (copy)  copy.textContent  = t.copyright;
}

/* ============================================================
   WHATSAPP BUTONU
   ============================================================ */
function buildWhatsApp() {
  const fab = document.getElementById('whatsappFab');
  if (!fab) return;

  const labelSpan = el('span', { text: t.orderBtn });
  fab.appendChild(labelSpan);
}

/* ============================================================
   JSON YÜKLEME
   ============================================================ */
async function loadMenu() {
  showSkeletons();

  try {
    const res = await fetch('./menu.json');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    menuData = await res.json();
  } catch (err) {
    console.error('Menü yüklenemedi:', err);
    const container = document.getElementById('menuContainer');
    if (container) {
      container.textContent = '';
      const msg = el('p', {
        text: LANG === 'tr' ? 'Menü yüklenirken hata oluştu. Lütfen sayfayı yenileyin.' : 'Failed to load menu. Please refresh.',
        attrs: { style: 'text-align:center;padding:40px 16px;color:var(--text-muted);font-size:14px;' },
      });
      container.appendChild(msg);
    }
    return;
  }

  buildCategoryNav();
  renderMenu();
}

/* ============================================================
   UYGULAMA BAŞLATMA
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  // Tema uygula
  applyTheme(theme);

  // Tema toggle butonu
  const themeBtn = document.getElementById('themeToggle');
  if (themeBtn) themeBtn.addEventListener('click', toggleTheme);

  // Günün menüsü
  //buildDailySpecial();

  // Footer
  buildFooter();
 
  // WhatsApp etiketi
  buildWhatsApp();

  // Menü JSON yükle
  loadMenu();
});
