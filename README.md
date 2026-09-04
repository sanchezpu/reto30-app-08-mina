# Mina

**Investigación de Voz del Cliente para quien escribe las campañas.**

Pegas las reseñas de un negocio en crudo y Mina devuelve un informe con las palabras
exactas que usan sus clientes: qué elogian, qué frases sirven de titular, qué objeciones
hay que desactivar, qué ángulos atacan cada deseo, y los anuncios ya escritos con los
límites de Ads Manager respetados.

🔗 **En vivo:** https://app08.reto.icebergmarketingdigital.com

---

## Qué problema resuelve

El *review mining* es una técnica de copywriting conocida: el mensaje que convierte no
sale del negocio, sale del cliente. Se leen las reseñas, se extraen las palabras
literales y se le devuelven en el anuncio. Un copywriter la hace a mano y le lleva horas
por cada negocio.

Mina hace ese trabajo en un minuto y medio, y lo entrega en la forma en la que se usa
después: bloques copiables, informe imprimible y anuncios listos para pegar.

## Para quién

Para quien gestiona campañas de Meta Ads y Google Ads y necesita la investigación
**antes** de escribir la campaña, no después. También sirve para una auditoría rápida de
un prospecto: pegas sus reseñas y llegas a la reunión sabiendo qué le elogian.

## Lo que hace distinto

**Modo comparativo.** Pega además las reseñas de un competidor y el informe añade un
bloque de posicionamiento: qué te elogian a ti que a él no, dónde él es más fuerte —para
no competir ahí— y qué hueco queda libre para tu mensaje. Funciona incluso si el negocio
todavía no tiene reseñas propias: se analiza al competidor y se busca por dónde entrar.

**Los verbatims son verificados, no prometidos.** Toda la técnica se apoya en la palabra
exacta, y un modelo de lenguaje parafrasea sin querer: endereza una frase, corrige una
tilde, y lo que devuelve ya no es lo que escribió el cliente. Por eso no basta con
pedírselo. Cada cita se busca dentro de las reseñas de entrada y **se devuelve el trozo
de la fuente**, no el del modelo. La que no aparece se descarta, y el informe dice
cuántas se descartaron.

**Las frecuencias se cuentan, no se estiman.** El modelo no da números: da los índices de
las reseñas donde vio cada tema. Los conteos los hace el servidor sobre índices
validados. No hay forma de que aparezca un «68 % de los clientes» que nadie contó.

**Dice cuándo no sabe.** Si el corpus es corto para sostener una conclusión, lo declara en
la cabecera del informe como señal débil en vez de fabricar un hallazgo.

## Cómo se usa

1. Pega las reseñas tal como las copias de Google Maps, TripAdvisor o Amazon. Sin formato.
2. Opcionalmente, el nombre del negocio y las reseñas de un competidor.
3. Analizar. Tarda entre 30 y 90 segundos.
4. Copia por bloques o entero, imprime el informe, o comparte el enlace.

El enlace lleva el informe entero comprimido dentro de la URL. No hay base de datos: quien
abra el enlace ve exactamente el mismo informe, sin cuentas y sin instalar nada.

## Stack

| Pieza | Elección |
|---|---|
| Frontend | Vite + React 18 + TypeScript + Tailwind |
| Iconos | lucide-react |
| Compartir | lz-string, el informe viaja en el hash de la URL |
| API | Node 22, **cero dependencias** (`node:http`, `node:https`) |
| Análisis | OpenRouter, modelo configurable por variable de entorno |
| Persistencia | ninguna |

La API es un solo archivo sin `node_modules`. Corre como contenedor `node:22-alpine` sobre
un bind mount y nginx la alcanza por nombre en la red interna; no publica puertos.

## Desarrollo

```bash
npm install
npm run dev          # frontend en :5173, con proxy de /api a :3008
npm run api          # API en :3008  (necesita OPENROUTER_API_KEY)
```

Configuración: copia `.env.example` y rellena `OPENROUTER_API_KEY`.

## Pruebas

```bash
# Las dos barandillas del servidor, sin gastar una llamada al modelo:
# se le da una respuesta falsa con una cita inventada dentro y se
# comprueba que la descarta.
node herramientas/probar-barandillas.mjs

# El informe de ejemplo cumple la regla que la app promete:
# cada verbatim está literalmente en las reseñas de ejemplo.
node herramientas/verificar-demo.mjs

# Prueba de aceptación contra la API real.
node herramientas/probar-verbatims.mjs \
  https://app08.reto.icebergmarketingdigital.com/api/analizar \
  resenas.txt competidor.txt "Nombre del negocio"
```

La segunda comprueba la literalidad con `corpus.includes(cita)` a secas, **a propósito**:
si reutilizara la función del servidor, un fallo en esa función haría pasar la prueba y
fallar la aplicación. La comprobación más tonta posible es la única que no puede mentir.

## Límites conocidos

- 5 análisis por hora y por IP.
- 60.000 caracteres por campo, unas 300 reseñas largas.
- Un informe muy grande puede no caber en un enlace compartible; la app lo avisa y
  ofrece copiarlo en vez de generar una URL rota.
- La calidad del informe depende de la calidad de las reseñas: cinco reseñas de una línea
  dan una señal débil, y Mina lo dice en vez de disimularlo.
