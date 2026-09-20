"""Genera sitemap.xml con todas las páginas y postales del catálogo.

Uso (desde la carpeta web):
    python herramientas/generar_sitemap.py https://www.tudominio.es
"""
import json, re, sys, datetime, pathlib

base = (sys.argv[1] if len(sys.argv) > 1 else 'https://www.postalbird.es').rstrip('/')
raiz = pathlib.Path(__file__).resolve().parent.parent
catalogo = (raiz / 'js' / 'catalog.js').read_text(encoding='utf-8')
datos = json.loads(catalogo[catalogo.index('{'):catalogo.rindex('}') + 1])
hoy = datetime.date.today().isoformat()

paginas = ['index.html', 'tarjetas.html', 'como-funciona.html', 'sobre-nosotros.html', 'contacto.html',
           'aviso-legal.html', 'privacidad.html', 'cookies.html', 'condiciones.html']
urls = [base + '/' + p for p in paginas]
urls += [base + '/tarjetas.html?cat=' + c['id'] for c in datos['categories']]
urls += [base + '/postal.html?id=' + p['id'] for p in datos['products']]

xml = ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
xml += ['  <url><loc>%s</loc><lastmod>%s</lastmod></url>' % (u.replace('&', '&amp;'), hoy) for u in urls]
xml.append('</urlset>')
(raiz / 'sitemap.xml').write_text('\n'.join(xml) + '\n', encoding='utf-8')
(raiz / 'robots.txt').write_text(re.sub(r'Sitemap: .*', 'Sitemap: ' + base + '/sitemap.xml', (raiz / 'robots.txt').read_text(encoding='utf-8')), encoding='utf-8')
print(len(urls), 'direcciones escritas en sitemap.xml')
