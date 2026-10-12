const mongoose = require('mongoose');

const OptionSchema = new mongoose.Schema({
  letter: String,
  text: String,
  isCorrect: Boolean
}, { _id: false });

const ObjectiveSchema = new mongoose.Schema({
  number: Number,
  topicName: String,
  termName: String,
  difficulty: String,
  style: String,
  questionText: String,
  correctAnswer: String,
  wrongOptions: [String],
  options: [OptionSchema]
}, { _id: false });

const TheoryPointSchema = new mongoose.Schema({
  point: String,
  marks: Number
}, { _id: false });

const TheorySchema = new mongoose.Schema({
  number: Number,
  label: String,
  questionText: String,
  marks: Number,
  modelAnswer: [TheoryPointSchema]
}, { _id: false });

const ExamSchema = new mongoose.Schema({
  metadata: {
    schoolName: String,
    schoolLevel: String,
    className: String,
    subject: String,
    term: String,
    timeAllowed: String,
    country: String
  },
  exam: {
    objectives: [ObjectiveSchema],
    theory: [TheorySchema]
  }
}, { timestamps: true });

module.exports = mongoose.model('Exam', ExamSchema);
