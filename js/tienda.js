/* Catálogo: filtros por categoría, búsqueda y "mostrar más" */
(function () {
  const PB = window.PB, D = PB.data, PAGE = 24;
  const norm = (s) => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const TEXTOS = {
    amor: 'Para decir «te quiero» de una forma que nunca olvidará.',
    cumpleanos: 'Que el cumpleaños llegue con sorpresa al buzón.',
    amistad: 'Porque los buenos amigos también merecen una postal.',
    agradecimiento: 'Un gracias que llega al buzón vale mucho más que un mensaje.',
    'dia-de-la-madre': 'Un detalle para la mejor madre del mundo.',
    'dia-del-padre': 'Para el padre que siempre está ahí.',
    navidad: 'Felicita las fiestas como se hacía antes: por correo.',
    boda: 'Enhorabuena a los novios con mucho humor y cariño.',
    'cada-dia': 'No hace falta una fecha especial para alegrarle el día a alguien.'
  };
  let cat = PB.qs('cat') || 'todas', q = PB.qs('q') || '', shown = PAGE;
  if (cat !== 'todas' && !PB.cat(cat)) cat = 'todas';

  const $ = PB.$, grid = $('#grid'), chips = $('#chips'), input = $('#q');
  input.value = q;

  function chipsHTML() {
    const all = '<button class="chip' + (cat === 'todas' ? ' on' : '') + '" data-cat="todas" type="button" aria-pressed="' + (cat === 'todas') + '">Todas <small>' + D.products.length + '</small></button>';
    return all + D.categories.filter((c) => PB.catCount(c.id)).map((c) =>
      '<button class="chip' + (cat === c.id ? ' on' : '') + '" data-cat="' + c.id + '" type="button" aria-pressed="' + (cat === c.id) + '">' + PB.esc(c.name) + ' <small>' + PB.catCount(c.id) + '</small></button>').join('');
  }
  function list() {
    const words = norm(q).split(/\s+/).filter(Boolean);
    return D.products.filter((p) => {
      if (cat !== 'todas' && !p.cats.includes(cat)) return false;
      const hay = norm(p.title + ' ' + p.name + ' ' + p.cats.map((c) => PB.cat(c).name).join(' '));
      return words.every((w) => hay.includes(w));
    });
  }
  function render() {
    const items = list();
    chips.innerHTML = chipsHTML();
    grid.innerHTML = items.slice(0, shown).map(PB.cardHTML).join('');
    $('#empty').hidden = items.length > 0;
    $('#more').hidden = items.length <= shown;
    $('#count').textContent = items.length + (items.length === 1 ? ' postal' : ' postales');
    const c = PB.cat(cat);
    $('#titulo').textContent = c ? 'Tarjetas postales de ' + c.name.toLowerCase().replace(/^día/, 'día') : 'Tarjetas postales';
    $('#intro').textContent = c ? TEXTOS[c.id] : 'Elige la que más te guste. Después escribes tu dedicatoria y nos dices a quién se la enviamos.';
    document.title = (c ? 'Tarjetas postales de ' + c.name.toLowerCase() : 'Tarjetas postales para enviar por correo') + ' · Postalbird';
  }
  function sync() {
    const u = new URL(location.href);
    cat === 'todas' ? u.searchParams.delete('cat') : u.searchParams.set('cat', cat);
    q ? u.searchParams.set('q', q) : u.searchParams.delete('q');
    history.replaceState(null, '', u);
  }
  chips.addEventListener('click', (e) => {
    const b = e.target.closest('[data-cat]'); if (!b) return;
    cat = b.dataset.cat; shown = PAGE; sync(); render();
  });
  input.addEventListener('input', () => { q = input.value; shown = PAGE; sync(); render(); });
  $('#more').addEventListener('click', () => { shown += PAGE; render(); });
  render();
})();
