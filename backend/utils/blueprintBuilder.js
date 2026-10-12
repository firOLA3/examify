function buildObjectiveBlueprint(schoolLevel, term, topicsData, difficultyMix) {
  const totalQuestions = schoolLevel.toLowerCase() === 'primary' ? 20 : 40;
  const deductiveStyles = ['which-is-not', 'all-except', 'one-of-these-is-a'];
  const deductiveCount = Math.ceil(totalQuestions * 0.3); // At least 30%

  // 1. Filter terms
  let activeTerms = topicsData.terms;
  if (term.toLowerCase() !== 'all') {
    const filtered = topicsData.terms.filter(t => t.termName.toLowerCase().includes(term.toLowerCase()));
    if (filtered.length > 0) activeTerms = filtered;
  }

  // 2. Distribute questions across valid topics
  let flatTopics = [];
  
  // Flatten and filter topics that actually have content
  const allValidTopics = [];
  activeTerms.forEach(termObj => {
    const validTopics = (termObj.topics || []).filter(t => 
      (t.keyFacts && t.keyFacts.length > 0) || 
      (t.definitions && t.definitions.length > 0) || 
      (t.lists && t.lists.length > 0) || 
      (t.summary && t.summary.length > 15)
    );
    validTopics.forEach(t => allValidTopics.push({ topicName: t.topicName, termName: termObj.termName }));
  });

  if (allValidTopics.length > 0) {
    for (let i = 0; i < totalQuestions; i++) {
      flatTopics.push(allValidTopics[i % allValidTopics.length]);
    }
  } else {
    // Fallback if all topics are empty
    for (let i = 0; i < totalQuestions; i++) {
      flatTopics.push({ topicName: "General Topics", termName: "All" });
    }
  }

  // Shuffle the flat topics so they aren't clustered by term/topic
  flatTopics = flatTopics.sort(() => Math.random() - 0.5);

  // 3. Assign Difficulties
  const easyCount = Math.round(totalQuestions * (difficultyMix.easy || 0.6));
  const mediumCount = Math.round(totalQuestions * (difficultyMix.medium || 0.3));
  // Hard gets whatever is left
  let difficulties = [];
  for (let i = 0; i < easyCount; i++) difficulties.push('easy');
  for (let i = 0; i < mediumCount; i++) difficulties.push('medium');
  while (difficulties.length < totalQuestions) difficulties.push('hard');
  difficulties = difficulties.sort(() => Math.random() - 0.5);

  // 4. Assign Styles
  let styles = [];
  for (let i = 0; i < deductiveCount; i++) {
    styles.push(deductiveStyles[i % deductiveStyles.length]);
  }
  while (styles.length < totalQuestions) styles.push('normal');
  styles = styles.sort(() => Math.random() - 0.5);

  // 5. Build Blueprint Rows
  const objectiveBlueprint = flatTopics.map((item, index) => ({
    questionNumber: index + 1,
    topicName: item.topicName,
    termName: item.termName,
    difficulty: difficulties[index] || 'medium',
    style: styles[index] || 'normal'
  }));

  return objectiveBlueprint;
}

function buildTheoryBlueprint(schoolLevel, term, topicsData) {
  const isPrimary = schoolLevel.toLowerCase() === 'primary';
  const totalQuestions = isPrimary ? 2 : 3; // 20 marks (2x10) or 30 marks (3x10)

  // Get unique topics to assign to main questions
  let availableTopics = [];
  let activeTerms = topicsData.terms;
  if (term.toLowerCase() !== 'all') {
    const filtered = topicsData.terms.filter(t => t.termName.toLowerCase().includes(term.toLowerCase()));
    if (filtered.length > 0) activeTerms = filtered;
  }
  
  activeTerms.forEach(termObj => {
    const validTopics = (termObj.topics || []).filter(t => 
      (t.keyFacts && t.keyFacts.length > 0) || 
      (t.definitions && t.definitions.length > 0) || 
      (t.lists && t.lists.length > 0) || 
      (t.summary && t.summary.length > 15)
    );
    validTopics.forEach(topic => {
      availableTopics.push(topic.topicName);
    });
  });

  // Shuffle available topics
  availableTopics = availableTopics.sort(() => Math.random() - 0.5);
  
  const theoryBlueprint = [];
  
  for (let i = 0; i < totalQuestions; i++) {
    // If we run out of unique topics, wrap around
    const topicName = availableTopics[i % availableTopics.length] || "General";
    
    // Structure: 10 marks total. 
    // a (3 marks) -> "What is..."
    // b (3 marks) -> "List or mention 3..."
    // c (4 marks) -> "List or mention 5..."
    
    theoryBlueprint.push({
      questionNumber: i + 1,
      topicName: topicName,
      totalMarks: 10,
      subQuestions: [
        { label: 'a', marks: 3, requirement: "What is..." },
        { label: 'b', marks: 3, requirement: "List or mention 3..." },
        { label: 'c', marks: 4, requirement: "List or mention 5..." }
      ]
    });
  }

  return theoryBlueprint;
}

module.exports = {
  buildObjectiveBlueprint,
  buildTheoryBlueprint
};
