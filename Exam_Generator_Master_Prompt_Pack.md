# Exam Question Generator

Master Prompt Pack and Build Guidelines

## 1. What this document is

This is the kickoff pack for the exam generator. It contains the rules of the exam, who does what (code or AI), the four master prompts, the validation checklist, the feature list, the build order, and one final kickoff prompt you can paste into a coding assistant. It contains no code. Anything in {curly brackets} is a placeholder that your backend fills in before sending the prompt.

## 2. The system at a glance

Each step is done by your code, by Gemini (AI), or by the teacher, as marked.

1. Teacher uploads the PDF manual (teacher)
2. Gemini reads the manual and lists topics per term (AI)
3. Teacher confirms the topics (teacher)
4. Code builds the blueprint: marks, topic quotas, question styles (code)
5. Gemini writes the questions in batches (AI)
6. Code validates the questions and shuffles the options (code)
7. Teacher previews, edits and regenerates questions (teacher)
8. Code exports Word and PDF (code)

## 3. The exam rules

| **Item**                | **Primary school**                                                                                               | **Secondary school (JSS / SS)**                                                                                  |
|-------------------------|------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------|
| **Objective questions** | 20 questions, 40 marks (2 marks each)                                                                            | 40 questions, 40 marks (1 mark each)                                                                             |
| **Objective options**   | 3 options: (a) (b) (c)                                                                                           | 4 options: (a) (b) (c) (d)                                                                                       |
| **Theory total**        | 20 marks                                                                                                         | 30 marks                                                                                                         |
| **Theory shape**        | 2 to 4 main questions, each with a few sub-questions. Whole marks only.                                          | More varied splits, whole marks only, for example 1a 1b 1c 2a 2b 3 = 4, 3, 3, 5, 5, 10.                          |
| **Class levels**        | Primary 1 to 6                                                                                                   | JSS 1 to 3 and SS 1 to 3                                                                                         |
| **Terms**               | First, Second, Third, or All                                                                                     | First, Second, Third, or All                                                                                     |
| **Output**              | Word (.docx) and PDF. Student paper first, teacher answers and marking guide on the last pages of the same file. | Word (.docx) and PDF. Student paper first, teacher answers and marking guide on the last pages of the same file. |

### Question wording rules (from your friend, kept)

- Avoid overusing what, where, who, how and when as question openers.

- Theory sub-question (a) must begin with "What is...".

- Theory sub-question (b) must begin with "List or mention 3...".

- Every other theory question or sub-question (c, standalone) must begin with "List or mention 5...".

- Use deductive objective formats: "Which of these is not...", "All of these are... except...", "One of these is a...".

- Options are written as (a) ..., (b) ..., (c) ... with small letters in brackets.

- Questions must cover all topics in the selected term.

- Language must suit the class level. Primary 1 must be very simple.

### Rules we added

- At least 30 percent of objective questions use the deductive formats. Code assigns which question numbers get which format, so the quota is guaranteed.

- Each topic receives a fair number of questions, decided by code from the confirmed topic list. When All terms is chosen, code first shares the questions equally between the three terms, then between topics inside each term.

- The correct option is shuffled by code so the answer letter is not biased toward (b).

- If a topic has no natural definition for the (a) rule, the prompt may use "State..." instead of "What is...". This should be a teacher setting.

- Questions must come only from the manual. No outside facts.

- All theory marks are whole numbers. No halves anywhere.

- The teacher copy is not a separate file. It sits on the last pages of the same document, after the student paper.

## 4. Who does what

| **Code (exact and predictable)**                                        | **Gemini (language and understanding)**                |
|-------------------------------------------------------------------------|--------------------------------------------------------|
| **Picks the theory marking blueprint so the total is exactly 20 or 30** | Reads the manual and finds topics per term             |
| **Decides question counts per topic and difficulty mix**                | Writes question text suited to the class level         |
| **Assigns which questions use deductive formats**                       | Writes the correct answer and believable wrong options |
| **Shuffles options and records the final answer letter**                | Writes model answers and marking points for theory     |
| **Checks counts, marks, formats, prefixes and duplicates**              | Rewrites only the questions that failed a check        |
| **Builds the Word and PDF files**                                       | Never does any arithmetic                              |

## 5. Master Prompt 1: Topic extraction

Use this once per uploaded manual. Send the PDF itself to Gemini, not copied text. Save the result so later requests cost nothing.

> ROLE:
>
> You are a curriculum analyst for {subject} in a {country} school system.
>
> TASK:
>
> Read the attached manual completely. The manual contains three terms. For each term, list every teachable topic and the key facts, definitions, lists and processes taught under it.
>
> **RULES:**
>
> 1\. Use only what is written in the manual. Do not add outside knowledge.
>
> 2\. Keep the manual's own topic names and term boundaries. If term boundaries are unclear, say so in the notes field.
>
> 3\. For each topic, give: topic name, a short summary, up to 8 key facts, up to 5 definitions, and up to 5 lists or classifications that could be asked as "list 3" or "list 5" questions.
>
> 4\. If pages are scanned or unreadable, report which pages and do not guess.
>
> 5\. Return the result in the structured format the system supplies. No extra commentary.

## 6. Master Prompt 2: Objective questions

Use this per batch of questions, grouped by topic (for example 10 questions at a time). The blueprint is produced by your code and pasted in.

> ROLE:
>
> You are an experienced {subject} teacher writing an exam for {class_level} pupils. You write clear, fair, multiple-choice questions.
>
> **SOURCE MATERIAL:**
>
> {confirmed_topic_content_for_this_batch}
>
> **BLUEPRINT FOR THIS BATCH:**
>
> {blueprint_rows}
>
> Each row gives: question number, topic, difficulty (easy, medium or hard), and required style (normal, which-is-not, all-except, one-of-these-is-a).
>
> **WRITING RULES:**
>
> 1\. Write exactly one question for each blueprint row, in the same order, using the stated number, topic, difficulty and style.
>
> 2\. Use only facts found in the source material. Never invent facts.
>
> 3\. Style meanings:
>
> \- which-is-not: "Which of these is not ...?" Three or more options are true, one is false.
>
> \- all-except: "All of these are ... except ..." The odd one out is the answer.
>
> \- one-of-these-is-a: "One of these is a ..." Only one option fits.
>
> \- normal: any clear wording, but do not start with What, Where, Who, How or When more than occasionally.
>
> 4\. Give the one correct answer and exactly {wrong_option_count} wrong options. Do not write letters or brackets on the options. The system adds (a), (b), (c) later.
>
> 5\. Wrong options must be believable but clearly wrong to a pupil who learned the topic. Never use "all of the above" or "none of the above".
>
> 6\. Options must be similar in length and grammar so the correct one does not stand out.
>
> 7\. Vocabulary and sentence length must match a {class_level} pupil. Short sentences for lower primary.
>
> 8\. Do not repeat a question, or test the same fact twice, within this batch or in the list of already-used questions below.
>
> ALREADY USED QUESTIONS (do not repeat):
>
> {previous_questions}
>
> **OUTPUT:**
>
> For each question return: number, topic, style, question text, correct answer, list of wrong options, and a one-line source note (which part of the manual it comes from).

## 7. Master Prompt 3: Theory questions

Use this once per exam. The blueprint contains the exact numbering and marks created by your code. The AI must not change them.

> ROLE:
>
> You are an experienced {subject} teacher writing the theory section for {class_level} pupils.
>
> **SOURCE MATERIAL:**
>
> {confirmed_topic_content_for_term}
>
> THEORY BLUEPRINT (fixed, do not change numbers, letters or marks):
>
> {theory_blueprint}
>
> Example: Question 1 (10 marks): 1a (5 marks), 1b (5 marks). Question 2 (10 marks): 2a (3 marks), 2b (3 marks), 2c (4 marks). Question 3 (10 marks), standalone.
>
> **WRITING RULES:**
>
> 1\. Sub-question (a) must begin with "What is..." (or "State..." only when the topic has no natural definition and the teacher allowed it).
>
> 2\. Sub-question (b) must begin with "List or mention 3...".
>
> 3\. Any other sub-question or standalone question must begin with "List or mention 5...".
>
> 4\. Sub-questions under the same number must belong to the same topic, and a (b) should follow naturally from its (a).
>
> 5\. Spread the numbered questions across different topics of the term. Do not use the same topic twice.
>
> 6\. Use only facts from the source material. Match the language level to {class_level}.
>
> 7\. For each sub-question also write a model answer made of separate points, and say how the marks are shared across the points. The shared marks must add up exactly to the marks given in the blueprint.
>
> **OUTPUT:**
>
> For each sub-question return: number, label, question text, marks (copied exactly), and the model answer points with marks per point.

## 8. Master Prompt 4: Regenerate one question

Used by the "regenerate" button in the preview screen. It keeps everything else untouched.

> ROLE:
>
> You are a {subject} teacher fixing one exam question for {class_level} pupils.
>
> **THE QUESTION TO REPLACE:**
>
> {old_question_with_its_blueprint_row}
>
> REASON (optional, from the teacher or from the validator):
>
> {reason}
>
> **RULES:**
>
> Keep the same number, topic, difficulty, style and marks. Use only the source material below. The new question must test a different fact from the old one and from these other questions in the exam: {other_questions}.
>
> Follow every writing rule from the original objective or theory prompt.
>
> **SOURCE MATERIAL:**
>
> {topic_content}

## 9. Validation checklist (done by code before the teacher sees anything)

| **\#** | **Check**                                                                                                       | **If it fails**                             |
|--------|-----------------------------------------------------------------------------------------------------------------|---------------------------------------------|
| **1**  | Objective count is exactly 20 (primary) or 40 (secondary)                                                       | Regenerate the missing questions only       |
| **2**  | Every question has the right number of options and one correct answer                                           | Regenerate that question                    |
| **3**  | Theory marks add up to exactly 20 or 30, and every sub-question has the blueprint marks                         | Reject and rebuild; never patch by hand     |
| **4**  | Theory (a) starts with What is (or State if allowed), (b) with List or mention 3, others with List or mention 5 | Regenerate that sub-question                |
| **5**  | At least 30 percent of objectives use deductive styles as the blueprint required                                | Regenerate the questions in the wrong style |
| **6**  | Every topic in the term has at least one question                                                               | Regenerate with a corrected blueprint       |
| **7**  | No duplicate or near-duplicate questions in the exam or against the saved question bank                         | Regenerate the duplicates                   |
| **8**  | Answer letters are balanced after shuffling (no letter above about 40 percent)                                  | Reshuffle                                   |
| **9**  | No option reads "all of the above" or "none of the above"                                                       | Regenerate that question                    |
| **10** | Opening words What, Where, Who, How, When are not overused                                                      | Regenerate the extra ones                   |

## 10. Features to include

### Must have

- Upload PDF, choose class level, term (First, Second, Third, All) and school level.

- Topic review screen with tick boxes before generation.

- Preview screen showing all questions, with Edit and Regenerate on every question.

- Download as Word and as PDF. Each file has the student paper first, then the teacher answers and marking guide on the last pages.

- Paper header: school name, subject, class, term, time allowed, name and class lines, instructions.

- Progress steps during generation: Reading manual, Building blueprint, Writing questions, Checking, Ready.

### Should have

- Question bank in MongoDB, tagged by class, term and topic, with duplicate detection.

- Cache of extracted topics per uploaded manual, so changing the term is instant.

- Difficulty mix setting (for example 60 percent easy, 30 medium, 10 hard).

- Subject type setting (recall-based, or calculation-based like Maths).

- Teacher setting for the "What is" fallback wording.

- Rate limiting, file size limit, and clear error messages for unreadable PDFs.

### Later

- Accounts, saved exams and history.

- Build an exam by picking from the saved question bank.

- School branding (logo, colours) on exports.

- Multiple versions (Version A and B) of the same exam with shuffled questions.

## 11. Build order

| **Stage** | **Build**                                                        | **Done when**                                       |
|-----------|------------------------------------------------------------------|-----------------------------------------------------|
| **1**     | Upload and send the PDF to Gemini; topic extraction              | You see a correct topic list for each term          |
| **2**     | Blueprint builder (theory marks, topic quotas, style assignment) | Marks always total 20 or 30, and quotas are correct |
| **3**     | Objective and theory generation in batches                       | A full exam comes back in the right structure       |
| **4**     | Validator, shuffler and single-question regenerate               | Bad output is caught and fixed automatically        |
| **5**     | Word and PDF export, with teacher pages at the end               | Both files open cleanly and look print-ready        |
| **6**     | Frontend: steps, topic review, preview and edit                  | A teacher can go from upload to download unaided    |
| **7**     | Question bank, caching, polish                                   | Repeat exams do not repeat questions                |

## 12. Decisions

### Settled

- Secondary objectives have 4 options: (a) (b) (c) (d). Primary has 3.

- All theory marks are whole numbers, including "List or mention" questions.

- The teacher copy sits on the last pages of the same file as the student paper.

- The first test subject is Computer Studies.

- When a teacher picks All terms, each term gets an equal share of the questions (for example 40 secondary objectives become about 13 or 14 per term, with code handling the remainder).

### Still open

Nothing is open. You can go to the kickoff prompt in section 13.

## 13. Kickoff prompt for your coding assistant

Paste this into the coding assistant once you have answered the decisions above.

> I am building a web app called Exam Question Generator. Stack: React frontend, Node and Express backend, MongoDB, Google Gemini through the current official Google GenAI SDK, docx and pdfkit for export. Build it in the stages listed below and stop after each stage so I can test.
>
> **PRODUCT:**
>
> A teacher uploads a PDF manual, picks school level, class level and term (First, Second, Third, All), reviews the detected topics, and gets an exam with objective and theory sections, downloadable as Word and PDF (one file: student paper first, then teacher answers and marking guide on the last pages).
>
> **EXAM RULES:**
>
> Primary: 20 objectives (40 marks, 2 each, 3 options), theory 20 marks in 2 to 4 main questions with whole-mark sub-questions (whole marks for secondary theory too).
>
> Secondary: 40 objectives (40 marks, 1 each, 4 options), theory 30 marks with more varied splits, whole marks only.
>
> Theory wording: (a) starts with What is, (b) starts with List or mention 3, all others start with List or mention 5.
>
> Objective wording: at least 30 percent use Which of these is not, All of these are except, or One of these is a. Avoid overusing What, Where, Who, How, When. Options use small letters in brackets.
>
> **ARCHITECTURE RULES:**
>
> 1\. Code, never the AI, does all arithmetic (including the equal share of questions across terms when All is chosen): the theory marking blueprint, topic quotas, difficulty mix, style assignment and option shuffling.
>
> 2\. Gemini reads the PDF directly (no plain-text extraction) and returns topics per term in a structured format. Cache the result per uploaded file.
>
> 3\. Questions are generated in batches by topic, using the four master prompts in the attached pack. The AI returns the correct answer separately from the wrong options, and code shuffles them and adds the letters.
>
> 4\. A validator runs the ten checks in the pack. On failure, regenerate only the failing questions, with a retry limit.
>
> 5\. The teacher sees a preview with edit and regenerate on every question before any download.
>
> 6\. Use the free tier sensibly: batch calls, cache results, handle rate-limit errors with retries and a friendly message.
>
> 7\. Keep the secret API key on the server only.
>
> **STAGES:**
>
> 1\) Upload and topic extraction. 2) Blueprint builder. 3) Question generation. 4) Validator, shuffler, regenerate. 5) Word and PDF export. 6) Frontend flow. 7) Question bank and polish.
>
> Start with stage 1. Explain your plan in plain language first, then build it.
