(() => {
  "use strict";

  const DATA = window.V11_GAME_DATA;
  if (!DATA) throw new Error("V11_GAME_DATA was not loaded before engine.js");

  const {
    BALANCE,
    SAVE_KEY,
    SKILLS,
    CLASS_SKILLS,
    TASKS,
    STAGE2_TASKS,
    CLASS_TASKS,
    PATHS
  } = DATA;

  const ALL_TASKS = [...TASKS, ...STAGE2_TASKS, ...CLASS_TASKS];

  function findTask(taskId) {
    return ALL_TASKS.find(task => task.id === taskId);
  }

  // ============================================================
  // SKILL DEFINITIONS / STATE
  // ============================================================
  function classSkillEntries(info) {
    if (info?.skills) return Object.values(info.skills);
    if (info?.skillId) {
      return [{ id: info.skillId, name: info.skillName, tag: info.className }];
    }
    return [];
  }

  function allKnownClassSkills() {
    const byId = new Map();
    for (const info of Object.values(CLASS_SKILLS)) {
      for (const entry of classSkillEntries(info)) {
        if (entry?.id && !byId.has(entry.id)) byId.set(entry.id, entry);
      }
    }
    return [...byId.values()];
  }

  function freshQaState() {
    return {
      buildTag: "V13-Warrior-Beta",
      activePlayMs: 0,
      taskStarts: {},
      taskCompletions: {},
      loopResets: 0,
      adventurerRestarts: 0,
      enteredWarrior: false,
      stageVisits: { warrior: {} },
      highestStage: { warrior: 0 },
      warriorClearActiveMs: null,
      warriorClearAt: null,
      warriorClearLoopNumber: null,
      warriorClearSkills: null
    };
  }

  function freshState() {
    const skills = {};

    for (const key of Object.keys(SKILLS)) {
      skills[key] = { level: 0, xpIntoLevel: 0, totalXp: 0 };
    }

    for (const entry of allKnownClassSkills()) {
      skills[entry.id] = { level: 0, xpIntoLevel: 0, totalXp: 0 };
    }

    const completed = {};
    for (const task of ALL_TASKS) completed[task.id] = false;

    return {
      energy: BALANCE.startingEnergy,
      maxEnergy: BALANCE.startingEnergy,
      skills,
      completed,
      firstClears: {},
      loopCount: {},
      qa: freshQaState(),
      trainingFunds: false,
      selectedClass: null,
      path: "adventurer",
      stage: 1
    };
  }

  function normalizeLoadedState(loaded) {
    const fresh = freshState();
    if (!loaded || typeof loaded !== "object") return fresh;

    const result = {
      ...fresh,
      ...loaded,
      skills: { ...fresh.skills, ...(loaded.skills || {}) },
      completed: { ...fresh.completed, ...(loaded.completed || {}) },
      firstClears: { ...(loaded.firstClears || {}) },
      loopCount: { ...(loaded.loopCount || {}) },
      qa: {
        ...fresh.qa,
        ...(loaded.qa || {}),
        taskStarts: { ...(loaded.qa?.taskStarts || {}) },
        taskCompletions: { ...(loaded.qa?.taskCompletions || {}) },
        stageVisits: {
          warrior: { ...(loaded.qa?.stageVisits?.warrior || {}) }
        },
        highestStage: {
          ...fresh.qa.highestStage,
          ...(loaded.qa?.highestStage || {})
        }
      }
    };

    for (const [id, skill] of Object.entries(result.skills)) {
      result.skills[id] = {
        level: Number.isFinite(skill?.level) ? skill.level : 0,
        xpIntoLevel: Number.isFinite(skill?.xpIntoLevel) ? skill.xpIntoLevel : 0,
        totalXp: Number.isFinite(skill?.totalXp) ? skill.totalXp : 0
      };
    }

    return result;
  }

  let state = normalizeLoadedState(loadState());
  let activeTask = null;
  let rafId = null;
  let qaActiveSince = null;

  function qaPageIsActive() {
    return !document.hidden && document.hasFocus();
  }

  function qaStartActiveTimer() {
    if (qaActiveSince === null && qaPageIsActive()) qaActiveSince = performance.now();
  }

  function qaCommitActiveTime() {
    if (qaActiveSince !== null) {
      state.qa.activePlayMs += Math.max(0, performance.now() - qaActiveSince);
      qaActiveSince = null;
    }
    if (qaPageIsActive()) qaActiveSince = performance.now();
  }

  function qaIncrement(bucket, id) {
    bucket[id] = (bucket[id] || 0) + 1;
  }

  function qaMarkStageVisit(path, stage) {
    if (path !== "warrior") return;
    state.qa.enteredWarrior = true;
    const key = String(stage);
    state.qa.stageVisits.warrior[key] = (state.qa.stageVisits.warrior[key] || 0) + 1;
    state.qa.highestStage.warrior = Math.max(state.qa.highestStage.warrior || 0, stage);
  }

  function qaSnapshotWarriorClear() {
    if (state.qa.warriorClearActiveMs !== null) return;
    qaCommitActiveTime();
    state.qa.warriorClearActiveMs = state.qa.activePlayMs;
    state.qa.warriorClearAt = new Date().toISOString();
    state.qa.warriorClearLoopNumber = (state.loopCount.warrior || 0) + 1;
    state.qa.warriorClearSkills = {};
    for (const id of ["warfare", "armored", "maneuvering", "vigilance", "valor"]) {
      state.qa.warriorClearSkills[id] = storedSkillLevel(id);
    }
  }

  qaStartActiveTimer();

  // ============================================================
  // XP / LEVEL MATH
  // ============================================================
  function xpToNextLevel(level) {
    return BALANCE.skillXp.level1Cost *
      Math.pow(BALANCE.skillXp.growthPerLevel, level);
  }

  function totalXpToReachLevel(targetLevel) {
    if (targetLevel <= 0) return 0;

    const g = BALANCE.skillXp.growthPerLevel;
    const base = BALANCE.skillXp.level1Cost;

    if (Math.abs(g - 1) < 1e-12) return base * targetLevel;
    return base * ((Math.pow(g, targetLevel) - 1) / (g - 1));
  }

  function xpForLevelSpan(startLevel, levels) {
    return Math.max(
      0,
      totalXpToReachLevel(startLevel + levels) - totalXpToReachLevel(startLevel)
    );
  }

  function storedSkillLevel(skillId, skillOverride = null) {
    const skillState = skillOverride || state.skills[skillId];
    return Number.isFinite(skillState?.level) ? skillState.level : 0;
  }

  // Future hook: contextual pre-postgame caps go here.
  function availableSkillLevel(skillId, skillOverride = null) {
    return storedSkillLevel(skillId, skillOverride);
  }

  // Future True Timeline projection hook. V13 deliberately contributes zero.
  function projectedSkillLevel(skillId) {
    void skillId;
    return 0;
  }

  function usableSkillLevel(skillId, skillOverride = null) {
    return Math.max(
      availableSkillLevel(skillId, skillOverride),
      projectedSkillLevel(skillId)
    );
  }

  function addSkillXpTo(skillObj, amount) {
    if (!skillObj || !Number.isFinite(amount) || amount <= 0) return;

    skillObj.totalXp += amount;
    skillObj.xpIntoLevel += amount;

    let guard = 0;
    while (guard++ < 1000000) {
      const needed = xpToNextLevel(skillObj.level);
      if (skillObj.xpIntoLevel + 1e-12 < needed) break;

      skillObj.xpIntoLevel -= needed;
      skillObj.level += 1;
    }
  }

  function addSkillXp(skillId, amount) {
    if (!state.skills[skillId]) {
      state.skills[skillId] = { level: 0, xpIntoLevel: 0, totalXp: 0 };
    }
    addSkillXpTo(state.skills[skillId], amount);
  }

  function xpNeededToGainOneLevel(skillId, skillOverride = null) {
    const s = skillOverride || state.skills[skillId];
    if (!s) return xpToNextLevel(0);
    return Math.max(0, xpToNextLevel(storedSkillLevel(skillId, s)) - s.xpIntoLevel);
  }

  function cloneSkill(skill) {
    return {
      level: skill?.level || 0,
      xpIntoLevel: skill?.xpIntoLevel || 0,
      totalXp: skill?.totalXp || 0
    };
  }

  // ============================================================
  // TASK NORMALIZATION
  // ============================================================
  function taskEnergyCost(task) {
    if (Number.isFinite(task.energyCost)) return task.energyCost;
    if (task.id === "earnFunds") return BALANCE.adventurer.fundsEnergy;
    return BALANCE.adventurer.trainingEnergy;
  }

  function taskSkillEntries(task) {
    if (Array.isArray(task.skills) && task.skills.length) {
      return task.skills.map(entry => ({
        id: entry.id,
        recommended: Number.isFinite(entry.recommended) ? entry.recommended : 0,
        weight: Number.isFinite(entry.weight) ? entry.weight : 1,
        xp: Number.isFinite(entry.xp) ? entry.xp : 0
      }));
    }

    if (task.skill) {
      return [{
        id: task.skill,
        recommended: Number.isFinite(task.expectedLevel) ? task.expectedLevel : 0,
        weight: 1,
        xp: Number.isFinite(task.xpReward)
          ? task.xpReward
          : BALANCE.adventurer.trainingBaseXp
      }];
    }

    return [];
  }

  function taskReferencedSkillIds(task) {
    const ids = new Set(taskSkillEntries(task).map(entry => entry.id));
    for (const id of Object.keys(task.xpRewards || {})) ids.add(id);
    for (const id of task.rewardSkills || []) ids.add(id);
    return [...ids].filter(Boolean);
  }

  function normalizeWeights(entries) {
    const total = entries.reduce((sum, entry) => sum + Math.max(0, entry.weight || 0), 0);
    if (total <= 0) return entries.map(() => 1 / Math.max(1, entries.length));
    return entries.map(entry => Math.max(0, entry.weight || 0) / total);
  }

  // Planned multi-skill rule:
  // - up to 100%, each skill contributes normally;
  // - while ANY required skill is below 100%, excess from stronger skills gets 50% credit;
  // - once all required skills meet threshold, excess gets full credit.
  function combineRequirementRatios(ratios, weights) {
    if (!ratios.length) return 1;
    const anyBelow = ratios.some(ratio => ratio < 1 - 1e-12);

    return ratios.reduce((sum, ratio, index) => {
      let effective = Math.max(0, ratio);
      if (anyBelow && effective > 1) {
        effective = 1 + (effective - 1) * 0.5;
      }
      return sum + effective * weights[index];
    }, 0);
  }

  // ============================================================
  // COMBAT POWER
  // ============================================================
  function combatRoleInfo(path) {
    const info = CLASS_SKILLS[path];
    if (!info?.skills) return null;
    const { combat, defense, mobility, perception } = info.skills;
    if (!combat || !defense || !mobility || !perception) return null;
    return { combat, defense, mobility, perception };
  }

  function legacyCombatBonus(path) {
    void path;
    // Future additive Legacy/perk Combat Power bonuses plug in here.
    return { ap: 0, dp: 0 };
  }

  function combatPowers(path, skillOverrides = null) {
    const roles = combatRoleInfo(path);
    if (!roles) return null;

    const getLevel = id => {
      const override = skillOverrides?.[id] || null;
      return usableSkillLevel(id, override);
    };

    const combat = getLevel(roles.combat.id);
    const defense = getLevel(roles.defense.id);
    const mobility = getLevel(roles.mobility.id);
    const perception = getLevel(roles.perception.id);
    const bonuses = legacyCombatBonus(path);

    const baseAp = combat * (1 + mobility / 1000);
    const baseDp = defense * (1 + perception / 1000);

    return {
      ap: baseAp * (1 + bonuses.ap),
      dp: baseDp * (1 + bonuses.dp),
      baseAp,
      baseDp,
      bonusAp: bonuses.ap,
      bonusDp: bonuses.dp
    };
  }

  function recommendedCombatPower(level) {
    return level * (1 + level / 1000);
  }

  // ============================================================
  // RECOMMENDED MINIMUM / ENERGY / SPEED
  // ============================================================
  function combatRecommendations(task) {
    if (Number.isFinite(task.recommendedAP) || Number.isFinite(task.recommendedDP)) {
      const ap = Number.isFinite(task.recommendedAP) ? task.recommendedAP : task.recommendedDP;
      const dp = Number.isFinite(task.recommendedDP) ? task.recommendedDP : task.recommendedAP;
      return { ap: Math.max(0, ap || 0), dp: Math.max(0, dp || 0), level: null };
    }

    if (Number.isFinite(task.recommendedLevel)) {
      const expected = recommendedCombatPower(task.recommendedLevel);
      return { ap: expected, dp: expected, level: task.recommendedLevel };
    }

    return null;
  }

  function taskRawProficiency(task, skillOverrides = null) {
    if (task.type === "combat") {
      const target = combatRecommendations(task);
      if (!target) return 1;

      const powers = combatPowers(task.path, skillOverrides);
      if (!powers) return 1;

      const ratios = [];
      const weights = [];
      if (target.ap > 0) { ratios.push(powers.ap / target.ap); weights.push(0.5); }
      if (target.dp > 0) { ratios.push(powers.dp / target.dp); weights.push(0.5); }
      if (!ratios.length) return 1;

      return combineRequirementRatios(ratios, weights);
    }

    const entries = taskSkillEntries(task);
    if (!entries.length) return 1;

    const weights = normalizeWeights(entries);
    const ratios = entries.map(entry => {
      if (entry.recommended <= 0) return 1;
      const override = skillOverrides?.[entry.id] || null;
      return usableSkillLevel(entry.id, override) / entry.recommended;
    });

    return combineRequirementRatios(ratios, weights);
  }

  function guidedPracticeProficiencyBonus(task) {
    const guided = task?.guidedPractice;
    if (!guided) return 0;

    if (Number.isFinite(guided)) {
      return Math.max(0, guided);
    }

    if (typeof guided === "object" && Number.isFinite(guided.proficiencyBonus)) {
      return Math.max(0, guided.proficiencyBonus);
    }

    return Math.max(0, BALANCE.taskScaling.defaultGuidedProficiencyBonus || 0);
  }

  function taskScalingProficiency(task, skillOverrides = null) {
    const raw = taskRawProficiency(task, skillOverrides);
    const guidedBonus = guidedPracticeProficiencyBonus(task);
    return Math.max(0, raw + guidedBonus);
  }

  // Gameplay checks that explicitly want the player's actual proficiency use
  // this alias. Guided Practice only modifies Energy/time scaling.
  function taskProficiency(task, skillOverrides = null) {
    return taskRawProficiency(task, skillOverrides);
  }

  function underlevelEnergyMultiplier(proficiency) {
    // p = current proficiency / Recommended Minimum.
    // Anchors intentionally match the design targets:
    //   p = 0.80 -> 1.20x Energy
    //   p = 0.50 -> 2.00x Energy
    // From there the penalty accelerates rapidly toward zero proficiency, so
    // severely underleveled content becomes practically impossible on a normal
    // Energy bar without requiring a hard level gate.
    const minP = BALANCE.taskScaling.underlevelMinProficiency;
    const p = Math.max(minP, Math.min(1, proficiency));
    const deficit = 1 - p;
    const severity = (4 - 2 * p) / 3;

    return 1 + (deficit / p) * severity;
  }

  function taskEnergyMultiplier(task, skillOverrides = null) {
    const proficiency = taskScalingProficiency(task, skillOverrides);

    if (proficiency < 1) {
      return underlevelEnergyMultiplier(proficiency);
    }

    return Math.max(
      BALANCE.taskScaling.minEnergyFraction,
      1 / Math.max(1, proficiency)
    );
  }

  // Future speed effects (perks/prestige/etc.) enter here. Their bonus above 1
  // is only applied in proportion to how much of the task's recommendation the
  // player actually meets. Current V13 has no external speed bonuses yet.
  function rawExternalTaskSpeedMultiplier(task) {
    void task;
    return 1;
  }

  function effectiveExternalTaskSpeedMultiplier(task, proficiency) {
    const raw = Math.max(0.000001, rawExternalTaskSpeedMultiplier(task));
    const effectiveness = Math.max(0, Math.min(1, proficiency));
    return 1 + (raw - 1) * effectiveness;
  }

  function taskDurationAtCurrentSpeed(task, skillOverrides = null) {
    const proficiency = taskScalingProficiency(task, skillOverrides);
    const external = effectiveExternalTaskSpeedMultiplier(task, proficiency);
    const speedFactor = Math.max(0.000001, proficiency * external);

    const baseDuration = clamp(
      BALANCE.timing.targetSeconds / speedFactor,
      BALANCE.timing.minSeconds,
      BALANCE.timing.maxSeconds
    );
    const timeMultiplier = Number.isFinite(task.timeMultiplier)
      ? Math.max(0.01, task.timeMultiplier)
      : 1;

    return clamp(
      baseDuration * timeMultiplier,
      BALANCE.timing.minSeconds,
      BALANCE.timing.maxSeconds
    );
  }

  function taskEnergyPerFullProgress(task, skillOverrides = null) {
    return taskEnergyCost(task) * taskEnergyMultiplier(task, skillOverrides);
  }

  // ============================================================
  // XP REWARD RESOLUTION
  // ============================================================
  function stageTrainingBenchmark(task) {
    const stage = PATHS[task.path]?.stages?.[task.stage];
    const benchmark = stage?.trainingBenchmark;
    if (!benchmark) return null;

    const recommendedLevel = Number.isFinite(benchmark.recommendedLevel)
      ? Math.max(0, benchmark.recommendedLevel)
      : 0;
    const totalXp = Number.isFinite(benchmark.totalXp)
      ? Math.max(0, benchmark.totalXp)
      : 0;

    return { recommendedLevel, totalXp };
  }

  function progressionRewardMultipliers(task) {
    const cfg = task?.progressionReward;
    if (!cfg) return null;

    const overrides = typeof cfg === "object" ? cfg : {};
    return {
      first: Number.isFinite(overrides.firstMultiplier)
        ? Math.max(0, overrides.firstMultiplier)
        : BALANCE.progressionRewards.firstClearMultiplier,
      repeat: Number.isFinite(overrides.repeatMultiplier)
        ? Math.max(0, overrides.repeatMultiplier)
        : BALANCE.progressionRewards.repeatMultiplier
    };
  }

  function progressionXpTierScale(skillId, benchmarkLevel, skillOverrides = null) {
    if (benchmarkLevel <= 0) return 1;
    const override = skillOverrides?.[skillId] || null;
    const currentLevel = storedSkillLevel(skillId, override);
    if (currentLevel >= benchmarkLevel) return 1;

    // Fixed late-stage XP numbers explode when awarded hundreds of levels
    // early because the core XP curve is exponential. Scale progression
    // rewards to the rewarded skill's current XP tier until it reaches this
    // stage's Normal-training tier. This is XP normalization, not a level cap.
    const currentTier = xpToNextLevel(currentLevel);
    const benchmarkTier = xpToNextLevel(benchmarkLevel);
    return benchmarkTier > 0
      ? Math.max(0, Math.min(1, currentTier / benchmarkTier))
      : 1;
  }

  function addProgressionXpRewards(task, rewards, skillOverrides = null) {
    const multipliers = progressionRewardMultipliers(task);
    const benchmark = stageTrainingBenchmark(task);
    const ids = Array.isArray(task.rewardSkills) ? task.rewardSkills : [];
    if (!multipliers || !benchmark || benchmark.totalXp <= 0 || !ids.length) return;

    const isFirst = !state.firstClears[task.id];
    const multiplier = isFirst ? multipliers.first : multipliers.repeat;
    const actionTotal = benchmark.totalXp * multiplier;
    const perSkillBeforeTierScale = actionTotal / ids.length;

    for (const id of ids) {
      const scale = progressionXpTierScale(id, benchmark.recommendedLevel, skillOverrides);
      rewards[id] = (rewards[id] || 0) + perSkillBeforeTierScale * scale;
    }
  }

  function baseTaskXpRewards(task, skillOverrides = null) {
    const rewards = {};

    for (const entry of taskSkillEntries(task)) {
      if (entry.xp > 0) rewards[entry.id] = (rewards[entry.id] || 0) + entry.xp;
    }

    for (const [id, amount] of Object.entries(task.xpRewards || {})) {
      if (Number.isFinite(amount) && amount > 0) {
        rewards[id] = (rewards[id] || 0) + amount;
      }
    }

    addProgressionXpRewards(task, rewards, skillOverrides);

    // Backward compatibility for unfinished paths still using the old model.
    if (task.firstClearLevelSpan && Array.isArray(task.rewardSkills)) {
      const span = task.firstClearLevelSpan;
      const firstAmount = xpForLevelSpan(span.start, span.levels);
      const isFirst = !state.firstClears[task.id];
      const amount = isFirst
        ? firstAmount
        : firstAmount * (Number.isFinite(task.repeatFraction) ? task.repeatFraction : 0.1);
      for (const id of task.rewardSkills) rewards[id] = amount;
    }

    if (task.levelSpanReward && Array.isArray(task.rewardSkills)) {
      const span = task.levelSpanReward;
      const amount = xpForLevelSpan(span.start, span.levels);
      for (const id of task.rewardSkills) rewards[id] = amount;
    }

    return rewards;
  }

  function resolvedTaskXpRewards(task, skillOverrides = null) {
    const rewards = baseTaskXpRewards(task, skillOverrides);

    // The optional-boss floor is FINAL XP and receives no further multiplier.
    if (task.floorOneLevel) {
      for (const id of Object.keys(rewards)) {
        const override = skillOverrides?.[id] || null;
        rewards[id] = Math.max(rewards[id], xpNeededToGainOneLevel(id, override));
      }
    }

    return rewards;
  }

  function totalRewardXp(rewards) {
    return Object.values(rewards).reduce((sum, amount) => sum + amount, 0);
  }

  // ============================================================
  // TASK AVAILABILITY / LOOP RULES
  // ============================================================
  function allMandatoryComplete() {
    return TASKS.every(task => !task.mandatory || state.completed[task.id]);
  }

  function classStageMandatoryComplete(path, stage) {
    return CLASS_TASKS.every(task =>
      task.path !== path ||
      task.stage !== stage ||
      !task.mandatory ||
      state.completed[task.id]
    );
  }

  function stage2ClassRequirementMet(task) {
    if (task.type !== "travel" || task.path !== "adventurer" || task.stage !== 2) {
      return true;
    }

    return Boolean(
      state.skills[task.requirementSkill] &&
      usableSkillLevel(task.requirementSkill) >= BALANCE.adventurer.schoolRequirement
    );
  }

  function normalizedTaskPath(task) {
    return task.path || "adventurer";
  }

  function normalizedTaskStage(task) {
    return Number.isFinite(task.stage) ? task.stage : 1;
  }

  function canStartTask(task) {
    if (activeTask) return false;
    if (state.energy <= 0) return false;

    if (
      normalizedTaskPath(task) !== state.path ||
      normalizedTaskStage(task) !== state.stage
    ) {
      return false;
    }

    if (!task.repeatable && state.completed[task.id]) return false;

    if (Array.isArray(task.requiresTasks)) {
      if (task.requiresTasks.some(requiredId => !state.completed[requiredId])) return false;
    }

    if (
      task.path === "adventurer" &&
      task.stage === 2 &&
      task.type === "travel" &&
      !stage2ClassRequirementMet(task)
    ) {
      return false;
    }

    if (
      task.type === "travel" &&
      task.path !== "adventurer" &&
      task.requiresMandatory !== false &&
      !classStageMandatoryComplete(task.path, task.stage)
    ) {
      return false;
    }

    return true;
  }

  function clearClassLoopCompletion(path) {
    for (const task of CLASS_TASKS) {
      if (task.path === path) state.completed[task.id] = false;
    }
  }

  function resetClassLoop(path = state.path) {
    if (!CLASS_SKILLS[path]) return;

    clearClassLoopCompletion(path);
    state.energy = state.maxEnergy;
    state.path = path;
    state.stage = 1;
    state.loopCount[path] = (state.loopCount[path] || 0) + 1;
    state.qa.loopResets += 1;
    qaMarkStageVisit(path, 1);
    activeTask = null;

    if (rafId) cancelAnimationFrame(rafId);
    saveState();
    showCurrentLocation();
    render();
  }

  // ============================================================
  // TASK SIMULATION / EXECUTION
  // ============================================================
  function buildSimSkillMap(task) {
    const map = {};
    for (const id of taskReferencedSkillIds(task)) {
      map[id] = cloneSkill(state.skills[id]);
    }
    return map;
  }

  function simulateTask(task, availableEnergy = Infinity) {
    const simSkills = buildSimSkillMap(task);
    const step = 0.0005;
    const rewardMap = resolvedTaskXpRewards(task, simSkills);

    if (taskEnergyCost(task) <= 0) {
      return {
        progress: 1,
        xpRewards: rewardMap,
        xp: totalRewardXp(rewardMap),
        seconds: 0,
        energyUsed: 0,
        complete: true
      };
    }

    let progress = 0;
    let seconds = 0;
    let energyUsed = 0;
    const earned = {};

    while (progress < 1 - 1e-12) {
      let dp = Math.min(step, 1 - progress);
      const durationForFullTask = taskDurationAtCurrentSpeed(task, simSkills);
      const energyForFullTask = taskEnergyPerFullProgress(task, simSkills);

      let sliceTime = durationForFullTask * dp;
      let sliceEnergy = energyForFullTask * dp;
      const energyRemaining = availableEnergy - energyUsed;

      if (sliceEnergy > energyRemaining + 1e-12) {
        if (energyRemaining <= 0) break;
        const fractionAffordable = energyRemaining / sliceEnergy;
        dp *= fractionAffordable;
        sliceTime *= fractionAffordable;
        sliceEnergy = energyRemaining;
      }

      if (dp <= 0) break;

      progress += dp;
      seconds += sliceTime;
      energyUsed += sliceEnergy;

      if (!task.xpOnComplete) {
        for (const [id, fullAmount] of Object.entries(rewardMap)) {
          const gained = fullAmount * dp;
          earned[id] = (earned[id] || 0) + gained;
          addSkillXpTo(simSkills[id], gained);
        }
      }

      if (energyUsed >= availableEnergy - 1e-10 && progress < 1 - 1e-10) break;
    }

    const complete = progress >= 1 - 1e-8;

    if (task.xpOnComplete && complete) {
      for (const [id, amount] of Object.entries(rewardMap)) earned[id] = amount;
    }

    return {
      progress: Math.min(1, progress),
      xpRewards: earned,
      xp: totalRewardXp(earned),
      seconds,
      energyUsed,
      complete
    };
  }

  function estimateTaskOutcome(task) {
    return {
      full: simulateTask(task, Infinity),
      current: simulateTask(task, state.energy)
    };
  }

  function resolveTaskInstantly(task) {
    // Use the same progressive simulation that powers the task estimates.
    // This preserves dynamic XP-driven proficiency changes, Energy scaling,
    // partial progress on Energy depletion, and XP-on-complete behavior; only
    // the real-world waiting time is skipped.
    const outcome = simulateTask(task, state.energy);

    state.energy = Math.max(0, state.energy - outcome.energyUsed);
    for (const [id, amount] of Object.entries(outcome.xpRewards || {})) {
      addSkillXp(id, amount);
    }

    activeTask = null;

    if (outcome.complete) {
      completeTask(task, true);
      return;
    }

    if (state.energy <= 1e-8) {
      state.energy = 0;
      endTaskFromEnergyDepletion(task);
      return;
    }

    saveState();
    render();
  }

  function startTask(taskId) {
    const task = findTask(taskId);
    if (!task || !canStartTask(task)) return;

    qaIncrement(state.qa.taskStarts, task.id);

    activeTask = {
      taskId,
      progress: 0,
      lastTime: performance.now()
    };

    if (BALANCE.debug?.instantTasks) {
      resolveTaskInstantly(task);
      return;
    }

    render();
    tickTask(performance.now());
  }

  function tickTask(now) {
    if (!activeTask) return;

    const task = findTask(activeTask.taskId);
    if (!task) {
      activeTask = null;
      render();
      return;
    }

    const dtRequested = Math.max(0, Math.min(0.25, (now - activeTask.lastTime) / 1000));
    activeTask.lastTime = now;

    const durationForFullTask = taskDurationAtCurrentSpeed(task);
    const energyForFullTask = taskEnergyPerFullProgress(task);
    let desiredProgress = dtRequested / durationForFullTask;
    desiredProgress = Math.min(desiredProgress, 1 - activeTask.progress);

    if (energyForFullTask > 0) {
      desiredProgress = Math.min(desiredProgress, state.energy / energyForFullTask);
    }

    if (desiredProgress > 0) {
      const energySpent = energyForFullTask * desiredProgress;
      state.energy = Math.max(0, state.energy - energySpent);

      if (!task.xpOnComplete) {
        const rewardMap = resolvedTaskXpRewards(task);
        for (const [id, fullAmount] of Object.entries(rewardMap)) {
          addSkillXp(id, fullAmount * desiredProgress);
        }
      }

      activeTask.progress += desiredProgress;
    }

    renderEnergy();
    renderSkills();
    renderClassArea();
    renderRunningProgress();

    if (activeTask.progress >= 1 - 1e-8) {
      completeTask(task);
      return;
    }

    if (state.energy <= 1e-8) {
      state.energy = 0;
      endTaskFromEnergyDepletion(task);
      return;
    }

    rafId = requestAnimationFrame(tickTask);
  }

  function renderRunningProgress() {
    if (!activeTask) return;
    const fill = document.querySelector(`[data-progress="${activeTask.taskId}"]`);
    if (fill) fill.style.width = `${Math.min(100, activeTask.progress * 100)}%`;
  }

  function completeTask(task, xpAlreadyApplied = false) {
    qaIncrement(state.qa.taskCompletions, task.id);

    if (task.xpOnComplete && !xpAlreadyApplied) {
      const rewardMap = resolvedTaskXpRewards(task);
      for (const [id, amount] of Object.entries(rewardMap)) addSkillXp(id, amount);
    }

    if (task.firstClearTracked || task.progressionReward) state.firstClears[task.id] = true;
    if (task.id === "warriorDefeatMastermind") qaSnapshotWarriorClear();

    if (!task.repeatable) state.completed[task.id] = true;
    if (task.id === "earnFunds") state.trainingFunds = true;

    activeTask = null;

    if (task.type === "travel" && task.destination) {
      // Class-path travel is part of the same 100-Energy push. Reaching the
      // next area with literally zero Energy means the loop ended before the
      // player could establish themselves there, so reset instead.
      if (CLASS_SKILLS[state.path] && state.energy <= 1e-8) {
        resetClassLoop(state.path);
        return;
      }

      if (task.className) state.selectedClass = task.className;
      travelTo(task.destination);
      return;
    }

    if (task.type === "giveUp") {
      saveState();
      showStage2Failure();
      return;
    }

    saveState();

    if (state.energy <= 1e-8) {
      if (state.path === "adventurer" && state.stage === 1) {
        showFailure();
        return;
      }
      if (state.path === "adventurer" && state.stage === 2) {
        showStage2Failure();
        return;
      }
      if (CLASS_SKILLS[state.path]) {
        resetClassLoop(state.path);
        return;
      }
    }

    render();
  }

  function endTaskFromEnergyDepletion(task) {
    activeTask = null;
    saveState();

    if (state.path === "adventurer" && state.stage === 1) {
      showFailure();
    } else if (state.path === "adventurer" && state.stage === 2) {
      showStage2Failure();
    } else if (CLASS_SKILLS[state.path]) {
      resetClassLoop(state.path);
    } else {
      render();
    }
  }

  function travelTo(destination) {
    if (!destination || activeTask) return;

    const enteringClassFromAdventurer =
      state.path === "adventurer" && Boolean(CLASS_SKILLS[destination.path]);

    state.path = destination.path;
    state.stage = destination.stage;
    qaMarkStageVisit(state.path, state.stage);

    // Choosing a class begins that class's first real loop. Adventurer prep
    // should not leave the player starting Warrior/Mage/etc. on 10 leftover
    // Energy just because they paid the Capital travel cost.
    if (enteringClassFromAdventurer) {
      state.energy = state.maxEnergy;
      state.loopCount[destination.path] = state.loopCount[destination.path] || 0;
      clearClassLoopCompletion(destination.path);
    }

    saveState();
    showCurrentLocation();
  }

  // ============================================================
  // SAVE / RESET
  // ============================================================
  function saveState() {
    qaCommitActiveTime();
    localStorage.setItem(SAVE_KEY, JSON.stringify({
      version: 13,
      state,
      balance: {
        xpGrowth: BALANCE.skillXp.growthPerLevel,
        trainingEnergy: BALANCE.adventurer.trainingEnergy,
        fundsEnergy: BALANCE.adventurer.fundsEnergy,
        targetTaskTime: BALANCE.timing.targetSeconds,
        maxTaskTime: BALANCE.timing.maxSeconds,
        minTaskTime: BALANCE.timing.minSeconds,
        minEnergyFraction: BALANCE.taskScaling.minEnergyFraction,
        instantTasks: Boolean(BALANCE.debug?.instantTasks)
      }
    }));
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);

      if (parsed.balance) {
        if (Number.isFinite(parsed.balance.xpGrowth)) {
          BALANCE.skillXp.growthPerLevel = parsed.balance.xpGrowth;
        }
        if (Number.isFinite(parsed.balance.trainingEnergy)) {
          BALANCE.adventurer.trainingEnergy = parsed.balance.trainingEnergy;
        }
        if (Number.isFinite(parsed.balance.fundsEnergy)) {
          BALANCE.adventurer.fundsEnergy = parsed.balance.fundsEnergy;
        }
        if (Number.isFinite(parsed.balance.targetTaskTime)) {
          BALANCE.timing.targetSeconds = parsed.balance.targetTaskTime;
        }
        if (Number.isFinite(parsed.balance.maxTaskTime)) {
          BALANCE.timing.maxSeconds = parsed.balance.maxTaskTime;
        }
        if (Number.isFinite(parsed.balance.minTaskTime)) {
          BALANCE.timing.minSeconds = parsed.balance.minTaskTime;
        }
        if (Number.isFinite(parsed.balance.minEnergyFraction)) {
          BALANCE.taskScaling.minEnergyFraction = parsed.balance.minEnergyFraction;
        }
        if (typeof parsed.balance.instantTasks === "boolean") {
          BALANCE.debug.instantTasks = parsed.balance.instantTasks;
        }
      }

      return parsed.state || null;
    } catch (err) {
      console.warn("Save load failed:", err);
      return null;
    }
  }

  function wipeSave() {
    if (!confirm("Wipe the beta save and restart Adventurer Stage 1?")) return;
    localStorage.removeItem(SAVE_KEY);
    state = freshState();
    qaActiveSince = qaPageIsActive() ? performance.now() : null;
    activeTask = null;
    if (rafId) cancelAnimationFrame(rafId);
    showCurrentLocation();
    render();
  }

  function resetStage1Failure() {
    const preservedQa = state.qa;
    preservedQa.adventurerRestarts += 1;
    localStorage.removeItem(SAVE_KEY);
    state = freshState();
    state.qa = preservedQa;
    activeTask = null;
    if (rafId) cancelAnimationFrame(rafId);
    showCurrentLocation();
    render();
  }

  function debugResetClassLoop() {
    if (CLASS_SKILLS[state.path]) resetClassLoop(state.path);
  }

  function qaFormatDuration(ms) {
    const totalSeconds = Math.max(0, Math.floor(ms / 1000));
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const sec = totalSeconds % 60;
    if (h > 0) return `${h}h ${String(m).padStart(2, "0")}m ${String(sec).padStart(2, "0")}s`;
    return `${m}m ${String(sec).padStart(2, "0")}s`;
  }

  function qaTaskLocationLabel(task) {
    if (task.path === "warrior") return `Warrior S${task.stage}`;
    if (task.path === "adventurer" && task.stage === 2) return "Capital";
    return "Adventurer";
  }

  function buildQaReport() {
    qaCommitActiveTime();
    const q = state.qa;
    const starts = Object.values(q.taskStarts).reduce((a, b) => a + b, 0);
    const completions = Object.values(q.taskCompletions).reduce((a, b) => a + b, 0);
    const warriorLoopsStarted = q.enteredWarrior ? q.loopResets + 1 : 0;
    const lines = [];

    lines.push("=== V13-Warrior-Beta Test Report ===");
    lines.push(`Build: ${q.buildTag}`);
    lines.push(`Active play time: ${qaFormatDuration(q.activePlayMs)}`);
    lines.push(`Warrior clear: ${q.warriorClearActiveMs === null ? "Not yet" : qaFormatDuration(q.warriorClearActiveMs)}`);
    if (q.warriorClearAt) lines.push(`Clear timestamp: ${q.warriorClearAt}`);
    lines.push(`Warrior loops started: ${warriorLoopsStarted}`);
    lines.push(`Loop resets: ${q.loopResets}`);
    lines.push(`Pre-class restarts: ${q.adventurerRestarts}`);
    lines.push(`Highest Warrior stage reached: ${q.highestStage.warrior || 0}/10`);
    lines.push(`Total task starts: ${starts}`);
    lines.push(`Total task completions: ${completions}`);
    lines.push("");

    lines.push("--- Warrior Stage Visits ---");
    const warriorStages = window.V11_GAME_DATA.PATHS.warrior?.stages || {};
    for (let stage = 1; stage <= 10; stage++) {
      const name = warriorStages[stage]?.name || `Stage ${stage}`;
      lines.push(`S${stage} ${name}: ${q.stageVisits.warrior[String(stage)] || 0}`);
    }
    lines.push("");

    lines.push("--- Current Warrior Skills ---");
    for (const id of ["warfare", "armored", "maneuvering", "vigilance", "valor"]) {
      const name = CLASS_SKILLS.warrior?.skills
        ? Object.values(CLASS_SKILLS.warrior.skills).find(x => x.id === id)?.name || id
        : id;
      lines.push(`${name}: ${storedSkillLevel(id)}`);
    }
    if (q.warriorClearSkills) {
      lines.push("");
      lines.push("--- Skills At First Mastermind Clear ---");
      for (const id of ["warfare", "armored", "maneuvering", "vigilance", "valor"]) {
        lines.push(`${id}: ${q.warriorClearSkills[id] ?? 0}`);
      }
      lines.push(`Clear loop: ${q.warriorClearLoopNumber}`);
    }
    lines.push("");

    lines.push("--- Task Starts / Completions ---");
    const wagonStarts = q.taskStarts.hireWagonCapital || 0;
    const wagonCompletions = q.taskCompletions.hireWagonCapital || 0;
    if (wagonStarts || wagonCompletions) {
      lines.push(`[Adventurer] Hire Wagon to Capital: ${wagonStarts} / ${wagonCompletions}`);
    }
    for (const task of ALL_TASKS) {
      const a = q.taskStarts[task.id] || 0;
      const c = q.taskCompletions[task.id] || 0;
      if (!a && !c) continue;
      lines.push(`[${qaTaskLocationLabel(task)}] ${task.name}: ${a} / ${c}`);
    }

    return lines.join("\n");
  }

  function showQaReport() {
    const overlay = document.getElementById("qaReportOverlay");
    const textarea = document.getElementById("qaReportText");
    if (!overlay || !textarea) return;
    textarea.value = buildQaReport();
    overlay.style.display = "flex";
    textarea.scrollTop = 0;
    textarea.focus();
    textarea.select();
  }

  function closeQaReport() {
    const overlay = document.getElementById("qaReportOverlay");
    if (overlay) overlay.style.display = "none";
  }

  async function copyQaReport() {
    const textarea = document.getElementById("qaReportText");
    if (!textarea) return;
    textarea.value = buildQaReport();
    try {
      await navigator.clipboard.writeText(textarea.value);
    } catch (err) {
      textarea.focus();
      textarea.select();
      document.execCommand("copy");
    }
    const btn = document.getElementById("qaCopyReportBtn");
    if (btn) {
      const old = btn.textContent;
      btn.textContent = "Copied";
      setTimeout(() => { btn.textContent = old; }, 1200);
    }
  }

  // ============================================================
  // TOOLTIP
  // ============================================================
  const tooltip = document.getElementById("tooltip");

  function showTooltip(text, x, y) {
    tooltip.textContent = text;
    tooltip.classList.add("show");

    const pad = 12;
    const rect = tooltip.getBoundingClientRect();
    let left = x + 12;
    let top = y + 12;

    if (left + rect.width > window.innerWidth - pad) {
      left = window.innerWidth - rect.width - pad;
    }
    if (top + rect.height > window.innerHeight - pad) {
      top = y - rect.height - 12;
    }

    tooltip.style.left = `${Math.max(pad, left)}px`;
    tooltip.style.top = `${Math.max(pad, top)}px`;
  }

  function hideTooltip() {
    tooltip.classList.remove("show");
  }

  function bindTooltip(el, getText) {
    const textFn = typeof getText === "function" ? getText : () => getText;

    el.addEventListener("mouseenter", e => showTooltip(textFn(), e.clientX, e.clientY));
    el.addEventListener("mousemove", e => showTooltip(textFn(), e.clientX, e.clientY));
    el.addEventListener("mouseleave", hideTooltip);

    el.addEventListener("click", e => {
      if (window.matchMedia("(hover: none)").matches) {
        showTooltip(
          textFn(),
          e.clientX || window.innerWidth / 2,
          e.clientY || window.innerHeight / 2
        );
        setTimeout(hideTooltip, 2600);
      }
    });
  }

  // ============================================================
  // RENDER — COMMON
  // ============================================================
  function render() {
    renderEnergy();
    renderTasks();
    renderStage2Tasks();
    renderSkills();
    renderClassArea();
    syncDebugInputs();
    syncInstantTaskToggles();
  }

  function renderEnergy() {
    const pct = Math.max(0, Math.min(100, state.energy / state.maxEnergy * 100));
    const label = `${formatNumber(state.energy)} / ${formatNumber(state.maxEnergy)}`;

    for (const [textId, fillId] of [
      ["energyText", "energyFill"],
      ["stage2EnergyText", "stage2EnergyFill"],
      ["classEnergyText", "classEnergyFill"]
    ]) {
      const text = document.getElementById(textId);
      const fill = document.getElementById(fillId);
      if (text) text.textContent = label;
      if (fill) fill.style.width = `${pct}%`;
    }
  }

  function makeSectionLabel(text) {
    const label = document.createElement("div");
    label.style.margin = "4px 2px 2px";
    label.style.fontWeight = "800";
    label.style.color = "var(--muted)";
    label.style.fontSize = ".82rem";
    label.style.textTransform = "uppercase";
    label.style.letterSpacing = ".08em";
    label.textContent = text;
    return label;
  }

  // ============================================================
  // ADVENTURER STAGE 1
  // ============================================================
  function renderTasks() {
    const host = document.getElementById("taskList");
    if (!host) return;
    host.innerHTML = "";

    host.appendChild(makeSectionLabel("Travel"));

    const travel = document.createElement("div");
    travel.className = "task travel";
    const travelUnlocked = allMandatoryComplete();

    travel.innerHTML = `
      <div class="task-title-row">
        <div>
          <div class="task-name">Hire Wagon to Capital</div>
          <div class="task-meta">Travel • 0 Energy</div>
        </div>
        <div class="task-status">${travelUnlocked ? "Ready" : "Locked"}</div>
      </div>
      <button ${travelUnlocked && !activeTask ? "" : "disabled"}>
        ${travelUnlocked ? "Travel" : "Complete Mandatory Tasks"}
      </button>
    `;

    bindTooltip(travel, () => {
      let text =
        `Hire Wagon to Capital\n\n` +
        `You have enough travel money to hire a wagon to the Capital. ` +
        `From there, you can choose where your adventure actually begins.\n\n` +
        `Travel Cost: 0 Energy`;

      if (!travelUnlocked) {
        const remaining = TASKS.filter(t => t.mandatory && !state.completed[t.id]).length;
        text += `\nMandatory tasks remaining: ${remaining}`;
      }
      return text;
    });

    travel.querySelector("button").addEventListener(
      "click",
      () => {
        if (!travelUnlocked || activeTask) return;
        qaIncrement(state.qa.taskStarts, "hireWagonCapital");
        qaIncrement(state.qa.taskCompletions, "hireWagonCapital");
        travelTo({ path: "adventurer", stage: 2 });
      }
    );
    host.appendChild(travel);

    host.appendChild(makeSectionLabel("Mandatory Tasks"));
    for (const task of TASKS.filter(t => t.mandatory)) host.appendChild(buildAdventurerTaskCard(task));

    host.appendChild(makeSectionLabel("Optional Training"));
    for (const task of TASKS.filter(t => !t.mandatory)) host.appendChild(buildAdventurerTaskCard(task));
  }

  function guidedTaskLabel(task) {
    return guidedPracticeProficiencyBonus(task) > 0
      ? ' <span class="guided-label">(Guided)</span>'
      : '';
  }

  function buildAdventurerTaskCard(task) {
    const card = document.createElement("div");
    card.className = "task";
    if (state.completed[task.id]) card.classList.add("completed-once");

    const estimate = estimateTaskOutcome(task);
    const entries = taskSkillEntries(task);
    const repeatText = task.repeatable ? "Repeatable" : "One-time";
    const rewardText = entries.length
      ? `~${formatNumber(estimate.full.energyUsed)} Energy • ${formatXpRewards(resolvedTaskXpRewards(task))} • ${repeatText}`
      : `${formatNumber(taskEnergyCost(task))} Energy • Travel Funds • ${repeatText}`;

    const isRunning = activeTask?.taskId === task.id;
    const taskType = task.mandatory ? "Mandatory" : "Optional";

    card.innerHTML = `
      <div class="task-title-row">
        <div>
          <div class="task-name">${task.name}${guidedTaskLabel(task)}</div>
          <div class="task-meta">${rewardText}</div>
        </div>
        <div class="task-status">${taskType}${state.completed[task.id] ? " ✓" : ""}</div>
      </div>
      <div class="progress-bar">
        <div class="progress-fill" data-progress="${task.id}" style="width:${isRunning ? activeTask.progress * 100 : 0}%"></div>
      </div>
      <button ${canStartTask(task) ? "" : "disabled"}>
        ${isRunning ? "Running..." : (state.completed[task.id] && !task.repeatable ? "Completed" : "Start Task")}
      </button>
    `;

    card.querySelector("button").addEventListener("click", () => startTask(task.id));
    bindTooltip(card, () => adventurerTaskTooltip(task));
    return card;
  }

  function adventurerTaskTooltip(task) {
    const estimate = estimateTaskOutcome(task);
    const entries = taskSkillEntries(task);

    if (!entries.length) {
      return (
        `${task.name}\n\n` +
        `${task.mandatory ? "Mandatory" : "Optional"} • One-time\n` +
        `Earn enough money to pay for the wagon ride to the Capital.\n\n` +
        `Energy Cost: ${formatNumber(taskEnergyCost(task))}\n` +
        `Estimated real time to complete: ${formatDuration(estimate.full.seconds)}`
      );
    }

    const entry = entries[0];
    const meta = SKILLS[entry.id];
    const currentLevel = usableSkillLevel(entry.id);
    const completionsNeeded = completionsNeededForLevel(entry.id, BALANCE.adventurer.schoolRequirement, entry.xp);

    return (
      `${task.name}\n\n` +
      `${task.mandatory ? "Mandatory" : "Optional"} • ${task.repeatable ? "Repeatable" : "One-time"}\n` +
      `Trains ${meta.name}.\n` +
      `You need ${meta.name} ${BALANCE.adventurer.schoolRequirement} to attend ${meta.school}.\n` +
      `Current: ${formatNumber(currentLevel)}${currentLevel >= BALANCE.adventurer.schoolRequirement ? " — Requirement met" : ` — ~${completionsNeeded} full completions remaining`}\n\n` +
      `Base Energy: ${formatNumber(taskEnergyCost(task))}\n` +
      `Estimated Energy: ${formatNumber(estimate.full.energyUsed)}\n` +
      `XP Reward: ${formatXpRewards(resolvedTaskXpRewards(task))}\n` +
      `Estimated time: ${formatDuration(estimate.full.seconds)}`
    );
  }

  function completionsNeededForLevel(skillId, targetLevel, reward) {
    const sim = cloneSkill(state.skills[skillId]);
    if (usableSkillLevel(skillId, sim) >= targetLevel) return 0;

    let completions = 0;
    const amount = Number.isFinite(reward) && reward > 0 ? reward : BALANCE.adventurer.trainingBaseXp;

    while (usableSkillLevel(skillId, sim) < targetLevel && completions < 1000000) {
      addSkillXpTo(sim, amount);
      completions += 1;
    }
    return completions;
  }

  // ============================================================
  // ADVENTURER STAGE 2
  // ============================================================
  function renderStage2Tasks() {
    const host = document.getElementById("stage2TaskList");
    if (!host) return;
    host.innerHTML = "";

    for (const task of STAGE2_TASKS.filter(task => task.type === "travel")) {
      const card = document.createElement("div");
      card.className = "task travel";
      const estimate = estimateTaskOutcome(task);
      const requirementMet = stage2ClassRequirementMet(task);

      card.innerHTML = `
        <div class="task-title-row">
          <div>
            <div class="task-name">${task.name}${guidedTaskLabel(task)}</div>
            <div class="task-meta">Travel • ~${formatNumber(estimate.full.energyUsed)} Energy</div>
          </div>
          <div class="task-status">${requirementMet ? "Ready" : "Locked"}</div>
        </div>
        <div class="progress-bar">
          <div class="progress-fill" data-progress="${task.id}" style="width:${activeTask?.taskId === task.id ? activeTask.progress * 100 : 0}%"></div>
        </div>
        <button ${canStartTask(task) ? "" : "disabled"}>
          ${activeTask?.taskId === task.id ? "Traveling..." : "Travel"}
        </button>
      `;

      card.querySelector("button").addEventListener("click", () => startTask(task.id));
      bindTooltip(card, () => stage2TaskTooltip(task));
      host.appendChild(card);
    }

    host.appendChild(makeSectionLabel("Other"));
    const giveUp = STAGE2_TASKS.find(task => task.type === "giveUp");
    if (!giveUp) return;

    const card = document.createElement("div");
    card.className = "task";
    card.innerHTML = `
      <div class="task-title-row">
        <div>
          <div class="task-name">${giveUp.name}</div>
          <div class="task-meta">${formatNumber(taskEnergyCost(giveUp))} Energy</div>
        </div>
        <div class="task-status">Optional</div>
      </div>
      <div class="progress-bar">
        <div class="progress-fill" data-progress="${giveUp.id}" style="width:${activeTask?.taskId === giveUp.id ? activeTask.progress * 100 : 0}%"></div>
      </div>
      <button ${canStartTask(giveUp) ? "" : "disabled"}>
        ${activeTask?.taskId === giveUp.id ? "Giving Up..." : "Give Up"}
      </button>
    `;
    card.querySelector("button").addEventListener("click", () => startTask(giveUp.id));
    bindTooltip(card, () => stage2TaskTooltip(giveUp));
    host.appendChild(card);
  }

  function stage2TaskTooltip(task) {
    const estimate = estimateTaskOutcome(task);

    if (task.type === "giveUp") {
      return (
        `${task.name}\n\n` +
        `Leave the Capital and attempt to go home on foot.\n\n` +
        `Energy Cost: ${formatNumber(taskEnergyCost(task))}\n` +
        `With current Energy you will make it ${formatPercent(estimate.current.progress * 100)} of the way.`
      );
    }

    const currentLevel = usableSkillLevel(task.requirementSkill);
    const skillMet = currentLevel >= BALANCE.adventurer.schoolRequirement;
    return (
      `${task.name}\n\n` +
      `Class: ${task.className}\n` +
      `${SKILLS[task.requirementSkill]?.name || task.requirementSkill} ${BALANCE.adventurer.schoolRequirement} ` +
      `(Current: ${formatNumber(currentLevel)}) — ${skillMet ? "Met" : "Not Met"}\n\n` +
      `Base Energy Cost: ${formatNumber(taskEnergyCost(task))}\n` +
      `Estimated Energy: ${formatNumber(estimate.full.energyUsed)}\n` +
      `Estimated time: ${formatDuration(estimate.full.seconds)}`
    );
  }

  // ============================================================
  // CLASS AREA
  // ============================================================
  function renderClassArea() {
    const info = CLASS_SKILLS[state.path];
    const taskHost = document.getElementById("classTaskList");
    const skillHost = document.getElementById("classSkills");
    if (!info || !taskHost || !skillHost) return;

    const stageDef = PATHS[state.path]?.stages?.[state.stage];
    const stageName = stageDef?.name ? ` — ${stageDef.name}` : "";
    document.getElementById("classStageTitle").textContent =
      `${info.className} — Stage ${state.stage}${stageName}`;

    const loop = (state.loopCount[state.path] || 0) + 1;
    document.getElementById("classStageSubtitle").textContent =
      `${stageDef?.subtitle || "No stage description yet."}  •  Loop ${loop}`;
    document.getElementById("classSkillsTitle").textContent = `${info.className} Skills`;

    taskHost.innerHTML = "";
    const tasks = CLASS_TASKS.filter(task => task.path === state.path && task.stage === state.stage);

    if (!tasks.length) {
      const empty = document.createElement("div");
      empty.className = "task";
      empty.innerHTML = `
        <div class="task-name">Stage ${state.stage} Placeholder</div>
        <div class="task-meta">No tasks are implemented here in the W-1 test build.</div>
      `;
      taskHost.appendChild(empty);
    } else {
      const groups = [
        ["Travel / Leads", tasks.filter(t => t.category === "travel" || t.type === "travel")],
        ["Mandatory", tasks.filter(t => t.category === "mandatory" || (t.mandatory && t.type !== "travel"))],
        ["Optional Training", tasks.filter(t => t.category === "training")],
        ["Optional Challenges", tasks.filter(t => t.category === "challenge")],
        ["Other", tasks.filter(t => !["travel", "mandatory", "training", "challenge"].includes(t.category) && t.type !== "travel" && !t.mandatory)]
      ];

      for (const [label, group] of groups) {
        if (!group.length) continue;
        taskHost.appendChild(makeSectionLabel(label));
        for (const task of group) taskHost.appendChild(buildClassTaskCard(task, info));
      }
    }

    skillHost.innerHTML = "";

    const powers = combatPowers(state.path);
    if (powers) skillHost.appendChild(buildCombatPowerCard(state.path, powers));

    for (const entry of classSkillEntries(info)) {
      skillHost.appendChild(buildSkillCard(entry.id, {
        name: entry.name,
        tag: entry.tag || info.className
      }));
    }
  }

  function buildClassTaskCard(task, info) {
    const card = document.createElement("div");
    card.className = `task${task.type === "travel" ? " travel" : ""}`;
    if (state.completed[task.id]) card.classList.add("completed-once");

    const estimate = estimateTaskOutcome(task);
    const isRunning = activeTask?.taskId === task.id;
    const lockedByMandatory = task.type === "travel" && task.requiresMandatory !== false &&
      !classStageMandatoryComplete(task.path, task.stage);

    const status = task.mandatory
      ? (state.completed[task.id] ? "Mandatory ✓" : "Mandatory")
      : task.category === "challenge"
        ? (state.completed[task.id] ? "Done This Loop ✓" : "Challenge")
        : task.type === "travel"
          ? (lockedByMandatory ? "Locked" : "Ready")
          : "Optional";

    card.innerHTML = `
      <div class="task-title-row">
        <div>
          <div class="task-name">${task.name}${guidedTaskLabel(task)}</div>
          <div class="task-meta">${classTaskMeta(task, estimate)}</div>
        </div>
        <div class="task-status">${status}</div>
      </div>
      <div class="progress-bar">
        <div class="progress-fill" data-progress="${task.id}" style="width:${isRunning ? activeTask.progress * 100 : 0}%"></div>
      </div>
      <button ${canStartTask(task) ? "" : "disabled"}>
        ${isRunning ? (task.type === "travel" ? "Following Lead..." : "Running...") :
          (state.completed[task.id] && !task.repeatable ? "Completed" : (task.type === "travel" ? "Continue" : "Start Task"))}
      </button>
    `;

    card.querySelector("button").addEventListener("click", () => startTask(task.id));
    bindTooltip(card, () => classTaskTooltip(task, info));
    return card;
  }

  function classTaskMeta(task, estimate) {
    const rewards = resolvedTaskXpRewards(task);
    const rewardText = Object.keys(rewards).length ? formatXpRewards(rewards) : "No XP";

    return `~${formatNumber(estimate.full.energyUsed)} Energy • ${rewardText}`;
  }

  function classTaskTooltip(task, info) {
    const estimate = estimateTaskOutcome(task);
    const proficiency = taskProficiency(task);
    const scalingProficiency = taskScalingProficiency(task);
    const guidedBonus = guidedPracticeProficiencyBonus(task);
    const energyMult = taskEnergyMultiplier(task);
    const rewards = resolvedTaskXpRewards(task);
    const lines = [task.name, ""];

    if (task.description) lines.push(task.description, "");

    if (task.type === "combat") {
      const powers = combatPowers(task.path);
      const target = combatRecommendations(task);
      lines.push(`Combat Encounter`);
      if (Number.isFinite(target?.level)) {
        lines.push(`Recommended combat baseline: Lv ${formatNumber(target.level)}`);
      }
      if (target) {
        lines.push(`Recommended AP / DP: ${formatNumber(target.ap)} / ${formatNumber(target.dp)}`);
      }
      lines.push(`Current AP / DP: ${formatNumber(powers?.ap || 0)} / ${formatNumber(powers?.dp || 0)}`);
    } else {
      const entries = taskSkillEntries(task);
      if (entries.length) {
        lines.push("Recommended Minimums:");
        for (const entry of entries) {
          const name = skillDisplayName(entry.id);
          lines.push(`• ${name}: ${formatNumber(entry.recommended)} (Current ${formatNumber(usableSkillLevel(entry.id))})`);
        }
      }
    }

    lines.push(``, `Combined proficiency: ${formatPercent(proficiency * 100)}`);

    if (guidedBonus > 0) {
      lines.push(
        `Guided Practice bonus: +${formatPercent(guidedBonus * 100)}`,
        `Scaling proficiency: ${formatPercent(scalingProficiency * 100)}`
      );
    }

    lines.push(
      `Energy multiplier: ×${formatNumber(energyMult)}`,
      `Base Energy: ${formatNumber(taskEnergyCost(task))}`,
      `Estimated Energy: ${formatNumber(estimate.full.energyUsed)}`,
      `Estimated time: ${formatDuration(estimate.full.seconds)}`
    );

    if (Object.keys(rewards).length) {
      lines.push(``, `XP Reward: ${formatXpRewards(rewards)}`);
    }

    if (task.progressionReward) {
      const benchmark = stageTrainingBenchmark(task);
      const multipliers = progressionRewardMultipliers(task);
      const isFirst = !state.firstClears[task.id];
      const pct = (isFirst ? multipliers?.first : multipliers?.repeat) * 100;
      if (task.category === "challenge") {
        lines.push(`Challenge base reward: ${formatPercent(pct)} of one stage training action, split across rewarded skills.`);
      } else {
        lines.push(`${isFirst ? "First-clear" : "Repeat"} progression reward: ${formatPercent(pct)} of one stage training action, split across rewarded skills.`);
      }
      if (benchmark) {
        lines.push(`Full reward tier: Stage training Lv ${formatNumber(benchmark.recommendedLevel)}+. Earlier clears scale to the rewarded skill's current XP tier.`);
      }
    }

    if (task.firstClearLevelSpan) {
      lines.push(
        state.firstClears[task.id]
          ? `Repeat boss reward: ${formatPercent((task.repeatFraction || 0.1) * 100)} of first-clear base XP.`
          : `First-clear boss reward: ${formatNumber(task.firstClearLevelSpan.levels)} levels worth of XP at the boss's Recommended Minimum.`
      );
    }

    if (task.floorOneLevel) {
      lines.push(`Optional challenge bosses always reward at least one level’s worth of XP on completion.`);
    }

    if (Array.isArray(task.requiresTasks)) {
      const missing = task.requiresTasks.filter(id => !state.completed[id]);
      if (missing.length) {
        lines.push(``, `Locked until: ${missing.map(id => findTask(id)?.name || id).join(", ")}.`);
      }
    }

    if (task.type === "travel" && task.requiresMandatory !== false && !classStageMandatoryComplete(task.path, task.stage)) {
      lines.push(``, `Complete this stage's mandatory tasks first.`);
    }

    return lines.join("\n");
  }

  function buildCombatPowerCard(path, powers) {
    const el = document.createElement("div");
    el.className = "skill";
    el.innerHTML = `
      <div class="skill-head">
        <div class="skill-name">Combat Power<span class="tag">Derived</span></div>
      </div>
      <div class="skill-xp">Offensive Power: <strong>${formatNumber(powers.ap)}</strong></div>
      <div class="skill-xp">Defensive Power: <strong>${formatNumber(powers.dp)}</strong></div>
    `;

    bindTooltip(el, () => {
      const roles = combatRoleInfo(path);
      return (
        `Combat Power\n\n` +
        `AP = ${roles.combat.name} × (1 + ${roles.mobility.name} / 1000)\n` +
        `DP = ${roles.defense.name} × (1 + ${roles.perception.name} / 1000)\n\n` +
        `Offensive Power: ${formatNumber(powers.ap)}\n` +
        `Defensive Power: ${formatNumber(powers.dp)}\n\n` +
        `Legacy and perk Combat Power bonuses will stack additively here later.`
      );
    });

    return el;
  }

  // ============================================================
  // SKILL CARDS
  // ============================================================
  function renderSkills() {
    renderSkillsInto("skills");
    renderSkillsInto("stage2Skills");
  }

  function buildSkillCard(id, meta, tooltipFactory = null) {
    const s = state.skills[id];
    if (!s) return document.createElement("div");

    const storedLevel = storedSkillLevel(id);
    const usableLevel = usableSkillLevel(id);
    const needed = xpToNextLevel(storedLevel);
    const pct = Math.max(0, Math.min(100, s.xpIntoLevel / needed * 100));

    const el = document.createElement("div");
    el.className = "skill";
    el.innerHTML = `
      <div class="skill-head">
        <div class="skill-name">${meta.name}<span class="tag">${meta.tag}</span></div>
        <div class="skill-level">Lv ${formatNumber(usableLevel)}</div>
      </div>
      <div class="skill-xp">${formatNumber(s.xpIntoLevel)} / ${formatNumber(needed)} XP</div>
      <div class="skill-progress"><div style="width:${pct}%"></div></div>
    `;

    bindTooltip(
      el,
      tooltipFactory || (() =>
        `${meta.name} [${meta.tag}]\n\n` +
        `Usable Level: ${formatNumber(usableSkillLevel(id))}\n` +
        `Stored Level: ${formatNumber(storedSkillLevel(id))}\n` +
        `Total XP: ${formatNumber(state.skills[id].totalXp)}\n` +
        `XP to next level: ${formatNumber(xpToNextLevel(storedSkillLevel(id)))}`
      )
    );

    return el;
  }

  function renderSkillsInto(hostId) {
    const host = document.getElementById(hostId);
    if (!host) return;
    host.innerHTML = "";

    for (const [id, meta] of Object.entries(SKILLS)) {
      host.appendChild(buildSkillCard(id, meta, () => {
        const current = usableSkillLevel(id);
        return (
          `${meta.name} [${meta.tag}]\n\n` +
          `Level: ${formatNumber(current)}\n` +
          `Total XP: ${formatNumber(state.skills[id].totalXp)}\n` +
          `XP to next level: ${formatNumber(xpToNextLevel(storedSkillLevel(id)))}\n\n` +
          `You need ${meta.name} ${BALANCE.adventurer.schoolRequirement} to attend ${meta.school}.`
        );
      }));
    }
  }

  function skillDisplayName(id) {
    if (SKILLS[id]?.name) return SKILLS[id].name;
    for (const info of Object.values(CLASS_SKILLS)) {
      for (const entry of classSkillEntries(info)) {
        if (entry.id === id) return entry.name;
      }
    }
    return id;
  }

  function formatXpRewards(rewards) {
    const parts = Object.entries(rewards)
      .filter(([, amount]) => amount > 0)
      .map(([id, amount]) => `${formatNumber(amount)} ${skillDisplayName(id)} XP`);
    return parts.join(" • ") || "0 XP";
  }

  // ============================================================
  // FORMATTING
  // ============================================================
  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function formatPercent(pct) {
    if (!Number.isFinite(pct)) return "∞";
    if (pct >= 99.995 && pct <= 100.005) return "100%";
    if (Math.abs(pct) >= 10) return `${pct.toFixed(1)}%`;
    return `${pct.toFixed(2)}%`;
  }

  function formatDuration(seconds) {
    if (!Number.isFinite(seconds)) return "∞";
    if (seconds < 0.001) return `${(seconds * 1000).toFixed(2)}ms`;
    if (seconds < 0.1) return `${(seconds * 1000).toFixed(1)}ms`;
    if (seconds < 1) return `${seconds.toFixed(2)}s`;
    return `${seconds.toFixed(2)}s`;
  }

  function formatNumber(n) {
    if (!Number.isFinite(n)) return "∞";
    if (Math.abs(n) < 1e-9) return "0";
    const abs = Math.abs(n);
    if (abs >= 1e12) return n.toExponential(3).replace("e+", "e");
    if (abs >= 1e9) return `${(n / 1e9).toFixed(3).replace(/0+$/, "").replace(/\.$/, "")}B`;
    if (abs >= 1e6) return `${(n / 1e6).toFixed(3).replace(/0+$/, "").replace(/\.$/, "")}M`;
    if (abs >= 1e3) return `${(n / 1e3).toFixed(3).replace(/0+$/, "").replace(/\.$/, "")}K`;
    if (abs >= 100) return n.toFixed(1).replace(/\.0$/, "");
    if (abs >= 10) return n.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
    return n.toFixed(3).replace(/0+$/, "").replace(/\.$/, "");
  }

  // ============================================================
  // SCREENS
  // ============================================================
  function hideAllScreens() {
    document.getElementById("gameScreen").style.display = "none";
    document.getElementById("failureScreen").style.display = "none";
    document.getElementById("stage2Screen").style.display = "none";
    document.getElementById("stage2FailureScreen").style.display = "none";
    document.getElementById("classScreen").style.display = "none";
  }

  function showGame() {
    hideAllScreens();
    document.getElementById("gameScreen").style.display = "";
  }

  function showFailure() {
    hideAllScreens();
    document.getElementById("failureScreen").style.display = "flex";
  }

  function showStage2() {
    hideAllScreens();
    document.getElementById("stage2Screen").style.display = "";
    render();
  }

  function showStage2Failure() {
    hideAllScreens();
    document.getElementById("stage2FailureScreen").style.display = "flex";
  }

  function showClassArea() {
    hideAllScreens();
    document.getElementById("classScreen").style.display = "";
    render();
  }

  function showCurrentLocation() {
    if (state.path === "adventurer" && state.stage === 1) {
      showGame();
    } else if (state.path === "adventurer" && state.stage === 2) {
      showStage2();
    } else if (CLASS_SKILLS[state.path]) {
      showClassArea();
    } else {
      console.warn("Unknown location:", state.path, state.stage);
      showGame();
    }
  }

  // ============================================================
  // DEBUG / BINDINGS
  // ============================================================
  function syncDebugInputs() {
    const values = {
      xpGrowthInput: BALANCE.skillXp.growthPerLevel,
      trainingEnergyInput: BALANCE.adventurer.trainingEnergy,
      fundsEnergyInput: BALANCE.adventurer.fundsEnergy,
      targetTaskTimeInput: BALANCE.timing.targetSeconds,
      maxTaskTimeInput: BALANCE.timing.maxSeconds,
      minTaskTimeInput: BALANCE.timing.minSeconds,
      minEnergyFractionInput: BALANCE.taskScaling.minEnergyFraction
    };

    for (const [id, value] of Object.entries(values)) {
      const el = document.getElementById(id);
      if (el) el.value = value;
    }
  }

  function syncInstantTaskToggles() {
    for (const input of document.querySelectorAll(".instantTasksToggle")) {
      input.checked = Boolean(BALANCE.debug?.instantTasks);
    }
  }

  function bindInstantTaskToggles() {
    for (const input of document.querySelectorAll(".instantTasksToggle")) {
      input.addEventListener("change", () => {
        BALANCE.debug.instantTasks = input.checked;
        syncInstantTaskToggles();
        saveState();
      });
    }
  }

  function bindDebugNumber(id, setter) {
    const input = document.getElementById(id);
    if (!input) return;

    input.addEventListener("change", () => {
      const value = Number(input.value);
      if (!Number.isFinite(value)) return;
      setter(value);
      saveState();
      render();
    });
  }

  // External beta: real task timing only. Debug/Instant controls are intentionally hidden.
  BALANCE.debug.instantTasks = false;

  document.getElementById("saveBtn")?.addEventListener("click", saveState);
  document.getElementById("wipeBtn")?.addEventListener("click", wipeSave);
  document.getElementById("restartStage1Btn")?.addEventListener("click", resetStage1Failure);
  document.getElementById("stage2SaveBtn")?.addEventListener("click", saveState);
  document.getElementById("stage2WipeBtn")?.addEventListener("click", wipeSave);
  document.getElementById("restartFromStage2Btn")?.addEventListener("click", resetStage1Failure);
  document.getElementById("classSaveBtn")?.addEventListener("click", saveState);
  document.getElementById("classWipeBtn")?.addEventListener("click", wipeSave);

  for (const btn of document.querySelectorAll("[data-qa-report]")) {
    btn.addEventListener("click", showQaReport);
  }
  document.getElementById("qaCopyReportBtn")?.addEventListener("click", copyQaReport);
  document.getElementById("qaCloseReportBtn")?.addEventListener("click", closeQaReport);
  document.getElementById("qaReportOverlay")?.addEventListener("click", event => {
    if (event.target.id === "qaReportOverlay") closeQaReport();
  });

  window.addEventListener("focus", qaStartActiveTimer);
  window.addEventListener("blur", qaCommitActiveTime);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) qaCommitActiveTime();
    else qaStartActiveTimer();
  });
  window.addEventListener("beforeunload", saveState);

  setInterval(saveState, BALANCE.autosaveMs);

  showCurrentLocation();
  render();
})();
