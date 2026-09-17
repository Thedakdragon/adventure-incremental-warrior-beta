(() => {
  "use strict";

  window.V11_GAME_DATA.registerClassPath({
    id: "warrior",

    classInfo: {
      className: "Warrior",
      skillId: "warfare",
      skillName: "Warfare",
      skills: {
        combat: { id: "warfare", name: "Warfare", tag: "Warrior" },
        defense: { id: "armored", name: "Armored", tag: "Warrior" },
        mobility: { id: "maneuvering", name: "Maneuvering", tag: "Warrior" },
        perception: { id: "vigilance", name: "Vigilance", tag: "Warrior" },
        social: { id: "valor", name: "Valor", tag: "Warrior" }
      }
    },

    travelFromAdventurer: {
      id: "arena",
      name: "Arena",
      path: "adventurer",
      stage: 2,
      type: "travel",
      className: "Warrior",
      requirementSkill: "discipline",
      energyCost: 10,
      destination: { path: "warrior", stage: 1 }
    },

    stages: {
      // ========================================================
      // STAGE 1 — ARENA
      // Mostly tested baseline.
      // ========================================================
      1: {
        name: "The Arena",
        subtitle: "Learn the fundamentals, prove you can fight, and listen for what comes next.",
        trainingBenchmark: { recommendedLevel: 10, totalXp: 30 },
        tasks: [
          {
            id: "warriorHearOutRecruiter",
            name: "Speak with the Guild Recruiter",
            type: "travel",
            category: "travel",
            repeatable: false,
            mandatory: false,
            requiresMandatory: true,
            energyCost: 5,
            skills: [
              { id: "valor", recommended: 35, weight: 1, xp: 0 }
            ],
            destination: { path: "warrior", stage: 2 },
            xpOnComplete: true,
            firstClearTracked: true,
            rewardSkills: ["valor"],
            progressionReward: true,
            description: "A guild recruiter has been asking around for capable fighters. Hear what they have to say about work beyond the Arena."
          },
          {
            id: "warriorQualifyingBout",
            name: "Qualifying Bout",
            type: "combat",
            category: "mandatory",
            mandatory: true,
            repeatable: false,
            energyCost: 10,
            recommendedLevel: 20,
            xpOnComplete: true,
            firstClearTracked: true,
            rewardSkills: ["warfare", "armored", "maneuvering", "vigilance"],
            progressionReward: true,
            description: "Win a sanctioned bout and prove that your training works against someone who hits back."
          },
          {
            id: "warriorArenaFinal",
            name: "Win the Arena Trials",
            type: "combat",
            category: "mandatory",
            mandatory: true,
            repeatable: false,
            requiresTasks: ["warriorQualifyingBout"],
            energyCost: 10,
            recommendedLevel: 35,
            xpOnComplete: true,
            firstClearTracked: true,
            rewardSkills: ["warfare", "armored", "maneuvering", "vigilance"],
            progressionReward: true,
            description: "The final required bout. Winning proves you are ready to stop being merely an Arena trainee."
          },
          {
            id: "warriorSparringDrills",
            name: "Sparring Drills",
            type: "training",
            category: "training",
            mandatory: false,
            repeatable: true,
            energyCost: 5,
            guidedPractice: true,
            skills: [
              { id: "warfare", recommended: 10, weight: 0.5, xp: 15 },
              { id: "maneuvering", recommended: 10, weight: 0.5, xp: 15 }
            ],
            description: "Practice attacking while moving with purpose instead of planting your feet and hoping for the best."
          },
          {
            id: "warriorGuardDrills",
            name: "Guard Drills",
            type: "training",
            category: "training",
            mandatory: false,
            repeatable: true,
            energyCost: 5,
            guidedPractice: true,
            skills: [
              { id: "armored", recommended: 10, weight: 0.5, xp: 15 },
              { id: "vigilance", recommended: 10, weight: 0.5, xp: 15 }
            ],
            description: "Practice keeping your defenses where the next strike is actually going to land."
          },
          {
            id: "warriorChatRecruits",
            name: "Chat with the Recruits",
            type: "training",
            category: "training",
            mandatory: false,
            repeatable: true,
            energyCost: 5,
            guidedPractice: true,
            skills: [
              { id: "valor", recommended: 10, weight: 1, xp: 15 }
            ],
            description: "Talk with people as new to this as you are. Easy company, modest lessons."
          },
          {
            id: "warriorMaintainEquipment",
            name: "Maintain Equipment",
            type: "training",
            category: "training",
            mandatory: false,
            repeatable: true,
            energyCost: 10,
            timeMultiplier: 0.70,
            skills: [
              { id: "warfare", recommended: 25, weight: 0.5, xp: 60 },
              { id: "armored", recommended: 25, weight: 0.5, xp: 60 }
            ],
            description: "Properly maintain weapons and armor with enough practical understanding to know what actually matters."
          },
          {
            id: "warriorArenaCourse",
            name: "Arena Course",
            type: "training",
            category: "training",
            mandatory: false,
            repeatable: true,
            energyCost: 10,
            timeMultiplier: 0.70,
            skills: [
              { id: "maneuvering", recommended: 25, weight: 0.5, xp: 60 },
              { id: "vigilance", recommended: 25, weight: 0.5, xp: 60 }
            ],
            description: "Navigate hazards, shifting footing, and moving targets while keeping track of what can hit you next."
          },
          {
            id: "warriorChatVeterans",
            name: "Chat with the Veterans",
            type: "training",
            category: "training",
            mandatory: false,
            repeatable: true,
            energyCost: 10,
            timeMultiplier: 0.70,
            skills: [
              { id: "valor", recommended: 25, weight: 1, xp: 60 }
            ],
            description: "Experienced fighters are less impressed by enthusiasm. Keep up with the conversation and you may learn something useful."
          },
          {
            id: "warriorArenaChampion",
            name: "Duel the Arena Champion",
            type: "combat",
            category: "challenge",
            mandatory: false,
            repeatable: false,
            energyCost: 50,
            recommendedAP: 371,
            recommendedDP: 371,
            floorOneLevel: true,
            xpOnComplete: true,
            rewardSkills: ["warfare", "armored", "maneuvering", "vigilance"],
            progressionReward: { firstMultiplier: 2.0, repeatMultiplier: 2.0 },
            description: "Anyone may challenge the Arena Champion. Very few have succeeded."
          }
        ]
      },

      // ========================================================
      // STAGE 2 — GUILD TRIALS
      // Boss baseline: 90. Normal training 50; hard training 70.
      // ========================================================
      2: {
        name: "Guild Trials",
        subtitle: "The Arena got you noticed. Now prove the Guild should actually let you in.",
        trainingBenchmark: { recommendedLevel: 50, totalXp: 90 },
        tasks: [
          {
            id: "warriorAcceptGuildMembership",
            name: "Accept Guild Membership",
            type: "travel",
            category: "travel",
            repeatable: false,
            mandatory: false,
            requiresMandatory: true,
            energyCost: 5,
            skills: [{ id: "valor", recommended: 80, weight: 1, xp: 0 }],
            destination: { path: "warrior", stage: 3 },
            xpOnComplete: true,
            firstClearTracked: true,
            rewardSkills: ["valor"],
            progressionReward: true,
            description: "You passed. Sign the ledger, take the badge, and step into the Guild as an actual member."
          },
          {
            id: "warriorGuildCombatAssessment",
            name: "Pass the Combat Assessment",
            type: "combat",
            category: "mandatory",
            mandatory: true,
            repeatable: false,
            energyCost: 5,
            recommendedLevel: 70,
            xpOnComplete: true,
            firstClearTracked: true,
            rewardSkills: ["warfare", "armored", "maneuvering", "vigilance"],
            progressionReward: true,
            description: "The Guild does not care how impressive you looked in the Arena. Show that you can fight to their standards."
          },
          {
            id: "warriorCompleteGuildTrials",
            name: "Complete the Guild Trials",
            type: "combat",
            category: "mandatory",
            mandatory: true,
            repeatable: false,
            requiresTasks: ["warriorGuildCombatAssessment"],
            energyCost: 10,
            recommendedLevel: 90,
            xpOnComplete: true,
            firstClearTracked: true,
            rewardSkills: ["warfare", "armored", "maneuvering", "vigilance"],
            progressionReward: true,
            description: "One final combined trial decides whether you leave as a Guild member or another applicant who almost made it."
          },
          {
            id: "warriorWeaponsAndNerves",
            name: "Weapons & Nerves",
            type: "training",
            category: "training",
            mandatory: false,
            repeatable: true,
            energyCost: 5,
            skills: [
              { id: "warfare", recommended: 50, weight: 0.5, xp: 45 },
              { id: "valor", recommended: 50, weight: 0.5, xp: 45 }
            ],
            description: "Work the basic weapon forms while an examiner keeps interrupting, correcting, and judging you. Technique matters; keeping your composure matters too."
          },
          {
            id: "warriorTrialCourse",
            name: "Trial Course",
            type: "training",
            category: "training",
            mandatory: false,
            repeatable: true,
            energyCost: 5,
            skills: [
              { id: "armored", recommended: 50, weight: 0.3333333333, xp: 35 },
              { id: "maneuvering", recommended: 50, weight: 0.3333333333, xp: 35 },
              { id: "vigilance", recommended: 50, weight: 0.3333333333, xp: 35 }
            ],
            description: "Cross the Guild trial course in full gear while watching for the hazards deliberately placed where tired applicants stop looking."
          },
          {
            id: "warriorFocusedWeaponsTest",
            name: "Focused Weapons Test",
            type: "training",
            category: "training",
            mandatory: false,
            repeatable: true,
            energyCost: 8.5,
            timeMultiplier: 0.70,
            skills: [{ id: "warfare", recommended: 70, weight: 1, xp: 135 }],
            description: "Forget everything except striking cleanly, repeatedly, and under increasingly unpleasant scrutiny."
          },
          {
            id: "warriorArmorEnduranceTest",
            name: "Armor Endurance Test",
            type: "training",
            category: "training",
            mandatory: false,
            repeatable: true,
            energyCost: 8.5,
            timeMultiplier: 0.70,
            skills: [{ id: "armored", recommended: 70, weight: 1, xp: 135 }],
            description: "Spend long enough under load that every bad habit in how you wear and brace your armor becomes impossible to ignore."
          },
          {
            id: "warriorTimedObstacleRun",
            name: "Timed Obstacle Run",
            type: "training",
            category: "training",
            mandatory: false,
            repeatable: true,
            energyCost: 8.5,
            timeMultiplier: 0.70,
            skills: [{ id: "maneuvering", recommended: 70, weight: 1, xp: 135 }],
            description: "Run the course against the clock. The Guild is less interested in grace than whether you can still move when being slow gets people killed."
          },
          {
            id: "warriorThreatRecognitionTest",
            name: "Threat Recognition Test",
            type: "training",
            category: "training",
            mandatory: false,
            repeatable: true,
            energyCost: 8.5,
            timeMultiplier: 0.70,
            skills: [{ id: "vigilance", recommended: 70, weight: 1, xp: 135 }],
            description: "Identify feints, hidden hazards, bad footing, and incoming attacks before the examiner has time to point out what you missed."
          }
        ]
      },

      // ========================================================
      // STAGE 3 — GUILD
      // Boss baseline: 160. Normal training 105; hard training 135.
      // ========================================================
      3: {
        name: "The Guild",
        subtitle: "You are a member now. Do the work, build a reputation, and prove the badge was not a clerical error.",
        trainingBenchmark: { recommendedLevel: 105, totalXp: 150 },
        tasks: [
          {
            id: "warriorTakeDistantContract",
            name: "Take a Distant Contract",
            type: "travel",
            category: "travel",
            repeatable: false,
            mandatory: false,
            requiresMandatory: true,
            energyCost: 5,
            skills: [{ id: "valor", recommended: 145, weight: 1, xp: 0 }],
            destination: { path: "warrior", stage: 4 },
            xpOnComplete: true,
            firstClearTracked: true,
            rewardSkills: ["valor"],
            progressionReward: true,
            description: "A contract outside the Capital promises real danger, real pay, and the first job that feels like the adventure you signed up for."
          },
          {
            id: "warriorClearBanditRoad",
            name: "Clear the Bandit Road",
            type: "combat",
            category: "mandatory",
            mandatory: true,
            repeatable: false,
            energyCost: 5,
            recommendedLevel: 135,
            xpOnComplete: true,
            firstClearTracked: true,
            rewardSkills: ["warfare", "armored", "maneuvering", "vigilance"],
            progressionReward: true,
            description: "A routine Guild contract stops being routine when the road ahead turns out to belong to somebody else."
          },
          {
            id: "warriorDefendGuildCaravan",
            name: "Defend the Guild Caravan",
            type: "combat",
            category: "mandatory",
            mandatory: true,
            repeatable: false,
            requiresTasks: ["warriorClearBanditRoad"],
            energyCost: 10,
            recommendedLevel: 160,
            xpOnComplete: true,
            firstClearTracked: true,
            rewardSkills: ["warfare", "armored", "maneuvering", "vigilance"],
            progressionReward: true,
            description: "Bring the caravan home intact when the people you angered decide to make one serious attempt at taking it back."
          },
          {
            id: "warriorGuildPatrol",
            name: "Guild Patrol",
            type: "training",
            category: "training",
            mandatory: false,
            repeatable: true,
            energyCost: 5,
            skills: [
              { id: "vigilance", recommended: 105, weight: 0.5, xp: 75 },
              { id: "valor", recommended: 105, weight: 0.5, xp: 75 }
            ],
            description: "Walk a public patrol where noticing trouble early matters almost as much as looking like someone worth bringing trouble to."
          },
          {
            id: "warriorGuildSparring",
            name: "Guild Sparring",
            type: "training",
            category: "training",
            mandatory: false,
            repeatable: true,
            energyCost: 5,
            skills: [
              { id: "warfare", recommended: 105, weight: 0.5, xp: 75 },
              { id: "armored", recommended: 105, weight: 0.5, xp: 75 }
            ],
            description: "Spar with Guild members who have stopped treating you like an applicant and started testing whether you belong beside them."
          },
          {
            id: "warriorCourierDetail",
            name: "Courier Detail",
            type: "training",
            category: "training",
            mandatory: false,
            repeatable: true,
            energyCost: 5,
            skills: [
              { id: "maneuvering", recommended: 105, weight: 0.5, xp: 75 },
              { id: "valor", recommended: 105, weight: 0.5, xp: 75 }
            ],
            description: "Carry messages through a busy city quickly enough to matter and confidently enough that nobody decides the sealed letter is negotiable."
          },
          {
            id: "warriorEquipmentInspection",
            name: "Equipment Inspection",
            type: "training",
            category: "training",
            mandatory: false,
            repeatable: true,
            energyCost: 5,
            skills: [
              { id: "armored", recommended: 105, weight: 0.5, xp: 75 },
              { id: "vigilance", recommended: 105, weight: 0.5, xp: 75 }
            ],
            description: "Inspect returning gear for the small failures that become large failures the next time somebody trusts their life to it."
          },
          {
            id: "warriorBountyHunt",
            name: "Hunt a Bounty",
            type: "training",
            category: "training",
            mandatory: false,
            repeatable: true,
            energyCost: 8.5,
            timeMultiplier: 0.70,
            skills: [
              { id: "warfare", recommended: 135, weight: 0.5, xp: 144 },
              { id: "vigilance", recommended: 135, weight: 0.5, xp: 144 }
            ],
            description: "Track down somebody dangerous enough to have a Guild bounty and alert enough that walking straight at them would be educational only once."
          },
          {
            id: "warriorRooftopPursuit",
            name: "Rooftop Pursuit",
            type: "training",
            category: "training",
            mandatory: false,
            repeatable: true,
            energyCost: 8.5,
            timeMultiplier: 0.70,
            skills: [
              { id: "maneuvering", recommended: 135, weight: 0.5, xp: 144 },
              { id: "warfare", recommended: 135, weight: 0.5, xp: 144 }
            ],
            description: "Chase a fleeing target across roofs, alleys, and every obstacle that turns a simple arrest into an improvised combat course."
          }
        ]
      },

      // ========================================================
      // STAGE 4 — ADVENTURE
      // Boss baseline: 250. Normal training 175; hard training 220.
      // ========================================================
      4: {
        name: "Adventure",
        subtitle: "At last: dangerous roads, ruined places, monsters, and nobody calling any of it a training exercise.",
        trainingBenchmark: { recommendedLevel: 175, totalXp: 400 },
        tasks: [
          {
            id: "warriorAnswerGuildRecall",
            name: "Answer the Guild's Recall",
            type: "travel",
            category: "travel",
            repeatable: false,
            mandatory: false,
            requiresMandatory: true,
            energyCost: 5,
            skills: [{ id: "valor", recommended: 235, weight: 1, xp: 0 }],
            destination: { path: "warrior", stage: 5 },
            xpOnComplete: true,
            firstClearTracked: true,
            rewardSkills: ["valor"],
            progressionReward: true,
            description: "Urgent messengers are calling every capable Guild fighter back toward the Capital. Something larger than contracts is happening."
          },
          {
            id: "warriorSurviveRuinedKeep",
            name: "Survive the Ruined Keep",
            type: "combat",
            category: "mandatory",
            mandatory: true,
            repeatable: false,
            energyCost: 5,
            recommendedLevel: 220,
            xpOnComplete: true,
            firstClearTracked: true,
            rewardSkills: ["warfare", "armored", "maneuvering", "vigilance"],
            progressionReward: true,
            description: "The contract said abandoned. The things living inside the keep apparently did not read the contract."
          },
          {
            id: "warriorSlayContractBeast",
            name: "Slay the Contract Beast",
            type: "combat",
            category: "mandatory",
            mandatory: true,
            repeatable: false,
            requiresTasks: ["warriorSurviveRuinedKeep"],
            energyCost: 10,
            recommendedLevel: 250,
            xpOnComplete: true,
            firstClearTracked: true,
            rewardSkills: ["warfare", "armored", "maneuvering", "vigilance"],
            progressionReward: true,
            description: "Find the creature the contract was really about and finish the job before it decides the adventurer is the easier bounty."
          },
          {
            id: "warriorMakeCamp",
            name: "Make Camp",
            type: "training",
            category: "training",
            mandatory: false,
            repeatable: true,
            energyCost: 5,
            skills: [
              { id: "armored", recommended: 175, weight: 0.5, xp: 200 },
              { id: "vigilance", recommended: 175, weight: 0.5, xp: 200 }
            ],
            description: "Choose defensible ground, keep your gear ready, and sleep lightly enough to wake before whatever found the camp gets ambitious."
          },
          {
            id: "warriorScoutRoute",
            name: "Scout the Route",
            type: "training",
            category: "training",
            mandatory: false,
            repeatable: true,
            energyCost: 5,
            skills: [
              { id: "maneuvering", recommended: 175, weight: 0.5, xp: 200 },
              { id: "vigilance", recommended: 175, weight: 0.5, xp: 200 }
            ],
            description: "Move ahead of the group and learn which parts of the road are merely inconvenient and which parts are trying to kill travelers."
          },
          {
            id: "warriorDealWithLocals",
            name: "Deal with the Locals",
            type: "training",
            category: "training",
            mandatory: false,
            repeatable: true,
            energyCost: 5,
            skills: [
              { id: "warfare", recommended: 175, weight: 0.5, xp: 200 },
              { id: "valor", recommended: 175, weight: 0.5, xp: 200 }
            ],
            description: "Looking capable opens some conversations and closes others. Learn when a visible sword is reassurance and when it is the problem."
          },
          {
            id: "warriorHuntDangerousGame",
            name: "Hunt Dangerous Game",
            type: "training",
            category: "training",
            mandatory: false,
            repeatable: true,
            energyCost: 8.5,
            timeMultiplier: 0.70,
            skills: [{ id: "warfare", recommended: 220, weight: 1, xp: 570 }],
            description: "Pick something large enough that there is no room for sloppy attacks, then convince it you were the more dangerous animal."
          },
          {
            id: "warriorEscortRuins",
            name: "Escort Through the Ruins",
            type: "training",
            category: "training",
            mandatory: false,
            repeatable: true,
            energyCost: 8.5,
            timeMultiplier: 0.70,
            skills: [
              { id: "armored", recommended: 220, weight: 0.5, xp: 380 },
              { id: "valor", recommended: 220, weight: 0.5, xp: 380 }
            ],
            description: "Keep less durable people alive through a place full of things that would very much prefer you failed at that job."
          },
          {
            id: "warriorCrossBrokenCountry",
            name: "Cross Broken Country",
            type: "training",
            category: "training",
            mandatory: false,
            repeatable: true,
            energyCost: 8.5,
            timeMultiplier: 0.70,
            skills: [
              { id: "maneuvering", recommended: 220, weight: 0.3333333333, xp: 300 },
              { id: "vigilance", recommended: 220, weight: 0.3333333333, xp: 300 },
              { id: "armored", recommended: 220, weight: 0.3333333333, xp: 300 }
            ],
            description: "Push through terrain where footing, awareness, and the ability to absorb a bad mistake all matter at the same time."
          }
        ]
      },

      // ========================================================
      // STAGE 5 — CALL TO WAR
      // Boss baseline: 350. Normal training 270; hard training 315.
      // ========================================================
      5: {
        name: "Call to War",
        subtitle: "The Guild's contracts give way to muster rolls. Whatever this conflict was, it has become everybody's problem.",
        trainingBenchmark: { recommendedLevel: 270, totalXp: 1932 },
        tasks: [
          {
            id: "warriorMarchToFront",
            name: "March to the Front",
            type: "travel",
            category: "travel",
            repeatable: false,
            mandatory: false,
            requiresMandatory: true,
            energyCost: 5,
            skills: [{ id: "valor", recommended: 335, weight: 1, xp: 0 }],
            destination: { path: "warrior", stage: 6 },
            xpOnComplete: true,
            firstClearTracked: true,
            rewardSkills: ["valor"],
            progressionReward: true,
            description: "The muster is complete. Fall in with the Guild contingent and march toward the part of the map everyone has started calling the front."
          },
          {
            id: "warriorProtectRefugees",
            name: "Protect the Refugees",
            type: "combat",
            category: "mandatory",
            mandatory: true,
            repeatable: false,
            energyCost: 5,
            recommendedLevel: 315,
            xpOnComplete: true,
            firstClearTracked: true,
            rewardSkills: ["warfare", "armored", "maneuvering", "vigilance"],
            progressionReward: true,
            description: "The war reaches the road before you reach the army. Get civilians through an attack that was never supposed to happen this far back."
          },
          {
            id: "warriorBreakEnemyScouts",
            name: "Break the Enemy Scouts",
            type: "combat",
            category: "mandatory",
            mandatory: true,
            repeatable: false,
            requiresTasks: ["warriorProtectRefugees"],
            energyCost: 10,
            recommendedLevel: 350,
            xpOnComplete: true,
            firstClearTracked: true,
            rewardSkills: ["warfare", "armored", "maneuvering", "vigilance"],
            progressionReward: true,
            description: "Find and crush the force probing the muster routes before they can report how exposed the gathering army really is."
          },
          {
            id: "warriorFormationDrills",
            name: "Formation Drills",
            type: "training",
            category: "training",
            mandatory: false,
            repeatable: true,
            energyCost: 5,
            skills: [
              { id: "warfare", recommended: 270, weight: 0.3333333333, xp: 728 },
              { id: "armored", recommended: 270, weight: 0.3333333333, xp: 728 },
              { id: "maneuvering", recommended: 270, weight: 0.3333333333, xp: 728 }
            ],
            description: "Learn to attack, brace, and move as part of a line instead of behaving like every fight is an Arena duel centered on you."
          },
          {
            id: "warriorRallyRecruits",
            name: "Rally the Recruits",
            type: "training",
            category: "training",
            mandatory: false,
            repeatable: true,
            energyCost: 5,
            skills: [
              { id: "valor", recommended: 270, weight: 0.5, xp: 966 },
              { id: "vigilance", recommended: 270, weight: 0.5, xp: 966 }
            ],
            description: "Read a crowd full of nervous recruits and give them confidence without promising that the coming war will be kind."
          },
          {
            id: "warriorWarGames",
            name: "War Games",
            type: "training",
            category: "training",
            mandatory: false,
            repeatable: true,
            energyCost: 8.5,
            timeMultiplier: 0.70,
            skills: [
              { id: "warfare", recommended: 315, weight: 0.5, xp: 1680 },
              { id: "vigilance", recommended: 315, weight: 0.5, xp: 1680 }
            ],
            description: "Fight exercises large enough that seeing the opening matters just as much as knowing what to do once you reach it."
          },
          {
            id: "warriorForcedMarch",
            name: "Forced March",
            type: "training",
            category: "training",
            mandatory: false,
            repeatable: true,
            energyCost: 8.5,
            timeMultiplier: 0.70,
            skills: [
              { id: "armored", recommended: 315, weight: 0.5, xp: 1680 },
              { id: "maneuvering", recommended: 315, weight: 0.5, xp: 1680 }
            ],
            description: "Cover distance in fighting gear until movement and endurance stop being separate problems."
          },
          {
            id: "warriorLogisticsPressure",
            name: "Logistics Under Pressure",
            type: "training",
            category: "training",
            mandatory: false,
            repeatable: true,
            energyCost: 8.5,
            timeMultiplier: 0.70,
            skills: [
              { id: "maneuvering", recommended: 315, weight: 0.5, xp: 1680 },
              { id: "valor", recommended: 315, weight: 0.5, xp: 1680 }
            ],
            description: "Get people and supplies where they need to be while everyone involved has a different urgent reason why their problem should come first."
          },
          {
            id: "warriorHoldMusterGate",
            name: "Hold the Muster Gate",
            type: "training",
            category: "training",
            mandatory: false,
            repeatable: true,
            energyCost: 8.5,
            timeMultiplier: 0.70,
            skills: [{ id: "armored", recommended: 315, weight: 1, xp: 2520 }],
            description: "Stand exactly where an attacking force wants you to stop standing, and remain there until they reconsider the request."
          }
        ]
      },

      // ========================================================
      // STAGE 6 — WAR
      // Boss baseline: 500. Normal training 380; hard training 450.
      // ========================================================
      6: {
        name: "War",
        subtitle: "There is no Arena bell, no clean reset, and no contract board. There is only the next line that has to hold.",
        trainingBenchmark: { recommendedLevel: 380, totalXp: 30800 },
        tasks: [
          {
            id: "warriorVolunteerBreakthrough",
            name: "Volunteer for the Breakthrough",
            type: "travel",
            category: "travel",
            repeatable: false,
            mandatory: false,
            requiresMandatory: true,
            energyCost: 5,
            skills: [{ id: "valor", recommended: 475, weight: 1, xp: 0 }],
            destination: { path: "warrior", stage: 7 },
            xpOnComplete: true,
            firstClearTracked: true,
            rewardSkills: ["valor"],
            progressionReward: true,
            description: "The enemy war leader has finally exposed a path to their command. Somebody has to punch through far enough to reach it."
          },
          {
            id: "warriorHoldTheLine",
            name: "Hold the Line",
            type: "combat",
            category: "mandatory",
            mandatory: true,
            repeatable: false,
            energyCost: 5,
            recommendedLevel: 450,
            xpOnComplete: true,
            firstClearTracked: true,
            rewardSkills: ["warfare", "armored", "maneuvering", "vigilance"],
            progressionReward: true,
            description: "The line bends. Make sure it does not become the kind of bend historians describe as a rout."
          },
          {
            id: "warriorBreakEnemyFormation",
            name: "Break the Enemy Formation",
            type: "combat",
            category: "mandatory",
            mandatory: true,
            repeatable: false,
            requiresTasks: ["warriorHoldTheLine"],
            energyCost: 10,
            recommendedLevel: 500,
            xpOnComplete: true,
            firstClearTracked: true,
            rewardSkills: ["warfare", "armored", "maneuvering", "vigilance"],
            progressionReward: true,
            description: "Turn defense into momentum, break the formation in front of you, and force the battle to move in your direction for once."
          },
          {
            id: "warriorCampRotation",
            name: "Camp Rotation",
            type: "training",
            category: "training",
            mandatory: false,
            repeatable: true,
            energyCost: 5,
            skills: [
              { id: "armored", recommended: 380, weight: 0.3333333333, xp: 12600 },
              { id: "vigilance", recommended: 380, weight: 0.3333333333, xp: 12600 },
              { id: "valor", recommended: 380, weight: 0.3333333333, xp: 12600 }
            ],
            description: "Take your turn holding a tired camp together: stay protected, stay awake, and keep everyone else from deciding exhaustion is a strategy."
          },
          {
            id: "warriorSkirmish",
            name: "Skirmish",
            type: "training",
            category: "training",
            mandatory: false,
            repeatable: true,
            energyCost: 8.5,
            timeMultiplier: 0.70,
            skills: [
              { id: "warfare", recommended: 450, weight: 0.5, xp: 28000 },
              { id: "maneuvering", recommended: 450, weight: 0.5, xp: 28000 }
            ],
            description: "Fight the smaller clashes between named battles, where surviving often depends on hitting hard and moving before somebody hits back."
          },
          {
            id: "warriorShieldLine",
            name: "Hold the Shield Line",
            type: "training",
            category: "training",
            mandatory: false,
            repeatable: true,
            energyCost: 8.5,
            timeMultiplier: 0.70,
            skills: [
              { id: "warfare", recommended: 450, weight: 0.5, xp: 28000 },
              { id: "armored", recommended: 450, weight: 0.5, xp: 28000 }
            ],
            description: "Hold position while attacking anything that gets close enough to test whether the line is still actually a line."
          },
          {
            id: "warriorScoutNoMansLand",
            name: "Scout No-Man's Land",
            type: "training",
            category: "training",
            mandatory: false,
            repeatable: true,
            energyCost: 8.5,
            timeMultiplier: 0.70,
            skills: [
              { id: "maneuvering", recommended: 450, weight: 0.5, xp: 28000 },
              { id: "vigilance", recommended: 450, weight: 0.5, xp: 28000 }
            ],
            description: "Cross the space between armies without becoming the reason everyone suddenly starts shooting."
          },
          {
            id: "warriorRallyBrokenUnit",
            name: "Rally a Broken Unit",
            type: "training",
            category: "training",
            mandatory: false,
            repeatable: true,
            energyCost: 8.5,
            timeMultiplier: 0.70,
            skills: [{ id: "valor", recommended: 450, weight: 1, xp: 42000 }],
            description: "Find soldiers already convinced the battle is lost and give them one exceptionally compelling reason to turn around."
          },
          {
            id: "warriorNightRaid",
            name: "Night Raid",
            type: "training",
            category: "training",
            mandatory: false,
            repeatable: true,
            energyCost: 8.5,
            timeMultiplier: 0.70,
            skills: [
              { id: "warfare", recommended: 450, weight: 0.5, xp: 28000 },
              { id: "vigilance", recommended: 450, weight: 0.5, xp: 28000 }
            ],
            description: "Attack under darkness where every useful strike begins with correctly identifying what the hell you are looking at."
          }
        ]
      },

      // ========================================================
      // STAGE 7 — WAR LEADER
      // Boss baseline: 700. Normal training 530; hard training 620.
      // ========================================================
      7: {
        name: "The War Leader",
        subtitle: "The war has a face now. Break through the army around it and make sure that face stops giving orders.",
        trainingBenchmark: { recommendedLevel: 530, totalXp: 1220800 },
        tasks: [
          {
            id: "warriorSearchWarLeaderQuarters",
            name: "Search the War Leader's Quarters",
            type: "travel",
            category: "travel",
            repeatable: false,
            mandatory: false,
            requiresMandatory: true,
            energyCost: 5,
            skills: [{ id: "valor", recommended: 665, weight: 1, xp: 0 }],
            destination: { path: "warrior", stage: 8 },
            xpOnComplete: true,
            firstClearTracked: true,
            rewardSkills: ["valor"],
            progressionReward: true,
            description: "The war leader is dead, but their orders point toward somebody else. Follow the trail before the army has time to bury it."
          },
          {
            id: "warriorBreachCommandCamp",
            name: "Breach the Command Camp",
            type: "combat",
            category: "mandatory",
            mandatory: true,
            repeatable: false,
            energyCost: 5,
            recommendedLevel: 620,
            xpOnComplete: true,
            firstClearTracked: true,
            rewardSkills: ["warfare", "armored", "maneuvering", "vigilance"],
            progressionReward: true,
            description: "The command camp is behind the strongest surviving section of the enemy line. Conveniently, you have become very good at lines."
          },
          {
            id: "warriorDefeatWarLeader",
            name: "Defeat the War Leader",
            type: "combat",
            category: "mandatory",
            mandatory: true,
            repeatable: false,
            requiresTasks: ["warriorBreachCommandCamp"],
            energyCost: 10,
            recommendedLevel: 700,
            xpOnComplete: true,
            firstClearTracked: true,
            rewardSkills: ["warfare", "armored", "maneuvering", "vigilance"],
            progressionReward: true,
            description: "Reach the person commanding the war, survive their best attempt to prove the title was deserved, and end their part in this conflict."
          },
          {
            id: "warriorReadBattlefield",
            name: "Read the Battlefield",
            type: "training",
            category: "training",
            mandatory: false,
            repeatable: true,
            energyCost: 5,
            skills: [
              { id: "maneuvering", recommended: 530, weight: 0.5, xp: 610400 },
              { id: "vigilance", recommended: 530, weight: 0.5, xp: 610400 }
            ],
            description: "The command camp is buried behind a moving battle. Learn where the safe route is going to exist a few moments before it does."
          },
          {
            id: "warriorInterrogatePrisoners",
            name: "Interrogate Prisoners",
            type: "training",
            category: "training",
            mandatory: false,
            repeatable: true,
            energyCost: 5,
            skills: [
              { id: "valor", recommended: 530, weight: 0.5, xp: 610400 },
              { id: "vigilance", recommended: 530, weight: 0.5, xp: 610400 }
            ],
            description: "Read the person in front of you and make telling the truth feel like the safest available decision."
          },
          {
            id: "warriorRecoverUnderFire",
            name: "Recover Under Fire",
            type: "training",
            category: "training",
            mandatory: false,
            repeatable: true,
            energyCost: 5,
            skills: [
              { id: "armored", recommended: 530, weight: 0.5, xp: 610400 },
              { id: "valor", recommended: 530, weight: 0.5, xp: 610400 }
            ],
            description: "Pull battered troops back into fighting shape while remaining conspicuously difficult to kill yourself."
          },
          {
            id: "warriorCutVanguard",
            name: "Cut Through the Vanguard",
            type: "training",
            category: "training",
            mandatory: false,
            repeatable: true,
            energyCost: 8.5,
            timeMultiplier: 0.70,
            skills: [
              { id: "warfare", recommended: 620, weight: 0.5, xp: 1071000 },
              { id: "maneuvering", recommended: 620, weight: 0.5, xp: 1071000 }
            ],
            description: "Push through troops who know exactly what happens if they let you get any closer to command."
          },
          {
            id: "warriorBreakHonorGuard",
            name: "Break the Honor Guard",
            type: "training",
            category: "training",
            mandatory: false,
            repeatable: true,
            energyCost: 8.5,
            timeMultiplier: 0.70,
            skills: [
              { id: "warfare", recommended: 620, weight: 0.5, xp: 1071000 },
              { id: "armored", recommended: 620, weight: 0.5, xp: 1071000 }
            ],
            description: "The war leader saved the best fighters for last. Be the reason that decision does not work."
          },
          {
            id: "warriorForceCommandBreach",
            name: "Force the Command Breach",
            type: "training",
            category: "training",
            mandatory: false,
            repeatable: true,
            energyCost: 8.5,
            timeMultiplier: 0.70,
            skills: [{ id: "warfare", recommended: 620, weight: 1, xp: 1606500 }],
            description: "There is a final defended opening between you and command. Stop looking for another route and make this one exist."
          }
        ]
      },

      // ========================================================
      // STAGE 8 — PATH TO THE TOWER
      // Boss baseline: 850. Normal training 730; hard training 800.
      // ========================================================
      8: {
        name: "Path to the Tower",
        subtitle: "The war leader was another layer. The orders behind the war lead toward a tower that nobody seems eager to approach.",
        trainingBenchmark: { recommendedLevel: 730, totalXp: 31640000 },
        tasks: [
          {
            id: "warriorReachTower",
            name: "Reach the Tower",
            type: "travel",
            category: "travel",
            repeatable: false,
            mandatory: false,
            requiresMandatory: true,
            energyCost: 5,
            skills: [{ id: "valor", recommended: 825, weight: 1, xp: 0 }],
            destination: { path: "warrior", stage: 9 },
            xpOnComplete: true,
            firstClearTracked: true,
            rewardSkills: ["valor"],
            progressionReward: true,
            description: "The road ends at the tower. Whatever started this war is close enough now that turning around would be insulting."
          },
          {
            id: "warriorBreakRearguard",
            name: "Break the Rearguard",
            type: "combat",
            category: "mandatory",
            mandatory: true,
            repeatable: false,
            energyCost: 5,
            recommendedLevel: 800,
            xpOnComplete: true,
            firstClearTracked: true,
            rewardSkills: ["warfare", "armored", "maneuvering", "vigilance"],
            progressionReward: true,
            description: "The last organized resistance outside the tower has one job: make sure you never reach it."
          },
          {
            id: "warriorDefeatTowerVanguard",
            name: "Defeat the Tower Vanguard",
            type: "combat",
            category: "mandatory",
            mandatory: true,
            repeatable: false,
            requiresTasks: ["warriorBreakRearguard"],
            energyCost: 10,
            recommendedLevel: 850,
            xpOnComplete: true,
            firstClearTracked: true,
            rewardSkills: ["warfare", "armored", "maneuvering", "vigilance"],
            progressionReward: true,
            description: "The tower's outer defenders are stronger than anything the war leader kept nearby. That answers several uncomfortable questions."
          },
          {
            id: "warriorSurveyApproach",
            name: "Survey the Approach",
            type: "training",
            category: "training",
            mandatory: false,
            repeatable: true,
            energyCost: 5,
            skills: [
              { id: "maneuvering", recommended: 730, weight: 0.5, xp: 15820000 },
              { id: "vigilance", recommended: 730, weight: 0.5, xp: 15820000 }
            ],
            description: "Study the ground around the distant tower until the landscape stops looking like scenery and starts looking like routes and threats."
          },
          {
            id: "warriorFollowSupplyTrail",
            name: "Follow the Supply Trail",
            type: "training",
            category: "training",
            mandatory: false,
            repeatable: true,
            energyCost: 5,
            skills: [
              { id: "vigilance", recommended: 730, weight: 0.5, xp: 15820000 },
              { id: "valor", recommended: 730, weight: 0.5, xp: 15820000 }
            ],
            description: "Find the people keeping the tower supplied, then learn enough from them to follow the trail without announcing why you care."
          },
          {
            id: "warriorClimbFoothills",
            name: "Climb the Foothills",
            type: "training",
            category: "training",
            mandatory: false,
            repeatable: true,
            energyCost: 5,
            skills: [
              { id: "armored", recommended: 730, weight: 0.5, xp: 15820000 },
              { id: "maneuvering", recommended: 730, weight: 0.5, xp: 15820000 }
            ],
            description: "Carry fighting gear through terrain that clearly was not designed with comfortable approaches to evil towers in mind."
          },
          {
            id: "warriorStudyDispatches",
            name: "Study Enemy Dispatches",
            type: "training",
            category: "training",
            mandatory: false,
            repeatable: true,
            energyCost: 5,
            skills: [
              { id: "warfare", recommended: 730, weight: 0.5, xp: 15820000 },
              { id: "valor", recommended: 730, weight: 0.5, xp: 15820000 }
            ],
            description: "Read captured orders for both military intent and the assumptions their writers make about who will obey them."
          },
          {
            id: "warriorBreakMountainGate",
            name: "Break the Mountain Gate",
            type: "training",
            category: "training",
            mandatory: false,
            repeatable: true,
            energyCost: 8.5,
            timeMultiplier: 0.70,
            skills: [
              { id: "warfare", recommended: 800, weight: 0.5, xp: 25900000 },
              { id: "armored", recommended: 800, weight: 0.5, xp: 25900000 }
            ],
            description: "The final maintained checkpoint is fortified, defended, and inconveniently located directly in the route you want."
          },
          {
            id: "warriorCrossRuinedPass",
            name: "Cross the Ruined Pass",
            type: "training",
            category: "training",
            mandatory: false,
            repeatable: true,
            energyCost: 8.5,
            timeMultiplier: 0.70,
            skills: [
              { id: "maneuvering", recommended: 800, weight: 0.3333333333, xp: 20300000 },
              { id: "vigilance", recommended: 800, weight: 0.3333333333, xp: 20300000 },
              { id: "armored", recommended: 800, weight: 0.3333333333, xp: 20300000 }
            ],
            description: "Navigate a pass where terrain, traps, and defenders all punish a different kind of carelessness."
          }
        ]
      },

      // ========================================================
      // STAGE 9 — THE TOWER
      // Boss baseline: 950. Normal training 875; hard training 925.
      // The Door is deliberately treated as the stage boss for now.
      // ========================================================
      9: {
        name: "The Tower",
        subtitle: "Fight your way upward until the tower deploys its most baffling defense: basic door hardware.",
        trainingBenchmark: { recommendedLevel: 875, totalXp: 336000000 },
        tasks: [
          {
            id: "warriorEnterMastermindChamber",
            name: "Enter the Mastermind's Chamber",
            type: "travel",
            category: "travel",
            repeatable: false,
            mandatory: false,
            requiresMandatory: true,
            energyCost: 5,
            skills: [{ id: "valor", recommended: 940, weight: 1, xp: 0 }],
            destination: { path: "warrior", stage: 10 },
            xpOnComplete: true,
            firstClearTracked: true,
            rewardSkills: ["valor"],
            progressionReward: true,
            description: "Against all odds, the door has been defeated. There is nowhere left to go but through it."
          },
          {
            id: "warriorClimbTower",
            name: "Climb the Tower",
            type: "combat",
            category: "mandatory",
            mandatory: true,
            repeatable: false,
            energyCost: 5,
            recommendedLevel: 925,
            xpOnComplete: true,
            firstClearTracked: true,
            rewardSkills: ["warfare", "armored", "maneuvering", "vigilance"],
            progressionReward: true,
            description: "Clear floor after floor of defenders who increasingly seem less like soldiers and more like people guarding a secret."
          },
          {
            id: "warriorDefeatDoor",
            name: "Defeat the Door",
            type: "combat",
            category: "mandatory",
            mandatory: true,
            repeatable: false,
            requiresTasks: ["warriorClimbTower"],
            energyCost: 10,
            recommendedLevel: 950,
            xpOnComplete: true,
            firstClearTracked: true,
            rewardSkills: ["warfare", "armored", "maneuvering", "vigilance"],
            progressionReward: true,
            description: "A simple wooden door blocks the way. It has an unusual polished metal sphere where a sensible handle should be. Clearly this is a combat encounter."
          },
          {
            id: "warriorQuestionTowerStaff",
            name: "Question the Tower Staff",
            type: "training",
            category: "training",
            mandatory: false,
            repeatable: true,
            energyCost: 5,
            skills: [
              { id: "valor", recommended: 875, weight: 0.5, xp: 168000000 },
              { id: "vigilance", recommended: 875, weight: 0.5, xp: 168000000 }
            ],
            description: "Not everyone in the tower wants to die for its master. Figure out who already knows that and what they are afraid to tell you."
          },
          {
            id: "warriorMapInnerStairs",
            name: "Map the Inner Stairwells",
            type: "training",
            category: "training",
            mandatory: false,
            repeatable: true,
            energyCost: 5,
            skills: [
              { id: "maneuvering", recommended: 875, weight: 0.5, xp: 168000000 },
              { id: "vigilance", recommended: 875, weight: 0.5, xp: 168000000 }
            ],
            description: "Learn the tower layout well enough that every locked passage stops costing you an entire floor of backtracking."
          },
          {
            id: "warriorClearLowerFloors",
            name: "Clear the Lower Floors",
            type: "training",
            category: "training",
            mandatory: false,
            repeatable: true,
            energyCost: 8.5,
            timeMultiplier: 0.70,
            skills: [{ id: "warfare", recommended: 925, weight: 1, xp: 399000000 }],
            description: "Fight upward efficiently enough that the tower starts running out of defenders before you run out of patience."
          },
          {
            id: "warriorEndureTowerTraps",
            name: "Endure Tower Traps",
            type: "training",
            category: "training",
            mandatory: false,
            repeatable: true,
            energyCost: 8.5,
            timeMultiplier: 0.70,
            skills: [{ id: "armored", recommended: 925, weight: 1, xp: 399000000 }],
            description: "The tower has opinions about uninvited guests. Most of those opinions are sharp, heavy, or on fire."
          },
          {
            id: "warriorScaleInnerTower",
            name: "Scale the Inner Tower",
            type: "training",
            category: "training",
            mandatory: false,
            repeatable: true,
            energyCost: 8.5,
            timeMultiplier: 0.70,
            skills: [{ id: "maneuvering", recommended: 925, weight: 1, xp: 399000000 }],
            description: "Take stairs, ladders, broken galleries, and increasingly questionable architectural shortcuts toward the top."
          },
          {
            id: "warriorReadTrapwork",
            name: "Read the Trapwork",
            type: "training",
            category: "training",
            mandatory: false,
            repeatable: true,
            energyCost: 8.5,
            timeMultiplier: 0.70,
            skills: [{ id: "vigilance", recommended: 925, weight: 1, xp: 399000000 }],
            description: "Study enough murderous architecture that the next hidden mechanism starts looking obvious before it activates."
          }
        ]
      },

      // ========================================================
      // STAGE 10 — THE MASTERMIND
      // Final base-path boss baseline: 1000.
      // Legacy/class-completion behavior is intentionally not wired yet.
      // ========================================================
      10: {
        name: "The Mastermind",
        subtitle: "The war, the tower, and every trail behind them end here. There is finally nobody else left to blame.",
        trainingBenchmark: { recommendedLevel: 970, totalXp: 1344000000 },
        tasks: [
          {
            id: "warriorBreakInnerGuard",
            name: "Break the Inner Guard",
            type: "combat",
            category: "mandatory",
            mandatory: true,
            repeatable: false,
            energyCost: 5,
            recommendedLevel: 990,
            xpOnComplete: true,
            firstClearTracked: true,
            rewardSkills: ["warfare", "armored", "maneuvering", "vigilance"],
            progressionReward: true,
            description: "The final guards have nowhere to retreat and no reason left to underestimate you."
          },
          {
            id: "warriorDefeatMastermind",
            name: "Defeat the Mastermind",
            type: "combat",
            category: "mandatory",
            mandatory: true,
            repeatable: false,
            requiresTasks: ["warriorBreakInnerGuard"],
            energyCost: 10,
            recommendedLevel: 1000,
            xpOnComplete: true,
            firstClearTracked: true,
            rewardSkills: ["warfare", "armored", "maneuvering", "vigilance"],
            progressionReward: true,
            description: "Corner the figure behind the war. When the disguise fails, what remains is a monstrous three-headed hound and one last fight."
          },
          {
            id: "warriorDemandAnswers",
            name: "Demand Answers",
            type: "training",
            category: "training",
            mandatory: false,
            repeatable: true,
            energyCost: 5,
            skills: [
              { id: "valor", recommended: 970, weight: 0.5, xp: 672000000 },
              { id: "vigilance", recommended: 970, weight: 0.5, xp: 672000000 }
            ],
            description: "You crossed a war and climbed a tower for answers. By now you can tell which answers are evasions before the sentence finishes."
          },
          {
            id: "warriorDuelEliteGuard",
            name: "Duel the Elite Guard",
            type: "training",
            category: "training",
            mandatory: false,
            repeatable: true,
            energyCost: 8.5,
            timeMultiplier: 0.70,
            skills: [
              { id: "warfare", recommended: 990, weight: 0.5, xp: 1029000000 },
              { id: "armored", recommended: 990, weight: 0.5, xp: 1029000000 }
            ],
            description: "Fight the best remaining warriors in the tower before the person they protect has time to become someone else's problem."
          },
          {
            id: "warriorHuntInnerSanctum",
            name: "Hunt Through the Inner Sanctum",
            type: "training",
            category: "training",
            mandatory: false,
            repeatable: true,
            energyCost: 8.5,
            timeMultiplier: 0.70,
            skills: [
              { id: "maneuvering", recommended: 990, weight: 0.5, xp: 1029000000 },
              { id: "vigilance", recommended: 990, weight: 0.5, xp: 1029000000 }
            ],
            description: "The mastermind knows the sanctum better than you do. Become inconveniently good at finding the next route anyway."
          },
          {
            id: "warriorWeatherMastermindTraps",
            name: "Weather the Mastermind's Traps",
            type: "training",
            category: "training",
            mandatory: false,
            repeatable: true,
            energyCost: 8.5,
            timeMultiplier: 0.70,
            skills: [
              { id: "armored", recommended: 990, weight: 0.5, xp: 1029000000 },
              { id: "maneuvering", recommended: 990, weight: 0.5, xp: 1029000000 }
            ],
            description: "Push through defenses built by somebody with far too much time to imagine exactly how an intruder might die."
          },
          {
            id: "warriorCornerLieutenants",
            name: "Corner the Lieutenants",
            type: "training",
            category: "training",
            mandatory: false,
            repeatable: true,
            energyCost: 8.5,
            timeMultiplier: 0.70,
            skills: [
              { id: "warfare", recommended: 990, weight: 0.5, xp: 1029000000 },
              { id: "valor", recommended: 990, weight: 0.5, xp: 1029000000 }
            ],
            description: "Strip away the last people willing to protect the mastermind, using whichever combination of threat and steel gets the answer fastest."
          },
          {
            id: "warriorRefuseToFall",
            name: "Refuse to Fall",
            type: "training",
            category: "training",
            mandatory: false,
            repeatable: true,
            energyCost: 8.5,
            timeMultiplier: 0.70,
            skills: [{ id: "armored", recommended: 990, weight: 1, xp: 1543500000 }],
            description: "At this point survival is less a defensive technique and more an increasingly unreasonable refusal to stop moving."
          }
        ]
      }
    }
  });
})();
