const KIOSK_CONFIG = {
  exhibit: "seahorse",
  idleResetMs: 90000,
  maxBubbles: 16,
  maxFish: 6,
  screens: {
    home: "homeScreen",
    challenge: "challengeScreen",
    playground: "playgroundScreen",
    game: "gameScreen"
  },
  challengeModes: ["explorer", "detective", "scientist"],
  futureExhibits: ["octopus", "shark", "jellyfish", "turtle", "rays"]
};

const MISSION_ASSET_PATH = "missions/seahorse-super-spy/assets";

const homeScreen = document.getElementById(KIOSK_CONFIG.screens.home);
const challengeScreen = document.getElementById(KIOSK_CONFIG.screens.challenge);
const playgroundScreen = document.getElementById(KIOSK_CONFIG.screens.playground);
const gameScreen = document.getElementById(KIOSK_CONFIG.screens.game);
const missionApp = document.getElementById("missionApp");
const gameBackButton = document.getElementById("gameBackButton");
const challengeHomeButton = document.getElementById("challengeHomeButton");
const playgroundBackButton = document.getElementById("playgroundBackButton");
const bubbleLayer = document.getElementById("bubbleLayer");
const fishLayer = document.querySelector(".distant-fish-layer");
const startButton = document.getElementById("altStartButton");
const seahorseButton = document.getElementById("seahorseButton");
const junoButton = document.getElementById("junoButton");
const junoImage = document.getElementById("junoImage");
const seaFriends = [...document.querySelectorAll("[data-friend]")];

let idleTimer = 0;
let camouflageTimer = 0;
let junoLaughTimer = 0;
let lastClickBubbleAt = 0;
const friendTimers = new Map();
let currentScreen = "home";

function switchScreen(nextScreen) {
  currentScreen = nextScreen;
  homeScreen.classList.toggle("is-active", nextScreen === "home");
  challengeScreen.classList.toggle("is-active", nextScreen === "challenge");
  playgroundScreen.classList.toggle("is-active", nextScreen === "playground");
  gameScreen.classList.toggle("is-active", nextScreen === "game");
  if (nextScreen === "home") {
    startButton.classList.remove("is-starting");
    missionApp.innerHTML = "";
  } else {
    if (bubbleLayer) bubbleLayer.innerHTML = "";
    if (fishLayer) fishLayer.innerHTML = "";
  }
  if (nextScreen !== "challenge") {
    resetJunoLaugh();
  }
  resetIdleTimer();
}

function resetIdleTimer() {
  window.clearTimeout(idleTimer);
  idleTimer = window.setTimeout(() => switchScreen("home"), KIOSK_CONFIG.idleResetMs);
}

function handleMissionActivity(event) {
  const frame = missionApp.querySelector("iframe");
  if (!frame || event.source !== frame.contentWindow) {
    return;
  }

  if (event.data?.type === "seahorse:activity") {
    resetIdleTimer();
  }

  if (event.data?.type === "seahorse:idleTimeout") {
    switchScreen("home");
  }
}

function handlePlaygroundShortcut(event) {
  if (currentScreen !== "challenge" || !event.shiftKey || event.code !== "Space") {
    return;
  }

  event.preventDefault();
  switchScreen("playground");
}

function createBubble() {
  if (currentScreen !== "home" || !bubbleLayer) {
    return;
  }

  if (bubbleLayer.childElementCount >= KIOSK_CONFIG.maxBubbles) {
    return;
  }

  const bubble = document.createElement("span");
  const size = randomBetween(14, 42);
  bubble.className = "bubble";
  bubble.setAttribute("aria-label", "Bubble");
  bubble.style.setProperty("--x", `${randomBetween(3, 96)}vw`);
  bubble.style.setProperty("--size", `${size}px`);
  bubble.style.setProperty("--dur", `${randomBetween(9, 15)}s`);
  bubble.style.setProperty("--drift", `${randomBetween(-7, 7)}vw`);

  bubble.addEventListener("pointerdown", (event) => {
    event.stopPropagation();
    popBubble(bubble);
    resetIdleTimer();
  });
  bubble.addEventListener("click", (event) => {
    event.stopPropagation();
    popBubble(bubble);
    resetIdleTimer();
  });

  bubble.addEventListener("animationend", () => bubble.remove(), { once: true });
  bubbleLayer.appendChild(bubble);
}

function popBubble(bubble) {
  bubble.classList.add("is-popped");
  window.setTimeout(() => bubble.remove(), 260);
}

function makeClickBubbles(event) {
  if (event.pointerType === "mouse" && event.button !== 0) return;
  const now = Date.now();
  if (event.type === "click" && now - lastClickBubbleAt < 120) return;
  lastClickBubbleAt = now;
  const layer = document.querySelector(".click-bubbles") || document.body.appendChild(Object.assign(document.createElement("div"), { className: "click-bubbles" }));
  for (let i = 0; i < 3; i += 1) {
    const bubble = document.createElement("img");
    bubble.src = "missions/seahorse-super-spy/assets/click-bubble.png";
    bubble.alt = "";
    bubble.className = "click-bubble";
    const size = 12 + Math.random() * 20;
    bubble.style.cssText = `left:${event.clientX - size / 2 + (Math.random() - 0.5) * 24}px;top:${event.clientY - size / 2 + (Math.random() - 0.5) * 16}px;width:${size}px;--drift:${(Math.random() - 0.5) * 60}px;--rise:${75 + Math.random() * 75}px;--spin:${(Math.random() - 0.5) * 45}deg;--bubble-time:${1.35 + Math.random() * 0.65}s;--bubble-delay:${i * 0.05}s`;
    layer.appendChild(bubble);
    bubble.addEventListener("animationend", () => bubble.remove(), { once: true });
  }
}

function createFish() {
  if (currentScreen !== "home" || !fishLayer) {
    return;
  }

  if (fishLayer.childElementCount >= KIOSK_CONFIG.maxFish) {
    return;
  }

  const fish = document.createElement("span");
  const direction = Math.random() > 0.5 ? "right" : "left";
  fish.className = `fish fish-${direction}`;
  fish.style.setProperty("--top", `${randomBetween(11, 58)}vh`);
  fish.style.setProperty("--w", `${randomBetween(34, 76)}px`);
  fish.style.setProperty("--dur", `${randomBetween(18, 32)}s`);
  fish.addEventListener("animationend", () => fish.remove(), { once: true });
  fishLayer.appendChild(fish);
}

function touchSeahorse(event) {
  if (!seahorseButton) return;
  event.stopPropagation();
  window.clearTimeout(camouflageTimer);
  seahorseButton.classList.add("is-camouflaged");
  createSoftBubbles(seahorseButton, 8);
  camouflageTimer = window.setTimeout(() => seahorseButton.classList.remove("is-camouflaged"), 1900);
  resetIdleTimer();
}

function startExperience(event) {
  const button = event.currentTarget || startButton;
  if (button.classList.contains("is-starting")) {
    event.stopPropagation();
    return;
  }

  const rect = button.getBoundingClientRect();
  button.classList.add("is-starting");
  createBurst(rect.left + rect.width / 2, rect.top + rect.height / 2);
  createSoftBubbles(button, 7);

  for (let i = 0; i < 8; i += 1) {
    window.setTimeout(createBubble, i * 45);
  }

  window.setTimeout(() => switchScreen("challenge"), 260);
  event.stopPropagation();
}

function tickleJuno(event) {
  if (currentScreen !== "challenge" || junoButton.classList.contains("giggling")) {
    return;
  }

  event.stopPropagation();
  window.clearTimeout(junoLaughTimer);
  junoButton.classList.add("giggling");
  junoImage.src = "assets/juno-laughing-normalized.png";
  makeLaughWords(junoButton, () => resetJunoLaugh());
  junoLaughTimer = window.setTimeout(resetJunoLaugh, 2000);
  resetIdleTimer();
}

function resetJunoLaugh() {
  if (!junoButton || !junoImage) {
    return;
  }

  junoImage.src = "assets/juno.png";
  junoButton.classList.remove("giggling");
  junoButton.querySelector(".laugh-words")?.remove();
}

function makeLaughWords(button, onComplete) {
  button.querySelector(".laugh-words")?.remove();
  const layer = document.createElement("span");
  layer.className = "laugh-words";

  ["Ha!", "Ha!", "Ha!"].forEach((text, index) => {
    const word = document.createElement("span");
    word.className = "laugh-word";
    word.textContent = text;
    word.style.setProperty("--laugh-x", `${-55 + index * 55}px`);
    word.style.setProperty("--laugh-y", `${115 + index * 24}px`);
    word.style.setProperty("--laugh-rotate", `${-12 + index * 12}deg`);
    word.style.setProperty("--laugh-delay", `${index * 0.16}s`);
    layer.appendChild(word);
    if (index === 2) {
      word.addEventListener("animationend", onComplete, { once: true });
    }
  });

  button.appendChild(layer);
}

function openMission(mode) {
  if (!KIOSK_CONFIG.challengeModes.includes(mode)) {
    return;
  }

  renderMission(mode);
  switchScreen("game");
}

function asset(name) {
  return `${MISSION_ASSET_PATH}/${name}`;
}

function renderMission(mode) {
  missionApp.innerHTML = "";
  const frame = document.createElement("iframe");
  frame.className = "verbatim-mission-frame";
  frame.setAttribute("title", `${mode} mission`);
  frame.setAttribute("aria-label", `${mode} mission`);
  frame.srcdoc = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
  <meta name="theme-color" content="#063b5c">
  <base href="missions/seahorse-super-spy/">
  <title>Juno's Ocean Missions: Seahorse Super Spy</title>
  <link rel="stylesheet" href="styles.css?v=detective-info1">
</head>
<body>
  <div class="video-bg" aria-hidden="true">
    <video autoplay muted loop playsinline preload="auto">
      <source src="assets/bubble.mp4" type="video/mp4">
    </video>
    <div class="ambient-fish-layer">
      <i class="ambient-fish"></i><i class="ambient-fish"></i><i class="ambient-fish"></i><i class="ambient-fish"></i>
      <i class="ambient-fish"></i><i class="ambient-fish"></i><i class="ambient-fish"></i><i class="ambient-fish"></i>
    </div>
  </div>
  <main id="app" class="app" aria-live="polite"></main>
  <script src="app.js?v=detective-info1"></script>
  <style>
    .target-hint {
      width: clamp(76px, 8.4vw, 116px) !important;
      height: clamp(76px, 8.4vw, 116px) !important;
      translate: 0 22px !important;
      margin-left: 4px;
    }
    .target-seahorse {
      left: 33% !important;
      width: 72% !important;
      height: 128% !important;
    }
    .target-glass {
      width: 112% !important;
      height: 112% !important;
      left: -6% !important;
      top: -6% !important;
    }
    .find-heading {
      gap: 16px !important;
    }
    .win-splash .win-actions {
      margin-top: 0;
    }
    .win-splash .primary {
      pointer-events: auto;
    }
    .win-splash .win-discover {
      margin-top: 16px;
      min-width: 210px;
      min-height: 58px;
      padding: 12px 22px;
      font-size: 1.1rem;
      pointer-events: auto;
    }
    .moving-ocean.found .win-splash {
      pointer-events: auto;
    }
    .camouflage-examples {
      width: min(760px, 100%);
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
    }
    .camouflage-examples img {
      width: 100%;
      aspect-ratio: 4 / 3;
      object-fit: cover;
      display: block;
      border: 3px solid var(--navy);
      border-radius: 18px;
      box-shadow: 0 5px 0 rgba(4, 50, 76, 0.28);
      background: #0b7891;
    }
    .explorer-summary {
      width: min(1010px, 92vw) !important;
    }
    .explorer-summary .juno-row {
      width: 100% !important;
      grid-template-columns: 138px minmax(0, 1fr) !important;
    }
    .explorer-summary .juno-small {
      width: 138px !important;
    }
    .explorer-summary .speech {
      width: 100% !important;
      white-space: nowrap !important;
      text-align: center;
      font-size: clamp(1.08rem, 1.72vw, 1.34rem) !important;
      padding-inline: clamp(20px, 2.5vw, 34px) !important;
    }
    @media (max-width: 760px), (max-height: 650px) {
      .camouflage-examples {
        gap: 7px;
      }
      .camouflage-examples img {
        border-width: 2px;
        border-radius: 12px;
      }
    }
    .moving-seahorse::after {
      content: "";
      position: absolute;
      inset: -42px -54px;
      border-radius: 48%;
      background: transparent;
    }
  </style>
  <script>
    (() => {
      const selectedMission = ${JSON.stringify(mode)};
      const returnHome = () => {
        if (parent && parent.SeahorseKiosk && parent.SeahorseKiosk.goToChallenges) {
          parent.SeahorseKiosk.goToChallenges();
        }
      };
      const returnToChoices = () => {
        if (parent && parent.SeahorseKiosk && parent.SeahorseKiosk.goToChallenges) {
          parent.SeahorseKiosk.goToChallenges();
        }
      };
      const improveSeahorseHitTarget = () => {
        const ocean = document.querySelector(".moving-ocean");
        if (!ocean || ocean.dataset.kioskHitPatch === "true") {
          return;
        }
        ocean.dataset.kioskHitPatch = "true";
        ocean.addEventListener("pointerdown", (event) => {
          const seahorses = [...document.querySelectorAll(".moving-seahorse:not(.collected):not(:disabled):not([hidden])")];
          if (!seahorses.length || event.target.closest(".moving-seahorse")) {
            return;
          }
          const seahorse = seahorses.find((candidate) => {
            const rect = candidate.getBoundingClientRect();
            const padX = Math.max(34, rect.width * 0.45);
            const padY = Math.max(42, rect.height * 0.32);
            return (
            event.clientX >= rect.left - padX &&
            event.clientX <= rect.right + padX &&
              event.clientY >= rect.top - padY &&
              event.clientY <= rect.bottom + padY
            );
          });
          if (seahorse && typeof foundSeahorse === "function") {
            event.stopPropagation();
            event.preventDefault();
            foundSeahorse({
              seahorse,
              target: seahorse,
              stopPropagation() {},
              preventDefault() {}
            });
          }
        }, true);
      };
      const bootMission = () => {
        if (typeof window.go !== "function") {
          window.setTimeout(bootMission, 30);
          return;
        }
        showStart = returnHome;
        showSelect = returnToChoices;
        window.showStart = returnHome;
        window.showSelect = returnToChoices;
        window.go(selectedMission, 0);
        window.setInterval(improveSeahorseHitTarget, 250);
      };
      bootMission();
    })();
  <\/script>
</body>
</html>`;
  missionApp.appendChild(frame);
}

function renderMissionShell(mode, content) {
  missionApp.innerHTML = `
    <div class="mission-shell mission-${mode}">
      <header class="mission-topbar">
        <div class="mission-title">
          <img src="${asset("juno.png")}" alt="">
          <span>${mode[0].toUpperCase()}${mode.slice(1)}</span>
        </div>
      </header>
      ${content}
    </div>
  `;
}

function renderExplorerGame() {
  const swimmers = [
    ["blue-fish.png", "fish", 13, 13, 13, -1],
    ["blue-octopus.png", "octopus", 28, 11, 18, -7],
    ["starfish.png", "starfish", 45, 8, 22, -14],
    ["blue-fish.png", "fish", 61, 10, 15, -5],
    ["moving-seahorse.png", "seahorse", 22, 8, 19, -10],
    ["blue-octopus.png", "octopus", 72, 9, 24, -18]
  ].map(([image, label, lane, size, duration, delay]) => `
    <button class="mission-swimmer" type="button" data-animal="${label}" style="--lane:${lane}%;--size:${size}%;--dur:${duration}s;--delay:${delay}s" aria-label="${label}">
      <img src="${asset(image)}" alt="">
    </button>
  `).join("");

  renderMissionShell("explorer", `
    <section class="explorer-stage">
      <div class="mission-feedback" aria-live="polite"></div>
      <h2>Find the hidden seahorse</h2>
      <div class="mission-ocean">
        <div class="mission-rays" aria-hidden="true"></div>
        ${swimmers}
        <button class="hidden-seahorse-target" type="button" aria-label="Hidden seahorse">
          <img src="${asset("moving-seahorse.png")}" alt="">
        </button>
      </div>
      <div class="mission-next"></div>
    </section>
  `);

  missionApp.querySelectorAll(".mission-swimmer").forEach((button) => {
    button.addEventListener("pointerdown", () => {
      const animalName = button.dataset.animal === "fish" ? "guppy" : button.dataset.animal;
      showMissionFeedback(`That's a ${animalName}. Keep looking!`, "try");
    });
  });
  missionApp.querySelector(".hidden-seahorse-target").addEventListener("pointerdown", () => {
    missionApp.querySelector(".mission-ocean").classList.add("found");
    showMissionFeedback("You found it!", "good");
    missionApp.querySelector(".mission-next").innerHTML = `<button class="mission-primary" type="button" data-next>Discover why</button>`;
    missionApp.querySelector("[data-next]").addEventListener("pointerdown", renderExplorerFact);
  });
}

function renderExplorerFact() {
  renderMissionShell("explorer", `
    <section class="mission-panel explorer-summary">
      <img class="mission-juno-small" src="${asset("juno.png")}" alt="">
      <p>Seahorses use colour and shape to blend in. That camouflage helps them hide from predators.</p>
      <p>Now look in the tank. Can you spot a real seahorse hiding?</p>
      <div class="mission-actions">
        <button class="mission-primary secondary" type="button" data-back>Back to home</button>
      </div>
    </section>
  `);
  missionApp.querySelector("[data-back]").addEventListener("pointerdown", () => switchScreen("challenge"));
}

function renderDetectiveGame() {
  const cards = [
    ["detective-seahorse-a.jpg", "A", false],
    ["detective-seahorse-b.jpg", "B", true],
    ["detective-seahorse-c.jpg", "C", false]
  ];
  renderMissionShell("detective", `
    <section class="mission-panel detective-game">
      <h2>Which seahorse is hardest to spot?</h2>
      <div class="detective-cards">
        ${cards.map(([image, label, correct]) => `
          <button class="detective-card" type="button" data-correct="${correct}">
            <img src="${asset(image)}" alt="">
            <span>${label}</span>
          </button>
        `).join("")}
      </div>
      <div class="mission-feedback" aria-live="polite"></div>
      <div class="mission-next"></div>
    </section>
  `);
  missionApp.querySelectorAll(".detective-card").forEach((card) => {
    card.addEventListener("pointerdown", () => {
      const correct = card.dataset.correct === "true";
      card.classList.toggle("correct", correct);
      card.classList.toggle("wrong", !correct);
      showMissionFeedback(correct ? "Correct! It matches the background." : "Good try. Look for the best camouflage.", correct ? "good" : "try");
      if (correct) {
        missionApp.querySelectorAll(".detective-card").forEach((button) => button.disabled = true);
        missionApp.querySelector(".mission-next").innerHTML = `<button class="mission-primary" type="button" data-next>Next clue</button>`;
        missionApp.querySelector("[data-next]").addEventListener("pointerdown", renderDetectiveFact);
      }
    });
  });
}

function renderDetectiveFact() {
  renderMissionShell("detective", `
    <section class="mission-panel">
      <img class="mission-juno-small" src="${asset("juno.png")}" alt="">
      <p>A predator might only have a split second to spot a seahorse before it disappears into the seagrass.</p>
      <button class="mission-primary" type="button" data-next>Tank challenge</button>
    </section>
  `);
  missionApp.querySelector("[data-next]").addEventListener("pointerdown", renderDetectiveTank);
}

function renderDetectiveTank() {
  renderQuestionGame("detective", "Look in the exhibit. What helps the seahorse blend in?", ["Colour", "Shape", "Both"], 2, "Exactly. Colour and shape work together.", renderDetectiveGame);
}

function renderScientistGame() {
  renderMissionShell("scientist", `
    <section class="mission-panel scientist-game">
      <h2>Which habitat gives a seahorse the best chance to hide?</h2>
      <div class="detective-cards">
        <button class="detective-card" type="button" data-correct="false"><img src="${asset("scientist-coral.jpg")}" alt=""><span>Bright coral</span></button>
        <button class="detective-card" type="button" data-correct="false"><img src="${asset("scientist-sand.jpg")}" alt=""><span>Open sand</span></button>
        <button class="detective-card" type="button" data-correct="true"><img src="${asset("scientist-grass.jpg")}" alt=""><span>Dense seagrass</span></button>
      </div>
      <div class="mission-feedback" aria-live="polite"></div>
      <div class="mission-next"></div>
    </section>
  `);
  missionApp.querySelectorAll(".detective-card").forEach((card) => {
    card.addEventListener("pointerdown", () => {
      const correct = card.dataset.correct === "true";
      card.classList.toggle("correct", correct);
      card.classList.toggle("wrong", !correct);
      showMissionFeedback(correct ? "Correct. Seagrass gives lots of hiding places." : "Try again. Which one has the most cover?", correct ? "good" : "try");
      if (correct) {
        missionApp.querySelectorAll(".detective-card").forEach((button) => button.disabled = true);
        missionApp.querySelector(".mission-next").innerHTML = `<button class="mission-primary" type="button" data-next>Why?</button>`;
        missionApp.querySelector("[data-next]").addEventListener("pointerdown", () => {
          renderQuestionGame("scientist", "Why does seagrass help?", ["More food", "More hiding places", "Warmer water"], 1, "Correct! Seagrass creates many hiding places.", renderScientistExplain, "Keep investigating");
        });
      }
    });
  });
}

function renderScientistExplain() {
  renderMissionShell("scientist", `
    <section class="mission-panel">
      <img class="mission-juno-small" src="${asset("juno.png")}" alt="">
      <p>Dense seagrass breaks up a seahorse's outline and helps it blend into the environment.</p>
      <button class="mission-primary" type="button" data-next>Keep investigating</button>
    </section>
  `);
  missionApp.querySelector("[data-next]").addEventListener("pointerdown", () => {
    renderAquariumScreen("scientist", "Look at the exhibit. Can you identify features that help the seahorse remain hidden?", renderScientistGame);
  });
}

function renderAquariumScreen(mode, text, replayCallback) {
  renderMissionShell(mode, `
    <section class="mission-panel">
      <img class="mission-juno-small" src="${asset("juno.png")}" alt="">
      <p>${text}</p>
      <button class="mission-primary" type="button" data-again>Back to home</button>
    </section>
  `);
  missionApp.querySelector("[data-again]").addEventListener("pointerdown", () => switchScreen("challenge"));
}

function renderQuestionGame(mode, question, options, correctIndex, goodText, nextCallback, nextLabel = "Play again") {
  renderMissionShell(mode, `
    <section class="mission-panel">
      <h2>${question}</h2>
      <div class="mission-choices">
        ${options.map((option, index) => `<button class="mission-choice" type="button" data-correct="${index === correctIndex}">${option}</button>`).join("")}
      </div>
      <div class="mission-feedback" aria-live="polite"></div>
      <div class="mission-next"></div>
    </section>
  `);
  missionApp.querySelectorAll(".mission-choice").forEach((choice) => {
    choice.addEventListener("pointerdown", () => {
      const correct = choice.dataset.correct === "true";
      choice.classList.toggle("correct", correct);
      choice.classList.toggle("wrong", !correct);
      showMissionFeedback(correct ? goodText : "Good try. Look closely and try again.", correct ? "good" : "try");
      if (correct) {
        missionApp.querySelectorAll(".mission-choice").forEach((button) => button.disabled = true);
        missionApp.querySelector(".mission-next").innerHTML = `<button class="mission-primary" type="button" data-next>${nextLabel}</button>`;
        missionApp.querySelector("[data-next]").addEventListener("pointerdown", nextCallback);
      }
    });
  });
}

function showMissionFeedback(text, type) {
  const feedback = missionApp.querySelector(".mission-feedback");
  if (!feedback) {
    return;
  }
  feedback.textContent = text;
  feedback.className = `mission-feedback ${type}`;
}

function touchSeaFriend(button, event) {
  const reactions = {
    crab: "is-waving",
    starfish: "is-spinning",
    jelly: "is-glowing",
    shell: "is-open"
  };
  const kind = button.dataset.friend;
  const reaction = reactions[kind];

  if (!reaction) {
    return;
  }

  event.stopPropagation();
  window.clearTimeout(friendTimers.get(button));
  button.classList.remove(reaction);
  void button.offsetWidth;
  button.classList.add(reaction);
  friendTimers.set(button, window.setTimeout(() => button.classList.remove(reaction), kind === "shell" ? 1200 : 900));
  createFriendBurst(button, kind);
  resetIdleTimer();
}

function createBurst(x, y) {
  const burst = document.createElement("span");
  burst.className = "burst";
  burst.style.setProperty("--x", `${x}px`);
  burst.style.setProperty("--y", `${y}px`);
  burst.addEventListener("animationend", () => burst.remove(), { once: true });
  document.body.appendChild(burst);
}

function createSoftBubbles(target, count) {
  const rect = target.getBoundingClientRect();
  for (let i = 0; i < count; i += 1) {
    const bubble = document.createElement("span");
    bubble.className = "friend-spark";
    bubble.style.setProperty("--x", `${rect.left + randomBetween(rect.width * 0.25, rect.width * 0.75)}px`);
    bubble.style.setProperty("--y", `${rect.top + randomBetween(rect.height * 0.2, rect.height * 0.8)}px`);
    bubble.style.setProperty("--dx", `${randomBetween(-26, 26)}px`);
    bubble.style.setProperty("--dy", `${randomBetween(-90, -42)}px`);
    bubble.style.setProperty("--s", `${randomBetween(9, 17)}px`);
    bubble.style.setProperty("--dur", `${randomBetween(620, 900)}ms`);
    bubble.addEventListener("animationend", () => bubble.remove(), { once: true });
    document.body.appendChild(bubble);
  }
}

function createFriendBurst(button, kind) {
  const rect = button.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  const count = kind === "starfish" ? 9 : 7;

  for (let i = 0; i < count; i += 1) {
    const spark = document.createElement("span");
    const angle = (Math.PI * 2 * i) / count + randomBetween(-0.28, 0.28);
    const distance = randomBetween(34, 82);
    spark.className = `friend-spark ${kind === "starfish" ? "star" : kind === "shell" ? "pearl" : ""}`;
    spark.style.setProperty("--x", `${centerX + randomBetween(-10, 10)}px`);
    spark.style.setProperty("--y", `${centerY + randomBetween(-8, 8)}px`);
    spark.style.setProperty("--dx", `${Math.cos(angle) * distance}px`);
    spark.style.setProperty("--dy", `${Math.sin(angle) * distance - 18}px`);
    spark.style.setProperty("--s", `${randomBetween(8, 16)}px`);
    spark.style.setProperty("--dur", `${randomBetween(520, 780)}ms`);
    spark.addEventListener("animationend", () => spark.remove(), { once: true });
    document.body.appendChild(spark);
  }
}

function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}

function bootAmbientLoops() {
  for (let i = 0; i < 10; i += 1) {
    window.setTimeout(createBubble, i * 330);
  }

  for (let i = 0; i < 4; i += 1) {
    window.setTimeout(createFish, i * 1200);
  }

  window.setInterval(createBubble, 1050);
  window.setInterval(createFish, 5200);
}

["pointerdown", "keydown"].forEach((eventName) => {
  window.addEventListener(eventName, resetIdleTimer, { passive: true });
});
window.addEventListener("message", handleMissionActivity);
window.addEventListener("keydown", handlePlaygroundShortcut);

document.addEventListener("pointerdown", makeClickBubbles);
document.addEventListener("click", makeClickBubbles);
startButton.addEventListener("pointerdown", startExperience);
seahorseButton?.addEventListener("pointerdown", touchSeahorse);
junoButton.addEventListener("pointerdown", tickleJuno);
gameBackButton.addEventListener("pointerdown", () => {
  missionApp.innerHTML = "";
  switchScreen("challenge");
});
challengeHomeButton.addEventListener("pointerdown", (event) => {
  event.stopPropagation();
  switchScreen("home");
});
playgroundBackButton.addEventListener("pointerdown", (event) => {
  event.stopPropagation();
  switchScreen("challenge");
});
seaFriends.forEach((button) => {
  button.addEventListener("pointerdown", (event) => touchSeaFriend(button, event));
});

document.querySelectorAll(".challenge-card").forEach((button) => {
  button.addEventListener("pointerdown", () => {
    const mode = button.dataset.mode;
    button.animate(
      [
        { transform: "scale(1)", filter: "brightness(1)" },
        { transform: "scale(1.05)", filter: "brightness(1.18)" },
        { transform: "scale(1)", filter: "brightness(1)" }
      ],
      { duration: 380, easing: "ease-out" }
    );
    resetIdleTimer();
    if (KIOSK_CONFIG.challengeModes.includes(mode)) {
      window.setTimeout(() => {
        openMission(mode);
      }, 220);
    }
  });
});

bootAmbientLoops();
resetIdleTimer();

window.SeahorseKiosk = {
  config: KIOSK_CONFIG,
  goHome: () => switchScreen("home"),
  goToChallenges: () => switchScreen("challenge")
};
