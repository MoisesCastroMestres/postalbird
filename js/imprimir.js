/* Panel de impresión: cola de pedidos + hojas a tamaño real (dedicatoria y sobre) */
(function () {
  'use strict';
  const PB = window.PB, $ = PB.$, $$ = PB.$$;
  const KEY = 'pb_cola', CFG = 'pb_print_cfg', CM = 37.7953; // píxeles CSS por cm
  const SIZES = { p: { w: 23, h: 15.5 }, g: { w: 24, h: 16.5 } };   // hojas de tus plantillas (desplegadas)
  const M = { top: 1.4, right: 1.2, bottom: 1.4, left: 1.6 };        // márgenes dentro de la mitad de texto
  const ENV = { w: 18, h: 12.5, to: { x: 6.5, y: 5.2, w: 10.5, h: 5.2, pt: 20 }, from: { x: 0.9, y: 0.9, w: 7.5, h: 3.2, pt: 12 } };

  let cola = PB.store.get(KEY, []), sel = null, filtro = 'todos';
  const cfg = Object.assign({ size: 'p', fold: 'v', pt: 20, ink: 'pedido', x: 0, y: 0 }, PB.store.get(CFG, {}));
  const save = () => PB.store.set(KEY, cola);
  const cur = () => cola.find((o) => o.ref === sel);
  const fecha = (o) => new Date(o.fecha).toLocaleDateString('es-ES');

  /* ---------- Cola ---------- */
  function addFromText(text) {
    const found = new Set();
    (text.match(/#p=([A-Za-z0-9_-]{40,})/g) || []).forEach((m) => found.add(m.slice(3)));
    (text.match(/[A-Za-z0-9_-]{80,}/g) || []).forEach((m) => found.add(m));
    let added = 0, dup = 0, last = null;
    found.forEach((code) => {
      try {
        const o = PB.decode(code);
        if (!o || !o.ref || !o.destinatario || o.mensaje === undefined) return;
        if (cola.some((x) => x.ref === o.ref)) { dup++; last = o.ref; return; }
        o.estado = 'pendiente'; cola.unshift(o); added++; last = o.ref;
      } catch (e) { /* no era un código válido */ }
    });
    if (added) save();
    return { added, dup, last };
  }
  function renderList() {
    $$('#filters .chip').forEach((c) => c.classList.toggle('on', c.dataset.f === filtro));
    const items = cola.filter((o) => filtro === 'todos' || o.estado === filtro);
    $('#list').innerHTML = items.length ? items.map((o) =>
      '<li><button type="button" data-ref="' + o.ref + '" class="' + (o.ref === sel ? 'on' : '') + '"><span class="badge ' + o.estado + '">' + o.estado + '</span><b>' + PB.esc(o.destinatario.nombre) + '</b>' +
      '<small>' + PB.esc(o.postal.nombre) + ' · ' + fecha(o) + '<br>' + PB.esc(o.ref) + '</small></button></li>').join('')
      : '<li class="muted">No hay pedidos en esta lista.</li>';
  }
  $('#list').addEventListener('click', (e) => { const b = e.target.closest('[data-ref]'); if (b) select(b.dataset.ref); });
  $('#filters').addEventListener('click', (e) => { const b = e.target.closest('[data-f]'); if (b) { filtro = b.dataset.f; renderList(); } });
  $('#addBtn').addEventListener('click', () => {
    const r = addFromText($('#paste').value);
    $('#addMsg').textContent = r.added ? r.added + ' pedido(s) añadido(s).' : r.dup ? 'Ese pedido ya estaba en la lista.' : 'No he encontrado ningún pedido válido en ese texto.';
    if (r.last) { $('#paste').value = ''; select(r.last); } else renderList();
  });

  /* ---------- Detalle y hojas ---------- */
  function select(ref) { sel = ref; renderList(); renderDetail(); $('#work').scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  function renderDetail() {
    const o = cur();
    $('#none').hidden = !!o; $('#detail').hidden = !o; if (!o) return;
    $('#dTitle').textContent = o.destinatario.nombre;
    $('#dMeta').textContent = o.ref + ' · ' + fecha(o) + ' · ' + o.postal.id + ' ' + o.postal.nombre;
    const st = $('#dState'); st.textContent = o.estado; st.className = 'badge ' + o.estado;
    const d = o.destinatario, c = o.cliente, pg = o.pago || {};
    $('#iDest').textContent = [d.nombre, d.dir1, d.dir2, d.cp + ' ' + d.ciudad + (d.provincia ? ' (' + d.provincia + ')' : ''), d.pais].filter(Boolean).join('\n');
    $('#iCli').textContent = [c.nombre, c.email, c.tel].filter(Boolean).join('\n') + (o.notas ? '\n\nNotas: ' + o.notas : '');
    $('#iPed').textContent = ['Envío: ' + o.envio.nombre, 'Total: ' + PB.money(o.total), 'Pago: ' + (pg.metodo || '—') + (pg.importe ? ' (' + pg.importe + ' €)' : ''), pg.id ? 'Operación: ' + pg.id : '',
      o.fechaEnvio ? 'Enviar a partir del: ' + o.fechaEnvio : ''].filter(Boolean).join('\n');
    layout();
  }
  function geom() {
    const s = SIZES[cfg.size];
    if (cfg.fold === 'v') return { W: s.w, H: s.h, box: { x: s.w / 2 + M.left, y: M.top, w: s.w / 2 - M.left - M.right, h: s.h - M.top - M.bottom }, guide: { left: s.w / 2 + 'cm', top: 0, width: 0, height: s.h + 'cm', bl: '1px' } };
    return { W: s.h, H: s.w, box: { x: M.left, y: s.w / 2 + M.top, w: s.h - M.left - M.right, h: s.w / 2 - M.top - M.bottom }, guide: { left: 0, top: s.w / 2 + 'cm', width: s.h + 'cm', height: 0, bt: '1px' } };
  }
  function scaleTo(wrap, Wcm, Hcm) {
    const avail = wrap.parentElement.clientWidth || 400, k = Math.min(1, avail / (Wcm * CM));
    const sc = $('.scaler', wrap), sh = $('.sheet', wrap);
    sc.style.width = Wcm * CM * k + 'px'; sc.style.height = Hcm * CM * k + 'px';
    sh.style.transform = 'scale(' + k + ')'; sh.style.transformOrigin = 'top left';
  }
  const place = (el, x, y, w, h) => { el.style.left = x + 'cm'; el.style.top = y + 'cm'; el.style.width = w + 'cm'; el.style.height = h + 'cm'; };

  function layout() {
    const o = cur(); if (!o) return;
    const font = PB.font(o.fuente), inkId = cfg.ink === 'pedido' ? o.tinta : cfg.ink, ink = PB.ink(inkId).color, ox = cfg.x / 10, oy = cfg.y / 10;

    // Dedicatoria
    const g = geom(), sh = $('#sheetInt');
    sh.style.width = g.W + 'cm'; sh.style.height = g.H + 'cm';
    const gd = $('.guide', sh); gd.style.cssText = 'left:' + g.guide.left + ';top:' + g.guide.top + ';width:' + g.guide.width + ';height:' + g.guide.height + ';border-left:' + (g.guide.bl ? '1px dashed #d9c9b0' : 0) + ';border-top:' + (g.guide.bt ? '1px dashed #d9c9b0' : 0);
    const t = $('#pTxt'); place(t, g.box.x + ox, g.box.y + oy, g.box.w, g.box.h);
    t.style.fontFamily = font.css; t.style.color = ink; t.textContent = o.mensaje;
    t.style.fontSize = cfg.pt * font.escala * (96 / 72) + 'px';
    PB.fit(t, cfg.pt * font.escala * (96 / 72), 11 * font.escala * (96 / 72));
    const over = t.scrollHeight > t.clientHeight + 1;
    $('#capInt').textContent = SIZES[cfg.size].w + ' × ' + SIZES[cfg.size].h + ' cm · letra ' + (parseFloat(t.style.fontSize) * 72 / 96).toFixed(1) + ' pt' + (over ? ' · ⚠ el texto no cabe' : '');
    scaleTo($('#wrapInt'), g.W, g.H);

    // Sobre
    const es = $('#sheetEnv'); es.style.width = ENV.w + 'cm'; es.style.height = ENV.h + 'cm';
    const d = o.destinatario, to = $('#eTo'), from = $('#eFrom');
    place(to, ENV.to.x + ox, ENV.to.y + oy, ENV.to.w, ENV.to.h); place(from, ENV.from.x + ox, ENV.from.y + oy, ENV.from.w, ENV.from.h);
    to.textContent = [d.nombre, d.dir1, d.dir2, d.cp + ' ' + d.ciudad + (d.provincia ? ' (' + d.provincia + ')' : ''), d.pais !== 'España' ? d.pais : ''].filter(Boolean).join('\n');
    from.textContent = o.remitente && o.remitente.incluir ? o.remitente.texto : '';
    [[to, ENV.to.pt], [from, ENV.from.pt]].forEach(([el, pt]) => {
      el.style.fontFamily = font.css; el.style.color = ink; PB.fit(el, pt * font.escala * (96 / 72), 8 * (96 / 72));
    });
    scaleTo($('#wrapEnv'), ENV.w, ENV.h);
  }

  /* ---------- Ajustes ---------- */
  function syncCfg() {
    $('#cSize').value = cfg.size; $('#cFold').value = cfg.fold; $('#cInk').value = cfg.ink;
    $('#cPt').value = cfg.pt; $('#cPtV').textContent = cfg.pt + ' pt'; $('#cX').value = cfg.x; $('#cXV').textContent = cfg.x; $('#cY').value = cfg.y; $('#cYV').textContent = cfg.y;
  }
  $('#cfg').addEventListener('input', () => {
    cfg.size = $('#cSize').value; cfg.fold = $('#cFold').value; cfg.ink = $('#cInk').value;
    cfg.pt = +$('#cPt').value; cfg.x = +$('#cX').value; cfg.y = +$('#cY').value;
    PB.store.set(CFG, cfg); syncCfg(); layout();
  });
  window.addEventListener('resize', layout);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(layout);

  /* ---------- Acciones ---------- */
  function printSheet(kind) {
    const g = geom(), wrap = $(kind === 'int' ? '#wrapInt' : '#wrapEnv'), W = kind === 'int' ? g.W : ENV.w, H = kind === 'int' ? g.H : ENV.h;
    $('#pageStyle').textContent = '@page { size: ' + W + 'cm ' + H + 'cm; margin: 0; }';
    wrap.classList.add('printing'); layout();
    setTimeout(() => window.print(), 50);
  }
  window.addEventListener('afterprint', () => $$('.printing').forEach((x) => x.classList.remove('printing')));
  $('#printInt').addEventListener('click', () => printSheet('int'));
  $('#printEnv').addEventListener('click', () => printSheet('env'));
  const setState = (s) => { const o = cur(); if (o) { o.estado = s; save(); renderList(); renderDetail(); } };
  $('#markPrinted').addEventListener('click', () => setState('impreso'));
  $('#markSent').addEventListener('click', () => setState('enviado'));
  $('#delBtn').addEventListener('click', () => {
    const o = cur(); if (!o || !confirm('¿Eliminar el pedido ' + o.ref + ' de esta lista?')) return;
    cola = cola.filter((x) => x.ref !== o.ref); save(); sel = null; renderList(); renderDetail();
  });
  $('#clearBtn').addEventListener('click', () => {
    const n = cola.filter((o) => o.estado === 'enviado').length;
    if (!n || !confirm('¿Quitar de la lista los ' + n + ' pedidos ya enviados?')) return;
    cola = cola.filter((o) => o.estado !== 'enviado'); save(); if (!cur()) sel = null; renderList(); renderDetail();
  });
  $('#csvBtn').addEventListener('click', () => {
    const cols = ['Pedido', 'Fecha', 'Estado', 'Postal', 'Destinatario', 'Dirección', 'Dirección 2', 'CP', 'Población', 'Provincia', 'País', 'Envío', 'Total', 'Cliente', 'Email', 'Teléfono', 'Mensaje'];
    const q = (s) => '"' + String(s == null ? '' : s).replace(/"/g, '""') + '"';
    const rows = cola.map((o) => [o.ref, fecha(o), o.estado, o.postal.nombre, o.destinatario.nombre, o.destinatario.dir1, o.destinatario.dir2, o.destinatario.cp, o.destinatario.ciudad,
      o.destinatario.provincia, o.destinatario.pais, o.envio.nombre, o.total, o.cliente.nombre, o.cliente.email, o.cliente.tel, o.mensaje].map(q).join(';'));
    const blob = new Blob(['﻿' + [cols.map(q).join(';')].concat(rows).join('\r\n')], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'pedidos-postalbird.csv'; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  });

  /* ---------- Arranque: si se abre desde el enlace del correo, importa el pedido ---------- */
  syncCfg();
  const m = location.hash.match(/^#p=(.+)$/);
  if (m) {
    const r = addFromText('#p=' + m[1]);
    history.replaceState(null, '', location.pathname);
    if (r.last) sel = r.last; else alert('No he podido leer el pedido de este enlace. Copia el código del correo y pégalo en «Añadir un pedido».');
  }
  if (!sel && cola.length) sel = (cola.find((o) => o.estado === 'pendiente') || cola[0]).ref;
  renderList(); renderDetail();
})();
