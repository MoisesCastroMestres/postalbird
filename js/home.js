/* Página de inicio: categorías y postales destacadas */
(function () {
  const PB = window.PB, D = PB.data;
  document.querySelectorAll('[data-total]').forEach((e) => (e.textContent = D.products.length));
  document.querySelectorAll('[data-price]').forEach((e) => (e.textContent = PB.money(PB.config.precioPostal)));

  document.getElementById('cats').innerHTML = D.categories
    .filter((c) => PB.catCount(c.id))
    .map((c) => '<a class="cat-tile" href="tarjetas.html?cat=' + c.id + '"><b>' + PB.esc(c.name) + '</b><span>' + PB.catCount(c.id) + ' postales</span></a>')
    .join('');

  // Una postal destacada por categoría (la primera con foto de portada)
  const orden = ['amor', 'cumpleanos', 'amistad', 'agradecimiento', 'dia-de-la-madre', 'navidad', 'boda', 'dia-del-padre'];
  const usados = new Set(), picks = [];
  orden.forEach((cid) => {
    const p = D.products.find((x) => x.cats[0] === cid && /portada/.test(x.images[0]) && !usados.has(x.id));
    if (p) { usados.add(p.id); picks.push(p); }
  });
  document.getElementById('destacadas').innerHTML = picks.map(PB.cardHTML).join('');
})();
