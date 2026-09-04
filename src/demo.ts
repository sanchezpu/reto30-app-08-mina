import type { Informe } from './tipos'

// Negocio inventado a propósito. El informe de ejemplo tiene que enseñar de
// qué va la herramienta sin colgarle a un negocio real un análisis que no ha
// pedido, y sin gastar una llamada al modelo cada vez que alguien abre la app.
//
// ⚠️ Los verbatims de INFORME_DEMO están tomados literalmente de RESENAS_DEMO.
// No es decorativo: si el ejemplo incumpliera la regla que la app promete,
// la herramienta se desmentiría sola. Lo comprueba herramientas/verificar-demo.mjs.

export const NEGOCIO_DEMO = 'Bruma · café de origen'
export const COMPETIDOR_DEMO = 'Andén Tostadores'

export const RESENAS_DEMO = `Llevo tres meses pidiendo y no vuelvo al café de supermercado. Se nota fresquísimo, la bolsa trae la fecha de tueste y eso ya dice todo. El Huila con notas a panela es mi favorito.

Pedí un jueves y me llegó el lunes a Medellín. El empaque venía perfecto, sellado y con una tarjetita escrita a mano. Detalles que uno agradece.

El café es excelente pero el envío se demoró más de lo que decía la página. Me dijeron 3 días y fueron 6. Igual volvería a pedir.

Compré el molido para prensa francesa y me sorprendió el aroma apenas abrí la bolsa. Mi esposa que no toma café me pidió un sorbo.

Precio un poco alto comparado con lo que uno consigue en el barrio, pero es que no es lo mismo. Uno paga la diferencia y se nota.

Excelente atención por WhatsApp. Les escribí para preguntar cuál me servía para mi cafetera italiana y me respondieron en minutos con una recomendación clara.

Regalé la caja de tres orígenes a mi papá y quedó feliz. Buena presentación para regalo, se ve que le pusieron cuidado.

Ya es el cuarto pedido y nunca me ha llegado un lote malo. Consistencia total, siempre sabe igual de bien.

Se demoró el envío pero avisaron por WhatsApp que había retraso de la transportadora. Al menos uno sabe qué está pasando.

El sabor es limpio, sin ese amargo quemado del café comercial. Se siente el trabajo detrás.

Pedí sin saber mucho de café y venía una guía de preparación adentro. Aprendí a usar bien mi V60 con eso.

Un poco caro el envío para pedidos pequeños. Toca pedir dos bolsas para que salga a cuenta.`

export const RESENAS_COMPETIDOR_DEMO = `Buen café y muy barato el envío, llega en dos días a Bogotá.

El café está bien pero la molienda no era la que pedí. Me mandaron grano entero.

Tienen suscripción mensual y eso me sirve mucho, me llega sin tener que acordarme.

Buenos precios, es de los más económicos dentro del café de especialidad.

El tueste me pareció muy oscuro para lo que prometen. Sabe a café de panadería.

Rápido el envío, llegó al otro día. La atención por Instagram es lenta eso sí.

Me gusta que tengan tienda física para ir a probar antes de comprar.

La bolsa no trae fecha de tueste, uno no sabe qué tan fresco está.`

export const INFORME_DEMO: Informe = {
  negocio: NEGOCIO_DEMO,
  generado: '2026-09-04T09:00:00.000Z',
  resenas: 12,
  resenasCompetidor: 8,
  resumen:
    'Bruma no vende café: vende la prueba de que el café está fresco. Lo que más repiten sus clientes no es el sabor en abstracto, sino la fecha de tueste impresa en la bolsa y el aroma al abrir el paquete. La fricción está en el envío, que se demora más de lo prometido, y en el precio, que se justifica solo cuando el cliente ya probó.',
  senal: 'media',
  notaSenal:
    '12 reseñas propias: suficiente para ver un patrón claro en frescura y en envío, corto para sostener conclusiones sobre el precio.',
  elogios: [
    {
      tema: 'Frescura verificable',
      que: 'Repiten la fecha de tueste impresa y el aroma al abrir la bolsa, no la frescura como promesa.',
      indices: [1, 4, 8, 10],
      menciones: 4,
    },
    {
      tema: 'Atención que resuelve la compra',
      que: 'Escriben por WhatsApp con dudas concretas de cafetera o molienda y les responden rápido.',
      indices: [6, 9],
      menciones: 2,
    },
    {
      tema: 'Consistencia entre pedidos',
      que: 'Clientes recurrentes que destacan que ningún lote les ha salido malo.',
      indices: [1, 8],
      menciones: 2,
    },
    {
      tema: 'Empaque y regalo',
      que: 'El sellado, la tarjeta a mano y la caja de tres orígenes aparecen como motivo de compra para regalar.',
      indices: [2, 7],
      menciones: 2,
    },
    {
      tema: 'Acompañamiento al principiante',
      que: 'La guía de preparación dentro del pedido convierte a quien no sabía de café.',
      indices: [6, 11],
      menciones: 2,
    },
    {
      tema: 'Sabor limpio',
      que: 'Lo describen por oposición: no sabe al café quemado del comercial.',
      indices: [4, 10],
      menciones: 2,
    },
  ],
  verbatims: [
    { texto: 'no vuelvo al café de supermercado', uso: 'titular', tema: 'Frescura verificable' },
    {
      texto: 'la bolsa trae la fecha de tueste y eso ya dice todo',
      uso: 'prueba',
      tema: 'Frescura verificable',
    },
    { texto: 'me sorprendió el aroma apenas abrí la bolsa', uso: 'titular', tema: 'Frescura verificable' },
    { texto: 'sin ese amargo quemado del café comercial', uso: 'titular', tema: 'Sabor limpio' },
    { texto: 'Se siente el trabajo detrás', uso: 'titular', tema: 'Sabor limpio' },
    { texto: 'nunca me ha llegado un lote malo', uso: 'titular', tema: 'Consistencia entre pedidos' },
    { texto: 'Uno paga la diferencia y se nota', uso: 'titular', tema: 'Precio' },
    {
      texto: 'El empaque venía perfecto, sellado y con una tarjetita escrita a mano',
      uso: 'prueba',
      tema: 'Empaque y regalo',
    },
    {
      texto: 'me respondieron en minutos con una recomendación clara',
      uso: 'prueba',
      tema: 'Atención que resuelve la compra',
    },
    {
      texto: 'venía una guía de preparación adentro',
      uso: 'prueba',
      tema: 'Acompañamiento al principiante',
    },
    { texto: 'Me dijeron 3 días y fueron 6', uso: 'prueba', tema: 'Envío' },
    {
      texto: 'avisaron por WhatsApp que había retraso de la transportadora',
      uso: 'prueba',
      tema: 'Atención que resuelve la compra',
    },
  ],
  objeciones: [
    {
      objecion: '«Me van a decir un plazo de envío y va a tardar el doble.»',
      desactivar:
        'Di el plazo real, no el optimista, y promete aviso proactivo si se pasa. Sus propios clientes ya premian eso: lo que salvó la reseña 9 fue el WhatsApp avisando, no la puntualidad.',
      indices: [3, 9, 12],
      menciones: 3,
    },
    {
      objecion: '«Es caro para ser café. En el barrio consigo por la mitad.»',
      desactivar:
        'No defiendas el precio: enseña la diferencia que ya nombran ellos. Fecha de tueste contra bolsa sin fecha, y sabor limpio contra amargo quemado. El precio deja de compararse cuando el producto deja de ser el mismo.',
      indices: [5, 12],
      menciones: 2,
    },
    {
      objecion: '«No sé de café, no voy a saber qué pedir y me voy a equivocar.»',
      desactivar:
        'Convierte el catálogo en una pregunta: qué cafetera tienes. Es literalmente lo que ya hacen por WhatsApp, y la guía dentro del pedido remata la duda después de comprar.',
      indices: [6, 11],
      menciones: 2,
    },
    {
      objecion: '«El envío me sale caro si solo quiero probar una bolsa.»',
      desactivar:
        'Umbral de envío gratis puesto justo en dos bolsas, que es lo que los clientes ya hacen por su cuenta.',
      indices: [12],
      menciones: 1,
    },
  ],
  angulos: [
    {
      nombre: 'El café que no sabe a supermercado',
      deseo: 'Dejar de conformarse con el café quemado de siempre, sin volverse un experto.',
      publico: 'Quien ya toma café a diario y sospecha que hay algo mejor pero no sabe por dónde entrar.',
      apoyo: '«no vuelvo al café de supermercado» + «sin ese amargo quemado del café comercial»',
    },
    {
      nombre: 'Frescura con fecha, no con promesa',
      deseo: 'Poder comprobar la calidad antes de creérsela.',
      publico: 'Comprador escéptico, ya decepcionado por marcas que prometen «recién tostado».',
      apoyo: 'Es el tema más mencionado, y es justo lo que le reclaman al competidor.',
    },
    {
      nombre: 'Para el que todavía no sabe de café',
      deseo: 'No hacer el ridículo pidiendo, y acertar a la primera.',
      publico: 'Principiante que acaba de comprar cafetera y no sabe qué molienda pedir.',
      apoyo: '«me respondieron en minutos con una recomendación clara» + la guía en el pedido',
    },
    {
      nombre: 'El regalo que no parece de última hora',
      deseo: 'Quedar bien con poco esfuerzo y sin que se note que fue apurado.',
      publico: 'Quien compra para otro: cumpleaños, día del padre, detalle de oficina.',
      apoyo: 'Empaque sellado, tarjeta escrita a mano y la caja de tres orígenes.',
    },
  ],
  anuncios: [
    {
      angulo: 'El café que no sabe a supermercado',
      primary:
        '«No vuelvo al café de supermercado.» Lo escribió un cliente al tercer mes. Tueste de origen con la fecha impresa en la bolsa.',
      headline: 'Sin ese amargo quemado',
      descripcion: 'Café de origen fresco',
    },
    {
      angulo: 'Frescura con fecha, no con promesa',
      primary:
        'Cada bolsa lleva impresa la fecha de tueste. No te pedimos que creas que está fresco: lo lees antes de abrirla.',
      headline: 'Frescura con fecha, no promesa',
      descripcion: 'Tostado esta semana',
    },
    {
      angulo: 'Para el que todavía no sabe de café',
      primary:
        '¿No sabes cuál pedir? Escríbenos qué cafetera tienes y te decimos cuál va. Cada pedido llega con su guía de preparación.',
      headline: 'Te decimos cuál pedir',
      descripcion: 'Guía en cada pedido',
    },
    {
      angulo: 'El regalo que no parece de última hora',
      primary:
        'Caja de tres orígenes, sellada y con tarjeta escrita a mano. El regalo que no parece comprado a última hora.',
      headline: 'Un regalo que se nota pensado',
      descripcion: 'Caja de tres orígenes',
    },
  ],
  posicionamiento: {
    tuFuerte: [
      {
        punto: 'La fecha de tueste impresa en la bolsa',
        porQue:
          'Es tu tema más mencionado y a él le reclaman exactamente lo contrario: «La bolsa no trae fecha de tueste, uno no sabe qué tan fresco está».',
      },
      {
        punto: 'Atención humana que cierra la venta',
        porQue:
          'A ti te elogian la respuesta en minutos por WhatsApp; de él dicen que «La atención por Instagram es lenta eso sí».',
      },
      {
        punto: 'Perfil de tueste claro',
        porQue: 'Su tueste lo describen como «Sabe a café de panadería». Tuyo: «El sabor es limpio».',
      },
    ],
    suFuerte: [
      {
        punto: 'Envío más rápido y más barato',
        porQue:
          'Repiten «muy barato el envío, llega en dos días» mientras a ti te reclaman demoras y coste de envío. Aquí no compitas.',
      },
      {
        punto: 'Suscripción mensual',
        porQue: 'Resuelve la recompra sin que el cliente se acuerde. Tú no tienes esa pieza.',
      },
      {
        punto: 'Tienda física para probar antes',
        porQue: 'Elimina el riesgo de la primera compra, que es justo donde tu precio pesa más.',
      },
    ],
    hueco: [
      {
        punto: 'La prueba frente a la promesa',
        porQue:
          'Él compite por precio y velocidad y ahí no le vas a ganar. Tu hueco es lo comprobable: fecha impresa, guía dentro y una persona que contesta.',
      },
      {
        punto: 'El tueste claro contra el «café de panadería»',
        porQue:
          'Nadie está ocupando esa posición en el mercado. Es una diferencia de producto que sus propios clientes ya nombran.',
      },
      {
        punto: 'Envío honesto en vez de envío rápido',
        porQue:
          'No puedes prometer dos días, pero sí puedes ser el único que avisa cuando se retrasa. Convierte tu debilidad en política declarada.',
      },
    ],
  },
  descartados: 2,
}
