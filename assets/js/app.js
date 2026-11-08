/* Gurl Aesthetic storefront
   Static site: products live in data/products.json, settings in data/site.json.
   Cart is kept in localStorage and checked out as a pre-filled WhatsApp message. */
(function () {
  'use strict';

  var CART_KEY = 'ga-cart-v1';
  var site = null;
  var products = [];

  /* ---------- helpers ---------- */
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $all(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function money(n) { return n == null ? 'Price on request' : (site.currency || 'TT$') + Number(n).toLocaleString('en-TT'); }
  function byId(id) { for (var i = 0; i < products.length; i++) if (products[i].id === id) return products[i]; return null; }
  function param(name) { return new URLSearchParams(location.search).get(name); }
  function slugCat(c) { return String(c).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''); }

  function loadJSON(url) {
    return fetch(url, { cache: 'no-cache' }).then(function (r) { if (!r.ok) throw new Error(url + ' ' + r.status); return r.json(); });
  }

  /* ---------- cart state ---------- */
  function readCart() { try { return JSON.parse(localStorage.getItem(CART_KEY) || '[]'); } catch (e) { return []; } }
  function writeCart(items) { try { localStorage.setItem(CART_KEY, JSON.stringify(items)); } catch (e) { /* private mode */ } renderCart(); }
  function cartCount() { return readCart().reduce(function (n, it) { return n + it.qty; }, 0); }
  function addToCart(id, qty) {
    var items = readCart();
    var p = byId(id); if (!p) return;
    var found = null; for (var i = 0; i < items.length; i++) if (items[i].id === id) found = items[i];
    if (found) found.qty = Math.min(20, found.qty + (qty || 1)); else items.push({ id: id, qty: qty || 1 });
    writeCart(items);
    toast('Added to your bag');
    openCart();
  }
  function setQty(id, qty) {
    var items = readCart().map(function (it) { return it.id === id ? { id: it.id, qty: qty } : it; }).filter(function (it) { return it.qty > 0; });
    writeCart(items);
  }

  function whatsappURL(items, name, area) {
    var lines = items.map(function (it) {
      var p = byId(it.id); if (!p) return null;
      var line = '• ' + it.qty + ' × ' + p.name;
      if (p.price != null) line += ' — ' + money(p.price * it.qty);
      return line;
    }).filter(Boolean);
    var total = items.reduce(function (n, it) { var p = byId(it.id); return n + (p && p.price != null ? p.price * it.qty : 0); }, 0);
    var hasUnpriced = items.some(function (it) { var p = byId(it.id); return p && p.price == null; });
    var msg = 'Hi ' + site.name + '! I would like to order:\n' + lines.join('\n') + '\n\n';
    msg += (hasUnpriced ? 'Subtotal (priced items): ' : 'Total: ') + money(total) + '\n';
    msg += 'Name: ' + (name || '') + '\nDelivery area: ' + (area || '') + '\n\nSent from ' + site.domain;
    return 'https://wa.me/' + site.whatsapp + '?text=' + encodeURIComponent(msg);
  }

  /* ---------- shared markup ---------- */
  var ICON = {
    wa: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 11.5a8.4 8.4 0 0 1-8.5 8.4 8.6 8.6 0 0 1-4-1L3 21l2.2-5.3A8.4 8.4 0 1 1 21 11.5z"/></svg>',
    bag: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 7h12l1 13H5L6 7z"/><path d="M9 7a3 3 0 0 1 6 0"/></svg>',
    menu: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
    x: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>'
  };

  function logoHTML() {
    return '<a class="logo" href="index.html" aria-label="' + esc(site.name) + ' home"><span class="mark"><span class="g">G</span><span class="a">a</span></span><span class="word">' + esc(site.name) + '</span></a>';
  }

  function renderHeader() {
    var el = $('[data-header]'); if (!el) return;
    var page = document.body.getAttribute('data-page') || '';
    var cats = uniqueCategories();
    var links = '<a href="shop.html"' + (page === 'shop' && !param('cat') ? ' aria-current="page"' : '') + '>Shop all</a>' +
      cats.map(function (c) { return '<a href="shop.html?cat=' + encodeURIComponent(c) + '"' + (param('cat') === c ? ' aria-current="page"' : '') + '>' + esc(c) + '</a>'; }).join('') +
      '<a href="index.html#order">How to order</a>';
    el.innerHTML =
      '<div class="announce">' + esc(site.announcement) + '</div>' +
      '<div class="site-header container">' +
        '<button class="menu-btn" type="button" aria-label="Menu" aria-expanded="false" data-menu>' + ICON.menu + '</button>' +
        logoHTML() +
        '<nav class="nav" aria-label="Main" data-nav>' + links + '</nav>' +
        '<div class="header-actions">' +
          '<a class="wa-link" href="https://wa.me/' + esc(site.whatsapp) + '" target="_blank" rel="noopener" aria-label="WhatsApp">' + ICON.wa + '<span>WhatsApp</span></a>' +
          '<button class="cart-btn" type="button" aria-label="Open your bag" data-open-cart>' + ICON.bag + '<span class="count" data-cart-count data-zero="true">0</span></button>' +
        '</div>' +
      '</div>';
    $('[data-menu]', el).addEventListener('click', function () {
      var nav = $('[data-nav]', el); var open = nav.classList.toggle('open');
      this.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  function renderFooter() {
    var el = $('[data-footer]'); if (!el) return;
    var cats = uniqueCategories();
    el.innerHTML =
      '<div class="container"><div class="site-footer">' +
        '<div class="brand">' + logoHTML() + '<p>' + esc(site.tagline) + '. Nationwide delivery.</p><a href="https://wa.me/' + esc(site.whatsapp) + '" target="_blank" rel="noopener">WhatsApp ' + esc(site.whatsappDisplay) + '</a></div>' +
        '<div class="col"><span class="h">Shop</span>' + cats.map(function (c) { return '<a href="shop.html?cat=' + encodeURIComponent(c) + '">' + esc(c) + '</a>'; }).join('') + '</div>' +
        '<div class="col"><span class="h">Help</span><a href="index.html#order">How to order</a><a href="index.html#order">Delivery</a><a href="https://wa.me/' + esc(site.whatsapp) + '" target="_blank" rel="noopener">Contact</a></div>' +
        '<div class="col"><span class="h">Follow</span><a href="' + esc(site.instagram) + '" target="_blank" rel="noopener">Instagram</a><a href="' + esc(site.tiktok) + '" target="_blank" rel="noopener">TikTok</a></div>' +
      '</div><div class="copyright"><span>© ' + new Date().getFullYear() + ' ' + esc(site.name) + ' · ' + esc(site.domain) + '</span><span>Prices in Trinidad &amp; Tobago dollars</span></div></div>';
  }

  function renderDrawer() {
    if ($('[data-drawer]')) return;
    var wrap = document.createElement('div');
    wrap.innerHTML =
      '<div class="drawer-backdrop" data-close-cart></div>' +
      '<aside class="drawer" data-drawer aria-label="Your bag" aria-hidden="true">' +
        '<div class="drawer-head"><h2>Your bag</h2><button class="close-btn" type="button" aria-label="Close bag" data-close-cart>' + ICON.x + '</button></div>' +
        '<div class="drawer-body" data-cart-items></div>' +
        '<div class="drawer-foot" data-cart-foot>' +
          '<div class="total"><span>Subtotal</span><b data-cart-total>TT$0</b></div>' +
          '<label class="field">Your name<input type="text" name="name" autocomplete="name" data-cart-name></label>' +
          '<label class="field">Delivery area<input type="text" name="area" placeholder="e.g. Chaguanas" data-cart-area></label>' +
          '<a class="btn block" href="#" target="_blank" rel="noopener" data-checkout>' + ICON.wa + 'Send order on WhatsApp</a>' +
          '<p class="fine">This opens WhatsApp with your order already typed out. Delivery fee and payment are confirmed in the chat.</p>' +
        '</div>' +
      '</aside>' +
      '<div class="toast" role="status" aria-live="polite" data-toast></div>';
    document.body.appendChild(wrap);
    $all('[data-close-cart]').forEach(function (b) { b.addEventListener('click', closeCart); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeCart(); });
    ['[data-cart-name]', '[data-cart-area]'].forEach(function (s) { $(s).addEventListener('input', updateCheckoutLink); });
  }

  function openCart() { document.body.classList.add('cart-open'); $('[data-drawer]').setAttribute('aria-hidden', 'false'); }
  function closeCart() { document.body.classList.remove('cart-open'); var d = $('[data-drawer]'); if (d) d.setAttribute('aria-hidden', 'true'); }

  function thumbHTML(p, size) {
    var look = p.look || {};
    if (p.image) return '<img src="' + esc(p.image) + '" alt="' + esc(p.name) + '" loading="lazy">';
    if (size === 'mini') return '<span class="mini" style="background:' + esc(look.pack || '#fff') + '"></span>';
    return '<div class="mini" style="background:' + esc(look.pack || '#fff') + ';color:' + esc(look.ink || '#141413') + '"><span class="mark"><span class="g">G</span><span class="a">a</span></span><span class="label">' + esc(look.label || '') + '</span></div>';
  }

  function productCardHTML(p) {
    var look = p.look || {};
    return '<article class="product-card">' +
      '<a class="thumb" href="product.html?id=' + encodeURIComponent(p.id) + '" style="background:' + esc(look.bg || '#FDF0F5') + '">' + thumbHTML(p) +
        (p.tag ? '<span class="tag">' + esc(p.tag) + '</span>' : '') +
        (p.inStock === false ? '<span class="soldout">Sold out</span>' : '') +
      '</a>' +
      '<div class="meta"><span class="cat">' + esc(p.category) + '</span><a class="name" href="product.html?id=' + encodeURIComponent(p.id) + '">' + esc(p.name) + '</a>' +
      (p.note ? '<span class="note">' + esc(p.note) + '</span>' : '') + '<span class="price">' + esc(money(p.price)) + '</span></div>' +
      '<button class="btn outline" type="button" data-add="' + esc(p.id) + '"' + (p.inStock === false ? ' disabled' : '') + '>' + (p.inStock === false ? 'Sold out' : 'Add to bag') + '</button>' +
    '</article>';
  }

  function renderCart() {
    var items = readCart();
    $all('[data-cart-count]').forEach(function (el) { var n = cartCount(); el.textContent = n; el.setAttribute('data-zero', n === 0 ? 'true' : 'false'); });
    var body = $('[data-cart-items]'); if (!body) return;
    if (!items.length) {
      body.innerHTML = '<div class="drawer-empty"><p>Your bag is empty.</p><a class="btn small" href="shop.html">Start shopping</a></div>';
      $('[data-cart-foot]').style.display = 'none';
      return;
    }
    $('[data-cart-foot]').style.display = '';
    body.innerHTML = items.map(function (it) {
      var p = byId(it.id); if (!p) return '';
      var look = p.look || {};
      return '<div class="cart-row">' +
        '<div class="pic" style="background:' + esc(look.bg || '#FDF0F5') + '">' + thumbHTML(p, 'mini') + '</div>' +
        '<div class="info"><span class="n">' + esc(p.name) + '</span><span class="p">' + esc(money(p.price)) + '</span>' +
          '<button class="text-link" type="button" data-remove="' + esc(p.id) + '">Remove</button></div>' +
        '<div class="qty"><button type="button" aria-label="Decrease quantity" data-dec="' + esc(p.id) + '">−</button><span>' + it.qty + '</span><button type="button" aria-label="Increase quantity" data-inc="' + esc(p.id) + '">+</button></div>' +
        '<span class="line">' + (p.price == null ? '' : esc(money(p.price * it.qty))) + '</span>' +
      '</div>';
    }).join('');
    var total = items.reduce(function (n, it) { var p = byId(it.id); return n + (p && p.price != null ? p.price * it.qty : 0); }, 0);
    $('[data-cart-total]').textContent = money(total);
    updateCheckoutLink();
  }

  function updateCheckoutLink() {
    var a = $('[data-checkout]'); if (!a) return;
    var name = $('[data-cart-name]') ? $('[data-cart-name]').value : '';
    var area = $('[data-cart-area]') ? $('[data-cart-area]').value : '';
    a.href = whatsappURL(readCart(), name, area);
  }

  var toastTimer;
  function toast(msg) {
    var t = $('[data-toast]'); if (!t) return;
    t.textContent = msg; t.classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(function () { t.classList.remove('show'); }, 1800);
  }

  function uniqueCategories() {
    var seen = {}, out = [];
    products.forEach(function (p) { if (p.category && !seen[p.category]) { seen[p.category] = true; out.push(p.category); } });
    return out;
  }

  /* ---------- pages ---------- */
  function renderHome() {
    var feat = $('[data-featured]');
    if (feat) {
      var list = products.filter(function (p) { return p.inStock !== false; });
      var tagged = list.filter(function (p) { return p.tag; });
      var rest = list.filter(function (p) { return !p.tag; });
      feat.innerHTML = tagged.concat(rest).slice(0, 4).map(productCardHTML).join('');
    }
    var cats = $('[data-categories]');
    if (cats) {
      var art = {
        'Gel polish': '<div class="art" style="background:var(--blush)"><div class="mini-pack" style="background:#fff"><span class="g">G</span><span class="a">a</span></div></div>',
        'Acryl gel': '<div class="art" style="background:var(--ink)"><div class="mini-pack" style="background:#2A2928;color:#fff"><span class="g">G</span><span class="a">a</span></div></div>',
        'Tools': '<div class="art" style="background:var(--pink)"><svg width="110" height="110" viewBox="0 0 24 24" fill="none" stroke="#141413" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 3l-2 8 6 10 6-10-2-8z"/><path d="M6 11h12"/><path d="M10 3v8"/><path d="M14 3v8"/></svg></div>',
        'Charms': '<div class="art" style="background:var(--blush)"><span class="gem" style="width:26px;height:26px;border-radius:999px;background:#fff"></span><span class="gem" style="width:34px;height:34px;border-radius:999px;background:#E8E2D8"></span><span class="gem" style="width:22px;height:22px;transform:rotate(45deg);background:#fff"></span></div>'
      };
      cats.innerHTML = uniqueCategories().map(function (c) {
        var n = products.filter(function (p) { return p.category === c; }).length;
        return '<a class="cat-card" href="shop.html?cat=' + encodeURIComponent(c) + '">' + (art[c] || '<div class="art" style="background:var(--blush)"></div>') +
          '<span class="name">' + esc(c) + '</span><span class="sub">' + n + (n === 1 ? ' product' : ' products') + '</span></a>';
      }).join('');
    }
    var rev = $('[data-reviews]');
    if (rev && site.reviews) {
      rev.innerHTML = site.reviews.map(function (r) { return '<blockquote class="review"><span class="q">' + esc(r.quote) + '</span><span class="who">' + esc(r.name) + (r.area ? ' · ' + esc(r.area) : '') + '</span></blockquote>'; }).join('');
    }
    $all('[data-delivery-note]').forEach(function (el) { el.textContent = site.deliveryNote; });
  }

  function renderShop() {
    var grid = $('[data-shop-grid]'); if (!grid) return;
    var cats = uniqueCategories();
    var state = { cat: param('cat') || 'All', inStock: false, sort: 'featured' };
    var filters = $('[data-cat-filters]');

    function draw() {
      filters.innerHTML = ['All'].concat(cats).map(function (c) {
        var n = c === 'All' ? products.length : products.filter(function (p) { return p.category === c; }).length;
        return '<button class="chip-btn" type="button" aria-pressed="' + (state.cat === c) + '" data-cat="' + esc(c) + '"><span>' + esc(c) + '</span><span class="n">' + n + '</span></button>';
      }).join('');
      var list = products.filter(function (p) { return (state.cat === 'All' || p.category === state.cat) && (!state.inStock || p.inStock !== false); });
      if (state.sort === 'low') list = list.slice().sort(function (a, b) { return (a.price == null ? 1e9 : a.price) - (b.price == null ? 1e9 : b.price); });
      if (state.sort === 'high') list = list.slice().sort(function (a, b) { return (b.price == null ? -1 : b.price) - (a.price == null ? -1 : a.price); });
      grid.innerHTML = list.length ? list.map(productCardHTML).join('') : '<p class="muted">No products in this category yet.</p>';
      $('[data-result-count]').textContent = list.length + (list.length === 1 ? ' product' : ' products');
      var h = $('[data-shop-title]'); if (h) h.innerHTML = state.cat === 'All' ? 'Everything for the <span class="accent">perfect</span> set' : esc(state.cat);
      document.title = (state.cat === 'All' ? 'Shop' : state.cat) + ' · ' + site.name;
    }
    filters.addEventListener('click', function (e) {
      var b = e.target.closest('[data-cat]'); if (!b) return;
      state.cat = b.getAttribute('data-cat');
      var url = state.cat === 'All' ? 'shop.html' : 'shop.html?cat=' + encodeURIComponent(state.cat);
      history.replaceState(null, '', url);
      draw();
    });
    $('[data-instock]').addEventListener('change', function () { state.inStock = this.checked; draw(); });
    $('[data-sort]').addEventListener('change', function () { state.sort = this.value; draw(); });
    draw();
  }

  function renderProduct() {
    var root = $('[data-product]'); if (!root) return;
    var p = byId(param('id'));
    if (!p) { root.innerHTML = '<div class="simple"><h1>Product not found</h1><p>It may have sold out or moved.</p><a class="btn" href="shop.html">Back to the shop</a></div>'; return; }
    var look = p.look || {};
    document.title = p.name + ' · ' + site.name;
    var meta = $('meta[name="description"]'); if (meta) meta.setAttribute('content', p.description || p.name);
    var qty = 1;
    root.innerHTML =
      '<nav class="crumbs" aria-label="Breadcrumb"><a href="index.html">Home</a><span>/</span><a href="shop.html?cat=' + encodeURIComponent(p.category) + '">' + esc(p.category) + '</a><span>/</span><span>' + esc(p.name) + '</span></nav>' +
      '<div class="product-layout">' +
        '<div class="gallery"><div class="main" style="background:' + esc(look.bg || '#FDF0F5') + '">' +
          (p.image ? '<img src="' + esc(p.image) + '" alt="' + esc(p.name) + '">' :
            '<div class="big" style="background:' + esc(look.pack || '#fff') + ';color:' + esc(look.ink || '#141413') + '"><span class="mark"><span class="g">G</span><span class="a">a</span></span><span class="label">' + esc(look.label || p.name) + '</span></div>') +
          (p.tag ? '<span class="tag">' + esc(p.tag) + '</span>' : '') +
        '</div></div>' +
        '<div class="details">' +
          '<span class="eyebrow">' + esc(p.category) + '</span>' +
          '<h1>' + esc(p.name) + '</h1>' +
          '<div class="price-row"><span class="big-price">' + esc(money(p.price)) + '</span><span class="muted" style="font-size:14px">' + esc(p.note || '') + (p.inStock === false ? ' · Sold out' : ' · In stock') + '</span></div>' +
          (p.description ? '<p class="desc">' + esc(p.description) + '</p>' : '') +
          '<div class="buy-row">' +
            '<div class="qty"><button type="button" aria-label="Decrease quantity" data-qdec>−</button><span data-qty>1</span><button type="button" aria-label="Increase quantity" data-qinc>+</button></div>' +
            '<button class="btn" type="button" data-add-detail' + (p.inStock === false ? ' disabled' : '') + '>' + (p.inStock === false ? 'Sold out' : 'Add to bag') + '</button>' +
          '</div>' +
          '<a class="btn outline" href="https://wa.me/' + esc(site.whatsapp) + '?text=' + encodeURIComponent('Hi! I have a question about ' + p.name) + '" target="_blank" rel="noopener">' + ICON.wa + 'Ask about this on WhatsApp</a>' +
          '<div class="perks">' +
            '<div class="perk"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3l2.4 4.9 5.4.8-3.9 3.8.9 5.4L12 15.4 7.2 17.9l.9-5.4L4.2 8.7l5.4-.8z"/></svg>Salon-quality results</div>' +
            '<div class="perk"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>Long lasting &amp; durable</div>' +
            '<div class="perk"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 20l9-9"/><path d="M14 4l6 6-4 4-6-6z"/></svg>Easy to shape &amp; perfect</div>' +
            '<div class="perk"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 16h12l3-6H6z"/><circle cx="7" cy="19" r="1.5"/><circle cx="15" cy="19" r="1.5"/></svg>Nationwide delivery</div>' +
          '</div>' +
          (p.details ? '<details open><summary>How to use</summary><p>' + esc(p.details) + '</p></details>' : '') +
          '<details><summary>Delivery &amp; payment</summary><p>' + esc(site.deliveryNote) + ' ' + esc(site.paymentNote) + '</p></details>' +
        '</div>' +
      '</div>';
    $('[data-qinc]').addEventListener('click', function () { qty = Math.min(20, qty + 1); $('[data-qty]').textContent = qty; });
    $('[data-qdec]').addEventListener('click', function () { qty = Math.max(1, qty - 1); $('[data-qty]').textContent = qty; });
    $('[data-add-detail]').addEventListener('click', function () { addToCart(p.id, qty); });

    var related = $('[data-related]');
    if (related) {
      var list = products.filter(function (x) { return x.id !== p.id && x.inStock !== false; });
      var same = list.filter(function (x) { return x.category === p.category; });
      var other = list.filter(function (x) { return x.category !== p.category; });
      related.innerHTML = other.concat(same).slice(0, 4).map(productCardHTML).join('');
    }
  }

  /* ---------- global events ---------- */
  function bindGlobal() {
    document.addEventListener('click', function (e) {
      var t = e.target.closest('[data-add],[data-open-cart],[data-inc],[data-dec],[data-remove]');
      if (!t) return;
      if (t.hasAttribute('data-add')) addToCart(t.getAttribute('data-add'), 1);
      else if (t.hasAttribute('data-open-cart')) openCart();
      else if (t.hasAttribute('data-inc')) { var id = t.getAttribute('data-inc'); var it = readCart().filter(function (x) { return x.id === id; })[0]; if (it) setQty(id, Math.min(20, it.qty + 1)); }
      else if (t.hasAttribute('data-dec')) { var id2 = t.getAttribute('data-dec'); var it2 = readCart().filter(function (x) { return x.id === id2; })[0]; if (it2) setQty(id2, it2.qty - 1); }
      else if (t.hasAttribute('data-remove')) setQty(t.getAttribute('data-remove'), 0);
    });
  }

  /* ---------- boot ---------- */
  Promise.all([loadJSON('data/site.json'), loadJSON('data/products.json')]).then(function (res) {
    site = res[0]; products = res[1];
    renderHeader(); renderFooter(); renderDrawer(); bindGlobal();
    var page = document.body.getAttribute('data-page');
    if (page === 'home') renderHome();
    if (page === 'shop') renderShop();
    if (page === 'product') renderProduct();
    $all('[data-wa-href]').forEach(function (a) { a.href = 'https://wa.me/' + site.whatsapp; });
    renderCart();
    document.documentElement.classList.add('ready');
  }).catch(function (err) {
    console.error(err);
    var el = $('[data-header]'); if (el) el.innerHTML = '<div class="announce">Could not load the shop data. Please refresh.</div>';
  });
})();
