# Scoundrel — Solo Card Dungeon

## Game Overview
Scoundrel is a solo dungeon-crawl card game where you manage health, equip weapons, and survive monsters to clear a shuffled dungeon deck.

## Rules Summary
- **Health** starts at 20 (max 20).
- **Deck** uses 44 cards:
  - Monsters: all ♣ and ♠ (2–10, J=11, Q=12, K=13, A=14)
  - Weapons: ♦ 2–10
  - Potions: ♥ 2–10
- **Room**: draw until 4 cards are visible.
  - **Avoid**: place all 4 cards on the bottom (not twice in a row).
  - **Face**: resolve 3 cards in any order; the 4th carries forward.

### Card Resolution
- **Weapon (♦)**: Equip immediately and discard any previous weapon stack.
- **Potion (♥)**: Heal by value up to 20. Only one potion per room heals.
- **Monster (♣/♠)**:
  - Bare-handed: take full value damage.
  - With weapon: damage = monster value − weapon value (min 0).
  - Weapon rule: you can only defeat monsters with value ≤ the last defeated monster value.

### Ending & Scoring
- **Win**: deck cleared → score = remaining health.
- **Loss**: health ≤ 0 → score = negative sum of remaining monster values in the deck.

## How to Run
Open [index.html](index.html) in a browser. No build step or server required.

## File Responsibilities
- [index.html](index.html): App structure, HUD, room grid, controls, modals.
- [styles.css](styles.css): Theme, layout, cards, animations, accessibility.
- [js/state.js](js/state.js): Deck setup, shuffle, persistence helpers.
- [js/ui.js](js/ui.js): Rendering UI and log.
- [js/main.js](js/main.js): Game logic, rules enforcement, event handling.
