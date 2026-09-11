// Each state controls what a click means.
const STATE = { IDLE: "idle", WAITING: "waiting", READY: "ready", RESULT: "result" };
let gameState = STATE.IDLE;
let signalTime = 0;
let waitTimer = null;

const gameArea = document.querySelector("#gameArea");
const statusText = document.querySelector("#status");
const nukoImage = document.querySelector("#nukoImage");
const secondsText = document.querySelector("#seconds");
const millisecondsText = document.querySelector("#milliseconds");
const startButton = document.querySelector("#startButton");
const lastScore = document.querySelector("#lastScore");
const bestScore = document.querySelector("#bestScore");

const waitingImage = "nuko-waiting.gif";
const clickImage = "nuko-click.gif";

// The best score stays saved in this browser.
const savedBest = Number(localStorage.getItem("nukoQuickBest"));
if (savedBest > 0) bestScore.textContent = `${savedBest} ms`;

function setImage(src, alt) {
  nukoImage.src = src;
  nukoImage.alt = alt;
}

function beginGame() {
  clearTimeout(waitTimer);
  gameState = STATE.WAITING;
  gameArea.classList.remove("ready", "too-early");
  statusText.textContent = "WAIT FOR NUKO...";
  setImage(waitingImage, "Three little pixel cats waiting");
  secondsText.textContent = "0.00 s";
  millisecondsText.textContent = "Don't click yet!";
  startButton.hidden = true;

  // Pick a random delay from two to five seconds.
  const randomDelay = 2000 + Math.random() * 3000;
  waitTimer = setTimeout(showClickSignal, randomDelay);
}

function showClickSignal() {
  gameState = STATE.READY;
  gameArea.classList.add("ready");
  statusText.textContent = "CLICK!!!";
  setImage(clickImage, "A surprised pixel cat — click now!");
  millisecondsText.textContent = "NOW! NOW! NOW!";
  signalTime = performance.now();
}

function reactionRank(milliseconds) {
  if (milliseconds < 180) return "LIGHTNING PAW!";
  if (milliseconds < 260) return "SUPER SPEEDY!";
  if (milliseconds < 400) return "NICE REFLEXES!";
  return "SLEEPY KITTY...";
}

function recordReaction() {
  const reactionMs = Math.round(performance.now() - signalTime);
  const reactionSeconds = (reactionMs / 1000).toFixed(2);

  gameState = STATE.RESULT;
  gameArea.classList.remove("ready");
  statusText.textContent = reactionRank(reactionMs);
  secondsText.textContent = `${reactionSeconds} s`;
  millisecondsText.textContent = `${reactionMs} milliseconds`;
  lastScore.textContent = `${reactionMs} ms`;
  startButton.textContent = "↻ PLAY AGAIN";
  startButton.hidden = false;

  const currentBest = Number(localStorage.getItem("nukoQuickBest"));
  if (!currentBest || reactionMs < currentBest) {
    localStorage.setItem("nukoQuickBest", reactionMs);
    bestScore.textContent = `${reactionMs} ms`;
    statusText.textContent = "★ NEW BEST SCORE! ★";
  }
}

function falseStart() {
  clearTimeout(waitTimer);
  gameState = STATE.RESULT;
  gameArea.classList.add("too-early");
  statusText.textContent = "TOO EARLY!";
  secondsText.textContent = "--.-- s";
  millisecondsText.textContent = "You startled Nuko!";
  startButton.textContent = "↻ TRY AGAIN";
  startButton.hidden = false;
  setTimeout(() => gameArea.classList.remove("too-early"), 350);
}

function handleGameAreaClick() {
  if (gameState === STATE.WAITING) falseStart();
  else if (gameState === STATE.READY) recordReaction();
}

startButton.addEventListener("click", beginGame);
gameArea.addEventListener("pointerdown", handleGameAreaClick);
gameArea.addEventListener("keydown", (event) => {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    handleGameAreaClick();
  }
});

// Supported AI browsers can start the same visible game round.
if (document.modelContext?.registerTool) {
  try {
    Promise.resolve(document.modelContext.registerTool({
      name: "start_reaction_round",
      title: "Start reaction round",
      description: "Start a new Nuko Quick round using the page's Start action.",
      inputSchema: { type: "object", properties: {}, additionalProperties: false },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      execute() {
        beginGame();
        return { status: "waiting", instruction: "Wait for Nuko to change, then click the game area." };
      }
    })).catch(() => {});
  } catch (_) {
    // The game still works normally if that browser feature is unavailable.
  }
}
