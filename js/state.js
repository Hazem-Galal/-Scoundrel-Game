const STORAGE_KEY = "scoundrel-game-state";
const MAX_HEALTH = 20;

const SUITS = {
  clubs: "♣",
  spades: "♠",
  diamonds: "♦",
  hearts: "♥",
};

const CARD_TYPES = {
  monster: "monster",
  weapon: "weapon",
  potion: "potion",
};

const VALUE_LABELS = {
  11: "J",
  12: "Q",
  13: "K",
  14: "A",
};

const valueToLabel = (value) => VALUE_LABELS[value] || String(value);

const buildDeck = () => {
  const deck = [];
  const addCard = (type, suit, value) => {
    deck.push({
      id: crypto.randomUUID(),
      type,
      suit,
      value,
      label: valueToLabel(value),
    });
  };

  for (let value = 2; value <= 14; value += 1) {
    addCard(CARD_TYPES.monster, SUITS.clubs, value);
    addCard(CARD_TYPES.monster, SUITS.spades, value);
  }

  for (let value = 2; value <= 10; value += 1) {
    addCard(CARD_TYPES.weapon, SUITS.diamonds, value);
    addCard(CARD_TYPES.potion, SUITS.hearts, value);
  }

  return deck;
};

const shuffleDeck = (deck, seed = null) => {
  let rand = Math.random;
  if (seed !== null) {
    let t = seed >>> 0;
    rand = () => {
      t += 0x6d2b79f5;
      let r = t;
      r = Math.imul(r ^ (r >>> 15), r | 1);
      r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
      return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
    };
  }
  for (let i = deck.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
};

const createInitialState = (seed = null) => {
  const deck = shuffleDeck(buildDeck(), seed);
  return {
    seed,
    maxHealth: MAX_HEALTH,
    health: MAX_HEALTH,
    weapon: null,
    weaponStack: [],
    room: [],
    carriedCard: null,
    deck,
    discard: [],
    turn: 1,
    canAvoid: true,
    usedPotion: false,
    phase: "choice",
    status: "playing",
    log: [],
  };
};

const saveState = (state) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
};

const loadState = () => {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (error) {
    return null;
  }
};

const clearState = () => {
  localStorage.removeItem(STORAGE_KEY);
};

const valueSum = (cards) => cards.reduce((sum, card) => sum + card.value, 0);

const computeLossScore = (state) => {
  const remainingMonsters = state.deck.filter((card) => card.type === CARD_TYPES.monster);
  return -valueSum(remainingMonsters);
};

export {
  CARD_TYPES,
  MAX_HEALTH,
  SUITS,
  STORAGE_KEY,
  buildDeck,
  clearState,
  computeLossScore,
  createInitialState,
  loadState,
  saveState,
  shuffleDeck,
  valueToLabel,
};
