/* ============================================================
   CONFIGURACIÓN DE POSTALBIRD
   Es el único archivo que tienes que tocar para poner la web en marcha.
   Explicación paso a paso en el archivo LEEME.md
   ============================================================ */
window.PB_CONFIG = {
  nombre: 'Postalbird',
  eslogan: 'Tarjetas postales con dedicatoria manuscrita',

  // Correo que se muestra en la web (contacto y páginas legales)
  email: 'administracion@postalbird.es',

  // Dirección pública de la web (sin barra final). Se usa para los enlaces de los pedidos y el sitemap.
  // Déjalo vacío para que use la dirección desde la que se abre la web.
  urlPublica: '',

  // ---------- Precios (euros) ----------
  precioPostal: 3.9,
  maxCaracteres: 400,

  // Opciones de envío. "zona": 'ES' = solo España · 'INT' = resto del mundo
  envios: [
    { id: 'ordinario',   nombre: 'Correo ordinario',            detalle: 'Incluido en el precio',            precio: 0,    zona: 'ES'  },
    { id: 'nacex',       nombre: 'Nacex (mensajería urgente)',   detalle: 'Entrega rápida con seguimiento',   precio: 5,    zona: 'ES'  },
    { id: 'certificado', nombre: 'Correo certificado',           detalle: 'Para envíos fuera de España',      precio: 5.3,  zona: 'INT' }
  ],

  // ---------- Pagos con PayPal ----------
  // 1) Entra en https://developer.paypal.com  >  Apps & Credentials  >  Live  >  Create App
  // 2) Copia el "Client ID" y pégalo aquí.
  // Mientras esté vacío, la web funciona en MODO PRUEBA: se puede hacer todo el proceso, pero no se cobra nada.
  paypal: {
    clientId: '',
    moneda: 'EUR'
  },

  // ---------- Cómo te llegan los pedidos ----------
  // Elige UNA opción (ambas son gratuitas y no necesitan servidor):
  //  · 'formspree' : crea un formulario en https://formspree.io y pega su dirección (https://formspree.io/f/xxxxxxx)
  //  · 'web3forms' : pide una clave en https://web3forms.com (te la envían por correo) y pégala en "claveAcceso"
  //  · 'ninguno'   : sin envío automático; el cliente verá un botón para mandarte el pedido por correo.
  pedidos: {
    proveedor: 'ninguno',
    endpoint: '',      // solo Formspree
    claveAcceso: ''    // solo Web3Forms
  }
};
