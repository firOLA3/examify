const express = require('express');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const Groq = require('groq-sdk');
const pdfParse = require('pdf-parse');
const mongoose = require('mongoose');
const Exam = require('./models/Exam');
const asyncRetry = require('./utils/retry');

require('dotenv').config();

const app = express();
const port = process.env.PORT || 3001;
const MOCK_MODE = false; // Bypasses API completely when true

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/examify')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Setup middleware
app.use(cors());
app.use(express.json());

// Setup Multer for PDF uploads (store temporarily in 'uploads' folder)
const upload = multer({ dest: 'uploads/' });

// Ensure uploads folder exists
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

// Initialize Groq SDK
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
// Master Prompt 1 - Topic Extraction
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

app.post('/api/extract-topics', upload.single('manual'), async (req, res) => {
  const { subject = 'Computer Studies', country = 'Nigerian', text = '' } = req.body;

  if (!req.file && !text) {
    return res.status(400).json({ error: 'No PDF manual uploaded and no text provided' });
  }

  try {
    if (MOCK_MODE) {
      console.log('MOCK MODE: Returning fake topics instantly');
      if (req.file) fs.unlinkSync(req.file.path);
      return res.json({
        terms: [
          {
            termName: "First Term",
            topics: [
              {
                topicName: "Introduction to Computers",
                summary: "Basic overview of what a computer is.",
                keyFacts: ["A computer is an electronic machine", "It needs electricity to work"],
                definitions: ["Computer: An electronic device for processing data"],
                lists: ["Desktop", "Laptop", "Tablet"]
              }
            ]
          }
        ],
        notes: "Mock data generated successfully."
      });
    }

    let pdfText = '';
    
    if (req.file) {
      console.log(`Received upload: ${req.file.originalname}. Parsing PDF locally for Groq...`);
      const dataBuffer = fs.readFileSync(req.file.path);
      const pdfData = await pdfParse(dataBuffer);
      pdfText = pdfData.text;
      // Clean up the local uploaded file
      fs.unlinkSync(req.file.path);
    } else {
      console.log(`Received raw text input (${text.length} characters).`);
      pdfText = text;
    }

    // Limit text length to prevent 413 Rate Limit Exceeded (Tokens Per Minute)
    // 25,000 chars is roughly 6,000 tokens, leaving some room for the 8,000 token limit
    if (pdfText.length > 25000) {
      console.warn(`Text is ${pdfText.length} characters, which may exceed token limits. Truncating to 25,000 characters.`);
      pdfText = pdfText.substring(0, 25000) + "\n\n[TEXT TRUNCATED DUE TO TOKEN LIMITS]";
    }

    console.log(`Processing ${pdfText.length} characters. Generating topics via Groq API...`);

    const fullPrompt = `${masterPrompt1(subject, country)}

EXPECTED JSON SCHEMA:
${JSON.stringify(topicExtractionSchema, null, 2)}

MANUAL CONTENT:
${pdfText}
`;

    // Call Groq
    const completion = await asyncRetry(() => groq.chat.completions.create({
      messages: [{ role: "user", content: fullPrompt }],
      model: "openai/gpt-oss-120b",
      response_format: { type: "json_object" }
    }));

    // Parse the JSON response
    const topicsData = JSON.parse(completion.choices[0].message.content);

    res.json(topicsData);

  } catch (error) {
    console.error('Error during topic extraction:', error);
    res.status(500).json({ error: 'Failed to extract topics', details: error.message });
  }
});

// STAGE 2: Blueprint Builder
app.post('/api/build-blueprint', express.json(), (req, res) => {
  const { schoolLevel = 'Primary', term = 'All', topicsData, difficultyMix = { easy: 0.6, medium: 0.3, hard: 0.1 } } = req.body;
  
  if (!topicsData || !topicsData.terms) {
    return res.status(400).json({ error: 'Valid topicsData is required' });
  }

  try {
    const { buildObjectiveBlueprint, buildTheoryBlueprint } = require('./utils/blueprintBuilder');
    
    const objectiveBlueprint = buildObjectiveBlueprint(schoolLevel, term, topicsData, difficultyMix);
    const theoryBlueprint = buildTheoryBlueprint(schoolLevel, term, topicsData);

    res.json({
      message: 'Blueprint built successfully',
      blueprints: {
        objective: objectiveBlueprint,
        theory: theoryBlueprint
      }
    });
  } catch (error) {
    console.error('Error building blueprint:', error);
    res.status(500).json({ error: 'Failed to build blueprint', details: error.message });
  }
});

// STAGE 3: Question Generation
app.post('/api/generate-exam', express.json(), async (req, res) => {
  const { schoolLevel = 'Primary', subject = 'Computer Studies', topicsData, blueprints } = req.body;
  
  if (!blueprints || !topicsData) {
    return res.status(400).json({ error: 'Valid topicsData and blueprints are required' });
  }

  try {
    if (MOCK_MODE) {
      console.log('MOCK MODE: Returning fake exam instantly');
      return res.json({
        message: 'Exam generated successfully',
        exam: {
          objectives: [
            { number: 1, topic: "Introduction to Computers", style: "normal", questionText: "What is a computer?", correctAnswer: "An electronic machine", wrongOptions: ["A wooden box", "A metal chair", "A food item"], sourceNote: "" },
            { number: 2, topic: "Introduction to Computers", style: "which-is-not", questionText: "Which of these is NOT a type of computer?", correctAnswer: "Shoe", wrongOptions: ["Desktop", "Laptop", "Tablet"], sourceNote: "" }
          ],
          theory: [
            {
              number: 1, label: "1a", questionText: "What is a computer?", marks: 5,
              modelAnswer: [{ point: "It is an electronic machine", marks: 2 }, { point: "It processes data", marks: 3 }]
            },
            {
              number: 1, label: "1b", questionText: "List 3 types of computers.", marks: 5,
              modelAnswer: [{ point: "Desktop", marks: 2 }, { point: "Laptop", marks: 2 }, { point: "Tablet", marks: 1 }]
            }
          ]
        }
      });
    }

    const { generateObjectivesBatch, generateTheory } = require('./utils/generator');
    const objectiveRows = blueprints.objective;
    
    // Batch objective questions into chunks of 10
    const chunkSize = 10;
    const objectiveBatches = [];
    for (let i = 0; i < objectiveRows.length; i += chunkSize) {
      objectiveBatches.push(objectiveRows.slice(i, i + chunkSize));
    }

    // Fetch past questions from DB to avoid repeating them
    const pastExams = await Exam.find({ 
      'metadata.subject': subject,
      'metadata.schoolLevel': schoolLevel
    });
    
    let dbPreviousQuestions = [];
    pastExams.forEach(ex => {
      if (ex.exam && ex.exam.objectives) {
        ex.exam.objectives.forEach(q => dbPreviousQuestions.push({ q: q.questionText, a: q.correctAnswer }));
      }
    });
    // Limit to the most recent 20 to avoid confusing the LLM with too large a context
    dbPreviousQuestions = dbPreviousQuestions.slice(-20);

    const generatedObjectives = [];
    // We run sequentially to pass previous questions context and avoid duplicates
    for (const batch of objectiveBatches) {
      const simplifiedPrevious = [
        ...dbPreviousQuestions,
        ...generatedObjectives.map(q => ({ q: q.questionText, a: q.correctAnswer }))
      ];
      // Shrink context to avoid TPM limits
      const batchTopicNames = batch.map(b => b.topicName);
      const filteredTopicsData = {
        terms: (topicsData.terms || []).map(term => ({
          termName: term.termName,
          topics: (term.topics || []).filter(t => batchTopicNames.includes(t.topicName))
        })).filter(term => term.topics.length > 0)
      };

      const result = await generateObjectivesBatch(subject, schoolLevel, filteredTopicsData, batch, simplifiedPrevious);
      generatedObjectives.push(...result);
    }

    const theoryTopicNames = blueprints.theory.map(b => b.topicName);
    const filteredTheoryTopicsData = {
      terms: (topicsData.terms || []).map(term => ({
        termName: term.termName,
        topics: (term.topics || []).filter(t => theoryTopicNames.includes(t.topicName))
      })).filter(term => term.topics.length > 0)
    };

    const generatedTheory = await generateTheory(subject, schoolLevel, filteredTheoryTopicsData, blueprints.theory);

    res.json({
      message: 'Exam generated successfully',
      exam: {
        objectives: generatedObjectives,
        theory: generatedTheory
      }
    });
  } catch (error) {
    console.error('Error generating exam:', error);
    res.status(500).json({ error: 'Failed to generate exam', details: error.message });
  }
});

// STAGE 4: Validation, Shuffling, and Regeneration
app.post('/api/validate-and-shuffle', express.json(), (req, res) => {
  const { schoolLevel = 'Primary', exam, blueprints } = req.body;
  
  if (!exam || !exam.objectives || !exam.theory) {
    return res.status(400).json({ error: 'Valid raw exam data is required' });
  }

  try {
    const { shuffleAndBalanceOptions, validateObjectiveRules, validateTheoryRules } = require('./utils/validator');
    
    // Shuffle and format the options
    const finalObjectives = shuffleAndBalanceOptions(exam.objectives, schoolLevel);
    
    // Run validations
    const objectiveErrors = validateObjectiveRules(exam.objectives, blueprints.objective, schoolLevel.toLowerCase() === 'primary' ? 3 : 4);
    const theoryErrors = validateTheoryRules(exam.theory, blueprints.theory);
    
    res.json({
      message: 'Exam validated and shuffled',
      exam: {
        objectives: finalObjectives,
        theory: exam.theory
      },
      validationErrors: {
        objectives: objectiveErrors,
        theory: theoryErrors
      }
    });
  } catch (error) {
    console.error('Error in validation/shuffling:', error);
    res.status(500).json({ error: 'Validation failed', details: error.message });
  }
});

app.post('/api/regenerate', express.json(), async (req, res) => {
  const { schoolLevel = 'Primary', subject = 'Computer Studies', topicsData, oldQuestion, reason, otherQuestions } = req.body;

  try {
    const { regenerateSingleQuestion } = require('./utils/generator');
    const newQuestion = await regenerateSingleQuestion(subject, schoolLevel, topicsData, oldQuestion, reason, otherQuestions);
    
    res.json({ message: 'Question regenerated', question: newQuestion });
  } catch (error) {
    console.error('Error regenerating question:', error);
    res.status(500).json({ error: 'Regeneration failed', details: error.message });
  }
});

// STAGE 5: Exporting
app.post('/api/export', express.json(), async (req, res) => {
  const { format, exam, metadata } = req.body;

  if (!exam || !exam.objectives || !exam.theory) {
    return res.status(400).json({ error: 'Valid exam data is required' });
  }

  try {
    const { buildDocxBuffer, buildPdfBuffer } = require('./utils/exporter');
    let buffer;
    
    if (format === 'pdf') {
      buffer = await buildPdfBuffer(exam, metadata || {});
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=exam.pdf');
    } else if (format === 'docx') {
      buffer = await buildDocxBuffer(exam, metadata || {});
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      res.setHeader('Content-Disposition', 'attachment; filename=exam.docx');
    } else {
      return res.status(400).json({ error: 'Format must be pdf or docx' });
    }

    res.send(buffer);
  } catch (error) {
    console.error('Error exporting exam:', error);
    res.status(500).json({ error: 'Export failed', details: error.message });
  }
});

// STAGE 7: Save and Load Exams
app.post('/api/exams', express.json(), async (req, res) => {
  try {
    const { metadata, exam } = req.body;
    const newExam = new Exam({ metadata, exam });
    await newExam.save();
    res.json({ message: 'Exam saved to Question Bank successfully', id: newExam._id });
  } catch (error) {
    console.error('Error saving exam:', error);
    res.status(500).json({ error: 'Failed to save exam', details: error.message });
  }
});

app.get('/api/exams', async (req, res) => {
  try {
    const exams = await Exam.find().sort({ createdAt: -1 }).select('metadata createdAt');
    res.json(exams);
  } catch (error) {
    console.error('Error fetching exams:', error);
    res.status(500).json({ error: 'Failed to fetch past exams' });
  }
});

app.get('/api/exams/:id', async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) return res.status(404).json({ error: 'Exam not found' });
    res.json(exam);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch exam' });
  }
});

app.listen(port, () => {
  console.log(`Examify Backend (Stages 1-7) is running on http://localhost:${port}`);
});
