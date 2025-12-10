const missionStatusEl = document.getElementById("mission-status");
const crewStatsEl = document.getElementById("crew-stats");
const orgStatsEl = document.getElementById("org-stats");
const astronautStatsEl = document.getElementById("astronaut-stats");
const eventDescriptionEl = document.getElementById("event-description");
const choicesPanelEl = document.getElementById("choices-panel");
const resultTextEl = document.getElementById("result-text");
const learningTextEl = document.getElementById("learning-text");
const deltaTextEl = document.getElementById("delta-text");
const startButton = document.getElementById("start-button");
const nextButton = document.getElementById("next-button");

let gameState;
let currentEvent = null;
let waitingForChoice = false;

const difficultyLevels = {
  normal: {
    label: "Normal",
    wearMultiplier: 1,
    dangerStress: 90,
    dangerCohesion: 10,
    dangerMorale: 10,
    dangerFatigue: 95,
    loseStress: 100,
    loseFatigue: 100,
    loseConflictRisk: 110, // effectively disabled at normal
  },
  hard: {
    label: "Hard",
    wearMultiplier: 1.35,
    dangerStress: 85,
    dangerCohesion: 15,
    dangerMorale: 15,
    dangerFatigue: 90,
    loseStress: 95,
    loseFatigue: 98,
    loseConflictRisk: 95,
  },
  veryHard: {
    label: "Very Hard",
    wearMultiplier: 1.5,
    dangerStress: 80,
    dangerCohesion: 20,
    dangerMorale: 20,
    dangerFatigue: 85,
    loseStress: 90,
    loseFatigue: 95,
    loseConflictRisk: 90,
  },
  impossible: {
    label: "Impossible",
    wearMultiplier: 1.75,
    dangerStress: 75,
    dangerCohesion: 25,
    dangerMorale: 25,
    dangerFatigue: 80,
    loseStress: 85,
    loseFatigue: 92,
    loseConflictRisk: 85,
  },
  insane: {
    label: "Insane",
    wearMultiplier: 2,
    dangerStress: 70,
    dangerCohesion: 25,
    dangerMorale: 25,
    dangerFatigue: 75,
    loseStress: 80,
  },
};

const difficulty = difficultyLevels.insane;

function removeElement(element) {
  if (!element) return;
  if (typeof element.remove === "function") {
    element.remove();
    return;
  }
  if (element.parentNode) {
    element.parentNode.removeChild(element);
  }
}

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
    usedOpening: false,
    usedMidConditional: false,
    pools: {
      opening: shuffleCopy(eventCatalog.opening),
      early: shuffleCopy(eventCatalog.early),
      midRandom: shuffleCopy(eventCatalog.midRandom),
      late: shuffleCopy(eventCatalog.late),
    },
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

const eventCatalog = {
  opening: [
  {
      id: "openingLaunchBriefing",
    description:
        "Launch Day Psychological Briefing: the crew receives a final rundown on emotional regulation before departure.",
    choices: [
      {
          text: "Lean into the breathing protocols the psychologist outlined.",
        effects: (state) => {
            state.astronauts.forEach((a) => (a.stress -= 5));
            state.cohesion += 2;
          },
          resultText: "Heart rates settle as everyone practices the routine together.",
          learningText:
            "Astronauts undergo psychological conditioning like emotional desensitization to manage fear and stay mission-focused.",
        },
        {
          text: "Let each crew member self-manage with their preferred tools.",
        effects: (state) => {
            state.morale += 2;
            state.cohesion -= 1;
          },
          resultText: "Autonomy feels good, but the team is slightly less synchronized.",
          learningText:
            "Self-directed coping can help morale, but cohesion benefits from shared rituals in isolated missions.",
        },
        {
          text: "Skip the drill and focus on launch tasks.",
        effects: (state) => {
            state.morale -= 2;
            state.astronauts.forEach((a) => (a.stress += 3));
          },
          resultText: "Tension lingers as the countdown continues.",
          learningText:
            "Neglecting emotional prep raises early stress, which can echo through long-duration missions.",
      },
    ],
  },
  {
      id: "openingCrewOrientation",
    description:
        "Crew Composition Orientation: a final session on how this specific mix of personalities tends to interact.",
    choices: [
      {
          text: "Discuss likely friction points openly.",
        effects: (state) => {
            state.cohesion += 3;
            state.conflictRisk -= 2;
          },
          resultText: "The crew acknowledges differences and agrees on norms.",
          learningText:
            "Early interpersonal patterns often persist across the entire mission, as seen in the 520-day simulation.",
        },
        {
          text: "Pair up crew for buddy checks during launch week.",
        effects: (state) => {
            state.cohesion += 2;
            state.astronauts.forEach((a) => (a.connection += 2));
          },
          resultText: "Small teams form quick support loops.",
          learningText:
            "Structured peer support can buffer stress spikes in isolated, confined environments.",
        },
        {
          text: "Rely on established SOPs instead of extra discussion.",
        effects: (state) => {
            state.conflictRisk += 3;
          },
          resultText: "SOPs hold, but unspoken tension remains.",
          learningText:
            "Ignoring early relational signals can allow conflict patterns to solidify over time.",
      },
    ],
  },
  {
      id: "openingFirstNight",
    description:
        "First Night in Transit: the crew experiences their first full sleep cycle away from Earth.",
    choices: [
      {
          text: "Set a shared wind-down routine with ambient soundscapes.",
        effects: (state) => {
            state.astronauts.forEach((a) => (a.stress -= 3));
            state.vrSystemHealth -= 2;
          },
          resultText: "The capsule feels calmer as lights dim and soundscapes play.",
          learningText:
            "Monotony, sensory deprivation, and isolation begin affecting stress responses almost immediately in ICE settings.",
        },
        {
          text: "Let everyone pick their own schedule for night one.",
        effects: (state) => {
            state.morale += 2;
            state.cohesion -= 2;
          },
          resultText: "Freedom feels good, but rhythms start to diverge.",
          learningText:
            "Divergent routines can erode cohesion if not realigned early in long missions.",
        },
        {
          text: "Compress sleep to finish extra checklists.",
        effects: (state) => {
            state.astronauts.forEach((a) => (a.fatigue += 5));
            state.morale -= 2;
          },
          resultText: "Tasks get done, but everyone feels the strain.",
          learningText:
            "Sleep disruption in confined environments quickly elevates fatigue and stress.",
      },
    ],
  },
  ],
  early: [
  {
      id: "earlyEmotionalDesensitization",
    description:
        "The crew tries a guided emotional desensitization module aimed at reducing acute stress responses.",
    choices: [
      {
          text: "Run the module together and debrief.",
        effects: (state) => {
            state.astronauts.forEach((a) => (a.stress -= 6));
            state.cohesion += 3;
        },
          resultText: "Shared practice lowers nerves and builds trust.",
          learningText:
            "Emotional desensitization training helps astronauts manage fear while keeping team cohesion intact.",
      },
      {
          text: "Assign it to the most stressed member first.",
        effects: (state) => {
            const target = findMaxStressIndex(state);
            state.astronauts[target].stress -= 12;
            state.nasaSupport -= 3;
          },
          resultText: "Focused help eases one crewmate’s load.",
          learningText:
            "Targeted intervention can steady a vulnerable individual before patterns spread.",
        },
        {
          text: "Delay; prioritize the flight plan review.",
        effects: (state) => {
            state.astronauts.forEach((a) => (a.stress += 4));
          state.morale -= 3;
        },
          resultText: "Stress rises as the crew stays task-focused.",
          learningText:
            "Skipping psychological prep early can magnify stress later in isolated missions.",
      },
    ],
  },
  {
      id: "earlyPatternDetection",
    description:
        "Early biometric trends hint that one crewmate is struggling more than others.",
    choices: [
      {
          text: "Intervene immediately with a light duty day.",
        effects: (state) => {
            const idx = findMaxStressIndex(state);
            state.astronauts[idx].stress -= 10;
            state.astronauts[idx].fatigue -= 4;
            state.nasaSupport -= 4;
          },
          resultText: "A pause helps them regain balance.",
          learningText:
            "The 520-day simulation showed early patterns predicted long-term performance.",
        },
        {
          text: "Rotate roles to spread cognitive load.",
          effects: (state) => {
            state.cohesion += 2;
          state.astronauts.forEach((a) => {
              a.fatigue += 2;
              a.stress -= 2;
          });
        },
          resultText: "Shared load calms nerves but adds mild fatigue.",
          learningText:
            "Role rotation can offset individual stress but must be balanced against fatigue.",
        },
        {
          text: "Log the data and monitor another week.",
          effects: (state) => {
            state.conflictRisk += 3;
            state.astronauts.forEach((a) => (a.stress += 2));
          },
          resultText: "Stress creeps upward while you wait.",
          learningText:
            "Delayed action risks letting stress trajectories harden in small crews.",
        },
      ],
    },
    {
      id: "earlyConflictSignals",
      description:
        "Subtle barbs surface during a routine meal, hinting at early conflict.",
      choices: [
        {
          text: "Facilitate a brief mediation right away.",
        effects: (state) => {
          state.cohesion += 5;
            state.conflictRisk -= 5;
            state.astronauts.forEach((a) => (a.fatigue += 2));
        },
          resultText: "Tension drops after a candid conversation.",
          learningText:
            "Addressing micro-conflicts early reduces the chance of escalation in ICE teams.",
      },
      {
          text: "Pair the two on a joint task to rebuild trust.",
        effects: (state) => {
            state.cohesion += 3;
            state.astronauts.forEach((a) => (a.stress += 1));
          },
          resultText: "Forced collaboration mends rapport slowly.",
          learningText:
            "Shared goals can rebind a strained dyad when monitored closely.",
        },
        {
          text: "Ignore it; assume professionalism will prevail.",
          effects: (state) => {
            state.conflictRisk += 6;
            state.morale -= 2;
          },
          resultText: "Resentment simmers beneath the surface.",
          learningText:
            "Unresolved interpersonal friction commonly grows in confined missions.",
      },
    ],
  },
  {
      id: "earlySleepDisruption",
    description:
        "Sleep monitors show circadian drift after several nights on the same schedule.",
    choices: [
      {
          text: "Implement strict lights-out and morning bright light.",
        effects: (state) => {
          state.astronauts.forEach((a) => {
              a.fatigue -= 6;
              a.stress -= 2;
          });
        },
          resultText: "Sleep debt eases, improving mood.",
          learningText:
            "Circadian alignment is critical; drift increases fatigue and cognitive slips.",
      },
      {
          text: "Allow flexible naps to compensate.",
        effects: (state) => {
            state.astronauts.forEach((a) => {
              a.fatigue -= 4;
              a.connection -= 1;
            });
            state.cohesion -= 1;
          },
          resultText: "Energy returns but routines desynchronize slightly.",
          learningText:
            "Uncoordinated schedules can erode cohesion even as fatigue improves.",
        },
        {
          text: "Delay action; gather more data.",
        effects: (state) => {
            state.astronauts.forEach((a) => (a.fatigue += 3));
            state.morale -= 2;
        },
          resultText: "Crew grows groggy and irritable.",
          learningText:
            "Sleep issues compound quickly in confined crews; delayed fixes raise risk.",
      },
    ],
  },
  {
      id: "earlyBHPSupport",
    description:
        "NASA Behavioral Health and Performance offers early check-ins.",
    choices: [
      {
          text: "Schedule full-crew sessions this month.",
        effects: (state) => {
            state.astronauts.forEach((a) => (a.stress -= 8));
            state.nasaSupport -= 10;
          },
          resultText: "The team feels heard and lighter.",
          learningText:
            "NASA BHP provides ongoing support to prevent early stress from escalating.",
        },
        {
          text: "Send only the most strained pair.",
        effects: (state) => {
            const idx = findMaxStressIndex(state);
            state.astronauts[idx].stress -= 12;
            state.nasaSupport -= 5;
        },
          resultText: "Targeted counseling stabilizes a key risk.",
          learningText:
            "Selective counseling can conserve resources while addressing peak stress.",
      },
      {
          text: "Decline for now; conserve support credits.",
        effects: (state) => {
            state.morale -= 3;
            state.astronauts.forEach((a) => (a.stress += 2));
        },
          resultText: "Crew feels slightly less supported.",
          learningText:
            "Withholding support can save resources but may erode morale in isolation.",
      },
    ],
  },
  {
      id: "earlyCommsRoutine",
    description:
        "You can establish an early communication cadence with mission control.",
    choices: [
      {
          text: "Set a daily check-in with short reflections.",
        effects: (state) => {
            state.cohesion += 2;
            state.morale += 2;
            state.nasaSupport -= 3;
          },
          resultText: "Regular contact reassures the team.",
          learningText:
            "Structured communication routines reduce uncertainty and support morale.",
        },
        {
          text: "Move to every-other-day to preserve bandwidth.",
          effects: (state) => {
            state.nasaSupport += 2;
            state.morale -= 1;
          },
          resultText: "Efficiency improves, reassurance dips.",
          learningText:
            "Sparse contact can conserve resources but may increase perceived isolation.",
        },
        {
          text: "Let crews ping ad hoc.",
          effects: (state) => {
            state.conflictRisk += 2;
            state.morale -= 1;
          },
          resultText: "Unstructured pings feel uneven.",
          learningText:
            "Unpredictable comms can heighten tension and uneven support perception.",
        },
      ],
    },
    {
      id: "earlyResourceAllocation",
      description:
        "Support resources must be allocated between crew care and mission systems.",
    choices: [
      {
          text: "Prioritize crew wellbeing now.",
        effects: (state) => {
            state.morale += 4;
            state.nasaSupport -= 6;
        },
          resultText: "Crew feels valued; support credits shrink.",
          learningText:
            "Early investments in wellbeing can prevent costly stress spirals later.",
      },
      {
          text: "Balance 50/50 between crew and systems.",
        effects: (state) => {
            state.morale += 1;
            state.vrSystemHealth += 2;
            state.nasaSupport -= 3;
          },
          resultText: "Both areas get moderate attention.",
          learningText:
            "Balanced allocation keeps multiple systems stable without overspending support.",
        },
        {
          text: "Defer crew perks; focus on systems.",
        effects: (state) => {
            state.morale -= 4;
            state.vrSystemHealth += 5;
        },
          resultText: "Systems hum while mood dips.",
          learningText:
            "Under-supporting people can undermine performance despite strong hardware.",
      },
    ],
  },
  {
      id: "earlyMonotonyCoping",
      description:
        "Early hints of monotony appear during repetitive maintenance tasks.",
    choices: [
      {
          text: "Rotate tasks daily to break sameness.",
        effects: (state) => {
          state.astronauts.forEach((a) => {
              a.fatigue += 2;
              a.stress -= 4;
          });
        },
          resultText: "Novelty refreshes the crew at a small energy cost.",
          learningText:
            "Coping with monotony early can prevent burnout in long isolation.",
      },
      {
          text: "Add brief creative breaks between tasks.",
        effects: (state) => {
            state.morale += 3;
            state.cohesion += 1;
          },
          resultText: "Morale lifts as creativity surfaces.",
          learningText:
            "Short, shared breaks can sustain morale without major schedule impact.",
        },
        {
          text: "Push through to stay ahead of schedule.",
          effects: (state) => {
            state.astronauts.forEach((a) => (a.stress += 3));
          state.morale -= 2;
        },
          resultText: "Efficiency rises while mood frays.",
          learningText:
            "Ignoring monotony increases stress load that accumulates over months.",
      },
    ],
  },
  ],
  midConditional: {
    highStress: {
      id: "midStressCascade",
      description:
        "Stress Cascade: multiple crew stress scores are trending high.",
    choices: [
      {
          text: "Mandate a recovery block with mindfulness drills.",
        effects: (state) => {
            state.astronauts.forEach((a) => {
              a.stress -= 10;
              a.fatigue -= 2;
            });
          state.nasaSupport -= 4;
          },
          resultText: "Stress drops after a focused reset.",
          learningText:
            "High stress across crew members often leads to compounding conflict in isolated environments.",
        },
        {
          text: "Rotate duties to lower individual load.",
          effects: (state) => {
            state.cohesion += 2;
          state.astronauts.forEach((a) => {
              a.stress -= 6;
              a.fatigue += 2;
          });
        },
          resultText: "Load balancing eases pressure but tires the crew.",
          learningText:
            "Redistributing workload can reduce stress but must watch for fatigue spikes.",
      },
      {
          text: "Stay the course and monitor daily.",
        effects: (state) => {
            state.conflictRisk += 5;
            state.morale -= 3;
          },
          resultText: "Stress keeps simmering.",
          learningText:
            "Letting high stress ride increases risk of interpersonal blowups.",
        },
      ],
    },
    lowCohesion: {
      id: "midCrewFracture",
      description:
        "Crew Fracture Warning: cohesion metrics have fallen sharply.",
      choices: [
        {
          text: "Hold an intensive cohesion workshop.",
        effects: (state) => {
            state.cohesion += 12;
            state.astronauts.forEach((a) => (a.fatigue += 3));
          },
          resultText: "Cohesion rebounds after hard conversations.",
          learningText:
            "Weakened cohesion dramatically increases mission failure risk in ICE missions.",
        },
        {
          text: "Pair strong connectors with isolated members.",
          effects: (state) => {
            state.cohesion += 6;
            state.astronauts.forEach((a) => (a.connection += 2));
          },
          resultText: "Bridging efforts start to mend fractures.",
          learningText:
            "Deliberate pairing can repair social fabric before fractures widen.",
        },
        {
          text: "Keep roles separated to avoid conflict.",
          effects: (state) => {
            state.cohesion -= 3;
            state.conflictRisk -= 1;
          },
          resultText: "Distance lowers immediate tension but erodes unity.",
          learningText:
            "Separation can cool tempers short-term but harms long-term resilience.",
      },
    ],
  },
    lowMorale: {
      id: "midEmotionalWithdrawal",
      description:
        "Emotional Withdrawal Onset: morale readings show disengagement.",
      choices: [
        {
          text: "Plan a shared meaning-making session.",
          effects: (state) => {
            state.morale += 10;
            state.cohesion += 3;
            state.astronauts.forEach((a) => (a.fatigue += 2));
          },
          resultText: "The crew reconnects with purpose.",
          learningText:
            "Emotional withdrawal is a known defense in isolated environments.",
        },
        {
          text: "Offer personal time with optional counseling.",
          effects: (state) => {
            state.morale += 6;
            state.nasaSupport -= 4;
          },
          resultText: "Individual space restores some motivation.",
          learningText:
            "Personalized support can counter withdrawal without forcing interaction.",
        },
        {
          text: "Push mission milestones to spark urgency.",
          effects: (state) => {
            state.morale -= 2;
            state.conflictRisk += 2;
          },
          resultText: "Pressure backfires, denting morale further.",
          learningText:
            "Coercive pressure often worsens morale declines in long missions.",
        },
      ],
    },
    highFatigue: {
      id: "midBurnoutThreshold",
    description:
        "Burnout Threshold: average fatigue is approaching dangerous levels.",
    choices: [
      {
          text: "Enforce staggered rest with workload triage.",
        effects: (state) => {
            state.astronauts.forEach((a) => (a.fatigue -= 12));
            state.conflictRisk -= 2;
          },
          resultText: "Fatigue drops, easing tempers.",
          learningText:
            "Chronic fatigue in space missions reduces cognitive flexibility and problem-solving.",
        },
        {
          text: "Swap to low-effort maintenance tasks only.",
        effects: (state) => {
            state.fatigueRecoveryBoost = 2;
            state.morale -= 1;
          },
          resultText: "Energy recovers slowly; morale dips from reduced variety.",
          learningText:
            "Lowering task load helps recovery but can reduce engagement.",
        },
        {
          text: "Ignore the warning to maintain schedule.",
        effects: (state) => {
          state.astronauts.forEach((a) => {
              a.fatigue += 4;
              a.stress += 3;
          });
        },
          resultText: "Exhaustion deepens across the crew.",
          learningText:
            "Pushing through fatigue drives error risk and interpersonal strain.",
      },
    ],
  },
    stable: {
      id: "midQuietMonth",
      description:
        "Quiet Month: systems are stable and the crew feels steady.",
      choices: [
        {
          text: "Invest time in preventative training.",
          effects: (state) => {
            state.cohesion += 2;
            state.conflictRisk -= 2;
            state.astronauts.forEach((a) => (a.fatigue += 2));
          },
          resultText: "Skills sharpen while energy dips slightly.",
          learningText:
            "Even uneventful months contribute to slow monotony buildup in long missions.",
        },
        {
          text: "Bank rest and keep routines light.",
          effects: (state) => {
            state.astronauts.forEach((a) => (a.fatigue -= 6));
            state.morale += 2;
          },
          resultText: "Crew rests and morale perks up.",
          learningText:
            "Strategic rest can extend resilience before heavy phases arrive.",
        },
        {
          text: "Advance experiments to get ahead.",
          effects: (state) => {
            state.morale += 1;
            state.astronauts.forEach((a) => (a.stress += 2));
          },
          resultText: "Progress improves outlook, stress ticks up.",
          learningText:
            "Productivity boosts can help morale but must be balanced against stress and fatigue.",
        },
      ],
    },
  },
  midRandom: [
    {
      id: "midVREarth",
    description:
        "VR Earth Simulation demand increases as the crew craves natural scenes.",
    choices: [
      {
          text: "Schedule regular sessions for all.",
        effects: (state) => {
            state.astronauts.forEach((a) => (a.stress -= 10));
            state.vrSystemHealth -= 10;
          },
          resultText: "Everyone feels closer to home; the VR rig strains.",
          learningText:
            "VR nature immersion can lower stress but consumes system health in long missions.",
        },
        {
          text: "Prioritize the most isolated crewmate.",
        effects: (state) => {
            const idx = findMaxStressIndex(state);
            state.astronauts[idx].stress -= 12;
            state.vrSystemHealth -= 4;
        },
          resultText: "One crewmate feels real relief.",
          learningText:
            "Targeted VR use can triage isolation without exhausting the system.",
      },
      {
          text: "Limit VR to conserve hardware.",
        effects: (state) => {
            state.cohesion += 2;
            state.astronauts.forEach((a) => (a.stress += 3));
        },
          resultText: "Stress rises without the virtual escape.",
          learningText:
            "Withholding VR preserves hardware but increases psychological load.",
      },
    ],
  },
  {
      id: "midAICompanion",
    description:
        "The AI companion update offers richer social interaction.",
    choices: [
      {
          text: "Install and encourage daily use.",
        effects: (state) => {
            state.morale += 6;
            state.conflictRisk -= 2;
            state.nasaSupport -= 3;
          },
          resultText: "The AI becomes a lighthearted outlet.",
          learningText:
            "Socially responsive AI can ease tension in isolated crews.",
        },
        {
          text: "Trial with one volunteer before rollout.",
        effects: (state) => {
            state.morale += 2;
            state.nasaSupport -= 1;
          },
          resultText: "A pilot test gives cautious confidence.",
          learningText:
            "Incremental tech adoption reduces risk while still offering benefits.",
        },
        {
          text: "Skip the update to avoid distractions.",
        effects: (state) => {
            state.morale -= 3;
        },
          resultText: "The AI stays utilitarian and distant.",
          learningText:
            "Avoiding social tools can conserve focus but may lower morale.",
      },
    ],
  },
  {
      id: "midResponsibilityConflict",
    description:
        "Crew conflict flares over uneven responsibilities.",
    choices: [
      {
          text: "Redistribute tasks transparently.",
        effects: (state) => {
            state.cohesion += 6;
            state.morale -= 1;
            state.astronauts.forEach((a) => (a.fatigue += 2));
          },
          resultText: "Fairness improves though everyone works harder.",
          learningText:
            "Transparent workload sharing curbs resentment in confined teams.",
        },
        {
          text: "Reward the over-performer with rest later.",
        effects: (state) => {
            state.astronauts[2].fatigue += 5;
            state.astronauts[2].stress += 3;
            state.morale += 2;
        },
          resultText: "One member strains while others feel grateful.",
          learningText:
            "Over-reliance on one expert can strain them even as morale lifts elsewhere.",
      },
      {
          text: "Enforce the current plan despite complaints.",
        effects: (state) => {
            state.cohesion -= 6;
            state.conflictRisk += 5;
          },
          resultText: "Resentment deepens.",
          learningText:
            "Ignoring fairness concerns increases conflict probability.",
      },
    ],
  },
  {
      id: "midCommsDelay",
    description:
        "A new communication delay window forces slower loops with mission control.",
    choices: [
      {
          text: "Hold a meeting to set expectations and coping plans.",
        effects: (state) => {
            state.cohesion += 3;
            state.morale -= 1;
          },
          resultText: "Acknowledgment eases frustration.",
          learningText:
            "Structured acknowledgement of comms stress can reduce negative affect.",
        },
        {
          text: "Request extra reassurance from HQ despite delay.",
          effects: (state) => {
            state.morale += 3;
          state.nasaSupport -= 4;
        },
          resultText: "Extra messages boost morale at resource cost.",
          learningText:
            "Additional support can buffer morale but uses limited bandwidth and support credits.",
        },
        {
          text: "Double down on internal protocols to compensate.",
          effects: (state) => {
            state.cohesion += 1;
            state.morale -= 2;
          },
          resultText: "Self-reliance rises; morale slips.",
          learningText:
            "Internal structure can offset external delays but may feel isolating.",
        },
      ],
    },
    {
      id: "midResourceRationing",
      description:
        "A supply forecast suggests tighter rationing might be prudent.",
      choices: [
        {
          text: "Tighten rations across the board.",
        effects: (state) => {
          state.morale -= 4;
            state.nasaSupport += 3;
          },
          resultText: "Conservation grows, spirits dip.",
          learningText:
            "Resource rationing can protect mission assets but often harms morale.",
        },
        {
          text: "Ration only non-critical comforts.",
          effects: (state) => {
            state.morale -= 2;
            state.nasaSupport += 1;
          },
          resultText: "Minor cutbacks feel tolerable.",
          learningText:
            "Selective rationing balances morale with prudent resource use.",
        },
        {
          text: "Maintain current levels and monitor weekly.",
          effects: (state) => {
            state.nasaSupport -= 2;
          },
          resultText: "Support credits shrink; crew comfort holds.",
          learningText:
            "Delaying rationing can preserve morale if supply risk stays low.",
      },
    ],
  },
  {
      id: "midCrisisAverted",
    description:
        "A minor systems anomaly is resolved quickly, leaving the crew keyed up.",
    choices: [
      {
          text: "Debrief as a team to integrate lessons.",
        effects: (state) => {
            state.cohesion += 3;
            state.conflictRisk -= 2;
        },
          resultText: "Shared learning steadies the team.",
          learningText:
            "Collaborative debriefs reduce blame and reinforce cohesion after stressors.",
      },
      {
          text: "Give everyone a short mental break.",
        effects: (state) => {
            state.astronauts.forEach((a) => (a.stress -= 4));
        },
          resultText: "Stress subsides with quiet time.",
          learningText:
            "Brief recovery windows can reset stress before it cascades.",
      },
      {
          text: "Push back to regular tasks immediately.",
        effects: (state) => {
            state.astronauts.forEach((a) => (a.fatigue += 2));
            state.morale -= 1;
        },
          resultText: "Team feels rushed and tired.",
          learningText:
            "Skipping recovery after a scare can erode resilience.",
      },
    ],
  },
  {
      id: "midOrgStressFlag",
    description:
        "Organizational analytics flag rising combined stress and fatigue.",
    choices: [
      {
          text: "Follow HQ recommendation for a recovery day.",
        effects: (state) => {
            state.astronauts.forEach((a) => {
              a.stress -= 6;
              a.fatigue -= 4;
            });
            state.nasaSupport -= 3;
          },
          resultText: "Recovery lowers risk indicators.",
          learningText:
            "Organizational monitoring can catch trends before they become crises.",
        },
        {
          text: "Half-day recovery, half productivity.",
        effects: (state) => {
          state.astronauts.forEach((a) => {
              a.stress -= 3;
              a.fatigue -= 2;
          });
        },
          resultText: "Balanced approach offers partial relief.",
          learningText:
            "Partial recovery can help while keeping output on track.",
      },
      {
          text: "Override and continue operations.",
        effects: (state) => {
          state.conflictRisk += 3;
            state.morale -= 2;
        },
          resultText: "Metrics worsen under continued pressure.",
          learningText:
            "Ignoring validated stress flags raises the odds of downstream failure.",
      },
    ],
  },
  ],
  late: [
  {
      id: "lateDeepMonotony",
    description:
        "Deep monotony sets in as routines feel endless.",
    choices: [
      {
          text: "Redesign a week of duties for novelty.",
        effects: (state) => {
          state.astronauts.forEach((a) => {
              a.stress -= 6;
            a.fatigue += 3;
          });
            state.cohesion += 2;
        },
          resultText: "Novelty revives interest at an energy cost.",
          learningText:
            "Late-phase monotony can erode resilience; structured variety helps.",
      },
      {
          text: "Introduce paired creative projects.",
        effects: (state) => {
          state.morale += 5;
            state.cohesion += 3;
        },
          resultText: "Shared creativity brightens the cabin.",
          learningText:
            "Collaborative creative time can rebuild morale after long isolation.",
      },
      {
          text: "Stay the course and emphasize discipline.",
        effects: (state) => {
            state.morale -= 4;
            state.astronauts.forEach((a) => (a.stress += 3));
          },
          resultText: "Discipline holds, mood sags.",
          learningText:
            "Rigid routines without relief amplify late-mission strain.",
      },
    ],
  },
  {
      id: "lateResentment",
    description:
        "Resentment builds over perceived unequal sacrifices.",
    choices: [
      {
          text: "Conduct a fairness audit and rebalance.",
        effects: (state) => {
            state.cohesion += 6;
            state.conflictRisk -= 3;
            state.astronauts.forEach((a) => (a.fatigue += 2));
        },
          resultText: "Transparency reduces resentment.",
          learningText:
            "Fairness perceptions strongly affect cohesion in long-duration crews.",
      },
      {
          text: "Offer compensatory downtime to the overworked.",
        effects: (state) => {
            const idx = findMaxFatigueIndex(state);
            state.astronauts[idx].fatigue -= 10;
          state.morale += 2;
        },
          resultText: "Rest cools frustration for the most taxed member.",
          learningText:
            "Restoring overloaded members can prevent conflict escalation.",
      },
      {
          text: "Deny grievances to keep focus on mission.",
        effects: (state) => {
            state.cohesion -= 5;
            state.conflictRisk += 5;
        },
          resultText: "Tension hardens into distrust.",
          learningText:
            "Dismissing late-mission grievances increases risk of open conflict.",
      },
    ],
  },
  {
      id: "lateCommsBlackout",
    description:
        "A prolonged communications blackout isolates the crew for days.",
    choices: [
      {
          text: "Run daily circles to process uncertainty.",
        effects: (state) => {
          state.cohesion += 4;
            state.morale -= 1;
        },
          resultText: "Talking helps keep unity despite anxiety.",
          learningText:
            "Open processing reduces distress during isolation from support networks.",
      },
      {
          text: "Keep busy with intensive tasking.",
        effects: (state) => {
            state.morale -= 2;
            state.astronauts.forEach((a) => (a.fatigue += 3));
        },
          resultText: "Work distracts but drains energy.",
          learningText:
            "Task loading can distract but may worsen fatigue during blackouts.",
      },
      {
          text: "Use VR and AI companions to simulate contact.",
        effects: (state) => {
            state.morale += 2;
            state.vrSystemHealth -= 3;
          },
          resultText: "Synthetic connection eases the gap.",
          learningText:
            "Simulated social contact can buffer isolation when real comms fail.",
        },
      ],
    },
    {
      id: "lateVRDegradation",
      description:
        "VR system degradation limits therapeutic sessions.",
      choices: [
        {
          text: "Allocate repair time immediately.",
        effects: (state) => {
            state.vrSystemHealth += 10;
            state.astronauts.forEach((a) => (a.fatigue += 4));
          },
          resultText: "System health rebounds; crew tires.",
          learningText:
            "Maintaining coping tech late in mission preserves resilience.",
        },
        {
          text: "Reserve remaining VR for highest-stress crewmate.",
        effects: (state) => {
            const idx = findMaxStressIndex(state);
            state.astronauts[idx].stress -= 10;
            state.vrSystemHealth -= 2;
          },
          resultText: "Targeted relief buys time.",
          learningText:
            "Prioritizing limited resources can mitigate peak stress cases.",
        },
        {
          text: "Retire VR and pivot to analog routines.",
          effects: (state) => {
            state.cohesion += 2;
            state.astronauts.forEach((a) => (a.stress += 4));
          },
          resultText: "The crew leans on each other more; stress rises.",
          learningText:
            "Losing tech support shifts load to social coping, which may strain the crew.",
      },
    ],
  },
  {
      id: "lateHopelessness",
      description:
        "One crew member expresses hopelessness about finishing the mission.",
    choices: [
      {
          text: "Initiate immediate one-on-one counseling.",
        effects: (state) => {
            const idx = findMaxStressIndex(state);
            state.astronauts[idx].stress -= 12;
            state.astronauts[idx].fatigue += 3;
            state.nasaSupport -= 5;
          },
          resultText: "They feel heard and slightly lighter.",
          learningText:
            "Late-mission hopelessness signals burnout that requires focused support.",
        },
        {
          text: "Organize a crew meaning-sharing session.",
        effects: (state) => {
            state.morale += 6;
            state.cohesion += 3;
            state.astronauts.forEach((a) => (a.fatigue += 2));
          },
          resultText: "Purpose is rekindled together.",
          learningText:
            "Shared purpose conversations can restore motivation after long strain.",
        },
        {
          text: "Redirect them to routine tasks to stay occupied.",
          effects: (state) => {
            state.astronauts.forEach((a) => (a.stress += 2));
            state.morale -= 2;
          },
          resultText: "Hopelessness lingers beneath busyness.",
          learningText:
            "Masking distress with tasks often fails to resolve underlying burnout.",
      },
    ],
  },
  ],
  finale: {
    high: {
      id: "finaleHighStability",
      description:
        "Final Approach: The crew arrives psychologically intact, bonded, and steady.",
      choices: [
        {
          text: "Acknowledge the shared resilience.",
          effects: () => {},
          resultText: "The team celebrates a healthy arrival.",
          learningText:
            "Strong support systems and cohesive teams increase resilience in ICE environments.",
        },
      ],
    },
    moderate: {
      id: "finaleModerateStability",
      description:
        "Final Approach: The crew reaches Mars strained but functional.",
    choices: [
      {
          text: "Commit to recovery time on arrival.",
          effects: () => {},
          resultText: "They make it, aware of the strain.",
          learningText:
            "Psychological strain accumulates slowly but can be mitigated through conscious decisions.",
        },
      ],
    },
    low: {
      id: "finaleLowStability",
      description:
        "Final Approach: The crew arrives fragmented and emotionally compromised.",
      choices: [
        {
          text: "Hold together for the final landing sequence.",
          effects: () => {},
          resultText: "They arrive, but bonds are frayed.",
          learningText:
            "Interpersonal breakdown is a common failure mode in long missions.",
        },
      ],
    },
    collapse: {
      id: "finaleCollapse",
      description:
        "Final Approach: Psychological collapse ends the mission before arrival.",
      choices: [
        {
          text: "Acknowledge the mission abort.",
          effects: () => {},
          resultText: "The journey stops short under psychological strain.",
          learningText:
            "Poor management of stress, cohesion, and support can end missions despite strong systems.",
        },
      ],
    },
  },
  danger: {
    highStress: {
      id: "dangerEmotionalBreakdown",
      description:
        "Danger Event: A crew member is on the edge of an emotional breakdown.",
      choices: [
        {
          text: "Pull them from duty and run emergency support.",
        effects: (state) => {
            const idx = findMaxStressIndex(state);
            state.astronauts[idx].stress -= 20;
            state.astronauts[idx].fatigue -= 5;
            state.nasaSupport -= 6;
          },
          resultText: "Crisis support stabilizes them.",
          learningText:
            "Emotional overload is a primary risk NASA BHP monitors in real time.",
        },
        {
          text: "Redistribute tasks to cover them.",
          effects: (state) => {
            state.cohesion += 2;
            state.astronauts.forEach((a, i) => {
              if (i !== findMaxStressIndex(state)) a.fatigue += 3;
          });
        },
          resultText: "Team absorbs the workload at a cost.",
          learningText:
            "Covering for a distressed member can raise fatigue but preserve safety.",
      },
      {
          text: "Urge them to push through.",
        effects: (state) => {
            state.conflictRisk += 6;
          state.morale -= 4;
        },
          resultText: "Risk of collapse increases.",
          learningText:
            "Pressuring a distressed crewmate can trigger failure cascades.",
      },
    ],
  },
    lowCohesion: {
      id: "dangerCrewSnap",
      description:
        "Danger Event: Cohesion is critically low and a crew member snaps.",
    choices: [
      {
          text: "Isolate conflict parties and mediate with authority.",
        effects: (state) => {
            state.cohesion += 10;
            state.conflictRisk -= 8;
            state.astronauts.forEach((a) => (a.stress += 2));
          },
          resultText: "Crisis is contained with firm mediation.",
          learningText:
            "Low cohesion makes crew conflict exponentially more likely in ICE settings.",
        },
        {
          text: "Reassign duties to separate them long-term.",
        effects: (state) => {
            state.cohesion -= 1;
            state.conflictRisk -= 4;
          },
          resultText: "Distance prevents immediate escalation.",
          learningText:
            "Separation can stop acute conflict but may slow cohesion repair.",
        },
        {
          text: "Ignore the outburst and keep working.",
        effects: (state) => {
            state.conflictRisk += 10;
            state.morale -= 5;
        },
          resultText: "Tension threatens mission safety.",
          learningText:
            "Unaddressed snapping can cascade into mission-ending conflict.",
      },
    ],
  },
    lowMorale: {
      id: "dangerRefusalToWork",
      description:
        "Danger Event: Morale has collapsed and a crew member refuses to work.",
    choices: [
      {
          text: "Pause operations for a morale intervention.",
        effects: (state) => {
            state.morale += 12;
            state.cohesion += 2;
            state.nasaSupport -= 4;
          },
          resultText: "Motivation partially recovers.",
          learningText:
            "Motivation collapse is a late-stage symptom in long isolation that needs rapid support.",
        },
        {
          text: "Reallocate tasks and promise compensatory rest.",
        effects: (state) => {
            state.cohesion += 1;
            state.astronauts.forEach((a) => (a.fatigue += 2));
          },
          resultText: "Work continues under strain.",
          learningText:
            "Redistribution can keep operations running but increases fatigue risk.",
        },
        {
          text: "Apply strict discipline measures.",
          effects: (state) => {
            state.morale -= 3;
            state.conflictRisk += 4;
          },
          resultText: "Compliance rises, resentment spikes.",
          learningText:
            "Coercion may restore output briefly while undermining morale further.",
      },
    ],
  },
    highFatigue: {
      id: "dangerMicroSleep",
      description:
        "Danger Event: Fatigue is extreme and a micro-sleep incident occurs.",
    choices: [
      {
          text: "Mandate immediate sleep rotations.",
        effects: (state) => {
            state.astronauts.forEach((a) => (a.fatigue -= 15));
            state.conflictRisk -= 2;
          },
          resultText: "Rest averts further incidents.",
          learningText:
            "Sleep deprivation in astronauts is linked to severe cognitive failures.",
        },
        {
          text: "Switch to only critical tasks with double checks.",
        effects: (state) => {
            state.astronauts.forEach((a) => (a.fatigue -= 8));
            state.morale -= 1;
          },
          resultText: "Safety improves while morale dips slightly.",
          learningText:
            "Reducing scope lowers risk while fatigue recovers.",
        },
        {
          text: "Power through and log the incident.",
          effects: (state) => {
            state.astronauts.forEach((a) => (a.fatigue += 2));
            state.conflictRisk += 3;
          },
          resultText: "Risk of another incident rises.",
          learningText:
            "Ignoring extreme fatigue invites repeated cognitive lapses.",
      },
    ],
  },
  },
};

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

function snapshotState(state) {
  return {
    cohesion: state.cohesion,
    morale: state.morale,
    conflictRisk: state.conflictRisk,
    nasaSupport: state.nasaSupport,
    vrSystemHealth: state.vrSystemHealth,
    astronauts: state.astronauts.map((a) => ({
      name: a.name,
      stress: a.stress,
      fatigue: a.fatigue,
      connection: a.connection,
    })),
  };
}

function shuffleCopy(arr) {
  const copy = arr.slice();
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function findMaxStressIndex(state) {
  let idx = 0;
  let max = -Infinity;
  state.astronauts.forEach((a, i) => {
    if (a.stress > max) {
      max = a.stress;
      idx = i;
    }
  });
  return idx;
}

function findMaxFatigueIndex(state) {
  let idx = 0;
  let max = -Infinity;
  state.astronauts.forEach((a, i) => {
    if (a.fatigue > max) {
      max = a.fatigue;
      idx = i;
    }
  });
  return idx;
}

function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function formatDelta(label, delta) {
  if (delta === 0) return null;
  const sign = delta > 0 ? "+" : "";
  return `${label} ${sign}${delta}`;
}

function describeDeltas(before, after) {
  const deltas = [];
  const core = [
    formatDelta("Cohesion", after.cohesion - before.cohesion),
    formatDelta("Morale", after.morale - before.morale),
    formatDelta("Conflict Risk", after.conflictRisk - before.conflictRisk),
    formatDelta("NASA Support", after.nasaSupport - before.nasaSupport),
    formatDelta("VR System", after.vrSystemHealth - before.vrSystemHealth),
  ].filter(Boolean);

  if (core.length) deltas.push(core.join(", "));

  const astroDeltas = after.astronauts
    .map((a, idx) => {
      const prev = before.astronauts[idx];
      const parts = [
        formatDelta("Stress", a.stress - prev.stress),
        formatDelta("Fatigue", a.fatigue - prev.fatigue),
        formatDelta("Connection", a.connection - prev.connection),
      ].filter(Boolean);
      if (!parts.length) return null;
      return `${a.name}: ${parts.join(", ")}`;
    })
    .filter(Boolean);

  if (astroDeltas.length) deltas.push(astroDeltas.join(" | "));

  if (!deltas.length) return "No stat changes.";
  return `Changes: ${deltas.join(" · ")}`;
}

function startGame() {
  gameState = createInitialState();
  currentEvent = null;
  waitingForChoice = false;
  resultTextEl.textContent = "";
  learningTextEl.textContent = "";
  deltaTextEl.textContent = "";
  startButton.disabled = true;
  nextButton.disabled = true;
  nextButton.textContent = "Next";
  const endSummary = document.getElementById("end-summary");
  removeElement(endSummary);
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
  currentEvent = getNextEventForPhase();
  waitingForChoice = true;
  resultTextEl.textContent = "";
  learningTextEl.textContent = "";
  deltaTextEl.textContent = "";
  render();
  renderChoices();
  nextButton.disabled = true;
}

function applyWearAndTear() {
  gameState.astronauts.forEach((astronaut) => {
    astronaut.stress += Math.round(randomBetween(2, 3) * difficulty.wearMultiplier);
    astronaut.fatigue += Math.round(randomBetween(2, 3) * difficulty.wearMultiplier);
  });

  gameState.morale -= Math.max(1, Math.round(1 * difficulty.wearMultiplier));

  gameState.conflictRisk += Math.max(1, Math.round(2 * difficulty.wearMultiplier));
  clampState(gameState);
}

function getAverageStress(state) {
  const total = state.astronauts.reduce((sum, a) => sum + a.stress, 0);
  return total / state.astronauts.length;
}

function getAverageFatigue(state) {
  const total = state.astronauts.reduce((sum, a) => sum + a.fatigue, 0);
  return total / state.astronauts.length;
}

function getDangerEventIfAny() {
  const avgStress = getAverageStress(gameState);
  const avgFatigue = getAverageFatigue(gameState);
  if (avgStress >= difficulty.dangerStress) return eventCatalog.danger.highStress;
  if (gameState.cohesion <= difficulty.dangerCohesion) return eventCatalog.danger.lowCohesion;
  if (gameState.morale <= difficulty.dangerMorale) return eventCatalog.danger.lowMorale;
  if (avgFatigue >= difficulty.dangerFatigue) return eventCatalog.danger.highFatigue;
  return null;
}

function getMidConditionalEvent() {
  const avgStress = getAverageStress(gameState);
  const avgFatigue = getAverageFatigue(gameState);
  if (avgStress >= 70) return eventCatalog.midConditional.highStress;
  if (gameState.cohesion <= 40) return eventCatalog.midConditional.lowCohesion;
  if (gameState.morale <= 40) return eventCatalog.midConditional.lowMorale;
  if (avgFatigue >= 60) return eventCatalog.midConditional.highFatigue;
  return eventCatalog.midConditional.stable;
}

function takeFromPool(poolName) {
  const pool = gameState.pools[poolName];
  if (!pool || pool.length === 0) return null;
  return pool.pop();
}

function getFinaleEvent() {
  const avgStress = getAverageStress(gameState);
  const avgFatigue = getAverageFatigue(gameState);
  const avgCore = (gameState.cohesion + gameState.morale + gameState.nasaSupport + gameState.vrSystemHealth) / 4;
  if (avgCore >= 75 && avgStress <= 40 && avgFatigue <= 50 && gameState.conflictRisk <= 30) {
    return eventCatalog.finale.high;
  }
  if (avgCore >= 55 && avgStress <= 60) return eventCatalog.finale.moderate;
  if (avgCore >= 35) return eventCatalog.finale.low;
  return eventCatalog.finale.collapse;
}

function getNextEventForPhase() {
  const danger = getDangerEventIfAny();
  if (danger) return danger;

  // Opening (month 1)
  if (!gameState.usedOpening) {
    gameState.usedOpening = true;
    const opening = takeFromPool("opening");
    if (opening) return opening;
  }

  // Early phase months 2-5 (4 events)
  if (gameState.month >= 2 && gameState.month <= 5) {
    const early = takeFromPool("early");
    if (early) return early;
  }

  // Mid-game conditional at month 6
  if (!gameState.usedMidConditional && gameState.month === 6) {
    gameState.usedMidConditional = true;
    return getMidConditionalEvent();
  }

  // Mid-game random months 7-11
  if (gameState.month >= 7 && gameState.month <= 11) {
    const midR = takeFromPool("midRandom");
    if (midR) return midR;
  }

  // Late-game months 12-16
  if (gameState.month >= 12 && gameState.month <= 16) {
    const late = takeFromPool("late");
    if (late) return late;
  }

  // Finale at month 17+
  if (gameState.month >= gameState.totalMonths) {
    return getFinaleEvent();
  }

  // Fallback
  return eventCatalog.midConditional.stable;
}

function handleChoice(choiceIndex) {
  if (!waitingForChoice || gameState.isGameOver) return;

  const choice = currentEvent.choices[choiceIndex];
  if (!choice) return;

  const before = snapshotState(gameState);
  choice.effects(gameState);
  clampState(gameState);

  const loseReason = checkLoseConditions();
  if (loseReason) {
    endGame("lose", loseReason);
    return;
  }

  resultTextEl.textContent = choice.resultText || "Decision logged.";
  learningTextEl.textContent = choice.learningText || "";
  deltaTextEl.textContent = describeDeltas(before, snapshotState(gameState));
  waitingForChoice = false;
  nextButton.disabled = false;
  disableChoiceButtons();
  render();
}

function disableChoiceButtons() {
  const buttons = choicesPanelEl.querySelectorAll("button");
  for (let i = 0; i < buttons.length; i += 1) {
    buttons[i].disabled = true;
  }
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

  const stressed = gameState.astronauts.find((a) => a.stress >= difficulty.loseStress);
  if (stressed) return `${stressed.name}'s stress reached critical levels.`;

  const exhausted = gameState.astronauts.find((a) => a.fatigue >= difficulty.loseFatigue);
  if (exhausted) return `${exhausted.name}'s fatigue reached critical levels.`;

  if (gameState.conflictRisk >= difficulty.loseConflictRisk) return "Conflict risk spiked beyond safe limits.";
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
  learningTextEl.textContent = "";
  deltaTextEl.textContent = "";
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
  removeElement(existing);
  eventDescriptionEl.parentElement.appendChild(summary);
}

function renderIntro() {
  eventDescriptionEl.textContent =
    "Guide your four-person crew across 17 months. Each decision affects morale, cohesion, stress, and support.";
  learningTextEl.textContent = "";
  deltaTextEl.textContent = "";
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
    button.type = "button";
    button.addEventListener("click", () => handleChoice(index));
    choicesPanelEl.appendChild(button);
  });
}

startButton.addEventListener("click", startGame);
nextButton.addEventListener("click", nextTurn);

renderIntro();
