/* Asistente de personalización: mensaje → destinatario → envío → pago */
(function () {
  'use strict';
  const PB = window.PB, C = PB.config, $ = PB.$, $$ = PB.$$;
  const p = PB.product(PB.qs('id'));
  if (!p) {
    $('#app').innerHTML = '<div class="empty"><h1>Primero, elige una postal</h1><p><a class="btn" href="tarjetas.html">Ver las postales</a></p></div>';
    return;
  }
  document.title = 'Personaliza «' + p.name + '» · Postalbird';

  const f = $('#form'), DRAFT = 'pb_borrador_' + p.id;
  let step = 1, maxStep = 1, view = 'dedic', ref = PB.newRef(), paypalReady = false, sent = false;

  /* ---------- Construcción del formulario ---------- */
  $('#chosen').innerHTML = '<img src="' + p.images[0] + '" alt=""><div><b>' + PB.esc(p.name) + '</b><span class="muted">' + PB.esc(PB.cat(p.cats[0]).name) + ' · ' + PB.money(C.precioPostal) + '</span></div><a href="tarjetas.html" class="btn ghost small">Cambiar</a>';
  $('#coverImg').src = p.images[0];
  $('#msg').maxLength = C.maxCaracteres;
  $('#fonts').innerHTML = PB.FONTS.map((x, i) =>
    '<label><input type="radio" name="fuente" value="' + x.id + '"' + (i === 0 ? ' checked' : '') + '><span style="font-family:' + x.css + '">Con mucho cariño<small>' + x.nombre + '</small></span></label>').join('');
  $('#inks').innerHTML = PB.INKS.map((x, i) =>
    '<label title="' + x.nombre + '"><input type="radio" name="tinta" value="' + x.id + '"' + (i === 0 ? ' checked' : '') + '><i style="background:' + x.color + '"></i><span class="sr">' + x.nombre + '</span></label>').join('');
  $('#d_pais').innerHTML = PB.COUNTRIES.map((c) => '<option>' + c + '</option>').join('');
  const mañana = new Date(Date.now() + 864e5); $('#fecha').min = mañana.toISOString().slice(0, 10);

  function drawShipping() {
    const pais = f.d_pais.value, opts = PB.enviosPara(pais);
    let cur = (f.envio && f.envio.value) || '';
    if (!opts.some((o) => o.id === cur)) cur = opts[0].id;
    $('#envios').innerHTML = opts.map((o) =>
      '<label class="opt-card"><input type="radio" name="envio" value="' + o.id + '"' + (o.id === cur ? ' checked' : '') + '><span class="t">' + PB.esc(o.nombre) +
      '<small>' + PB.esc(o.detalle) + '</small></span><b>' + (o.precio ? '+ ' + PB.money(o.precio) : 'Incluido') + '</b></label>').join('');
  }

  /* ---------- Lectura del formulario ---------- */
  const v = (n) => (f.elements[n] ? String(f.elements[n].value).trim() : '');
  function read() {
    return { msg: f.msg.value.replace(/\r\n/g, '\n'), fuente: f.fuente.value, tinta: f.tinta.value, fecha: v('fecha'),
      d: { nombre: v('d_nombre'), dir1: v('d_dir1'), dir2: v('d_dir2'), cp: v('d_cp'), ciudad: v('d_ciudad'), provincia: v('d_prov'), pais: v('d_pais') },
      r: { incluir: f.r_on.checked, texto: f.r_txt.value.trim() }, envio: f.envio ? f.envio.value : '',
      c: { nombre: v('c_nombre'), email: v('c_email'), tel: v('c_tel') }, notas: v('notas') };
  }

  /* ---------- Vista previa ---------- */
  function preview() {
    const s = read(), font = PB.font(s.fuente), ink = PB.ink(s.tinta), P = PB.PAPER;
    const hw = $('#hwText'); hw.style.fontFamily = font.css; hw.style.color = ink.color;
    hw.textContent = s.msg.trim() ? s.msg : 'Aquí aparecerá tu dedicatoria…'; hw.style.opacity = s.msg.trim() ? 1 : 0.4;
    const pw = $('#paper').clientWidth;
    if (pw) PB.fit(hw, PB.ptPx(P.maxPt, pw, P.w) * font.escala, PB.ptPx(P.minPt, pw, P.w) * font.escala);

    const d = s.d, E = PB.ENV, ew = $('#envelope').clientWidth;
    const to = [d.nombre || 'Nombre del destinatario', d.dir1 || 'Calle y número', d.dir2, [d.cp, d.ciudad].filter(Boolean).join(' ') || 'CP Población', d.provincia, d.pais !== 'España' ? d.pais : ''].filter(Boolean).join('\n');
    const from = s.r.incluir ? s.r.texto : '';
    [['#envTo', to, E.toPt], ['#envFrom', from, E.fromPt]].forEach(([sel, txt, pt]) => {
      const el = $(sel); el.style.fontFamily = font.css; el.style.color = ink.color; el.textContent = txt;
      if (ew) el.style.fontSize = PB.ptPx(pt, ew, E.w) * font.escala + 'px';
    });
    const n = s.msg.length, cnt = $('#counter'); cnt.textContent = n + ' / ' + C.maxCaracteres; cnt.classList.toggle('warn', n >= C.maxCaracteres - 20);
    $('#totalMini').textContent = PB.money(PB.total(s.envio));
    drawSummary(s);
  }
  function setView(x) {
    view = x;
    $$('.tabs button').forEach((b) => { const on = b.dataset.view === x; b.classList.toggle('on', on); b.setAttribute('aria-selected', on); });
    $$('.stage .view').forEach((e) => e.classList.toggle('on', e.id === 'v-' + x));
    $('#cap').textContent = { dedic: 'Así se verá tu dedicatoria', sobre: 'Así se verá el sobre', postal: 'Esta es la portada de tu postal' }[x];
    preview();
  }

  function drawSummary(s) {
    const e = C.envios.find((o) => o.id === s.envio) || { nombre: '—', precio: 0 };
    $('#summary').innerHTML = '<dl><dt>Postal «' + PB.esc(p.name) + '»</dt><dd>' + PB.money(C.precioPostal) + '</dd>' +
      '<dt>' + PB.esc(e.nombre) + '</dt><dd>' + (e.precio ? PB.money(e.precio) : 'Incluido') + '</dd>' +
      '<dt>Para</dt><dd>' + PB.esc(s.d.nombre || '—') + '</dd>' +
      '<dt>Destino</dt><dd>' + PB.esc([s.d.ciudad, s.d.pais].filter(Boolean).join(', ') || '—') + '</dd>' +
      '<dt class="total">Total</dt><dd class="total">' + PB.money(PB.total(s.envio)) + '</dd></dl>';
  }

  /* ---------- Validación ---------- */
  function bad(el, msg) {
    el.classList.add('bad');
    let e = el.parentElement.querySelector('.err[data-for="' + el.name + '"]');
    if (!e) { e = document.createElement('div'); e.className = 'err'; e.dataset.for = el.name; el.insertAdjacentElement('afterend', e); }
    e.textContent = msg; return false;
  }
  function validate(n) {
    const panel = $('.panel[data-step="' + n + '"]');
    $$('.bad', panel).forEach((x) => x.classList.remove('bad')); $$('.err', panel).forEach((x) => (x.textContent = ''));
    const s = read(), bads = [];
    const need = (el, cond, msg) => { if (!cond) bads.push(bad(el, msg) || el); };
    if (n === 1) {
      need(f.msg, s.msg.trim().length > 0, 'Escribe tu dedicatoria.');
      need(f.msg, s.msg.length <= C.maxCaracteres, 'El máximo son ' + C.maxCaracteres + ' caracteres.');
    }
    if (n === 2) {
      need(f.d_nombre, s.d.nombre.length > 1, 'Indica el nombre del destinatario.');
      need(f.d_dir1, s.d.dir1.length > 2, 'Indica la dirección.');
      need(f.d_cp, s.d.pais !== 'España' ? s.d.cp.length > 1 : /^\d{5}$/.test(s.d.cp), s.d.pais === 'España' ? 'El código postal debe tener 5 números.' : 'Indica el código postal.');
      need(f.d_ciudad, s.d.ciudad.length > 1, 'Indica la población.');
      if (s.r.incluir) need(f.r_txt, s.r.texto.length > 2, 'Escribe el remitente o desmarca la casilla.');
    }
    if (n === 3) {
      need(f.c_nombre, s.c.nombre.length > 1, 'Indica tu nombre.');
      need(f.c_email, /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s.c.email), 'Indica un correo válido; te escribiremos si hay algún problema.');
    }
    if (bads.length) { bads[0].focus && bads[0].focus(); return false; }
    return true;
  }

  /* ---------- Navegación entre pasos ---------- */
  function go(n) {
    step = Math.max(1, Math.min(4, n)); maxStep = Math.max(maxStep, step);
    $$('.panel').forEach((e) => e.classList.toggle('on', +e.dataset.step === step));
    $$('#stepper button').forEach((b) => { const i = +b.dataset.go; b.classList.toggle('on', i === step); b.classList.toggle('done', i < step); b.disabled = i > maxStep; });
    $('#prev').style.visibility = step === 1 ? 'hidden' : 'visible';
    $('#next').style.display = step === 4 ? 'none' : '';
    if (step === 1) setView('dedic'); else if (step === 2) setView('sobre'); else preview();
    if (step === 4) initPay();
    $('#chosen').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  function next() { if (validate(step)) go(step + 1); }
  $('#next').addEventListener('click', next);
  $('#prev').addEventListener('click', () => go(step - 1));
  $('#stepper').addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b) return;
    const n = +b.dataset.go;
    if (n < step || (n > step && validateRange(step, n))) go(n);
  });
  function validateRange(from, to) { for (let i = from; i < to; i++) if (!validate(i)) { go(i); return false; } return true; }
  f.addEventListener('submit', (e) => { e.preventDefault(); if (step < 4) next(); });
  $$('.tabs button').forEach((b) => b.addEventListener('click', () => setView(b.dataset.view)));

  f.addEventListener('input', (e) => {
    if (e.target.classList.contains('bad')) { e.target.classList.remove('bad'); const er = e.target.parentElement.querySelector('.err'); if (er) er.textContent = ''; }
    if (e.target.name === 'r_on') $('#r_box').hidden = !e.target.checked;
    preview(); saveDraft();
  });
  f.d_pais.addEventListener('change', () => { drawShipping(); preview(); });
  $('#envios').addEventListener('change', preview);
  window.addEventListener('resize', () => preview());
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(preview);

  /* ---------- Borrador (se conserva si recargas la página) ---------- */
  function saveDraft() {
    try { const o = {}; new FormData(f).forEach((val, k) => { if (k !== 'acepto') o[k] = val; }); sessionStorage.setItem(DRAFT, JSON.stringify(o)); } catch (e) { /* sin almacenamiento */ }
  }
  function loadDraft() {
    let o; try { o = JSON.parse(sessionStorage.getItem(DRAFT) || 'null'); } catch (e) { o = null; }
    if (!o) return;
    Object.keys(o).forEach((k) => {
      const els = f.querySelectorAll('[name="' + k + '"]'); if (!els.length) return;
      els.forEach((el) => { if (el.type === 'radio') el.checked = el.value === o[k]; else if (el.type === 'checkbox') el.checked = true; else el.value = o[k]; });
    });
    $('#r_box').hidden = !f.r_on.checked;
  }

  /* ---------- Pago ---------- */
  function buildOrder(pago) {
    const s = read(), e = C.envios.find((o) => o.id === s.envio);
    return { v: 1, ref, fecha: new Date().toISOString(), postal: { id: p.id, nombre: p.name }, mensaje: s.msg.trim(), fuente: s.fuente, tinta: s.tinta, fechaEnvio: s.fecha,
      destinatario: { nombre: s.d.nombre, dir1: s.d.dir1, dir2: s.d.dir2, cp: s.d.cp, ciudad: s.d.ciudad, provincia: s.d.provincia, pais: s.d.pais },
      remitente: s.r, envio: { id: e.id, nombre: e.nombre, precio: e.precio }, total: PB.total(e.id), cliente: s.c, notas: s.notas, pago };
  }
  const payMsg = (html, cls) => ($('#payMsg').innerHTML = html ? '<div class="msg ' + (cls || 'err-box') + '">' + html + '</div>' : '');
  function okToPay() {
    payMsg('');
    for (let i = 1; i <= 3; i++) if (!validate(i)) { go(i); return false; }
    if (!f.acepto.checked) { payMsg('Para continuar, acepta las condiciones de compra y la política de privacidad.'); f.acepto.focus(); return false; }
    return true;
  }
  function loadPayPal() {
    return new Promise((res, rej) => {
      if (window.paypal) return res();
      const s = document.createElement('script');
      s.src = 'https://www.paypal.com/sdk/js?client-id=' + encodeURIComponent(C.paypal.clientId) + '&currency=' + C.paypal.moneda + '&locale=es_ES&components=buttons';
      s.onload = res; s.onerror = () => rej(new Error('No se pudo cargar PayPal')); document.head.appendChild(s);
    });
  }
  function initPay() {
    const demo = !C.paypal.clientId;
    $('#demoNote').hidden = !demo; $('#demoBtn').hidden = !demo;
    if (demo) { $('#demoBtn').onclick = () => { if (okToPay()) complete({ metodo: 'PRUEBA (sin cobro)' }); }; return; }
    if (paypalReady) return; paypalReady = true;
    loadPayPal().then(() => {
      window.paypal.Buttons({
        style: { layout: 'vertical', shape: 'pill', label: 'pay', color: 'gold' },
        onClick: (d, a) => (okToPay() ? a.resolve() : a.reject()),
        createOrder: (d, a) => {
          const s = read(), e = C.envios.find((o) => o.id === s.envio), fmt = (n) => n.toFixed(2), name = ('Postal ' + p.name).slice(0, 120);
          return a.order.create({ purchase_units: [{ reference_id: ref, custom_id: ref, description: name,
            amount: { currency_code: C.paypal.moneda, value: fmt(PB.total(e.id)), breakdown: { item_total: { currency_code: C.paypal.moneda, value: fmt(C.precioPostal) }, shipping: { currency_code: C.paypal.moneda, value: fmt(e.precio) } } },
            items: [{ name, sku: p.id, quantity: '1', unit_amount: { currency_code: C.paypal.moneda, value: fmt(C.precioPostal) } }] }],
            application_context: { shipping_preference: 'NO_SHIPPING' } });
        },
        onApprove: (d, a) => a.order.capture().then((det) => {
          const cap = det.purchase_units && det.purchase_units[0].payments && det.purchase_units[0].payments.captures && det.purchase_units[0].payments.captures[0];
          complete({ metodo: 'PayPal', id: (cap && cap.id) || det.id, estado: det.status, importe: cap && cap.amount ? cap.amount.value : '', email: det.payer && det.payer.email_address });
        }),
        onError: () => payMsg('No hemos podido completar el pago con PayPal. No se te ha cobrado nada; inténtalo de nuevo o escríbenos a <a href="mailto:' + C.email + '">' + C.email + '</a>.')
      }).render('#paypal');
    }).catch(() => { paypalReady = false; payMsg('No se pudo cargar PayPal. Comprueba tu conexión y recarga la página.'); });
  }

  async function complete(pago) {
    if (sent) return; sent = true;
    const order = buildOrder(pago);
    try { sessionStorage.removeItem(DRAFT); } catch (e) { /* nada */ }
    const res = await PB.enviar({ asunto: 'Pedido ' + order.ref + ' · ' + p.name, mensaje: PB.orderText(order), nombre: order.cliente.nombre, email: order.cliente.email });
    showDone(order, res, pago.metodo !== 'PayPal');
  }
  function showDone(order, res, demo) {
    $('#editor').hidden = true; const box = $('#done'); box.hidden = false;
    let extra = '';
    if (!res.ok) {
      extra = '<div class="msg ' + (demo ? 'ok-box' : 'err-box') + '" style="text-align:left">' +
        (demo ? '<b>Es una demostración:</b> el pedido no se ha enviado a nadie y no se ha guardado ningún dato personal.'
              : '<b>Tu pago se ha realizado correctamente</b>, pero no hemos podido avisarnos automáticamente. Por favor, envíanos el pedido pulsando el botón de abajo (o copia el código y mándalo a ' + PB.esc(C.email) + ').') + '</div>' +
        (demo ? '<p><a class="btn small" href="' + PB.printLink(order) + '" target="_blank" rel="noopener">Ver cómo lo imprimiríamos</a></p>'
              : '<p><a class="btn" href="' + PB.mailtoPedido(order) + '">Enviar el pedido por correo</a></p><textarea class="code-box" readonly aria-label="Código del pedido">' + PB.encode(order) + '</textarea>');
    }
    box.innerHTML = '<div class="narrow"><div class="done-card"><span class="eyebrow">¡Gracias, ' + PB.esc(order.cliente.nombre.split(' ')[0]) + '!</span>' +
      '<h1 style="font-size:3.4rem">' + (demo ? 'Pedido de demostración completado' : '¡Pedido recibido!') + '</h1>' +
      '<p>Número de pedido: <b>' + order.ref + '</b></p>' +
      '<p>' + (res.ok ? 'Ya tenemos tu pedido. Imprimiremos tu dedicatoria con letra manuscrita y enviaremos la postal a <b>' + PB.esc(order.destinatario.nombre) + '</b>.' :
        'Postal «' + PB.esc(order.postal.nombre) + '» para <b>' + PB.esc(order.destinatario.nombre) + '</b>.') + '</p>' +
      (!demo ? '<p class="muted">Recibirás el justificante de PayPal en tu correo. Guarda el número de pedido por si necesitas escribirnos.</p>' : '') +
      extra + '<p style="margin-top:22px"><a class="btn ghost" href="tarjetas.html">Enviar otra postal</a></p></div></div>';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /* ---------- Arranque ---------- */
  if (PB.demo) PB.$$('[data-demo]').forEach((e) => (e.hidden = false));
  drawShipping(); loadDraft(); drawShipping(); $('#r_box').hidden = !f.r_on.checked;
  go(1);
})();
