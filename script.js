const missionStatusEl = document.getElementById("mission-status");
const crewStatsEl = document.getElementById("crew-stats");
const orgStatsEl = document.getElementById("org-stats");
const astronautStatsEl = document.getElementById("astronaut-stats");
const eventDescriptionEl = document.getElementById("event-description");
const choicesPanelEl = document.getElementById("choices-panel");
const resultTextEl = document.getElementById("result-text");
const startButton = document.getElementById("start-button");
const nextButton = document.getElementById("next-button");

let gameState;
let currentEvent = null;
let waitingForChoice = false;

function createInitialState() {
  return {
    month: 1,
    totalMonths: 17,
    isGameOver: false,
    cohesion: 70,
    morale: 70,
    conflictRisk: 20,
    nasaSupport: 100,
    vrSystemHealth: 80,
    astronauts: [
      {
        id: "A",
        name: "Astronaut A (Pilot)",
        stress: 30,
        fatigue: 30,
        connection: 60,
      },
      {
        id: "B",
        name: "Astronaut B (Scientist)",
        stress: 35,
        fatigue: 25,
        connection: 55,
      },
      {
        id: "C",
        name: "Astronaut C (Engineer)",
        stress: 25,
        fatigue: 35,
        connection: 50,
      },
      {
        id: "D",
        name: "Astronaut D (Medical/Psych Specialist)",
        stress: 30,
        fatigue: 30,
        connection: 65,
      },
    ],
  };
}

const events = [
  {
    id: "maintenance",
    description: "A minor equipment malfunction requires extra time to repair.",
    choices: [
      {
        text: "Assign the pilot to handle it solo.",
        effects: (state) => {
          state.cohesion += 2;
          state.astronauts[0].fatigue += 6;
          state.astronauts[0].stress += 3;
        },
        resultText: "The pilot takes on the extra workload and keeps the team focused.",
      },
      {
        text: "Split the job between all crew members.",
        effects: (state) => {
          state.morale -= 3;
          state.astronauts.forEach((a) => {
            a.fatigue += 3;
          });
        },
        resultText: "Everyone contributes, though enthusiasm dips a little.",
      },
      {
        text: "Delay the repair and monitor.",
        effects: (state) => {
          state.morale -= 5;
          state.conflictRisk += 5;
          state.nasaSupport -= 5;
        },
        resultText: "The issue lingers and HQ is displeased.",
      },
    ],
  },
  {
    id: "communication",
    description: "A communications blackout with Earth causes uncertainty for a day.",
    choices: [
      {
        text: "Run a team reflection session.",
        effects: (state) => {
          state.cohesion += 4;
          state.morale += 3;
          state.astronauts.forEach((a) => {
            a.connection += 4;
          });
        },
        resultText: "Sharing worries openly strengthens trust.",
      },
      {
        text: "Keep crew on routine tasks to avoid panic.",
        effects: (state) => {
          state.morale -= 2;
          state.astronauts.forEach((a) => {
            a.stress += 2;
          });
        },
        resultText: "Focus on routine keeps them busy but tension lingers.",
      },
    ],
  },
  {
    id: "exercise",
    description: "VR exercise system shows degraded performance.",
    choices: [
      {
        text: "Dedicate time to recalibrate the VR system.",
        effects: (state) => {
          state.vrSystemHealth += 8;
          state.nasaSupport -= 4;
          state.astronauts.forEach((a) => {
            a.fatigue += 3;
          });
        },
        resultText: "Hardware tunes up, though the crew feels the extra work.",
      },
      {
        text: "Switch to analog workouts for the week.",
        effects: (state) => {
          state.vrSystemHealth -= 5;
          state.morale -= 2;
          state.astronauts.forEach((a) => {
            a.stress -= 2;
          });
        },
        resultText: "Simpler routines give their minds a break.",
      },
      {
        text: "Request remote troubleshooting from Earth.",
        effects: (state) => {
          state.nasaSupport -= 8;
          state.conflictRisk -= 2;
          state.astronauts.forEach((a) => {
            a.connection += 2;
          });
        },
        resultText: "HQ responds, but support credits dip.",
      },
    ],
  },
  {
    id: "celebration",
    description: "Crew hits a mission milestone and wants to celebrate.",
    choices: [
      {
        text: "Approve a relaxed movie night.",
        effects: (state) => {
          state.morale += 5;
          state.astronauts.forEach((a) => {
            a.stress -= 3;
            a.fatigue -= 2;
          });
        },
        resultText: "Shared laughter boosts morale.",
      },
      {
        text: "Keep schedule tight but allow an extra dessert.",
        effects: (state) => {
          state.cohesion += 2;
          state.morale += 1;
        },
        resultText: "A small treat keeps spirits steady without losing time.",
      },
    ],
  },
  {
    id: "sleep",
    description: "Interrupted sleep cycles leave the crew groggy.",
    choices: [
      {
        text: "Rotate naps during low-priority tasks.",
        effects: (state) => {
          state.cohesion -= 2;
          state.astronauts.forEach((a) => {
            a.fatigue -= 6;
            a.stress -= 2;
          });
        },
        resultText: "Short naps restore energy but slightly hurt teamwork.",
      },
      {
        text: "Push through with caffeine and discipline.",
        effects: (state) => {
          state.morale -= 4;
          state.astronauts.forEach((a) => {
            a.fatigue += 4;
            a.stress += 3;
          });
        },
        resultText: "Everyone powers through, though mood worsens.",
      },
    ],
  },
  {
    id: "conflict",
    description: "Tension rises between two crew members over task priorities.",
    choices: [
      {
        text: "Hold a mediation led by the Medical/Psych specialist.",
        effects: (state) => {
          state.cohesion += 6;
          state.conflictRisk -= 6;
          state.astronauts[3].stress += 3;
        },
        resultText: "Facilitated dialogue cools tempers, though it taxes the mediator.",
      },
      {
        text: "Reassign duties to separate them temporarily.",
        effects: (state) => {
          state.cohesion -= 3;
          state.conflictRisk -= 2;
          state.astronauts.forEach((a) => {
            a.connection -= 1;
          });
        },
        resultText: "Distance prevents escalation but frays bonds.",
      },
      {
        text: "Ignore it and hope it passes.",
        effects: (state) => {
          state.conflictRisk += 8;
          state.morale -= 4;
        },
        resultText: "Unaddressed tension threatens cohesion.",
      },
    ],
  },
  {
    id: "science_win",
    description: "The scientist completes a difficult experiment early.",
    choices: [
      {
        text: "Celebrate and share the success story with HQ.",
        effects: (state) => {
          state.morale += 4;
          state.nasaSupport += 6;
          state.astronauts[1].connection += 5;
        },
        resultText: "NASA applauds the achievement and morale climbs.",
      },
      {
        text: "Redirect momentum into tackling maintenance backlog.",
        effects: (state) => {
          state.cohesion += 3;
          state.astronauts.forEach((a) => {
            a.fatigue += 3;
          });
        },
        resultText: "Team tackles chores together while energy lasts.",
      },
    ],
  },
  {
    id: "signal_delay",
    description: "An unexpected signal delay complicates navigation planning.",
    choices: [
      {
        text: "Pilot and engineer run a late-night recalculation.",
        effects: (state) => {
          state.cohesion += 1;
          state.astronauts[0].fatigue += 6;
          state.astronauts[2].fatigue += 6;
          state.astronauts[0].stress += 3;
          state.astronauts[2].stress += 3;
        },
        resultText: "Numbers line up again at the cost of sleep.",
      },
      {
        text: "Ask HQ for guidance despite delay.",
        effects: (state) => {
          state.nasaSupport -= 6;
          state.conflictRisk -= 1;
          state.morale += 1;
        },
        resultText: "Support tickets rise but the crew feels reassured.",
      },
    ],
  },
];

function clampState(state) {
  state.cohesion = clamp(state.cohesion);
  state.morale = clamp(state.morale);
  state.conflictRisk = clamp(state.conflictRisk);
  state.nasaSupport = clamp(state.nasaSupport);
  state.vrSystemHealth = clamp(state.vrSystemHealth);
  state.astronauts.forEach((astronaut) => {
    astronaut.stress = clamp(astronaut.stress);
    astronaut.fatigue = clamp(astronaut.fatigue);
    astronaut.connection = clamp(astronaut.connection);
  });
}

function clamp(value) {
  return Math.max(0, Math.min(100, value));
}

function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function startGame() {
  gameState = createInitialState();
  currentEvent = null;
  waitingForChoice = false;
  resultTextEl.textContent = "";
  startButton.disabled = true;
  nextButton.disabled = true;
  nextButton.textContent = "Next";
  const endSummary = document.getElementById("end-summary");
  if (endSummary) endSummary.remove();
  renderIntro();
  startTurn();
}

function startTurn() {
  if (gameState.isGameOver) return;

  if (gameState.month > gameState.totalMonths) {
    endGame("win");
    return;
  }

  applyWearAndTear();
  const loseReason = checkLoseConditions();
  if (loseReason) {
    endGame("lose", loseReason);
    return;
  }
  currentEvent = getRandomEvent();
  waitingForChoice = true;
  resultTextEl.textContent = "";
  render();
  renderChoices();
  nextButton.disabled = true;
}

function applyWearAndTear() {
  gameState.astronauts.forEach((astronaut) => {
    astronaut.stress += randomBetween(1, 2);
    astronaut.fatigue += randomBetween(1, 2);
  });

  if (gameState.month % 3 === 0) {
    gameState.morale -= 1;
  }

  gameState.conflictRisk += 1;
  clampState(gameState);
}

function getRandomEvent() {
  return events[Math.floor(Math.random() * events.length)];
}

function handleChoice(choiceIndex) {
  if (!waitingForChoice || gameState.isGameOver) return;

  const choice = currentEvent.choices[choiceIndex];
  if (!choice) return;

  choice.effects(gameState);
  clampState(gameState);

  const loseReason = checkLoseConditions();
  if (loseReason) {
    endGame("lose", loseReason);
    return;
  }

  resultTextEl.textContent = choice.resultText || "Decision logged.";
  waitingForChoice = false;
  nextButton.disabled = false;
  disableChoiceButtons();
  render();
}

function disableChoiceButtons() {
  const buttons = choicesPanelEl.querySelectorAll("button");
  buttons.forEach((btn) => (btn.disabled = true));
}

function nextTurn() {
  if (gameState.isGameOver) return;
  gameState.month += 1;
  startTurn();
}

function checkLoseConditions() {
  if (gameState.cohesion <= 0) return "Crew cohesion collapsed.";
  if (gameState.morale <= 0) return "Crew morale depleted.";
  if (gameState.nasaSupport <= 0) return "NASA support exhausted.";

  const stressed = gameState.astronauts.find((a) => a.stress >= 100);
  if (stressed) return `${stressed.name}'s stress reached critical levels.`;
  return null;
}

function endGame(resultType, reason = "") {
  gameState.isGameOver = true;
  waitingForChoice = false;
  nextButton.disabled = true;
  startButton.disabled = false;
  startButton.textContent = "Play Again";
  choicesPanelEl.innerHTML = "";

  let title = "Mission Complete";
  let description = "Mission complete. Your crew arrives at Mars with manageable strain.";
  if (resultType === "lose") {
    title = "Mission Failed";
    description = reason || "Psychological collapse ended the mission.";
  }

  eventDescriptionEl.innerHTML = `<strong>${title}</strong><br>${description}`;
  resultTextEl.textContent = "";
  renderEndSummary();
}

function renderEndSummary() {
  const summary = document.createElement("div");
  summary.id = "end-summary";
  summary.innerHTML = `
    <div class="small-text">Final Stats</div>
    ${renderCrewStats(true)}
    ${renderOrgStats(true)}
    ${renderAstronautStats(true)}
  `;

  const existing = document.getElementById("end-summary");
  if (existing) existing.remove();
  eventDescriptionEl.parentElement.appendChild(summary);
}

function renderIntro() {
  eventDescriptionEl.textContent =
    "Guide your four-person crew across 17 months. Each decision affects morale, cohesion, stress, and support.";
}

function render() {
  missionStatusEl.textContent = `Month ${Math.min(gameState.month, gameState.totalMonths)} / ${gameState.totalMonths}`;
  crewStatsEl.innerHTML = renderCrewStats();
  orgStatsEl.innerHTML = renderOrgStats();
  astronautStatsEl.innerHTML = renderAstronautStats();
  if (currentEvent && !gameState.isGameOver) {
    eventDescriptionEl.textContent = currentEvent.description;
  }
}

function renderCrewStats(includeTitle = false) {
  const title = includeTitle ? "<div class=\"small-text\">Crew Status</div>" : "";
  return `${title}
    <div class="stat-row"><span class="stat-label">Cohesion</span><span class="stat-value">${gameState.cohesion}</span></div>
    <div class="stat-row"><span class="stat-label">Morale</span><span class="stat-value">${gameState.morale}</span></div>
    <div class="stat-row"><span class="stat-label">Conflict Risk</span><span class="stat-value">${gameState.conflictRisk}</span></div>
  `;
}

function renderOrgStats(includeTitle = false) {
  const title = includeTitle ? "<div class=\"small-text\">Organizational Support</div>" : "";
  return `${title}
    <div class="stat-row"><span class="stat-label">NASA Support</span><span class="stat-value">${gameState.nasaSupport}</span></div>
    <div class="stat-row"><span class="stat-label">VR System Health</span><span class="stat-value">${gameState.vrSystemHealth}</span></div>
  `;
}

function renderAstronautStats(includeTitle = false) {
  const title = includeTitle ? "<div class=\"small-text\">Astronauts</div>" : "";
  const rows = gameState.astronauts
    .map(
      (a) => `
        <div class="astronaut">
          <div class="stat-row"><span class="stat-label">${a.name}</span><span class="stat-value">${a.connection} conn</span></div>
          <div class="stat-row small-text"><span>Stress: ${a.stress}</span><span>Fatigue: ${a.fatigue}</span></div>
        </div>
      `
    )
    .join("");
  return `${title}${rows}`;
}

function renderChoices() {
  choicesPanelEl.innerHTML = "";
  if (!currentEvent || gameState.isGameOver) return;

  currentEvent.choices.forEach((choice, index) => {
    const button = document.createElement("button");
    button.textContent = choice.text;
    button.addEventListener("click", () => handleChoice(index));
    choicesPanelEl.appendChild(button);
  });
}

startButton.addEventListener("click", startGame);
nextButton.addEventListener("click", nextTurn);

renderIntro();
