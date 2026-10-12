require('dotenv').config();
const { generateObjectivesBatch } = require('./utils/generator');

const topicsData = {
  subject: "Computer Studies",
  country: "Nigeria",
  terms: [{
    termName: "First Term",
    topics: [
      { topicName: "HISTORY OF COMPUTER", sourceText: "The computer did not just appear one day. Long ago, people used stones..." }
    ]
  }]
};

const objectiveBatch = [
  { number: 1, topic: "HISTORY OF COMPUTER", difficulty: "easy", style: "normal" },
  { number: 2, topic: "HISTORY OF COMPUTER", difficulty: "medium", style: "normal" }
];

async function test() {
  try {
    const objResult = await generateObjectivesBatch("Computer Studies", "Primary 2", topicsData, objectiveBatch, []);
    console.log("Is Array?", Array.isArray(objResult));
    console.log("Result:", objResult);
  } catch (err) {
    console.error("Test failed:", err);
  }
}
test();
