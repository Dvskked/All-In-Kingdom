# ♠ All-In Kingdom · El Imperio del Casino

Un juego de casino completo en JavaScript puro (sin frameworks), que se juega directamente en el navegador con un doble clic en `index.html`. De un pueblito polvoriento al trono de **Las Vegas**: gana oro en el **Póker Texas Hold'em multijugador (5+ rivales)** y en el **Blackjack**, viaja entre 12 ciudades casino y despluma a celebridades de todo el mundo.

## 🎮 Características

- **Póker Texas Hold'em multijugador** con *side pots*, *all-in* parcial, faroles y ciegas que suben cada 8 manos.
- **Blackjack** de 6 barajas, doblar, blackjack natural (3:2) y croupieri con "la Casa".
- **Apuestas de caballos (hipódromo)**: elige caballo, cuota y a correr; pagos por *ganador* y por *colocado* (top 3).
- **12 ciudades** (Villa Fichas → Puerto Azar → Madrid → Cartagena de Indias → Monte Carlo → Tokio → Moscú → Dubái → Nueva York → Vancouver → Macao → Las Vegas) con casinos y mesas de entrada barata (100 de oro inicial).
- **Cada ciudad con su propia mesa**, con paño de distinto color y marca de agua (Tokio, Las Vegas y otras de **morado**).
- **Personajes 3D con rostros dibujados (SVG)**: 14 tonos de piel, decenas de peinados, ojos, bocas y accesorios por personaje.
- **Sonido sintetizado** (Web Audio, sin ficheros): fichas, cartas, victorias y carreras. Botón de *mute* flotante.
- **Antitrampas básico**: bloqueo de recarga (F5, Ctrl+R, Ctrl+F5), menú contextual y atajos de DevTools + aviso si se abren las herramientas de desarrollo.
- **Famosos de todos los rincones** como rivales: Shakira, Sofía Vergara, Rosalía, el tándem ruso del tenis, Jackie Chan, Bruce Lee, Taylor Swift, el Rey del Pop, Céline Dion, Elvis... (todos parodias con nombre alterado).
- **Perfil con tu foto** (recortada automáticamente) o un **personaje generado** que se muestra en mesa y en el HUD.
- **Mesa de lujo** estilo *Governor of Poker 2*: paño estampado, rail de madera, remaches dorados y **pilas de fichas visibles** en cada asiento.
- IA rival con **equity real**, 4 personalidades (fácil, medio, difícil, agresivo) y frases de victoria/derrota.
- Progreso guardado automáticamente (recomendado: abrir con un navegador moderno).

## 🚀 Cómo jugar

1. Descarga o clona el repositorio.
2. Abre `index.html` en tu navegador (Chrome, Edge, Firefox... recomendable el más nuevo). No hace falta servidor.
3. Crea tu jugador, elige oro inicial y ¡a sentarse a la mesa!

Todos los ficheros son locales: el juego funciona sin conexión y sin instalar nada.

## 🛠️ Pila técnica

- **Vanilla JavaScript** (ES6) organizado por módulos en `js/`:
  - `deck.js` — baraja, reparto y evaluador de manos (7 cartas).
  - `poker.js` — motor Texas Hold'em multijugador (apuestas, side pots, subasta).
  - `blackjack.js` — motor completo de Blackjack.
  - `horses.js` — motor del hipódromo (cuotas, simulación de carrera y pagos).
  - `sound.js` — sonidos sintetizados con Web Audio (sin ficheros).
  - `guard.js` — disuasores antitrampas (bloqueo de recarga/DevTools).
  - `ai.js` — IA con probabilidad y 4 personalidades.
  - `progression.js` — ciudades, casinos, mesas, 40+ personajes, temas de mesa y guardado.
  - `characters.js` — generador de caras SVG + personajes animados (CSS 3D).
  - `ui.js` — cartas animadas, fichas, partículas, modales, guía de manos y guía de Blackjack.
  - `game.js` — controlador de pantallas y partidas.
- **CSS puro** (sin preprocesador), animaciones 3D de cartas y personajes.
- **Google Fonts** (Cinzel + Inter) — opcional: si no hay red, se usa tipografía del sistema.

## 🧪 Pruebas

La lógica (baraja, evaluador, motores de póker y blackjack, progresión y personajes) tiene una suite de *smoke tests* ejecutable con Node:

```bash
node ak_test.js   # requiere Node ≥ 12, sin dependencias
```

El test comprueba conservación de fichas en manos multijugador, side pots, 200 rondas de blackjack, 40 carreras de caballos con orden válido, desbloqueo de las 12 ciudades, temas de mesa y generación de rostros. También se realizan pruebas headless con `msedge --headless --dump-dom` para verificar el flujo completo de la interfaz sin errores de consola.

## 🗺️ Progresión

| Ciudad | Desbloquea con |
|---|---|
| Villa Fichas | 0 🪙 |
| Puerto Azar | 1.500 🪙 |
| Madrid | 3.500 🪙 |
| Cartagena de Indias | 6.000 🪙 |
| Monte Carlo | 10.000 🪙 |
| Tokio | 30.000 🪙 |
| Moscú | 40.000 🪙 |
| Dubái | 50.000 🪙 |
| Nueva York | 90.000 🪙 |
| Vancouver | 110.000 🪙 |
| Macao | 150.000 🪙 |
| Las Vegas | 200.000 🪙 |

## 📝 Advertencias

- Juego de **+18** con **oro ficticio sin valor real**.
- Las celebridades son **parodias**: nombres, títulos y frases están alterados. Cualquier parecido con la realidad es un farol.
- La protección antitrampas (`guard.js`) es **solo disuasoria**: bloquea atajos y avisa de DevTools en el navegador, pero ninguna defensa de cliente es infalible frente a un usuario experto.

---
Hecho con ♠ para pasar el rato y vaciar los bolsillos del Rey.