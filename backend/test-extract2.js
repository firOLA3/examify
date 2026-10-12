require('dotenv').config();
const fs = require('fs');
const pdfParse = require('pdf-parse');
const Groq = require('groq-sdk');
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function testExtract() {
  const dataBuffer = fs.readFileSync('c:/Users/Olaoluwa/Desktop/first-term.pdf');
  const data = await pdfParse(dataBuffer);
  const pdfText = data.text;

  const topicExtractionSchema = {
    type: "OBJECT",
    properties: {
      terms: {
        type: "ARRAY",
        items: {
          type: "OBJECT",
          properties: {
            termName: { type: "STRING", description: "e.g., First Term, Second Term, Third Term" },
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
      notes: { type: "STRING", description: "Notes about unreadable pages or unclear term boundaries." }
    }
  };

  const masterPrompt1 = (subject, country) => `
ROLE:
You are a curriculum analyst for ${subject} in a ${country} school system.

TASK:
Read the attached manual completely. The manual contains three terms. For each term, list every teachable topic and the key facts, definitions, lists and processes taught under it.

RULES:
1. Use only what is written in the manual. Do not add outside knowledge.
2. Keep the manual's own topic names and term boundaries. If term boundaries are unclear, say so in the notes field.
3. For each topic, give: topic name, a 1-sentence summary, up to 2 key facts, up to 1 definition, and up to 1 list. Keep descriptions EXTREMELY concise.
4. If pages are scanned or unreadable, report which pages and do not guess.
5. Return the result strictly in JSON format matching the schema provided. No extra commentary.
6. CRITICAL: You MUST extract EVERY SINGLE TOPIC from the document. Do not omit, skip, or merge any topics. Read until the very end of the text.
`;

  const fullPrompt = `${masterPrompt1("Computer Studies", "Nigerian")}\nEXPECTED JSON SCHEMA:\n${JSON.stringify(topicExtractionSchema, null, 2)}\nMANUAL CONTENT:\n${pdfText}`;
  
  console.log("Calling Groq API...");
  const completion = await groq.chat.completions.create({
    messages: [{ role: "user", content: fullPrompt }],
    model: "openai/gpt-oss-120b",
    response_format: { type: "json_object" }
  });
  
  const content = completion.choices[0].message.content;
  console.log("Raw Response Length:", content.length);
  try {
    const parsed = JSON.parse(content);
    console.log("Topics found:", parsed.terms[0].topics.length);
    parsed.terms[0].topics.forEach(t => console.log(t.topicName));
  } catch (e) {
    console.error("Syntax Error parsing JSON:", e.message);
  }
}

testExtract().catch(console.error);
