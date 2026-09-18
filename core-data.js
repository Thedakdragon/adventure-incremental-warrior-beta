(() => {
  "use strict";

  const build = window.V11_BUILD || { id: "master", label: "Master" };

  const BALANCE = {
    startingEnergy: 100,

    skillXp: {
      level1Cost: 10,
      growthPerLevel: 1.02
    },

    adventurer: {
      schoolRequirement: 5,
      trainingBaseXp: 10,
      trainingEnergy: 10,
      fundsEnergy: 20,
      classTravelEnergy: 10,
      giveUpEnergy: 100000
    },

    timing: {
      targetSeconds: 0.75,
      maxSeconds: 1.50,
      minSeconds: 0.05
    },

    debug: {
      // Temporary QA switch. When enabled, task execution is resolved
      // immediately, but Energy/XP/progression use the normal simulation.
      instantTasks: false
    },

    progressionRewards: {
      // Progression content is benchmarked against one whole representative
      // Normal training ACTION for its stage. First-ever clears pay 200%;
      // later loop clears pay 130%. The total is divided among reward skills.
      firstClearMultiplier: 2.0,
      repeatMultiplier: 1.3
    },

    taskScaling: {
      // Energy scaling pivots around 100% proficiency:
      //   below 100%: multiplier = proficiency ^ -1.5
      //   above 100%: multiplier = proficiency ^ -0.75
      // The steeper underlevel side makes reaching too far ahead expensive;
      // the gentler overlevel discount prevents obsolete stages from collapsing
      // into the best farm simply because their Energy cost approaches zero.
      underlevelEnergyExponent: 1.50,
      overlevelEnergyExponent: 0.75,

      // Energy can never fall below 10% of the task's base Energy cost.
      minEnergyFraction: 0.10,

      // Prevent division/power blow-ups at true 0% proficiency. At this epsilon
      // the resulting Energy cost is intentionally far beyond a 100-Energy bar.
      underlevelMinProficiency: 0.01,

      // Tasks tagged guidedPractice add bonus proficiency for Energy/time scaling.
      // A bare `true` uses this default. This never changes the player's
      // actual skill level or raw proficiency; it only represents the benefit
      // of being actively instructed instead of learning by trial and error.
      defaultGuidedProficiencyBonus: 0.25
    },

    autosaveMs: 2000
  };

  const data = {
    build,
    BALANCE,
    SAVE_KEY: build.id === "master"
      ? "adventureIncremental_v13_w1"
      : `adventureIncremental_v13_w1_test_${build.id}`,
    SKILLS: {},
    CLASS_SKILLS: {},
    TASKS: [],
    STAGE2_TASKS: [],
    CLASS_TASKS: [],
    PATHS: {}
  };

  function addUnique(array, item, kind) {
    if (array.some(existing => existing.id === item.id)) {
      throw new Error(`Duplicate ${kind} id: ${item.id}`);
    }
    array.push(item);
  }

  data.registerAdventurer = function registerAdventurer(definition) {
    data.PATHS.adventurer = definition;

    Object.assign(data.SKILLS, definition.skills || {});
    for (const task of definition.stage1Tasks || []) {
      addUnique(data.TASKS, task, "task");
    }
    for (const task of definition.stage2Tasks || []) {
      addUnique(data.STAGE2_TASKS, task, "Stage 2 task");
    }
  };

  data.registerClassPath = function registerClassPath(definition) {
    if (!definition?.id || !definition?.classInfo) {
      throw new Error("Class path definitions require id and classInfo");
    }

    if (data.PATHS[definition.id]) {
      throw new Error(`Duplicate path id: ${definition.id}`);
    }

    data.PATHS[definition.id] = definition;
    data.CLASS_SKILLS[definition.id] = definition.classInfo;

    if (definition.travelFromAdventurer) {
      addUnique(data.STAGE2_TASKS, definition.travelFromAdventurer, "Stage 2 task");
    }

    const stages = definition.stages || {};
    for (const [stageNumber, stage] of Object.entries(stages)) {
      for (const rawTask of stage.tasks || []) {
        addUnique(data.CLASS_TASKS, {
          path: definition.id,
          stage: Number(stageNumber),
          ...rawTask
        }, "class task");
      }
    }
  };

  window.V11_GAME_DATA = data;
})();
