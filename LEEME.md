# Postalbird — web sin WordPress

Es una web **100 % estática** (HTML, CSS y JavaScript). No necesita PHP, base de datos ni WordPress:
la subes a cualquier hosting y funciona. Se ha reconstruido a partir de tu copia de seguridad de 2019.

## Qué se ha recuperado de la web antigua

- **Las 122 postales** con sus fotos (portada, interior y trasera), categorías y precio (3,90 €).
- **Las categorías**: Amor, Cumpleaños, Amistad, Agradecimiento, Día de la Madre, Día del Padre, Navidad, Boda y Cada día.
- **Los textos** de inicio y de «Sobre nosotros», el logo y las fuentes de letra a mano.
- **Las tarifas de envío**: ordinario incluido, Nacex +5 €, resto de países (certificado) +5,30 €.
- **La dedicatoria de hasta 400 caracteres** y la elección de envío, como en el WooCommerce de antes.

No se han importado los pedidos ni los clientes antiguos (son datos personales y no hacían falta).

## Cómo verla en tu ordenador

Abre la carpeta `web` y haz doble clic en `index.html`. Si prefieres verla como si estuviera en internet:

```bash
python -m http.server 8080 --directory web
```

y entra en <http://localhost:8080>. Mientras no configures PayPal, la web funciona en **modo prueba**:
puedes hacer un pedido entero, pero no se cobra nada.

## Lo que tienes que configurar (archivo `js/config.js`)

### 1. Cobrar con PayPal

1. Entra en <https://developer.paypal.com> → *Apps & Credentials* → pestaña **Live** → *Create App*.
2. Copia el **Client ID** y pégalo en `paypal.clientId`.

El cliente paga con su cuenta de PayPal o con tarjeta, desde la ventana de PayPal. Tú no manejas datos de tarjeta.

### 2. Recibir los pedidos por correo

Una web estática no tiene servidor, así que los pedidos te llegan **por correo** usando un servicio gratuito de formularios. Elige uno:

- **Web3Forms** (recomendado, 250 envíos/mes gratis): pide una clave en <https://web3forms.com> con tu correo
  y ponla en `pedidos.claveAcceso`, con `pedidos.proveedor: 'web3forms'`.
- **Formspree** (50 envíos/mes gratis): crea un formulario en <https://formspree.io>, copia su dirección
  (`https://formspree.io/f/xxxxxxx`) en `pedidos.endpoint`, con `pedidos.proveedor: 'formspree'`.

Cada pedido llega con todos los datos, la dedicatoria y **un enlace para imprimirlo**. Si el correo automático fallara
después de un pago, el cliente ve un botón para enviarte el pedido a mano, así que no se pierde ninguno.

### 3. Datos legales

En `aviso-legal.html`, `privacidad.html` y `condiciones.html` hay campos **marcados en amarillo**
(tu nombre o razón social, NIF, domicilio, si los precios llevan IVA, plazo de envío, proveedor de formularios).
Complétalos y borra el recuadro «Borrador para completar». Son plantillas orientativas: conviene que las revise un profesional.

## Cómo trabajas con un pedido (imprimir)

1. Te llega el correo del pedido. Pulsa el enlace **«Abrir para imprimir»** (o abre `imprimir.html` y pega el código del correo).
2. Se abre el panel de impresión con **la dedicatoria y el sobre a tamaño real**, con la letra y la tinta que eligió el cliente.
3. Pulsa **Imprimir dedicatoria** y **Imprimir sobre**. En el diálogo de impresión: escala **100 %**, márgenes **ninguno**.
4. Marca el pedido como *impreso* y luego como *enviado*. Puedes exportar la lista a CSV (Excel).

Las medidas salen de tus plantillas de Word: hoja de 23 × 15,5 cm (pequeña) o 24 × 16,5 cm (grande), pliegue vertical
u horizontal, y sobre de 18 × 12,5 cm. En *Ajustes de impresión* puedes cambiar el tamaño de letra y mover el texto unos
milímetros si tu impresora lo saca algo desplazado. Haz primero una prueba en un folio.

> La lista de pedidos del panel se guarda **en tu navegador** (no en un servidor). Usa siempre el mismo navegador
> y exporta el CSV de vez en cuando como copia.

## Publicarla en internet

Sube **el contenido de la carpeta `web`** (no la carpeta en sí) a tu hosting, a `public_html`, por FTP o el administrador de archivos.
Otras opciones gratuitas: Netlify (arrastrar la carpeta en <https://app.netlify.com/drop>) o GitHub Pages.

Después:

1. Cambia la dirección en `js/config.js` (`urlPublica`).
2. Genera el mapa del sitio para Google: `python herramientas/generar_sitemap.py https://www.tudominio.es`.
3. Revisa `robots.txt`.

## Añadir, quitar o cambiar postales

Todo el catálogo está en `js/catalog.js`. Cada postal es un bloque como este:

```js
{ "id": "123", "name": "Nombre visible", "title": "Título largo (SEO)",
  "cats": ["amor", "cumpleanos"], "images": ["img/cards/123-portada.jpg", "img/cards/123-interior.jpg"], "desc": "Texto opcional" }
```

Guarda las fotos en `img/cards/` (unos 720 px de ancho, JPG) y la primera de la lista es la que se ve en el catálogo.

## Cosas que conviene saber

- **El precio se calcula en el navegador.** PayPal cobra lo que la web le pide; un usuario técnico podría manipularlo.
  Por eso el correo del pedido incluye el **importe realmente cobrado**: compáralo con el total antes de imprimir.
- No hay cuentas de cliente ni carrito con varios productos: cada pedido es **una postal**, como en tu WooCommerce de antes
  (que tenía el pago directo activado).
- **Seguridad de la copia antigua:** el backup de WordPress contiene contraseñas y claves antiguas (base de datos y pasarelas
  de pago). Si alguna siguiera activa, cámbiala o revócala, y no dejes ese archivo en un sitio público.
- Las fuentes usadas (La Belle Aurore, Handlee, Allura, Montez, Amatic SC y Nunito) tienen licencia libre.

## Estructura

| Carpeta / archivo | Qué es |
| --- | --- |
| `index.html`, `tarjetas.html`, `postal.html` | Inicio, catálogo y ficha de cada postal |
| `personalizar.html` | Asistente: mensaje → destinatario → envío → pago |
| `imprimir.html` | Tu panel para imprimir dedicatorias y sobres |
| `como-funciona.html`, `sobre-nosotros.html`, `contacto.html` | Contenido |
| `aviso-legal.html`, `privacidad.html`, `cookies.html`, `condiciones.html` | Legal |
| `js/config.js` | **Tu configuración** (precios, PayPal, correo de pedidos) |
| `js/catalog.js` | Catálogo de postales |
| `css/`, `js/`, `img/`, `fonts/` | Estilos, código, imágenes y tipografías |
