(() => {
  "use strict";

  const DATA = window.V11_GAME_DATA;

  DATA.registerAdventurer({
    id: "adventurer",

    skills: {
      discipline: {
        name: "Discipline",
        tag: "Warrior",
        school: "Warrior Training"
      }
    },

    stage1Tasks: [
      {
        id: "disciplineTraining",
        name: "Physical Training",
        skill: "discipline",
        expectedLevel: 0,
        mandatory: false,
        repeatable: true
      },
      {
        id: "earnFunds",
        name: "Earn Travel Funds",
        mandatory: true,
        repeatable: false
      }
    ],

    stage2Tasks: [
      {
        id: "giveUp",
        name: "Give Up",
        path: "adventurer",
        stage: 2,
        type: "giveUp",
        energyCost: 100000
      }
    ]
  });
})();
