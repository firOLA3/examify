const { buildObjectiveBlueprint, buildTheoryBlueprint } = require('./utils/blueprintBuilder');

const topicsData = {
  subject: "Computer Studies",
  country: "Nigeria",
  terms: [
    {
      term: 1,
      topics: [
        { topicName: "HISTORY OF COMPUTER", sourceText: "blabla" }
      ]
    }
  ]
};

const objBlueprint = buildObjectiveBlueprint("Primary 2", 1, topicsData, { easy: 0.6, medium: 0.3, hard: 0.1 });
console.log("Objective blueprint:", objBlueprint);
console.log("Length:", objBlueprint.length);
