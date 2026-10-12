require('dotenv').config();
const { GoogleGenAI } = require('@google/genai');
const path = require('path');

async function runTest() {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const pdfPath = path.join(__dirname, '../computer-studies-year_1-pupil.pdf');
  
  const masterPrompt1 = (subject, country) => `
ROLE:
You are a curriculum analyst for ${subject} in a ${country} school system.

TASK:
Read the attached manual completely. The manual contains three terms. For each term, list every teachable topic and the key facts, definitions, lists and processes taught under it.

RULES:
1. Use only what is written in the manual. Do not add outside knowledge.
2. Keep the manual's own topic names and term boundaries. If term boundaries are unclear, say so in the notes field.
3. For each topic, give: topic name, a short summary, up to 8 key facts, up to 5 definitions, and up to 5 lists or classifications that could be asked as "list 3" or "list 5" questions.
4. If pages are scanned or unreadable, report which pages and do not guess.
5. Return the result in the structured JSON format exactly matching the schema. No extra commentary.
`;

const topicExtractionSchema = {
  type: "OBJECT",
  properties: {
    terms: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          termName: { type: "STRING" },
          topics: {
            type: "ARRAY",
            items: {
              type: "OBJECT",
              properties: {
                topicName: { type: "STRING" },
                summary: { type: "STRING" },
                keyFacts: { type: "ARRAY", items: { type: "STRING" } },
                definitions: { type: "ARRAY", items: { type: "STRING" } },
                lists: { type: "ARRAY", items: { type: "STRING" } }
              }
            }
          }
        }
      }
    },
    notes: { type: "STRING" }
  }
};

  try {
    console.log('Uploading PDF to Gemini...');
    const uploadResult = await ai.files.upload({
      file: pdfPath,
      config: {
        mimeType: 'application/pdf',
        displayName: 'computer-studies-year_1-pupil.pdf'
      }
    });
    
    console.log('Upload successful! URI:', uploadResult.uri);
    console.log('Generating content with gemini-3.1-pro-preview...');
    
    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: [
        { fileData: { fileUri: uploadResult.uri, mimeType: uploadResult.mimeType || 'application/pdf' } },
        { text: masterPrompt1('Computer Studies', 'Nigerian') }
      ],
      config: {
        responseMimeType: 'application/json',
        responseSchema: topicExtractionSchema
      }
    });

    console.log('\n--- EXTRACTED TOPICS ---');
    console.log(response.text);
    console.log('------------------------\n');
    console.log('SUCCESS!');
  } catch (err) {
    console.error('FAILED:', err);
  }
}

runTest();
