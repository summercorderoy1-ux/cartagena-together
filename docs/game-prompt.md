# Cartagena Together — Build Prompt & Design

This prompt follows the downloaded repos: the design structure from
**obra/superpowers** (brainstorming → design → plan) and the prompt pattern
from **dair-ai/Prompt-Engineering-Guide** (role, context, clear instructions,
constraints, output format, success check).

---

## The prompt

**Role:** You are a game developer who makes small, charming pixel-art
browser games.

**Context:** The player wants a cozy exploration game about a couple
walking around **Cartagena, Colombia** together. It is personal and should
feel warm and romantic, not stressful.

**The couple (same height):**
- **Him:** dark blonde hair (darkish, golden-brown), fair skin, white linen
  shirt, khaki shorts.
- **Her:** light blonde hair, long, fair skin, coral sundress.

**Instructions:**
1. Build a top-down 2D pixel-art game that runs by opening `game/index.html`
   in a browser. No installs, no internet needed.
2. Recreate Cartagena in a stylised way:
   - The walled old city (Ciudad Amurallada): colourful colonial houses with
     wooden balconies and pink bougainvillea, cobbled streets, Plaza de
     Bolívar, the Cathedral, Las Bóvedas, the Torre del Reloj gate, and
     sunset on the wall at Café del Mar.
   - Getsemaní: street art and the street of hanging umbrellas.
   - Castillo San Felipe de Barajas on its hill.
   - Bocagrande's beach and tall buildings.
   - A dock with a boat (lancha) to the **Islas del Rosario**: white sand,
     palm trees, turquoise water, a hammock.
3. The player walks one character; the partner follows. A key swaps who
   leads.
4. Things to collect:
   - **Seashells** hidden on the beaches (15).
   - **Memories**: special spots where the couple takes a photo together
     (10). Each photo is a real snapshot of the screen saved into a photo
     album.
5. Friendly locals to talk to, including a **palenquera** (fruit seller in a
   bright dress with a fruit bowl on her head).
6. When everything is collected, show a romantic ending with fireworks over
   the city and the full photo album.

**Constraints:**
- Plain HTML, CSS and JavaScript only. All art drawn by code (no image files).
- Works with keyboard (arrows/WASD) and on touch screens.
- Saves progress automatically in the browser.
- Original art only; no characters or assets from existing games.

**Output format:** `game/index.html`, `game/style.css`, `game/js/*.js`.

**Success check:** a new player can start, type both names, explore every
area, collect all shells and memories, see the album, and reach the ending
without anything getting stuck.

---

## Design (superpowers style)

**Why:** a personal, cozy game about a couple's trip to Cartagena.

**Goals:** feel like Cartagena; easy and relaxing; photos feel like keepsakes.

**Non-goals:** combat, timers, losing, difficulty.

**Anti-goals:** anything frustrating — getting stuck behind walls, hidden
items that can't be reached, losing progress.

**Approaches considered:**
| Approach | Trade-off | Picked? |
|---|---|---|
| Single HTML file with canvas, art drawn in code | Opens anywhere, nothing to install; art is simpler | **Yes** |
| Game engine (Phaser) + sprite sheets | Richer, but needs a server/build and image files | No |
| 3D world (three.js) | Immersive, but much simpler characters | No |

**Calls made by the builder (change any of them):**
- Default names **Monty** and **Summer**; the player can type real names on the
  start screen.
- Two players: Monty uses **WASD + E**, Summer uses **arrows + Enter**; each moves
  independently but they stay on the same screen. **F** turns on "follow" for one player.
  **P** photo album, **M** map, **N** music on/off.
- Beach: swimming in the sea, kayaks at Bocagrande, the old-city beach and the island.
- More people: dancing (Don Rafa), arepa de huevo, coconut, coco loco, horse carriage rides,
  fishing, a sea turtle, wandering locals, and hugs between the couple.
- 10 memory spots: Torre del Reloj, Plaza de Bolívar, Las Bóvedas,
  Café del Mar sunset, Umbrella Street, Castillo San Felipe, the palenquera,
  Bocagrande beach, the island hammock, the island sandbar.
- Light cumbia-style background music made in code.
- Skin tone for him wasn't specified; drawn fair like her.
- Waiting on the player's Cartagena photo to refine colours and buildings.
