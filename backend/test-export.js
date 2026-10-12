const { buildDocxBuffer, buildPdfBuffer } = require('./utils/exporter');
const fs = require('fs');

const mockExam = {
  objectives: [
    { number: 1, questionText: 'What is a computer?', options: [{ letter: 'a', text: 'Machine', isCorrect: true }, { letter: 'b', text: 'Fruit', isCorrect: false }] }
  ],
  theory: [
    { number: 1, totalMarks: 10, subQuestions: [{ label: 'a', questionText: 'What is it?', marks: 10, modelAnswer: [{ point: 'It is a machine', marks: 10 }] }] }
  ]
};

const metadata = { schoolName: 'Test School', subject: 'CS', className: 'JSS 1', term: 'First', timeAllowed: '1hr' };

async function run() {
  try {
    const docxBuf = await buildDocxBuffer(mockExam, metadata);
    fs.writeFileSync('test.docx', docxBuf);
    console.log('DOCX generated');

    const pdfBuf = await buildPdfBuffer(mockExam, metadata);
    fs.writeFileSync('test.pdf', pdfBuf);
    console.log('PDF generated');
  } catch (err) {
    console.error('FAILED', err);
  }
}
run();
