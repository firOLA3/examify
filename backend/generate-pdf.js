const fs = require('fs');
const PDFDocument = require('pdfkit'); // Make sure pdfkit is installed

const doc = new PDFDocument();
doc.pipe(fs.createWriteStream('c:/Users/Olaoluwa/Desktop/first-term.pdf'));

doc.fontSize(12).text(`JOHNETHEL COMPUTER STUDIES MANUAL (YEAR 2)
Grooming Future Leaders for Excellence
TOPIC 1: HISTORY OF COMPUTER: (HOW COMPUTER CAME INTO EXISTENCE)
LESSON OBJECTIVES
• By the end of this lesson, pupils should be able to name at least one counting tool used before computers existed. (Knowledge)
• By the end of this lesson, pupils should be able to identify the abacus as an early counting machine. (Comprehension)
• By the end of this lesson, pupils should be able to state one way early computers were different from today's desktop computers. (Comprehension)
• By the end of this lesson, pupils should be able to say where a desktop computer is kept and why. (Application)
LESSON CONTENT
Have you ever seen a desktop computer in your school or at home? The computer did not just appear one day. Long ago, people used stones, fingers, and shells to count. Later, they made a counting frame called the abacus. After that, big machines were made, and finally today's desktop computers were born. Let us learn this wonderful story together.
LIFE BEFORE COMPUTERS
Long, long ago, there were no computers. People still needed to count their goats, yams, and money. They could not use a calculator or a phone. So they used things they could see and touch. This is how counting started long before the computer came into existence.
• (i). They used fingers to count small numbers.
• (ii). They used stones and sticks to count big numbers.

TOPIC 2: EARLY COUNTING DEVICES (FINGERS, PEBBLES, COWRIES, STONES, STICKS, TOES E.T.C)
LESSON OBJECTIVES
• By the end of this lesson, pupils should be able to define early counting devices as objects used long ago to count things. (Knowledge)
• By the end of this lesson, pupils should be able to name at least three early counting devices. (Knowledge)

TOPIC 3: LATER DEVELOPMENT OF COMPUTER: ABACUS, CALCULATOR
LESSON OBJECTIVES
• By the end of this lesson, pupils should be able to define an abacus as a counting tool with beads. (Knowledge)

TOPIC 4: INPUT DEVICES: (KEYBOARD- DESCRIPTION, TYPES, USES, FUNCTIONS OF SPECIAL KEYS)
LESSON OBJECTIVES
• By the end of this lesson, pupils should be able to define a keyboard as an input device used for typing letters, numbers, and symbols. (Knowledge)

TOPIC 5: INPUT DEVICES:(MOUSE- DESCRIPTION, FUNCTIONS, PRACTICAL USE OF MOUSE)
LESSON OBJECTIVES
• By the end of this lesson, pupils should be able to describe a computer mouse as a pointing device. (Knowledge)

TOPIC 6: OUTPUT DEVICES: (PRINTER - DESCRIPTION, TYPES AND USES)
LESSON OBJECTIVES
• By the end of this lesson, pupils should be able to define a printer as a machine that prints words and pictures on paper. (Knowledge)

TOPIC 7: OUTPUT DEVICES: (MONITOR -- DESCRIPTION, TYPES AND USES)
LESSON OBJECTIVES
• By the end of this lesson, pupils should be able to define a monitor as an output device that shows pictures and words. (Knowledge)

TOPIC 8: DIGITAL COMPUTER: MEANING, ORIGIN AND TYPES
LESSON OBJECTIVES
• By the end of this lesson, pupils should be able to define a digital computer as a machine that works with numbers and does tasks fast. (Knowledge)

TOPIC 9: INTRODUCTION TO MACHINE CODES: MEANING OF BINARY DIGIT, UNDERSTANDING DECIMAL NUMBERS
LESSON OBJECTIVES
• By the end of this lesson, pupils should be able to define a binary digit as a number that is either 0 or 1. (Knowledge)
`);

doc.end();
console.log('first-term.pdf created successfully on Desktop!');
