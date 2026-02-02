import {
  CARD_TYPES,
  MAX_HEALTH,
  clearState,
  computeLossScore,
  createInitialState,
  loadState,
  saveState,
  valueToLabel,
} from "./state.js";
import {
  appendLog,
  applyButtonState,
  announceStatus,
  clearLog,
  closeDialog,
  renderHud,
  renderLog,
  renderRoom,
  showEndDialog,
} from "./ui.js";

let state = null;
let remainingSelections = 3;

const pushLog = (message) => {
  state.log.push(message);
  appendLog(message);
};

const resetRoomState = () => {
  remainingSelections = 3;
  state.usedPotion = false;
};

const drawToRoom = () => {
  state.room = [];
  if (state.carriedCard) {
    state.room.push(state.carriedCard);
    state.carriedCard = null;
  }
  while (state.room.length < 4 && state.deck.length > 0) {
    state.room.push(state.deck.shift());
  }
};

const startRoom = () => {
  if (state.room.length === 0) {
    drawToRoom();
  }
  state.phase = "choice";
  resetRoomState();
};

const canWeaponDefeat = (monster) => {
  if (!state.weapon) return false;
  const last = state.weapon.lastDefeated ?? Infinity;
  // Non-increasing rule example: weapon defeats 9 then can only defeat 9 or lower.
  return monster.value <= last;
};

const resolveMonster = (monster) => {
  if (!state.weapon) {
    state.health -= monster.value;
    pushLog(`Took ${monster.value} damage (no weapon).`);
    return;
  }

  if (!canWeaponDefeat(monster)) {
    state.health -= monster.value;
    pushLog(`Weapon too weak, took ${monster.value} damage.`);
    return;
  }

  const damage = Math.max(0, monster.value - state.weapon.value);
  if (damage > 0) {
    state.health -= damage;
    pushLog(`Blocked with ${state.weapon.suit}${valueToLabel(state.weapon.value)}, took ${damage} damage.`);
  } else {
    pushLog(`Defeated ${monster.suit}${valueToLabel(monster.value)} with weapon.`);
  }
  state.weapon.lastDefeated = monster.value;
  state.weaponStack.push(monster);
};

const resolveWeapon = (weapon) => {
  state.weapon = { ...weapon, lastDefeated: null };
  state.weaponStack = [];
  pushLog(`Equipped ${weapon.suit}${valueToLabel(weapon.value)}.`);
};

const resolvePotion = (potion) => {
  // Potion restriction example: only the first potion in a room heals. Others are discarded.
  if (state.usedPotion) {
    pushLog(`Discarded extra potion ${potion.suit}${valueToLabel(potion.value)}.`);
    return;
  }
  const before = state.health;
  state.health = Math.min(MAX_HEALTH, state.health + potion.value);
  const healed = state.health - before;
  state.usedPotion = true;
  pushLog(`Healed ${healed} with ${potion.suit}${valueToLabel(potion.value)}.`);
};

const resolveCard = (card) => {
  switch (card.type) {
    case CARD_TYPES.weapon:
      resolveWeapon(card);
      break;
    case CARD_TYPES.potion:
      resolvePotion(card);
      break;
    case CARD_TYPES.monster:
      resolveMonster(card);
      break;
    default:
      break;
  }
  state.discard.push(card);
};

const endGameIfNeeded = () => {
  if (state.health <= 0) {
    state.status = "ended";
    const score = computeLossScore(state);
    showEndDialog(`You fell in the dungeon. Score: ${score}.`);
    pushLog(`Defeat. Score ${score}.`);
    return true;
  }
  if (state.deck.length === 0 && state.room.length === 0) {
    state.status = "ended";
    const score = state.health;
    showEndDialog(`You cleared the dungeon! Score: ${score}.`);
    pushLog(`Victory! Score ${score}.`);
    return true;
  }
  return false;
};

const persist = () => {
  saveState(state);
};

const renderAll = () => {
  renderHud(state);
  renderRoom(state, { interactive: state.status === "playing" && state.phase === "resolving" });
  applyButtonState(state);
  persist();
};

const handleFaceRoom = () => {
  if (state.status !== "playing") return;
  if (state.phase !== "choice") return;
  state.canAvoid = true;
  startRoom();
  state.phase = "resolving";
  renderAll();
  announceStatus("Select three cards to resolve.");
};

const handleAvoidRoom = () => {
  if (!state.canAvoid || state.status !== "playing") return;
  if (state.phase !== "choice") return;
  if (state.room.length === 0) {
    drawToRoom();
  }
  state.deck.push(...state.room);
  state.room = [];
  state.turn += 1;
  state.canAvoid = false;
  state.phase = "choice";
  pushLog("Avoided the room.");
  drawToRoom();
  resetRoomState();
  renderAll();
};

const handleRoomSelection = (index) => {
  if (state.status !== "playing") return;
  if (state.phase !== "resolving") return;
  if (remainingSelections <= 0) return;
  const card = state.room[index];
  if (!card) return;

  resolveCard(card);
  state.room.splice(index, 1);
  remainingSelections -= 1;

  if (remainingSelections === 0) {
    if (state.room.length === 1) {
      state.carriedCard = state.room[0];
      state.room = [];
    }
    state.turn += 1;
    state.canAvoid = true;
    state.phase = "choice";
    drawToRoom();
    resetRoomState();
  }

  if (!endGameIfNeeded()) {
    renderAll();
  }
};

const handleNewGame = () => {
  state = createInitialState();
  clearLog();
  state.log = [];
  pushLog("New game started.");
  drawToRoom();
  renderAll();
};

const handleRestart = () => {
  const saved = loadState();
  if (saved) {
    state = saved;
    renderLog(state);
    renderAll();
    announceStatus("Game restored from last session.");
    return;
  }
  handleNewGame();
};

const init = () => {
  const saved = loadState();
  state = saved || createInitialState();
  if (!saved) {
    pushLog("Welcome to Scoundrel.");
  }
  if (state.room.length === 0 && state.status === "playing") {
    drawToRoom();
  }
  renderLog(state);
  renderAll();

  document.querySelector("#faceBtn").addEventListener("click", handleFaceRoom);
  document.querySelector("#avoidBtn").addEventListener("click", handleAvoidRoom);
  document.querySelector("#newGameBtn").addEventListener("click", () => {
    clearState();
    handleNewGame();
  });
  document.querySelector("#restartBtn").addEventListener("click", handleRestart);
  document.querySelector("#clearLogBtn").addEventListener("click", clearLog);

  const helpDialog = document.querySelector("#helpDialog");
  document.querySelector("#helpBtn").addEventListener("click", () => helpDialog.showModal());
  document.querySelectorAll("[data-close-modal]").forEach((btn) => {
    btn.addEventListener("click", () => closeDialog(helpDialog));
  });

  const endDialog = document.querySelector("#endDialog");
  document.querySelector("[data-end-restart]").addEventListener("click", () => {
    closeDialog(endDialog);
    clearState();
    handleNewGame();
  });

  document.querySelector("#roomGrid").addEventListener("click", (event) => {
    const button = event.target.closest("button.card");
    if (!button) return;
    handleRoomSelection(Number(button.dataset.index));
  });

  document.querySelector("#roomGrid").addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    const button = event.target.closest("button.card");
    if (!button) return;
    event.preventDefault();
    handleRoomSelection(Number(button.dataset.index));
  });
};

init();
