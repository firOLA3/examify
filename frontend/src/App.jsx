import { useMemo, useRef, useState } from 'react'
import './App.css'

const API_BASE = 'http://localhost:3001'

const generationStages = [
  'Building blueprint',
  'Writing exam questions',
  'Checking quality and shuffling',
]

const shuffleArray = (items) => {
  const copy = [...items]
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1))
    ;[copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]]
  }
  return copy
}

function App() {
  const fileInputRef = useRef(null)

  const [currentStep, setCurrentStep] = useState('setup')
  const [form, setForm] = useState({
    schoolName: '',
    subject: 'Computer Studies',
    className: '',
    schoolLevel: 'Secondary',
    term: 'All',
    timeAllowed: '90',
    country: 'Nigerian',
  })
  const [manualFile, setManualFile] = useState(null)
  const [manualText, setManualText] = useState('')
  const [topicsData, setTopicsData] = useState({ terms: [] })
  const [selectedTopics, setSelectedTopics] = useState([])
  const [generationStage, setGenerationStage] = useState(0)
  const [exam, setExam] = useState({ objectives: [], theory: [] })
  const [validation, setValidation] = useState({ objectives: [], theory: [] })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [statusMessage, setStatusMessage] = useState('')
  const [editingQuestion, setEditingQuestion] = useState(null)
  const [pastExams, setPastExams] = useState([])

  const loadPastExams = async () => {
    try {
      setIsLoading(true)
      const res = await fetch(`${API_BASE}/api/exams`)
      const data = await res.json()
      setPastExams(data)
      setCurrentStep('past-papers')
    } catch (e) {
      setError('Failed to load past exams')
    } finally {
      setIsLoading(false)
    }
  }

  const loadExamToPreview = async (id) => {
    try {
      setIsLoading(true)
      const res = await fetch(`${API_BASE}/api/exams/${id}`)
      const data = await res.json()
      setExam(data.exam)
      setForm(prev => ({ ...prev, ...data.metadata }))
      setCurrentStep('preview')
    } catch (e) {
      setError('Failed to load exam details')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveExamToBank = async () => {
    try {
      setIsLoading(true)
      const res = await fetch(`${API_BASE}/api/exams`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          metadata: {
            schoolName: form.schoolName,
            schoolLevel: form.schoolLevel,
            className: form.className,
            subject: form.subject,
            term: form.term,
            timeAllowed: form.timeAllowed,
            country: form.country
          },
          exam
        })
      })
      if (res.ok) alert('Saved to Question Bank successfully!')
    } catch (e) {
      alert('Failed to save to question bank.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveEdit = () => {
    if (!editingQuestion) return
    setExam((prev) => ({
      ...prev,
      [editingQuestion.type]: prev[editingQuestion.type].map((q) =>
        (q.number === editingQuestion.number && q.label === editingQuestion.label)
          ? { ...q, questionText: editingQuestion.text }
          : q
      ),
    }))
    setEditingQuestion(null)
  }

  const flattenedTopics = useMemo(
    () =>
      topicsData.terms?.flatMap((term) =>
        term.topics?.map((topic) => ({
          termName: term.termName,
          topicName: topic.topicName,
        })),
      ) ?? [],
    [topicsData],
  )

  const selectedTopicCount = selectedTopics.length

  const updateForm = (field, value) => {
    setForm((previous) => ({ ...previous, [field]: value }))
  }

  const handleFileChange = (event) => {
    const file = event.target.files?.[0]
    if (!file) {
      setManualFile(null)
      return
    }

    setManualFile(file)
    setError('')
  }

  const handleExtractTopics = async (event) => {
    event.preventDefault()

    if (!manualFile && !manualText.trim()) {
      setError('Please choose a PDF manual or paste the curriculum text before continuing.')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const payload = new FormData()
      if (manualFile) {
        payload.append('manual', manualFile)
      }
      if (manualText.trim()) {
        payload.append('text', manualText)
      }
      payload.append('subject', form.subject)
      payload.append('country', form.country)

      const response = await fetch(`${API_BASE}/api/extract-topics`, {
        method: 'POST',
        body: payload,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.details || data.error || 'Unable to extract topics.')
      }

      const allTopics = [
        ...new Set(
          (data.terms || []).flatMap((term) =>
            (term.topics || []).map((topic) => topic.topicName),
          ),
        ),
      ]

      setTopicsData(data)
      setSelectedTopics(allTopics)
      setCurrentStep('review')
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setIsLoading(false)
    }
  }

  const toggleTopic = (topicName) => {
    setSelectedTopics((previous) =>
      previous.includes(topicName)
        ? previous.filter((topic) => topic !== topicName)
        : [...previous, topicName],
    )
  }

  const selectAllTopics = () => {
    const allTopicNames = [
      ...new Set(
        (topicsData.terms || []).flatMap((term) =>
          (term.topics || []).map((item) => item.topicName),
        ),
      ),
    ]
    setSelectedTopics(allTopicNames)
  }

  const clearSelectedTopics = () => setSelectedTopics([])

  const handleGenerateExam = async () => {
    if (!selectedTopics.length) {
      setError('Select at least one topic before generating the exam.')
      return
    }

    setIsLoading(true)
    setError('')
    setCurrentStep('generating')
    setGenerationStage(0)
    setStatusMessage('Preparing the exam blueprint...')

    try {
      const trimmedTerms = (topicsData.terms || [])
        .map((term) => ({
          ...term,
          topics: (term.topics || []).filter((topic) =>
            selectedTopics.includes(topic.topicName),
          ),
        }))
        .filter((term) => term.topics.length)

      const blueprintResponse = await fetch(`${API_BASE}/api/build-blueprint`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schoolLevel: form.schoolLevel,
          term: form.term,
          topicsData: { ...topicsData, terms: trimmedTerms },
          difficultyMix: { easy: 0.6, medium: 0.3, hard: 0.1 },
        }),
      })

      const blueprintData = await blueprintResponse.json()
      if (!blueprintResponse.ok) {
        throw new Error(blueprintData.details || blueprintData.error || 'Blueprint build failed.')
      }

      setGenerationStage(1)
      setStatusMessage('Generating objective and theory questions...')

      const generationResponse = await fetch(`${API_BASE}/api/generate-exam`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schoolLevel: form.schoolLevel,
          subject: form.subject,
          topicsData: { ...topicsData, terms: trimmedTerms },
          blueprints: blueprintData.blueprints,
        }),
      })

      const generationData = await generationResponse.json()
      if (!generationResponse.ok) {
        throw new Error(generationData.details || generationData.error || 'Exam generation failed.')
      }

      setGenerationStage(2)
      setStatusMessage('Validating rules and shuffling answer choices...')

      const validationResponse = await fetch(`${API_BASE}/api/validate-and-shuffle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schoolLevel: form.schoolLevel,
          exam: generationData.exam,
          blueprints: blueprintData.blueprints,
        }),
      })

      const validationData = await validationResponse.json()
      if (!validationResponse.ok) {
        throw new Error(validationData.details || validationData.error || 'Validation failed.')
      }

      setExam(validationData.exam)
      setValidation(validationData.validationErrors)
      setCurrentStep('preview')
    } catch (requestError) {
      setError(requestError.message)
      setCurrentStep('review')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegenerateQuestion = async (question, type) => {
    if (!question) return

    setIsLoading(true)
    setError('')

    try {
      const response = await fetch(`${API_BASE}/api/regenerate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schoolLevel: form.schoolLevel,
          subject: form.subject,
          topicsData,
          oldQuestion: question,
          reason: 'Teacher requested a fresher version for this question.',
          otherQuestions:
            type === 'objective'
              ? exam.objectives.filter((item) => item.number !== question.number)
              : exam.theory.filter((item) => item.number !== question.number),
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.details || data.error || 'Regeneration failed.')
      }

      const replacement = data.question

      if (type === 'objective') {
        setExam((previous) => ({
          ...previous,
          objectives: previous.objectives.map((item) =>
            item.number === question.number ? { ...item, ...replacement } : item,
          ),
        }))
      } else {
        setExam((previous) => ({
          ...previous,
          theory: previous.theory.map((item) =>
            item.number === question.number ? { ...item, ...replacement } : item,
          ),
        }))
      }
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleExport = async (format) => {
    if (!exam.objectives.length && !exam.theory.length) {
      setError('Generate an exam before exporting.')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const response = await fetch(`${API_BASE}/api/export`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          format,
          exam,
          metadata: {
            schoolName: form.schoolName,
            schoolLevel: form.schoolLevel,
            className: form.className,
            subject: form.subject,
            term: form.term,
            timeAllowed: form.timeAllowed,
          },
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.details || errorData.error || 'Export failed.')
      }

      const blob = await response.blob()
      const downloadUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = `examify-${format}.${format === 'pdf' ? 'pdf' : 'docx'}`
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(downloadUrl)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setIsLoading(false)
    }
  }

  const renderStepContent = () => {
    if (currentStep === 'setup') {
      return (
        <div className="portal-layout">
          <aside className="portal-sidebar">
            <div className="sidebar-card highlight-card">
              <span className="mini-label">School portal</span>
              <h3>Academic workflow</h3>
              <ul>
                <li className="active" style={{ cursor: 'pointer' }} onClick={() => setCurrentStep('setup')}>New assessment</li>
                <li style={{ cursor: 'pointer' }} onClick={loadPastExams}>Past papers</li>
                <li>Subject planning</li>
                <li>Reports</li>
              </ul>
            </div>

            <div className="sidebar-card stats-card">
              <div className="stat-row">
                <span>Teachers</span>
                <strong>18</strong>
              </div>
              <div className="stat-row">
                <span>Classes</span>
                <strong>24</strong>
              </div>
              <div className="stat-row">
                <span>Assessments</span>
                <strong>96</strong>
              </div>
            </div>
          </aside>

          <div className="portal-main-grid">
            <div className="panel panel-hero">
              <div className="eyebrow">AI-powered exam studio</div>
              <h1>Create smart exam papers in minutes.</h1>
              <p>
                Turn curriculum manuals into balanced school assessments, validate rules,
                and prepare polished PDF or Word exports for the next class test.
              </p>

              <div className="hero-stats">
                <div>
                  <strong>5</strong>
                  <span>workflow stages</span>
                </div>
                <div>
                  <strong>AI</strong>
                  <span>question logic</span>
                </div>
                <div>
                  <strong>1-click</strong>
                  <span>export ready</span>
                </div>
              </div>
            </div>

            <div className="panel panel-form">
              <div className="form-header">
                <div>
                  <span className="mini-label">New assessment</span>
                  <h2>Exam details</h2>
                </div>
              </div>

              <form onSubmit={handleExtractTopics} className="setup-form">
                <div className="field-row two-up">
                  <label>
                    <span>School name</span>
                    <input
                      type="text"
                      value={form.schoolName}
                      onChange={(event) => updateForm('schoolName', event.target.value)}
                      placeholder="e.g. Bright Future Academy"
                    />
                  </label>
                  <label>
                    <span>Class name</span>
                    <input
                      type="text"
                      value={form.className}
                      onChange={(event) => updateForm('className', event.target.value)}
                      placeholder="e.g. JSS 2"
                    />
                  </label>
                </div>

                <div className="field-row two-up">
                  <label>
                    <span>Subject</span>
                    <input
                      type="text"
                      value={form.subject}
                      onChange={(event) => updateForm('subject', event.target.value)}
                    />
                  </label>
                  <label>
                    <span>School level</span>
                    <select
                      value={form.schoolLevel}
                      onChange={(event) => updateForm('schoolLevel', event.target.value)}
                    >
                      <option value="Primary">Primary</option>
                      <option value="Secondary">Secondary</option>
                    </select>
                  </label>
                </div>

                <div className="field-row two-up">
                  <label>
                    <span>Term</span>
                    <select
                      value={form.term}
                      onChange={(event) => updateForm('term', event.target.value)}
                    >
                      <option value="All">All</option>
                      <option value="First">First</option>
                      <option value="Second">Second</option>
                      <option value="Third">Third</option>
                    </select>
                  </label>
                  <label>
                    <span>Time allowed</span>
                    <input
                      type="text"
                      value={form.timeAllowed}
                      onChange={(event) => updateForm('timeAllowed', event.target.value)}
                      placeholder="90 mins"
                    />
                  </label>
                </div>

                <div className="upload-box">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="application/pdf"
                    onChange={handleFileChange}
                    className="file-input"
                  />
                  <div className="upload-content">
                    <div className="upload-icon">PDF</div>
                    <div>
                      <strong>{manualFile ? manualFile.name : 'Upload curriculum manual'}</strong>
                      <p>Drag and drop or browse for your PDF curriculum file.</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="secondary-btn"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Choose file
                  </button>
                </div>

                <div className="text-input-box" style={{ marginTop: '1rem' }}>
                  <label>
                    <span style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Or paste curriculum text here (fallback for large PDFs):</span>
                    <textarea 
                      value={manualText}
                      onChange={(e) => setManualText(e.target.value)}
                      placeholder="Paste topics and curriculum details here if you don't have a PDF or if the PDF is too large."
                      style={{ width: '100%', minHeight: '120px', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
                    />
                  </label>
                </div>

                {error && <div className="alert error">{error}</div>}

                <button type="submit" className="primary-btn" disabled={isLoading}>
                  {isLoading ? 'Preparing...' : 'Continue to topics'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )
    }

    if (currentStep === 'review') {
      return (
        <div className="panel review-panel">
          <div className="section-header">
            <div>
              <div className="eyebrow">Topic review</div>
              <h2>Choose what to include in this assessment</h2>
            </div>
            <div className="bulk-actions">
              <button type="button" className="ghost-btn" onClick={selectAllTopics}>
                Select all
              </button>
              <button type="button" className="ghost-btn" onClick={clearSelectedTopics}>
                Clear
              </button>
            </div>
          </div>

          <div className="topic-summary">
            <div className="summary-card">
              <span className="label">Selected topics</span>
              <strong>{selectedTopicCount}</strong>
            </div>
            <div className="summary-card">
              <span className="label">School level</span>
              <strong>{form.schoolLevel}</strong>
            </div>
            <div className="summary-card">
              <span className="label">Term</span>
              <strong>{form.term}</strong>
            </div>
          </div>

          <div className="topic-list">
            {(topicsData.terms || []).map((term) => (
              <div className="term-section" key={term.termName}>
                <h3>{term.termName}</h3>

                {term.topics?.map((topic) => {
                  const isSelected = selectedTopics.includes(topic.topicName)
                  return (
                    <label
                      key={`${term.termName}-${topic.topicName}`}
                      className={`topic-item ${isSelected ? 'selected' : ''}`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleTopic(topic.topicName)}
                      />
                      <div>
                        <span>{topic.topicName}</span>
                        <small>{topic.summary}</small>
                      </div>
                    </label>
                  )
                })}
              </div>
            ))}
          </div>

          <div className="sticky-actions">
            <button type="button" className="ghost-btn" onClick={() => setCurrentStep('setup')}>
              Back
            </button>
            <button
              type="button"
              className="primary-btn"
              onClick={handleGenerateExam}
              disabled={isLoading || !selectedTopics.length}
            >
              {isLoading ? 'Generating...' : 'Confirm & generate exam'}
            </button>
          </div>
        </div>
      )
    }

    if (currentStep === 'generating') {
      return (
        <div className="panel processing-panel">
          <div className="eyebrow">Generating assessment</div>
          <h2>Let the AI build your exam package.</h2>

          <div className="progress-flow">
            {generationStages.map((stage, index) => (
              <div
                key={stage}
                className={`progress-step ${generationStage >= index ? 'active' : ''}`}
              >
                <span>{index + 1}</span>
                <div>
                  <strong>{stage}</strong>
                </div>
              </div>
            ))}
          </div>

          <div className="loader-wrap">
            <div className="loader" />
          </div>

          <p className="status-message">{statusMessage}</p>
          {error && <div className="alert error">{error}</div>}
        </div>
      )
    }

    return (
      <div className="panel preview-panel">
        <div className="section-header studio-header">
          <div>
            <div className="eyebrow">Exam workspace</div>
            <h2>{form.subject} assessment for {form.className || 'the class'}</h2>
          </div>
          <div className="export-actions">
            <button type="button" className="ghost-btn" onClick={() => setCurrentStep('setup')} style={{ marginRight: 'auto', border: '1px solid #ddd' }}>
              &larr; Start Over
            </button>
            <button type="button" className="ghost-btn" onClick={handleSaveExamToBank}>
              Save to DB
            </button>
            <button type="button" className="ghost-btn" onClick={() => handleExport('pdf')}>
              Download PDF
            </button>
            <button type="button" className="primary-btn" onClick={() => handleExport('docx')}>
              Download Word
            </button>
          </div>
        </div>

        <div className="paper-meta-bar">
          <div className="meta-pill">
            <span>School</span>
            <strong>{form.schoolName || 'School name'}</strong>
          </div>
          <div className="meta-pill">
            <span>Class</span>
            <strong>{form.className || 'Class'}</strong>
          </div>
          <div className="meta-pill">
            <span>Term</span>
            <strong>{form.term}</strong>
          </div>
          <div className="meta-pill">
            <span>Time</span>
            <strong>{form.timeAllowed || '90 mins'}</strong>
          </div>
        </div>

        {error && <div className="alert error">{error}</div>}

        <div className="preview-sections examine-paper">
          <div className="preview-card objective-paper">
            <div className="card-header">
              <div>
                <span className="mini-label">Section A</span>
                <h3>Objective section</h3>
              </div>
              <span className="section-badge">{exam.objectives.length} questions</span>
            </div>

            {(exam.objectives || []).map((question) => {
              const optionSet = shuffleArray([
                question.correctAnswer,
                ...(question.wrongOptions || []),
              ])

              return (
                <div key={question.number || question.questionText} className="question-card objective-card">
                  <div className="question-topline">
                    <span>Q{question.number}</span>
                    <span className="pill">{question.style}</span>
                  </div>
                  <p>{question.questionText}</p>

                  <div className="options-grid">
                    {optionSet.map((option, index) => (
                      <div
                        key={`${question.number}-${index}-${option}`}
                        className={`option-item ${
                          option === question.correctAnswer ? 'correct' : ''
                        }`}
                      >
                        <span>{String.fromCharCode(65 + index)}.</span>
                        {option}
                      </div>
                    ))}
                  </div>

                  {editingQuestion?.type === 'objectives' && editingQuestion?.number === question.number ? (
                    <div className="edit-box">
                      <textarea
                        value={editingQuestion.text}
                        onChange={(e) => setEditingQuestion({ ...editingQuestion, text: e.target.value })}
                        className="edit-textarea"
                      />
                      <div className="edit-actions">
                        <button type="button" className="ghost-btn" onClick={() => setEditingQuestion(null)}>Cancel</button>
                        <button type="button" className="primary-btn" onClick={handleSaveEdit}>Save</button>
                      </div>
                    </div>
                  ) : (
                    <div className="question-actions">
                      <button type="button" className="ghost-btn" onClick={() => setEditingQuestion({ type: 'objectives', number: question.number, label: undefined, text: question.questionText })}>
                        Edit
                      </button>
                      <button type="button" className="ghost-btn" onClick={() => handleRegenerateQuestion(question, 'objective')}>
                        Regenerate
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          <div className="preview-card theory-paper">
            <div className="card-header">
              <div>
                <span className="mini-label">Section B</span>
                <h3>Theory section</h3>
              </div>
              <span className="section-badge">{exam.theory.length} questions</span>
            </div>

            {(exam.theory || []).map((question) => (
              <div key={question.number || question.label} className="question-card theory-card">
                <div className="question-topline">
                  <span>Q{question.number}</span>
                  <span className="pill">{question.marks} marks</span>
                </div>
                <p>
                  <strong>{question.label}.</strong> {question.questionText}
                </p>

                <div className="model-answer">
                  <h4>Model answer</h4>
                  <ul>
                    {(question.modelAnswer || []).map((point, index) => (
                      <li key={`${question.number}-${index}`}>
                        <span>{point.point}</span>
                        <em>{point.marks} marks</em>
                      </li>
                    ))}
                  </ul>
                </div>

                {editingQuestion?.type === 'theory' && editingQuestion?.number === question.number && editingQuestion?.label === question.label ? (
                  <div className="edit-box">
                    <textarea
                      value={editingQuestion.text}
                      onChange={(e) => setEditingQuestion({ ...editingQuestion, text: e.target.value })}
                      className="edit-textarea"
                    />
                    <div className="edit-actions">
                      <button type="button" className="ghost-btn" onClick={() => setEditingQuestion(null)}>Cancel</button>
                      <button type="button" className="primary-btn" onClick={handleSaveEdit}>Save</button>
                    </div>
                  </div>
                ) : (
                  <div className="question-actions">
                    <button type="button" className="ghost-btn" onClick={() => setEditingQuestion({ type: 'theory', number: question.number, label: question.label, text: question.questionText })}>
                      Edit
                    </button>
                    <button type="button" className="ghost-btn" onClick={() => handleRegenerateQuestion(question, 'theory')}>
                      Regenerate
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (currentStep === 'past-papers') {
    return (
      <div className="panel review-panel">
        <div className="section-header">
          <div>
            <div className="eyebrow">Question Bank</div>
            <h2>Past Exam Papers</h2>
          </div>
          <button type="button" className="ghost-btn" onClick={() => setCurrentStep('setup')}>
            Back to Setup
          </button>
        </div>

        <div className="topic-list">
          {pastExams.map(ex => (
            <div key={ex._id} className="term-section" style={{ cursor: 'pointer', padding: '16px', borderBottom: '1px solid var(--border)' }} onClick={() => loadExamToPreview(ex._id)}>
              <h3>{ex.metadata?.subject} - {ex.metadata?.className}</h3>
              <p>{ex.metadata?.term} Term Exam (Generated on {new Date(ex.createdAt).toLocaleDateString()})</p>
            </div>
          ))}
          {pastExams.length === 0 && <p>No past exams found.</p>}
        </div>
      </div>
    )
  }

  const progressSteps = [
    { label: 'Setup', current: currentStep === 'setup' },
    { label: 'Topics', current: currentStep === 'review' },
    { label: 'Build', current: currentStep === 'generating' },
    { label: 'Preview', current: currentStep === 'preview' },
  ]

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand-block">
          <div className="brand-mark">E</div>
          <div>
            <span className="brand-name">Examify</span>
            <small>School portal</small>
          </div>
        </div>

        <nav className="progress-nav" aria-label="Progress steps">
          {progressSteps.map((step) => (
            <div key={step.label} className={`nav-step ${step.current ? 'current' : ''}`}>
              {step.label}
            </div>
          ))}
        </nav>

        <div className="profile-chip">
          <span className="profile-dot" />
          Mrs. Adams
        </div>
      </header>

      <main className="app-main">{renderStepContent()}</main>

      {currentStep !== 'setup' && flattenedTopics.length > 0 && (
        <aside className="inspector-panel">
          <h4>Detected topics</h4>
          <div className="inspector-list">
            {flattenedTopics.slice(0, 8).map((topic) => (
              <span key={`${topic.termName}-${topic.topicName}`} className="topic-tag">
                {topic.topicName}
              </span>
            ))}
          </div>
        </aside>
      )}
    </div>
  )
}

export default App
