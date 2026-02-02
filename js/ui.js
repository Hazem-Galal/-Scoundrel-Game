import { CARD_TYPES, MAX_HEALTH, valueToLabel } from "./state.js";

const selectors = {
  healthFill: "#healthFill",
  healthText: "#healthText",
  weaponValue: "#weaponValue",
  weaponLast: "#weaponLast",
  turnCount: "#turnCount",
  deckCount: "#deckCount",
  discardCount: "#discardCount",
  avoidState: "#avoidState",
  roomGrid: "#roomGrid",
  roomHint: "#roomHint",
  logBody: "#logBody",
  statusText: "#statusText",
};

const getEl = (selector) => document.querySelector(selector);

const renderHud = (state) => {
  const healthFill = getEl(selectors.healthFill);
  const healthText = getEl(selectors.healthText);
  const percent = Math.max(0, (state.health / state.maxHealth) * 100);
  healthFill.style.width = `${percent}%`;
  healthFill.parentElement.setAttribute("aria-valuenow", String(state.health));
  healthText.textContent = `${state.health} / ${state.maxHealth}`;

  const weaponValue = getEl(selectors.weaponValue);
  if (state.weapon) {
    weaponValue.innerHTML = `<span class="suit ${suitClass(state.weapon.suit)}">${state.weapon.suit}</span>${valueToLabel(state.weapon.value)}`;
  } else {
    weaponValue.textContent = "—";
  }
  const last = state.weapon ? state.weapon.lastDefeated : null;
  getEl(selectors.weaponLast).textContent = last ? valueToLabel(last) : "—";

  getEl(selectors.turnCount).textContent = String(state.turn);
  getEl(selectors.deckCount).textContent = String(state.deck.length);
  getEl(selectors.discardCount).textContent = String(state.discard.length);
  getEl(selectors.avoidState).textContent = state.canAvoid ? "Ready" : "Used";

  const statusText = getEl(selectors.statusText);
  statusText.textContent = state.status === "ended" ? "Game ended" : "";
};

const cardTypeLabel = (card) => {
  switch (card.type) {
    case CARD_TYPES.monster:
      return "Monster";
    case CARD_TYPES.weapon:
      return "Weapon";
    case CARD_TYPES.potion:
      return "Potion";
    default:
      return "Card";
  }
};

const suitClass = (suit) => {
  switch (suit) {
    case "♣":
      return "suit--club";
    case "♠":
      return "suit--spade";
    case "♦":
      return "suit--diamond";
    case "♥":
      return "suit--heart";
    default:
      return "";
  }
};

const getCardArt = (card) => {
  if (card.type === CARD_TYPES.potion) {
    return "assets/heart.jpg";
  }

  if (card.type === CARD_TYPES.monster) {
    const tier = card.value <= 5 ? 1 : card.value <= 10 ? 2 : 3;
    return card.suit === "♣" ? `assets/club-${tier}.jpg` : `assets/spade-${tier}.jpg`;
  }

  if (card.type === CARD_TYPES.weapon) {
    const tier = card.value <= 4 ? 1 : card.value <= 7 ? 2 : 3;
    return `assets/diamond-${tier}.jpg`;
  }

  return null;
};

const buildCardElement = (card, index, { disabled = false, carried = false } = {}) => {
  const button = document.createElement("button");
  button.className = `card card--${card.type} ${carried ? "card--carried" : ""}`.trim();
  button.type = "button";
  button.dataset.index = String(index);
  button.setAttribute("role", "listitem");
  button.setAttribute("aria-label", `${cardTypeLabel(card)} ${card.suit}${valueToLabel(card.value)}`);
  button.setAttribute("aria-disabled", String(disabled));
  button.disabled = disabled;

  const art = getCardArt(card);
  if (art) {
    button.classList.add("card--art");
    button.style.setProperty("--card-image", `url('${art}')`);
  }

  const face = document.createElement("div");
  face.className = "card__face";

  const header = document.createElement("div");
  header.className = "card__header";
  header.innerHTML = `<span class="suit ${suitClass(card.suit)}">${card.suit}</span><span>${cardTypeLabel(card)}</span>`;

  const value = document.createElement("div");
  value.className = "card__value";
  value.textContent = valueToLabel(card.value);

  const footer = document.createElement("div");
  footer.className = "card__type";
  footer.textContent = card.type;

  face.append(header, value, footer);
  button.append(face);

  return button;
};

const renderRoom = (state, { interactive = true } = {}) => {
  const roomGrid = getEl(selectors.roomGrid);
  roomGrid.innerHTML = "";

  state.room.forEach((card, index) => {
    const isCarried = state.carriedCard && card.id === state.carriedCard.id;
    const el = buildCardElement(card, index, { disabled: !interactive, carried: isCarried });
    roomGrid.appendChild(el);
    requestAnimationFrame(() => el.classList.add("is-revealed"));
  });

  const roomHint = getEl(selectors.roomHint);
  if (state.phase === "choice") {
    roomHint.textContent = state.canAvoid ? "Choose to avoid or face the room." : "Avoid used. Face the room.";
  } else {
    roomHint.textContent = "Choose three cards to resolve. One carries forward.";
  }
};

const appendLog = (message) => {
  const logBody = getEl(selectors.logBody);
  const entry = document.createElement("div");
  entry.className = "log__entry";
  entry.textContent = message;
  logBody.prepend(entry);
};

const renderLog = (state) => {
  const logBody = getEl(selectors.logBody);
  logBody.innerHTML = "";
  state.log.slice().reverse().forEach((entry) => appendLog(entry));
};

const clearLog = () => {
  getEl(selectors.logBody).innerHTML = "";
};

const showEndDialog = (summary) => {
  const dialog = document.querySelector("#endDialog");
  const summaryEl = document.querySelector("#endSummary");
  summaryEl.textContent = summary;
  if (!dialog.open) {
    dialog.showModal();
  }
};

const closeDialog = (dialog) => {
  if (dialog.open) dialog.close();
};

const applyButtonState = (state) => {
  const avoidBtn = document.querySelector("#avoidBtn");
  const faceBtn = document.querySelector("#faceBtn");
  avoidBtn.disabled = !state.canAvoid || state.status !== "playing" || state.phase !== "choice";
  faceBtn.disabled = state.status !== "playing" || state.phase !== "choice";
};

const announceStatus = (text) => {
  const statusText = getEl(selectors.statusText);
  statusText.textContent = text;
};

const clearRoomSelections = () => {
  const roomGrid = getEl(selectors.roomGrid);
  if (!roomGrid) return;

  roomGrid.querySelectorAll(".card.is-selected").forEach((card) => {
    card.classList.remove("is-selected");
  });

  roomGrid.querySelectorAll(".card[aria-pressed='true']").forEach((card) => {
    card.setAttribute("aria-pressed", "false");
  });

  const active = document.activeElement;
  if (active && roomGrid.contains(active)) {
    active.blur();
  }
};

export {
  appendLog,
  applyButtonState,
  announceStatus,
  clearRoomSelections,
  clearLog,
  closeDialog,
  renderHud,
  renderLog,
  renderRoom,
  showEndDialog,
};
