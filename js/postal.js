/* Ficha de una postal */
(function () {
  const PB = window.PB, C = PB.config, root = document.getElementById('root');
  const p = PB.product(PB.qs('id'));
  if (!p) {
    root.innerHTML = '<div class="empty"><h1>No encontramos esa postal</h1><p><a class="btn" href="tarjetas.html">Ver todas las postales</a></p></div>';
    return;
  }
  const cat = PB.cat(p.cats[0]);
  const title = 'Tarjeta postal «' + p.name + '» · Postalbird';
  document.title = title;
  const desc = (p.desc || 'Tarjeta postal «' + p.name + '». Escribe tu dedicatoria y la enviamos por correo, con letra manuscrita, al buzón que tú elijas.').slice(0, 155);
  document.querySelector('meta[name=description]').setAttribute('content', desc);

  const labels = ['Portada', 'Interior', 'Trasera', 'Otra vista', 'Otra vista'];
  const thumbs = p.images.length > 1 ? p.images.map((src, i) =>
    '<button type="button" data-i="' + i + '" aria-label="Ver imagen: ' + (labels[i] || 'otra vista') + '" aria-current="' + (i === 0) + '"><img src="' + src + '" alt="" loading="lazy"></button>').join('') : '';
  const rel = PB.data.products.filter((x) => x.id !== p.id && x.cats.some((c) => p.cats.includes(c)));
  const relacionadas = rel.slice(0, 4);

  root.innerHTML =
    '<nav class="crumbs" aria-label="Migas de pan"><a href="index.html">Inicio</a> › <a href="tarjetas.html">Tarjetas</a> › ' +
    '<a href="tarjetas.html?cat=' + cat.id + '">' + PB.esc(cat.name) + '</a></nav>' +
    '<div class="detail"><div class="gallery"><div class="main"><img id="main" src="' + p.images[0] + '" alt="Tarjeta postal: ' + PB.esc(p.title) + '" width="720" height="720"></div>' +
    '<div class="thumbs">' + thumbs + '</div></div>' +
    '<div class="info"><span class="eyebrow">' + PB.esc(cat.name) + '</span><h1>' + PB.esc(p.name) + '</h1>' +
    '<div class="price">' + PB.money(C.precioPostal) + '</div>' +
    '<p class="prose">' + PB.esc(p.desc || 'Elige esta postal, escribe tu dedicatoria y nosotros la imprimimos con letra manuscrita y la enviamos al buzón que nos indiques.') + '</p>' +
    '<ul class="facts"><li>Dedicatoria con letra manuscrita de hasta ' + C.maxCaracteres + ' caracteres</li>' +
    '<li>Papel 100 % reciclado</li><li>Envío ordinario incluido · Nacex y certificado opcionales</li><li>Ves cómo queda antes de pagar</li></ul>' +
    '<a class="btn" href="personalizar.html?id=' + p.id + '">Personalizar y enviar</a></div></div>';

  root.addEventListener('click', (e) => {
    const b = e.target.closest('.thumbs button'); if (!b) return;
    document.getElementById('main').src = p.images[+b.dataset.i];
    root.querySelectorAll('.thumbs button').forEach((x) => x.setAttribute('aria-current', x === b));
  });

  document.getElementById('relacionadas').innerHTML = relacionadas.length
    ? '<h2>También te pueden gustar</h2><div class="grid">' + relacionadas.map(PB.cardHTML).join('') + '</div>' : '';

  // Datos estructurados para buscadores
  const ld = document.createElement('script'); ld.type = 'application/ld+json';
  ld.textContent = JSON.stringify({ '@context': 'https://schema.org', '@type': 'Product', name: p.title, image: p.images.map((s) => new URL(s, location.href).href),
    description: desc, sku: p.id, brand: { '@type': 'Brand', name: 'Postalbird' },
    offers: { '@type': 'Offer', priceCurrency: 'EUR', price: C.precioPostal.toFixed(2), availability: 'https://schema.org/InStock', url: location.href } });
  document.head.appendChild(ld);
})();
