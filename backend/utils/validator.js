const letters = ['a', 'b', 'c', 'd'];

function shuffleAndBalanceOptions(objectives, classLevel) {
  const optionCount = classLevel.toLowerCase() === 'primary' ? 3 : 4;
  const answerCounts = { a: 0, b: 0, c: 0, d: 0 };
  
  return objectives.map(q => {
    // Determine the letter that needs boosting to maintain balance
    // We look at the counts of letters used so far and pick the minimum
    let targetIndex = 0;
    let minCount = Infinity;
    for (let i = 0; i < optionCount; i++) {
      const letter = letters[i];
      if (answerCounts[letter] < minCount) {
        minCount = answerCounts[letter];
        targetIndex = i;
      }
    }

    // Now we assign the correct answer to targetIndex
    const finalOptions = new Array(optionCount).fill(null);
    finalOptions[targetIndex] = {
      letter: letters[targetIndex],
      text: q.correctAnswer,
      isCorrect: true
    };
    
    // Increment our balance tracker
    answerCounts[letters[targetIndex]]++;

    // Fill the rest with wrong options
    let wrongOptions = [...q.wrongOptions].slice(0, optionCount - 1);
    wrongOptions = wrongOptions.sort(() => Math.random() - 0.5); // Shuffle the wrong options
    
    let wrongIdx = 0;
    for (let i = 0; i < optionCount; i++) {
      if (!finalOptions[i]) {
        finalOptions[i] = {
          letter: letters[i],
          text: wrongOptions[wrongIdx] || 'None',
          isCorrect: false
        };
        wrongIdx++;
      }
    }

    return { ...q, options: finalOptions };
  });
}

function validateObjectiveRules(objectives, blueprint, optionCount) {
  const errors = [];
  
  // 1. Objective count matches blueprint
  if (objectives.length !== blueprint.length) {
    errors.push(`Expected ${blueprint.length} objectives, got ${objectives.length}`);
  }

  const openingWords = { what: 0, where: 0, who: 0, how: 0, when: 0 };
  let deductiveCount = 0;

  objectives.forEach((q, idx) => {
    // 2. Right number of options
    if (q.wrongOptions.length < optionCount - 1) {
      errors.push(`Q${q.number || idx + 1}: Not enough wrong options`);
    }

    // 9. No all/none of the above
    const allOptionsStr = [...q.wrongOptions, q.correctAnswer].join(' ').toLowerCase();
    if (allOptionsStr.includes('all of the above') || allOptionsStr.includes('none of the above')) {
      errors.push(`Q${q.number || idx + 1}: Contains forbidden "all/none of the above"`);
    }

    // 10. Opening words tracking
    const firstWord = (q.questionText.split(' ')[0] || '').toLowerCase();
    if (openingWords[firstWord] !== undefined) {
      openingWords[firstWord]++;
    }

    // 5. Deductive styles
    if (['which-is-not', 'all-except', 'one-of-these-is-a'].includes(q.style)) {
      deductiveCount++;
    }
  });

  // Deductive requirement: at least 30%
  const requiredDeductive = Math.ceil(blueprint.length * 0.3);
  if (deductiveCount < requiredDeductive) {
    errors.push(`Only ${deductiveCount} deductive questions. Expected at least ${requiredDeductive}`);
  }

  // Check overuse of starting words (arbitrary limit of 25%)
  const maxAllowedOpeners = Math.ceil(blueprint.length * 0.25);
  for (const [word, count] of Object.entries(openingWords)) {
    if (count > maxAllowedOpeners) {
      errors.push(`Opening word "${word}" used ${count} times (overused)`);
    }
  }

  return errors;
}

function validateTheoryRules(theory, blueprint) {
  const errors = [];
  
  let totalMarks = 0;

  theory.forEach(q => {
    // Sum total marks
    totalMarks += q.marks || 0;

    const text = (q.questionText || '').toLowerCase();
    
    // 4. Checking prefixes
    if (q.label === 'a') {
      if (!text.startsWith('what is') && !text.startsWith('state')) {
        errors.push(`Theory Q${q.number}${q.label} does not start with "What is" or "State"`);
      }
    } else if (q.label === 'b') {
      if (!text.startsWith('list') && !text.startsWith('mention 3')) {
        errors.push(`Theory Q${q.number}${q.label} does not start with "List or mention 3"`);
      }
    } else {
      if (!text.startsWith('list') && !text.startsWith('mention 5')) {
        errors.push(`Theory Q${q.number}${q.label} does not start with "List or mention 5"`);
      }
    }
  });

  const expectedMarks = blueprint.reduce((sum, b) => sum + b.totalMarks, 0);
  if (totalMarks !== expectedMarks) {
    errors.push(`Theory marks total ${totalMarks} but expected ${expectedMarks}`);
  }

  return errors;
}

module.exports = {
  shuffleAndBalanceOptions,
  validateObjectiveRules,
  validateTheoryRules
};
