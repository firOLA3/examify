require('dotenv').config();
const fs = require('fs');
const pdfParse = require('pdf-parse');
const Groq = require('groq-sdk');
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function testExtract() {
  const dataBuffer = fs.readFileSync('c:/Users/Olaoluwa/Desktop/first-term.pdf');
  const data = await pdfParse(dataBuffer);
  const pdfText = data.text;

  const schema = {
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
                  summary: { type: "STRING" }
                }
              }
            }
          }
        }
      }
    }
  };

  const prompt = `Read the manual and extract every single topic. EXPECTED JSON SCHEMA:\n${JSON.stringify(schema, null, 2)}\n\nText:\n${pdfText}`;
  
  console.log("Calling Groq API...");
  const completion = await groq.chat.completions.create({
    messages: [{ role: "user", content: prompt }],
    model: "openai/gpt-oss-120b",
    response_format: { type: "json_object" }
  });
  
  console.log(completion.choices[0].message.content);
}

testExtract().catch(console.error);
