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
  // ========= INDIVIDUAL RESILIENCE & TRAINING =========
  {
    id: "emotionalDesensitization",
    description:
      "The crew completes a session on emotional regulation and desensitization, similar to the training astronauts undergo to manage fear and stay focused.",
    choices: [
      {
        text: "Discuss emotional regulation openly as a group.",
        effects: (state) => {
          state.astronauts.forEach((a) => {
            a.stress -= 5;
          });
          state.cohesion += 3;
        },
        resultText: "The crew shares strategies and feels more prepared to handle stress.",
      },
      {
        text: "Assign personal resilience training modules for each crew member.",
        effects: (state) => {
          state.astronauts[1].stress -= 10;
          state.astronauts[1].fatigue += 5;
          state.astronauts[3].stress -= 10;
          state.astronauts[3].fatigue += 5;
        },
        resultText: "Some crew members feel stronger mentally, but more tired.",
      },
      {
        text: "Skip the session and keep the schedule tight.",
        effects: (state) => {
          state.morale -= 5;
          state.astronauts.forEach((a) => {
            a.stress += 3;
          });
        },
        resultText: "The crew senses a missed opportunity to prepare for future stress.",
      },
    ],
  },

  {
    id: "earlyPatterns",
    description:
      "You review early psychological data from the mission. Patterns suggest that those who struggle now may continue to do so as the mission progresses.",
    choices: [
      {
        text: "Proactively support the most stressed astronaut.",
        effects: (state) => {
          let maxIndex = 0;
          let maxStress = -1;
          state.astronauts.forEach((a, i) => {
            if (a.stress > maxStress) {
              maxStress = a.stress;
              maxIndex = i;
            }
          });
          state.astronauts[maxIndex].stress -= 10;
          state.nasaSupport -= 5;
        },
        resultText: "You intervene early, hoping to change the long-term trajectory.",
      },
      {
        text: "Note the data but trust the crew to adapt on their own.",
        effects: (state) => {
          state.conflictRisk += 5;
          state.astronauts.forEach((a) => {
            a.stress += 3;
          });
        },
        resultText: "Tension builds quietly beneath the surface.",
      },
      {
        text: "Implement strict routines to stabilize behavior.",
        effects: (state) => {
          state.astronauts.forEach((a) => {
            a.fatigue += 5;
            a.stress -= 2;
          });
          state.cohesion += 2;
        },
        resultText: "Structure helps some, but the added workload wears them down.",
      },
    ],
  },

  {
    id: "monotony",
    description:
      "The constant hum of the spacecraft and repetitive routines wear on the crew. Monotony is becoming a real psychological threat.",
    choices: [
      {
        text: "Introduce varied task rotations to break the routine.",
        effects: (state) => {
          state.astronauts.forEach((a) => {
            a.fatigue += 3;
            a.stress -= 5;
          });
        },
        resultText: "The change of pace helps the crew feel a bit more stimulated.",
      },
      {
        text: "Allow custom audio and ambient soundscapes during work.",
        effects: (state) => {
          state.astronauts.forEach((a) => {
            a.stress -= 7;
          });
          state.vrSystemHealth -= 3;
        },
        resultText: "The new soundscapes ease the tension, at the cost of system use.",
      },
      {
        text: "Do nothing; staying disciplined is part of the mission.",
        effects: (state) => {
          state.morale -= 5;
          state.astronauts.forEach((a) => {
            a.stress += 4;
          });
        },
        resultText: "The monotony deepens, and the ship feels smaller each day.",
      },
    ],
  },

  {
    id: "privateStressReport",
    description:
      "One astronaut quietly reports feeling overwhelmed by the thought of months left in isolation.",
    choices: [
      {
        text: "Schedule one-on-one check-ins to monitor them closely.",
        effects: (state) => {
          state.astronauts[3].stress -= 8;
          state.astronauts[3].fatigue += 3;
          state.nasaSupport -= 5;
        },
        resultText: "The astronaut feels heard, and the medic takes on extra emotional labor.",
      },
      {
        text: "Encourage them to increase exercise and routine.",
        effects: (state) => {
          state.astronauts.forEach((a) => {
            a.fatigue += 2;
          });
          state.astronauts[0].stress -= 3;
          state.astronauts[1].stress -= 3;
        },
        resultText: "Physical exertion helps some crew members but adds to overall fatigue.",
      },
      {
        text: "Advise them to focus on duty and push through it.",
        effects: (state) => {
          state.astronauts[1].stress += 8;
          state.morale -= 3;
        },
        resultText: "They feel more alone, and the overall mood darkens slightly.",
      },
    ],
  },

  // ========= INTERPERSONAL DYNAMICS & COHESION =========

  {
    id: "cohesionWorkshop",
    description:
      "You notice small frictions forming. Mission guidelines suggest periodic workshops focused on communication and cohesion.",
    choices: [
      {
        text: "Run a structured crew-cohesion workshop.",
        effects: (state) => {
          state.cohesion += 10;
          state.astronauts.forEach((a) => {
            a.fatigue += 4;
          });
        },
        resultText: "The crew bonds more deeply, though the session is mentally tiring.",
      },
      {
        text: "Hold a light, informal conversation instead.",
        effects: (state) => {
          state.cohesion += 5;
          state.morale += 3;
        },
        resultText: "The casual talk eases tension without feeling like extra work.",
      },
      {
        text: "Skip the dedicated session and hope professionalism is enough.",
        effects: (state) => {
          state.cohesion -= 5;
          state.conflictRisk += 5;
        },
        resultText: "Unspoken issues linger beneath the surface.",
      },
    ],
  },

  {
    id: "argumentOverWorkload",
    description:
      "Two crew members get into a heated argument about workload and fairness. The disagreement spreads tension through the whole cabin.",
    choices: [
      {
        text: "Mediate the conflict and redistribute tasks fairly.",
        effects: (state) => {
          state.cohesion += 8;
          state.morale -= 2;
          state.astronauts.forEach((a) => {
            a.fatigue += 3;
          });
        },
        resultText: "Resolution is reached, but everyone feels a bit drained.",
      },
      {
        text: "Ask one astronaut to step up and take more responsibility.",
        effects: (state) => {
          state.astronauts[2].fatigue += 8;
          state.astronauts[2].stress += 4;
          state.cohesion += 2;
        },
        resultText: "The engineer shoulders more work, but their stress starts to climb.",
      },
      {
        text: "Order them to move on and get back to work.",
        effects: (state) => {
          state.cohesion -= 10;
          state.conflictRisk += 8;
        },
        resultText: "The conflict doesn’t disappear; it just goes quiet.",
      },
    ],
  },

  {
    id: "silentMeal",
    description:
      "The crew eats together in total silence several days in a row. It’s becoming noticeable.",
    choices: [
      {
        text: "Initiate a group conversation and invite everyone to share.",
        effects: (state) => {
          state.cohesion += 6;
          state.astronauts.forEach((a) => {
            a.fatigue += 2;
          });
        },
        resultText: "Conversation slowly starts up again, and the room feels less heavy.",
      },
      {
        text: "Let it pass; maybe everyone just needs quiet.",
        effects: (state) => {
          state.morale -= 3;
        },
        resultText: "The silence continues, and a sense of distance grows.",
      },
      {
        text: "Have the designated leader address the crew directly.",
        effects: (state) => {
          state.cohesion += 4;
          state.conflictRisk -= 2;
          state.astronauts[0].stress += 2;
        },
        resultText: "The leader steps in, easing some tension but taking on extra pressure.",
      },
    ],
  },

  {
    id: "crewBondingDecision",
    description:
      "Some crew members want more structured social activities. Others prefer alone time to recharge.",
    choices: [
      {
        text: "Schedule mandatory group recreation.",
        effects: (state) => {
          state.cohesion += 9;
          state.astronauts.forEach((a) => {
            a.fatigue += 3;
          });
        },
        resultText: "The group reconnects, though some resent losing their personal time.",
      },
      {
        text: "Allow everyone to decide how to use their time.",
        effects: (state) => {
          state.morale += 6;
          state.cohesion -= 2;
        },
        resultText: "Individuals feel better, but the crew acts more like separate islands.",
      },
      {
        text: "Focus that time on mission tasks instead.",
        effects: (state) => {
          state.morale -= 4;
          state.cohesion -= 4;
        },
        resultText: "Productivity increases, but shared resentment grows.",
      },
    ],
  },

  // ========= ORGANIZATIONAL SUPPORT: NASA BHP =========

  {
    id: "counselingOffer",
    description:
      "NASA Behavioral Health and Performance offers optional counseling sessions for the crew this month.",
    choices: [
      {
        text: "Schedule counseling for the whole crew.",
        effects: (state) => {
          state.astronauts.forEach((a) => {
            a.stress -= 10;
          });
          state.nasaSupport -= 12;
        },
        resultText: "Everyone feels lighter, though you’ve used a chunk of support resources.",
      },
      {
        text: "Send only the most stressed astronaut.",
        effects: (state) => {
          let maxIndex = 0;
          let maxStress = -1;
          state.astronauts.forEach((a, i) => {
            if (a.stress > maxStress) {
              maxStress = a.stress;
              maxIndex = i;
            }
          });
          state.astronauts[maxIndex].stress -= 15;
          state.nasaSupport -= 6;
        },
        resultText: "Targeted counseling helps your most fragile crew member regain balance.",
      },
      {
        text: "Skip counseling to save support resources.",
        effects: (state) => {
          state.astronauts.forEach((a) => {
            a.stress += 5;
          });
          state.morale -= 4;
        },
        resultText: "The crew feels less supported and a bit more on their own.",
      },
    ],
  },

  {
    id: "familyContactWindow",
    description:
      "A scheduled window allows the crew to send and receive messages from family back on Earth.",
    choices: [
      {
        text: "Extend the contact time so everyone can talk as long as they want.",
        effects: (state) => {
          state.morale += 12;
          state.astronauts.forEach((a) => {
            a.fatigue += 3;
          });
        },
        resultText: "Hearing from loved ones lifts spirits, though it comes with emotional exhaustion.",
      },
      {
        text: "Keep contact time within normal limits.",
        effects: (state) => {
          state.morale += 5;
        },
        resultText: "The crew is grateful for the connection, even if it’s brief.",
      },
      {
        text: "Shorten or skip contact this time to prioritize bandwidth for mission data.",
        effects: (state) => {
          state.morale -= 10;
          state.cohesion -= 3;
        },
        resultText: "Cutting off family time stings, and some blame mission priorities.",
      },
    ],
  },

  {
    id: "healthMonitoring",
    description:
      "High-level organizational systems flag rising stress and fatigue trends in your crew data.",
    choices: [
      {
        text: "Conduct a detailed psychological evaluation this month.",
        effects: (state) => {
          let maxIndex = 0;
          let maxStress = -1;
          state.astronauts.forEach((a, i) => {
            if (a.stress > maxStress) {
              maxStress = a.stress;
              maxIndex = i;
            }
          });
          state.astronauts[maxIndex].stress -= 12;
          state.astronauts[maxIndex].fatigue += 4;
          state.nasaSupport -= 5;
        },
        resultText: "You identify and help the astronaut under the most pressure.",
      },
      {
        text: "Review only the group-level metrics and adjust schedules slightly.",
        effects: (state) => {
          state.cohesion += 3;
          state.morale -= 2;
          state.astronauts.forEach((a) => {
            a.fatigue += 2;
          });
        },
        resultText: "Small tweaks help somewhat, but individuals still slip through the cracks.",
      },
      {
        text: "Ignore the alerts; assume the crew is adapting.",
        effects: (state) => {
          state.conflictRisk += 8;
          state.astronauts.forEach((a) => {
            a.stress += 4;
          });
        },
        resultText: "The warning signs go unaddressed, brewing future problems.",
      },
    ],
  },

  // ========= VR & AI SUPPORT TECHNOLOGY =========

  {
    id: "vrEarthSimulation",
    description:
      "The VR system can simulate Earth environments—forests, oceans, and open skies—to combat feelings of isolation.",
    choices: [
      {
        text: "Schedule regular VR sessions for every crew member.",
        effects: (state) => {
          state.astronauts.forEach((a) => {
            a.stress -= 10;
          });
          state.vrSystemHealth -= 12;
        },
        resultText: "The crew feels closer to home, but the VR system wears down faster.",
      },
      {
        text: "Reserve VR for the most isolated crew member.",
        effects: (state) => {
          state.astronauts[3].stress -= 15;
          state.vrSystemHealth -= 5;
        },
        resultText: "One astronaut experiences real relief, but others still feel isolated.",
      },
      {
        text: "Avoid using VR; rely on internal resilience and social support.",
        effects: (state) => {
          state.cohesion += 4;
          state.astronauts.forEach((a) => {
            a.stress += 4;
          });
        },
        resultText: "The crew’s bond is tested without technological escape.",
      },
    ],
  },

  {
    id: "aiCompanionUpdate",
    description:
      "A software update promises to make the onboard AI companion more personable and responsive.",
    choices: [
      {
        text: "Install the update and encourage the crew to interact with the AI.",
        effects: (state) => {
          state.morale += 7;
          state.conflictRisk -= 3;
          state.nasaSupport -= 4;
        },
        resultText: "The AI becomes a quirky part of daily life, easing some tension.",
      },
      {
        text: "Delay the update and continue with the current system.",
        effects: () => {},
        resultText: "Nothing changes; the AI remains functional but distant.",
      },
      {
        text: "Disable nonessential AI features to reduce complexity.",
        effects: (state) => {
          state.morale -= 4;
          state.cohesion -= 2;
        },
        resultText: "The ship feels more mechanical and less personable.",
      },
    ],
  },

  // ========= ICE ENVIRONMENT & COMMUNICATION =========

  {
    id: "commsDelay",
    description:
      "Communication delays from Earth are getting longer and more frustrating for the crew.",
    choices: [
      {
        text: "Hold a meeting to openly acknowledge the frustration.",
        effects: (state) => {
          state.cohesion += 5;
          state.morale -= 1;
        },
        resultText: "Talking about it helps them feel understood, even if nothing changes technically.",
      },
      {
        text: "Request additional updates and reassurance from mission control.",
        effects: (state) => {
          state.morale += 6;
          state.nasaSupport -= 6;
        },
        resultText: "Extra communication helps morale but uses up support bandwidth.",
      },
      {
        text: "Tell everyone to focus on the mission and ignore the delays.",
        effects: (state) => {
          state.morale -= 5;
          state.conflictRisk += 5;
        },
        resultText: "Some crew members feel dismissed, and irritation grows.",
      },
    ],
  },

  {
    id: "equipmentAnomaly",
    description:
      "A non-critical system shows intermittent glitches. It’s not dangerous, but it adds stress.",
    choices: [
      {
        text: "Assign one astronaut to troubleshoot the issue thoroughly.",
        effects: (state) => {
          state.astronauts[2].fatigue += 8;
          state.astronauts[2].stress += 3;
          state.morale += 3;
        },
        resultText: "Knowing someone is on it reassures the crew, but the engineer feels the strain.",
      },
      {
        text: "Distribute the troubleshooting tasks among the crew.",
        effects: (state) => {
          state.astronauts.forEach((a) => {
            a.fatigue += 3;
          });
          state.cohesion += 3;
        },
        resultText: "Everyone pitches in, strengthening teamwork at the cost of energy.",
      },
      {
        text: "Ignore the issue for now and log it as low priority.",
        effects: (state) => {
          state.morale -= 4;
          state.conflictRisk += 3;
        },
        resultText: "Living with a persistent glitch adds an undercurrent of anxiety.",
      },
    ],
  },

  // ========= REFLECTION & MEANING =========

  {
    id: "whyAreWeHere",
    description:
      "Mission protocol suggests a monthly reflection on personal purpose: Why are you here? What makes this mission meaningful to you?",
    choices: [
      {
        text: "Encourage a deep, guided reflection session for the crew.",
        effects: (state) => {
          state.astronauts.forEach((a) => {
            a.connection += 10;
            a.fatigue += 3;
          });
        },
        resultText: "The crew reconnects with their reasons for being here, at the cost of emotional energy.",
      },
      {
        text: "Keep the reflection light and informal.",
        effects: (state) => {
          state.morale += 5;
        },
        resultText: "The crew reflects just enough to feel grounded, without digging too deep.",
      },
      {
        text: "Skip reflection this month to keep the schedule efficient.",
        effects: (state) => {
          state.astronauts.forEach((a) => {
            a.connection -= 5;
            a.stress += 2;
          });
        },
        resultText: "Without reflection, the mission begins to feel more like a blur of tasks.",
      },
    ],
  },

  {
    id: "missionMilestone",
    description:
      "You pass a major time milestone of the journey. The halfway point is within sight, but so is the weight of the remaining months.",
    choices: [
      {
        text: "Celebrate with a small ceremony or shared meal.",
        effects: (state) => {
          state.morale += 8;
          state.cohesion += 4;
        },
        resultText: "The crew shares a rare bright moment, marking progress together.",
      },
      {
        text: "Acknowledge the milestone briefly and return to work.",
        effects: (state) => {
          state.morale += 2;
        },
        resultText: "The crew notes the date but doesn’t dwell on it.",
      },
      {
        text: "Downplay the milestone to avoid distraction.",
        effects: (state) => {
          state.morale -= 3;
        },
        resultText: "Silencing the moment leaves the crew feeling oddly disconnected from their own journey.",
      },
    ],
  },

  // ========= FREE TIME & ENERGY MANAGEMENT =========

  {
    id: "unexpectedFreeTime",
    description:
      "A scheduled experiment is delayed, giving the crew unexpected free time.",
    choices: [
      {
        text: "Use the time for training drills to reinforce discipline.",
        effects: (state) => {
          state.cohesion += 4;
          state.morale -= 3;
          state.astronauts.forEach((a) => {
            a.fatigue += 3;
          });
        },
        resultText: "The crew stays sharp, but some resent losing a rare break.",
      },
      {
        text: "Allow the crew to rest and sleep.",
        effects: (state) => {
          state.astronauts.forEach((a) => {
            a.fatigue -= 10;
          });
        },
        resultText: "The crew wakes up with clearer heads and more energy.",
      },
      {
        text: "Set up a group entertainment night.",
        effects: (state) => {
          state.morale += 8;
          state.cohesion += 3;
        },
        resultText: "Shared laughter and stories briefly make the ship feel like home.",
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
