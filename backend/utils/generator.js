const Groq = require('groq-sdk');
const asyncRetry = require('./retry');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function callGroq(prompt, schema) {
  const fullPrompt = prompt + "\n\nEXPECTED JSON SCHEMA:\n" + JSON.stringify(schema, null, 2);
  const completion = await groq.chat.completions.create({
    messages: [{ role: "user", content: fullPrompt }],
    model: "openai/gpt-oss-120b",
    response_format: { type: "json_object" }
  });
  return completion.choices[0].message.content;
}

const objectiveSchema = {
  type: "OBJECT",
  properties: {
    questions: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          number: { type: "INTEGER" },
          topic: { type: "STRING" },
          style: { type: "STRING" },
          questionText: { type: "STRING" },
          correctAnswer: { type: "STRING" },
          wrongOptions: { type: "ARRAY", items: { type: "STRING" } },
          sourceNote: { type: "STRING" }
        },
        required: ["number", "topic", "style", "questionText", "correctAnswer", "wrongOptions"]
      }
    }
  },
  required: ["questions"]
};

const theorySchema = {
  type: "OBJECT",
  properties: {
    questions: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          number: { type: "INTEGER" },
          label: { type: "STRING" },
          questionText: { type: "STRING" },
          marks: { type: "INTEGER" },
          modelAnswer: {
            type: "ARRAY",
            items: {
              type: "OBJECT",
              properties: {
                point: { type: "STRING" },
                marks: { type: "INTEGER" }
              },
              required: ["point", "marks"]
            }
          }
        },
        required: ["number", "questionText", "marks", "modelAnswer"]
      }
    }
  },
  required: ["questions"]
};

async function generateObjectivesBatch(subject, classLevel, topicsContent, blueprintBatch, previousQuestions = []) {
  
  const prompt = `
ROLE:
You are an experienced ${subject} teacher writing an exam for ${classLevel} pupils. You write clear, fair, multiple-choice questions.

SOURCE MATERIAL:
${JSON.stringify(topicsContent)}

BLUEPRINT FOR THIS BATCH:
${JSON.stringify(blueprintBatch)}

Each row gives: question number, topic, difficulty (easy, medium or hard), and required style (normal, which-is-not, all-except, one-of-these-is-a).

WRITING RULES:
1. Write exactly one question for each blueprint row, in the same order, using the stated number, topic, difficulty and style.
2. Use only facts found in the source material. Never invent facts.
3. Style meanings:
- which-is-not: "Which of these is not ...?" Three or more options are true, one is false.
- all-except: "All of these are ... except ..." The odd one out is the answer.
- one-of-these-is-a: "One of these is a ..." Only one option fits.
- normal: any clear wording, but do not start with What, Where, Who, How or When more than occasionally.
4. Give the one correct answer and exactly ${classLevel.toLowerCase().includes('primary') ? 2 : 3} wrong options. Do not write letters or brackets on the options. The system adds (a), (b), (c) later.
5. Wrong options must be believable but clearly wrong to a pupil who learned the topic. Never use "all of the above" or "none of the above".
6. Options must be similar in length and grammar so the correct one does not stand out.
7. Vocabulary and sentence length must match a ${classLevel} pupil. Short sentences for lower primary.
8. Do not repeat a question, or test the same fact twice, within this batch or in the list of already-used questions below.
9. CRITICAL: You MUST output exactly ${blueprintBatch.length} questions. You MUST generate one question for EVERY SINGLE ROW in the blueprint. Do not skip any rows.

ALREADY USED QUESTIONS (do not repeat):
${JSON.stringify(previousQuestions)}
`;

  const responseText = await asyncRetry(() => callGroq(prompt, objectiveSchema));
  const parsed = JSON.parse(responseText);
  return parsed.questions || [];
}

async function generateTheory(subject, classLevel, topicsContent, theoryBlueprint) {
  
  const prompt = `
ROLE:
You are an experienced ${subject} teacher writing the theory section for ${classLevel} pupils.

SOURCE MATERIAL:
${JSON.stringify(topicsContent)}

THEORY BLUEPRINT (fixed, do not change numbers, letters or marks):
${JSON.stringify(theoryBlueprint)}

Example: Question 1 (10 marks): 1a (5 marks), 1b (5 marks). Question 2 (10 marks): 2a (3 marks), 2b (3 marks), 2c (4 marks). Question 3 (10 marks), standalone.

WRITING RULES:
1. Sub-question (a) must begin with "What is..." (or "State..." only when the topic has no natural definition and the teacher allowed it).
2. Sub-question (b) must begin with "List or mention 3...".
3. Any other sub-question or standalone question must begin with "List or mention 5...".
4. Sub-questions under the same number must belong to the same topic, and a (b) should follow naturally from its (a).
5. Spread the numbered questions across different topics of the term. Do not use the same topic twice.
6. Use only facts from the source material. Match the language level to ${classLevel}.
7. For each sub-question also write a model answer made of separate points, and say how the marks are shared across the points. The shared marks must add up exactly to the marks given in the blueprint.
`;

  const responseText = await asyncRetry(() => callGroq(prompt, theorySchema));
  const parsed = JSON.parse(responseText);
  return parsed.questions || [];
}

async function regenerateSingleQuestion(subject, classLevel, topicsContent, oldQuestionData, reason, otherQuestionsContext = []) {
  
  const prompt = `
ROLE:
You are a ${subject} teacher fixing one exam question for ${classLevel} pupils.

THE QUESTION TO REPLACE:
${JSON.stringify(oldQuestionData)}

REASON (optional, from the teacher or from the validator):
${reason || 'Regenerating for variety or quality'}

RULES:
Keep the same number, topic, difficulty, style and marks. Use only the source material below. The new question must test a different fact from the old one and from these other questions in the exam:
${JSON.stringify(otherQuestionsContext)}

Follow every writing rule from the original objective or theory prompt.

SOURCE MATERIAL:
${JSON.stringify(topicsContent)}
`;

  // Use the same schema based on whether it has marks (theory) or not (objective)
  const isTheory = !!oldQuestionData.marks;
  const schemaToUse = isTheory ? theorySchema : objectiveSchema;

  const responseText = await asyncRetry(() => callGroq(prompt, schemaToUse));
  const parsed = JSON.parse(responseText);
  const questionsArray = parsed.questions || [];
  return questionsArray[0] || questionsArray;
}

module.exports = {
  generateObjectivesBatch,
  generateTheory,
  regenerateSingleQuestion
};
