# ListenQuest: Cambridge Stage 6 Listening Comprehension Tool 🎧

A specialized listening assessment web application built for Cambridge Primary English (Stage 6, Ages 10–11) students in Hanoi, Vietnam.

## ✨ Key Features

1. **Kid-Friendly Student Access (From Home or School)**
   - No complex passwords to remember or lose.
   - Students click their class (e.g. **Class 6A - Cambridge Eagles** or **Class 6B - Cambridge Falcons**).
   - Select their name from the class list and begin immediately.

2. **YouTube Audio Player with Strict 2-Listen Limit**
   - **Audio-Only Mode (Default)**: Conceals the YouTube video behind a playful animated soundwave visualizer, encouraging focused auditory comprehension.
   - **Video Mode Toggle**: Option in the Teacher Portal to reveal the embedded video player when visual cues are helpful.
   - **Strict 2-Listen Limit**: Server-enforced tracking per student. Refreshing the browser or switching devices does not reset the count. Once 2 listens are reached, the player is locked.

3. **Gemini AI Question Generator**
   - Paste any YouTube link, click **Generate 10 Cambridge Questions**, and Google Gemini AI automatically crafts 10 curriculum-aligned questions (Direct Retrieval, Vocabulary in Context, Inference, and Main Purpose).
   - Full question editor allows the teacher to review and edit questions, options, and correct answer keys before publishing.

4. **Teacher Portal & Results Dashboard (PIN: `1234`)**
   - **Class Results**: Live completion status (*Not Started*, *In Progress*, *Completed*), listens used (`0/2`, `1/2`, `2/2`), auto-graded scores (e.g. `9/10`), and percentage.
   - **Student Answer Sheets**: Click "Answers" on any student to see their choices vs correct answers.
   - **Student Reset**: One-click reset to give a student another attempt if their internet dropped.
   - **CSV Export**: Download grades and completion logs for school reporting.
   - **Class Rosters**: Bulk paste student names for Class 6A and 6B anytime.

---

## 🚀 How to Run Locally

Double-click `start-app.bat` in this folder, or run:
```bash
npm start
```
The application will be live at:
👉 **http://localhost:3001**

---

## 🌐 Making It Accessible to Students from Home

To allow children in Hanoi to access the tool from their home devices (phones, tablets, laptops), you have two easy options:

### Option A: Free Instant Cloud Deployment (Recommended)
You can deploy this project with zero cost on:
- **Render.com** (Free Web Service): Connect repository, set build command to `npm install && cd client && npm install && npm run build`, and start command to `node server/index.js`.
- **Railway.app** or **Fly.io**.
Once deployed, you will have a permanent web link (e.g., `https://cambridge-listenquest.onrender.com`) to share with students and parents!

### Option B: Quick Free Tunnel (No Deploy Needed)
If your computer is on during homework hours:
```bash
npx localtunnel --port 3001
```
This instantly generates a public HTTPS link (e.g. `https://cambridge-listen.loca.lt`) that students can open on any phone, tablet, or laptop at home.

---

## 🔒 Teacher Security & Settings
- **Default Teacher PIN**: `1234` (Changeable in Teacher Settings).
- **Gemini API Key**: Add your free key in **Settings** or set the `GEMINI_API_KEY` environment variable.
