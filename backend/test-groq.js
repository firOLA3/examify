require('dotenv').config();
const { generateObjectivesBatch, generateTheory } = require('./utils/generator');

const topicsData = [
  { topic: "HISTORY OF COMPUTER", term: 1, week: 1, content: "The computer did not just appear one day. Long ago, people used stones..." }
];

const objectiveBatch = [
  { number: 1, topic: "HISTORY OF COMPUTER", difficulty: "easy", style: "normal" },
  { number: 2, topic: "HISTORY OF COMPUTER", difficulty: "medium", style: "normal" }
];

async function test() {
  try {
    console.log("Testing generateObjectivesBatch...");
    const objResult = await generateObjectivesBatch("Computer Studies", "Primary 2", topicsData, objectiveBatch, []);
    console.log("Objectives result:", JSON.stringify(objResult, null, 2));
    
    console.log("Testing generateTheory...");
    const theoryBlueprint = [
      { number: 1, label: "1a", topic: "HISTORY OF COMPUTER", difficulty: "easy", marks: 5 }
    ];
    const thResult = await generateTheory("Computer Studies", "Primary 2", topicsData, theoryBlueprint);
    console.log("Theory result:", JSON.stringify(thResult, null, 2));
  } catch (err) {
    console.error("Test failed:", err);
  }
}
test();
