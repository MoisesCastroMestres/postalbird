/* ============ Postalbird — utilidades comunes, cabecera y pie ============ */
(function () {
  'use strict';
  const C = window.PB_CONFIG, DATA = window.PB_CATALOG;
  const PB = (window.PB = { config: C, data: DATA });

  /* ---------- Utilidades ---------- */
  PB.esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  PB.money = (n) => Number(n).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' });
  PB.qs = (k) => new URLSearchParams(location.search).get(k);
  PB.product = (id) => DATA.products.find((p) => p.id === id);
  PB.cat = (id) => DATA.categories.find((c) => c.id === id);
  PB.catCount = (id) => DATA.products.filter((p) => p.cats.includes(id)).length;
  PB.$ = (s, r) => (r || document).querySelector(s);
  PB.$$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  PB.store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* almacenamiento no disponible */ } }
  };
  PB.toast = (msg) => {
    const t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status'); t.textContent = msg;
    document.body.appendChild(t); setTimeout(() => t.remove(), 2600);
  };
  PB.demo = !(C.paypal && C.paypal.clientId);   // sin PayPal configurado = sitio de demostración
  PB.baseUrl = () => (C.urlPublica ? C.urlPublica.replace(/\/$/, '') + '/' : new URL('.', location.href).href);

  /* ---------- Opciones de personalización ---------- */
  PB.FONTS = [
    { id: 'belle',   nombre: 'La Belle Aurore', css: "'La Belle Aurore', cursive", escala: 1 },
    { id: 'handlee', nombre: 'Handlee',         css: "'Handlee', cursive",         escala: 0.9 },
    { id: 'allura',  nombre: 'Allura',          css: "'Allura', cursive",          escala: 1.25 },
    { id: 'montez',  nombre: 'Montez',          css: "'Montez', cursive",          escala: 1.05 }
  ];
  PB.INKS = [
    { id: 'azul',    nombre: 'Azul',    color: '#1e5b8e' },
    { id: 'negro',   nombre: 'Negro',   color: '#25211f' },
    { id: 'granate', nombre: 'Granate', color: '#8a1f3d' }
  ];
  PB.font = (id) => PB.FONTS.find((f) => f.id === id) || PB.FONTS[0];
  PB.ink = (id) => PB.INKS.find((i) => i.id === id) || PB.INKS[0];
  PB.COUNTRIES = ['España', 'Portugal', 'Francia', 'Italia', 'Alemania', 'Reino Unido', 'Irlanda', 'Países Bajos', 'Bélgica', 'Luxemburgo', 'Suiza', 'Austria',
    'Dinamarca', 'Suecia', 'Noruega', 'Finlandia', 'Polonia', 'Grecia', 'Andorra', 'Estados Unidos', 'Canadá', 'México', 'Argentina', 'Chile', 'Colombia',
    'Perú', 'Uruguay', 'Brasil', 'Australia', 'Japón', 'Otro país'];

  /* Medidas reales de impresión (cm) sacadas de tus plantillas de Word.
     Página de dedicatoria = una mitad de la hoja plegada (tarjeta pequeña 23 × 15,5 cm). Sobre: 18 × 12,5 cm. */
  PB.PAPER = { w: 11.5, h: 15.5, top: 1.4, right: 1.2, bottom: 1.4, left: 1.6, maxPt: 20, minPt: 11 };
  PB.ENV = { w: 18, h: 12.5, toPt: 20, fromPt: 12 };
  PB.ptPx = (pt, boxW, boxCm) => pt * 0.035278 * (boxW / boxCm);   // puntos → píxeles según el ancho real de la caja

  /* Ajusta el tamaño de la letra para que el texto quepa en su caja */
  PB.fit = (el, maxPx, minPx) => {
    if (!el || !el.clientHeight) return;
    let s = maxPx; el.style.fontSize = s + 'px';
    while (el.scrollHeight > el.clientHeight + 1 && s > minPx) { s -= 0.5; el.style.fontSize = s + 'px'; }
  };

  /* ---------- Envío de tarifas ---------- */
  PB.enviosPara = (pais) => C.envios.filter((e) => e.zona === (pais === 'España' ? 'ES' : 'INT'));
  PB.total = (envioId) => {
    const e = C.envios.find((x) => x.id === envioId);
    return Math.round((C.precioPostal + (e ? e.precio : 0)) * 100) / 100;
  };

  /* ---------- Pedidos: código, texto, envío ---------- */
  PB.encode = (obj) => {
    const bytes = new TextEncoder().encode(JSON.stringify(obj)); let s = '';
    bytes.forEach((b) => (s += String.fromCharCode(b)));
    return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  };
  PB.decode = (str) => {
    let s = String(str).trim().replace(/-/g, '+').replace(/_/g, '/'); while (s.length % 4) s += '=';
    const bin = atob(s), bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
    return JSON.parse(new TextDecoder().decode(bytes));
  };
  PB.newRef = () => {
    const d = new Date(), p = (n) => String(n).padStart(2, '0');
    return 'PB-' + String(d.getFullYear()).slice(2) + p(d.getMonth() + 1) + p(d.getDate()) + '-' + Math.random().toString(36).slice(2, 6).toUpperCase();
  };
  PB.printLink = (order) => PB.baseUrl() + 'imprimir.html#p=' + PB.encode(order);
  PB.orderText = (o) => {
    const d = o.destinatario, r = o.remitente || {}, c = o.cliente, pg = o.pago || {};
    const L = [
      'NUEVO PEDIDO ' + o.ref, 'Fecha: ' + new Date(o.fecha).toLocaleString('es-ES'), '',
      'POSTAL: ' + o.postal.id + ' · ' + o.postal.nombre,
      'ENVÍO: ' + o.envio.nombre + ' (' + PB.money(o.envio.precio) + ')',
      'TOTAL DEL PEDIDO: ' + PB.money(o.total),
      'PAGO: ' + (pg.metodo || '—') + (pg.id ? ' · operación ' + pg.id : '') + (pg.importe ? ' · cobrado ' + pg.importe + ' €' : '') + (pg.estado ? ' · ' + pg.estado : ''),
      o.fechaEnvio ? 'ENVIAR A PARTIR DEL: ' + o.fechaEnvio : '', '',
      '--- DEDICATORIA (letra: ' + PB.font(o.fuente).nombre + ', tinta: ' + PB.ink(o.tinta).nombre + ') ---', o.mensaje, '',
      '--- DESTINATARIO ---', d.nombre, d.dir1, d.dir2, d.cp + ' ' + d.ciudad + (d.provincia ? ' (' + d.provincia + ')' : ''), d.pais, '',
      '--- REMITENTE EN EL SOBRE ---', r.incluir && r.texto ? r.texto : '(sin remitente)', '',
      '--- CLIENTE ---', c.nombre, c.email, c.tel || '', o.notas ? '\nNotas: ' + o.notas : '', '',
      'Abrir para imprimir: ' + PB.printLink(o), '', 'Código del pedido (por si el enlace falla):', PB.encode(o)
    ];
    return L.filter((x) => x !== undefined && x !== null).join('\n').replace(/\n{3,}/g, '\n\n');
  };
  PB.mailtoPedido = (o) => 'mailto:' + C.email + '?subject=' + encodeURIComponent('Pedido ' + o.ref) + '&body=' + encodeURIComponent(PB.orderText(o));

  /* Devuelve {ok, motivo}. "no-configurado" significa que no hay servicio de correo elegido. */
  PB.enviar = async ({ asunto, mensaje, nombre, email }) => {
    const P = C.pedidos || {};
    try {
      if (P.proveedor === 'formspree' && P.endpoint) {
        const r = await fetch(P.endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({ _subject: asunto, name: nombre, email: email, message: mensaje }) });
        return { ok: r.ok, motivo: r.ok ? '' : 'error-' + r.status };
      }
      if (P.proveedor === 'web3forms' && P.claveAcceso) {
        const r = await fetch('https://api.web3forms.com/submit', { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({ access_key: P.claveAcceso, subject: asunto, from_name: nombre, email: email, message: mensaje }) });
        const j = await r.json().catch(() => ({}));
        return { ok: r.ok && j.success !== false, motivo: r.ok ? '' : 'error-' + r.status };
      }
    } catch (e) { return { ok: false, motivo: 'red' }; }
    return { ok: false, motivo: 'no-configurado' };
  };

  /* ---------- Componentes ---------- */
  PB.cardHTML = (p) => {
    const cat = PB.cat(p.cats[0]);
    return '<a class="pcard" href="postal.html?id=' + p.id + '"><div class="ph">' +
      '<img loading="lazy" width="400" height="400" src="' + p.images[0] + '" alt="Tarjeta postal: ' + PB.esc(p.title) + '">' +
      (p.images[1] ? '<img class="alt" loading="lazy" src="' + p.images[1] + '" alt="">' : '') +
      (cat ? '<span class="tag">' + PB.esc(cat.name) + '</span>' : '') +
      '</div><div class="body"><h3>' + PB.esc(p.name) + '</h3><div class="price">' + PB.money(C.precioPostal) + '</div></div></a>';
  };

  function headerHTML(page) {
    const cur = (n) => (page === n ? ' aria-current="page"' : '');
    const top = PB.demo
      ? '<b>Sitio de demostración</b> · No se realizan compras reales'
      : 'Papel <b>100 % reciclado</b> · Dedicatoria con letra manuscrita, enviada a su buzón · Desde <b>' + PB.money(C.precioPostal) + '</b>';
    return '<div class="topbar">' + top + '</div>' +
      '<div class="site-header"><div class="wrap">' +
      '<a class="brand" href="index.html" aria-label="Postalbird, inicio"><img src="img/logo.png" alt="Postalbird" width="180" height="50"></a>' +
      '<button class="burger" aria-label="Abrir menú" aria-expanded="false" aria-controls="nav"><span></span><span></span><span></span></button>' +
      '<nav class="nav" id="nav" aria-label="Principal">' +
      '<a href="tarjetas.html"' + cur('tarjetas') + '>Tarjetas</a>' +
      '<a href="como-funciona.html"' + cur('como') + '>Cómo funciona</a>' +
      '<a href="sobre-nosotros.html"' + cur('sobre') + '>Sobre nosotros</a>' +
      '<a href="contacto.html"' + cur('contacto') + '>Contacto</a>' +
      '<a class="btn small" href="tarjetas.html">Enviar una postal</a></nav></div></div>';
  }
  function footerHTML() {
    const cats = DATA.categories.slice(0, 6).map((c) => '<li><a href="tarjetas.html?cat=' + c.id + '">' + PB.esc(c.name) + '</a></li>').join('');
    return '<div class="wrap"><div class="cols">' +
      '<div><img class="logo" src="img/logo-blanco.png" alt="Postalbird" width="200" height="100">' +
      '<p>Recuperamos la tradición de enviar postales por correo, con una dedicatoria que parece escrita a mano por ti.</p></div>' +
      '<div><h4>Tarjetas</h4><ul>' + cats + '<li><a href="tarjetas.html">Ver todas</a></li></ul></div>' +
      '<div><h4>Ayuda</h4><ul><li><a href="como-funciona.html">Cómo funciona</a></li><li><a href="como-funciona.html#envios">Envíos y precios</a></li><li><a href="como-funciona.html#faq">Preguntas frecuentes</a></li><li><a href="contacto.html">Contacto</a></li><li><a href="sobre-nosotros.html">Sobre nosotros</a></li></ul></div>' +
      '<div><h4>Legal</h4><ul><li><a href="aviso-legal.html">Aviso legal</a></li><li><a href="privacidad.html">Política de privacidad</a></li><li><a href="cookies.html">Cookies</a></li><li><a href="condiciones.html">Condiciones de compra</a></li></ul></div>' +
      '</div><div class="legalbar"><span>© ' + new Date().getFullYear() + ' ' + PB.esc(C.nombre) + '. Todos los derechos reservados.</span><span>' + PB.esc(C.email) + '</span></div></div>';
  }

  function init() {
    const page = document.body.dataset.page || '';
    const h = document.getElementById('site-header'); if (h) h.innerHTML = headerHTML(page);
    const f = document.getElementById('site-footer'); if (f) f.innerHTML = footerHTML();
    const b = PB.$('.burger'), n = PB.$('#nav');
    if (b && n) b.addEventListener('click', () => { const o = n.classList.toggle('open'); b.setAttribute('aria-expanded', o); });
    if (!PB.store.get('pb_cookies_ok', false) && !/imprimir/.test(location.pathname)) {
      const c = document.createElement('div'); c.className = 'cookies'; c.setAttribute('role', 'dialog'); c.setAttribute('aria-label', 'Aviso de cookies');
      c.innerHTML = '<span>Solo usamos cookies técnicas. Al pagar, PayPal puede instalar las suyas. <a href="cookies.html">Más información</a></span><button class="btn small" type="button">Entendido</button>';
      c.querySelector('button').addEventListener('click', () => { PB.store.set('pb_cookies_ok', true); c.remove(); });
      document.body.appendChild(c);
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
