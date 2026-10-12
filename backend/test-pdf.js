const fs = require('fs');
const pdfParse = require('pdf-parse');

async function testPdf() {
  const dataBuffer = fs.readFileSync('c:/Users/Olaoluwa/Desktop/first-term.pdf');
  const data = await pdfParse(dataBuffer);
  
  if (data.text.includes('DIGITAL COMPUTER')) {
    console.log("Topic 8 is present");
  } else {
    console.log("Topic 8 is MISSING");
  }

  if (data.text.includes('INTRODUCTION TO MACHINE CODES')) {
    console.log("Topic 9 is present");
  } else {
    console.log("Topic 9 is MISSING");
  }
}
testPdf().catch(console.error);
