const { Document, Packer, Paragraph, TextRun, HeadingLevel, PageBreak } = require('docx');
const PDFDocument = require('pdfkit');

function buildDocxBuffer(examData, metadata) {
  const { schoolName = 'Example School', subject = 'Subject', className = 'Class', term = 'Term', timeAllowed = '1 Hour' } = metadata;
  
  const children = [
    new Paragraph({ text: schoolName.toUpperCase(), heading: HeadingLevel.HEADING_1, alignment: 'center' }),
    new Paragraph({ text: `${term} Examination - ${className}`, heading: HeadingLevel.HEADING_2, alignment: 'center' }),
    new Paragraph({ text: `Subject: ${subject}    |    Time Allowed: ${timeAllowed}`, alignment: 'center' }),
    new Paragraph({ text: '' }),
    new Paragraph({ text: 'Name: ____________________________________________________  Class: __________' }),
    new Paragraph({ text: '' }),
    new Paragraph({ text: 'SECTION A: OBJECTIVES', heading: HeadingLevel.HEADING_3 }),
    new Paragraph({ text: 'Instruction: Choose the correct option from the letters provided.' }),
    new Paragraph({ text: '' })
  ];

  // Objectives
  examData.objectives.forEach(q => {
    children.push(new Paragraph({ text: `${q.number}. ${q.questionText}` }));
    q.options.forEach(opt => {
      children.push(new Paragraph({ text: `    (${opt.letter}) ${opt.text}` }));
    });
    children.push(new Paragraph({ text: '' }));
  });

  // Theory
  children.push(new Paragraph({ text: 'SECTION B: THEORY', heading: HeadingLevel.HEADING_3, pageBreakBefore: true }));
  children.push(new Paragraph({ text: 'Instruction: Answer all questions in this section.' }));
  children.push(new Paragraph({ text: '' }));

  // Group flat theory by number
  const theoryGroups = {};
  (examData.theory || []).forEach(q => {
    if (!theoryGroups[q.number]) theoryGroups[q.number] = [];
    theoryGroups[q.number].push(q);
  });

  Object.keys(theoryGroups).sort().forEach(num => {
    children.push(new Paragraph({ text: `Question ${num} (10 marks)` }));
    theoryGroups[num].forEach(sq => {
      children.push(new Paragraph({ text: `  ${sq.label}) ${sq.questionText} [${sq.marks} marks]` }));
    });
    children.push(new Paragraph({ text: '' }));
  });

  // Teacher Copy
  children.push(new Paragraph({ text: 'TEACHER MARKING GUIDE', heading: HeadingLevel.HEADING_1, alignment: 'center', pageBreakBefore: true }));
  children.push(new Paragraph({ text: 'SECTION A ANSWERS' }));
  examData.objectives.forEach(q => {
    const correctOpt = q.options.find(o => o.isCorrect);
    children.push(new Paragraph({ text: `${q.number}. (${correctOpt.letter}) ${correctOpt.text}` }));
  });

  children.push(new Paragraph({ text: '' }));
  children.push(new Paragraph({ text: 'SECTION B MARKING GUIDE' }));
  
  Object.keys(theoryGroups).sort().forEach(num => {
    children.push(new Paragraph({ text: `Question ${num}` }));
    theoryGroups[num].forEach(sq => {
      children.push(new Paragraph({ text: `  ${sq.label}) [${sq.marks} marks total]` }));
      (sq.modelAnswer || []).forEach(ma => {
        children.push(new Paragraph({ text: `      - ${ma.point} (${ma.marks} marks)` }));
      });
    });
    children.push(new Paragraph({ text: '' }));
  });

  const doc = new Document({
    sections: [{
      properties: {},
      children: children
    }]
  });

  return Packer.toBuffer(doc);
}

function buildPdfBuffer(examData, metadata) {
  return new Promise((resolve) => {
    const doc = new PDFDocument({ margin: 50 });
    const buffers = [];
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => resolve(Buffer.concat(buffers)));

    const { schoolName = 'Example School', subject = 'Subject', className = 'Class', term = 'Term', timeAllowed = '1 Hour' } = metadata;

    // Header
    doc.font('Helvetica-Bold').fontSize(16).text(schoolName.toUpperCase(), { align: 'center' });
    doc.fontSize(14).text(`${term} Examination - ${className}`, { align: 'center' });
    doc.fontSize(12).text(`Subject: ${subject}    |    Time Allowed: ${timeAllowed}`, { align: 'center' });
    doc.moveDown();
    doc.font('Helvetica').fontSize(12).text('Name: ____________________________________________________  Class: __________');
    doc.moveDown(2);

    // Objectives
    doc.font('Helvetica-Bold').fontSize(14).text('SECTION A: OBJECTIVES');
    doc.font('Helvetica').fontSize(11).text('Instruction: Choose the correct option from the letters provided.');
    doc.moveDown();

    examData.objectives.forEach(q => {
      doc.font('Helvetica-Bold').text(`${q.number}. ${q.questionText}`);
      doc.font('Helvetica');
      q.options.forEach(opt => {
        doc.text(`    (${opt.letter}) ${opt.text}`);
      });
      doc.moveDown();
    });

    // Theory
    doc.addPage();
    doc.font('Helvetica-Bold').fontSize(14).text('SECTION B: THEORY');
    doc.font('Helvetica').fontSize(11).text('Instruction: Answer all questions in this section.');
    doc.moveDown();

    const pdfTheoryGroups = {};
    (examData.theory || []).forEach(q => {
      if (!pdfTheoryGroups[q.number]) pdfTheoryGroups[q.number] = [];
      pdfTheoryGroups[q.number].push(q);
    });

    Object.keys(pdfTheoryGroups).sort().forEach(num => {
      doc.font('Helvetica-Bold').text(`Question ${num} (10 marks)`);
      doc.font('Helvetica');
      pdfTheoryGroups[num].forEach(sq => {
        doc.text(`  ${sq.label}) ${sq.questionText} [${sq.marks} marks]`);
      });
      doc.moveDown();
    });

    // Teacher Section
    doc.addPage();
    doc.font('Helvetica-Bold').fontSize(16).text('TEACHER MARKING GUIDE', { align: 'center' });
    doc.moveDown();
    doc.fontSize(14).text('SECTION A ANSWERS');
    doc.font('Helvetica').fontSize(11);
    examData.objectives.forEach(q => {
      const correctOpt = q.options.find(o => o.isCorrect);
      doc.text(`${q.number}. (${correctOpt.letter}) ${correctOpt.text}`);
    });

    doc.moveDown();
    doc.font('Helvetica-Bold').fontSize(14).text('SECTION B MARKING GUIDE');
    doc.font('Helvetica').fontSize(11);
    
    Object.keys(pdfTheoryGroups).sort().forEach(num => {
      doc.font('Helvetica-Bold').text(`Question ${num}`);
      doc.font('Helvetica');
      pdfTheoryGroups[num].forEach(sq => {
        doc.text(`  ${sq.label}) [${sq.marks} marks total]`);
        (sq.modelAnswer || []).forEach(ma => {
          doc.text(`      - ${ma.point} (${ma.marks} marks)`);
        });
      });
      doc.moveDown();
    });

    doc.end();
  });
}

module.exports = {
  buildDocxBuffer,
  buildPdfBuffer
};
