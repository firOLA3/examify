require('dotenv').config();
const { buildObjectiveBlueprint, buildTheoryBlueprint } = require('./utils/blueprintBuilder');
const { generateObjectivesBatch, generateTheory } = require('./utils/generator');

const apiKey = process.env.GEMINI_API_KEY;

const mockTopicsData = {
  terms: [{
    termName: 'First Term',
    topics: [{
      topicName: 'Intro to Computers',
      summary: 'Basics of computing',
      keyFacts: ['A computer is electronic.', 'It takes inputs and gives outputs.'],
      definitions: ['Computer: an electronic device...'],
      lists: ['Types of computers: Micro, Mini, Mainframe']
    }]
  }]
};

async function run() {
  try {
    const objBlueprint = buildObjectiveBlueprint('Primary', 'First Term', mockTopicsData, { easy: 0.6, medium: 0.3, hard: 0.1 });
    const theoryBlueprint = buildTheoryBlueprint('Primary', 'First Term', mockTopicsData);
    
    // Test with just a small batch of 2 questions so we don't hit rate limits or take too long
    const smallBatch = objBlueprint.slice(0, 2);

    console.log('Generating 2 objectives...');
    const objResult = await generateObjectivesBatch(apiKey, 'Computer Studies', 'Primary', mockTopicsData, smallBatch, []);
    console.log(JSON.stringify(objResult, null, 2));

    console.log('\nGenerating theory...');
    const theoryResult = await generateTheory(apiKey, 'Computer Studies', 'Primary', mockTopicsData, theoryBlueprint.slice(0, 1));
    console.log(JSON.stringify(theoryResult, null, 2));
    
    console.log('\nSUCCESS!');
  } catch (err) {
    console.error('FAILED:', err);
  }
}

run();
