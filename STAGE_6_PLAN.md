# Stage 6: Frontend Development Plan

This document outlines the step-by-step plan for building the React frontend for Examify. The frontend will orchestrate the 5 backend stages we just built, providing a seamless, wizard-like experience for teachers.

## 1. Project Initialization

## 2. API Service Layer
Create a dedicated `services/api.js` file to handle all communication with our backend endpoints:
- `POST /api/extract-topics`: Uploads PDF and gets raw topics.
- `POST /api/build-blueprint`: Calculates the math and logic for the exam.
- `POST /api/generate-exam`: Triggers the AI batch generation.
- `POST /api/validate-and-shuffle`: Balances option letters and checks rules.
- `POST /api/regenerate`: Swaps out a single bad question.
- `POST /api/export`: Downloads the final `.pdf` or `.docx`.

## 3. Screen 1: Setup & Upload
**Goal:** Collect exam metadata and the source material.
- **Form Fields:** 
  - School Name, Subject, Class Name.
  - School Level (Primary / Secondary).
  - Term (First, Second, Third, All).
  - Time Allowed.
- **File Picker:** A drag-and-drop zone for the PDF manual.
- **Action:** Clicking "Next" sends the file to the extraction endpoint and transitions to the loading state.

## 4. Screen 2: Topic Review
**Goal:** Give the teacher control over what gets tested.
- **Display:** A list of extracted topics returned from Stage 1.
- **Interaction:** Checkboxes next to each topic. The teacher can uncheck topics they haven't taught yet.
- **Action:** Clicking "Confirm & Generate" moves to the automated generation pipeline.

## 5. Screen 3: Generation Progress (The Pipeline)
**Goal:** Keep the user engaged while the backend does heavy lifting.
- **UI:** A visual stepper or loading sequence.
- **Steps:** 
  1. "Building exam blueprint..." (Calls Stage 2)
  2. "Writing questions using AI..." (Calls Stage 3)
  3. "Validating rules and shuffling options..." (Calls Stage 4)

## 6. Screen 4: Exam Preview & Edit
**Goal:** Allow final human review and modification.
- **Objectives Section:** Displays questions 1-N with their A, B, C, D options. The correct answer is highlighted for the teacher.
- **Theory Section:** Displays main questions and sub-questions with their mark allocations and model answers.
- **Interactions per Question:**
  - **Edit Button:** Turns the text into an input field for manual typo fixes.
  - **Regenerate Button:** Calls the Stage 4 API to completely replace the question with a new one that tests a different fact.

## 7. Screen 5: Export & Download
**Goal:** Get the final printable files.
- **UI:** Two large, prominent buttons at the bottom of the Preview screen.
- **Actions:** 
  - "Download PDF" -> calls Stage 5 API with `format: 'pdf'`.
  - "Download Word" -> calls Stage 5 API with `format: 'docx'`.

## State Management Flow
The main `App.jsx` will manage a `currentStep` state variable to transition between these screens:
`UPLOAD` ➔ `REVIEW` ➔ `GENERATING` ➔ `PREVIEW`
