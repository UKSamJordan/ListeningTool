const db = require('./db');

async function generateQuestionsWithGemini(youtubeInfo, optionalTranscriptOrTopic) {
  const settings = db.getSettings();
  const apiKey = (process.env.GEMINI_API_KEY || settings.geminiApiKey || "").trim();

  const transcript = youtubeInfo.transcript || optionalTranscriptOrTopic || "";

  if (!apiKey) {
    return {
      success: false,
      error: "MISSING_API_KEY",
      message: "No Gemini API key found! Please go to the 'Settings' tab in the Teacher Portal and paste your Google Gemini API key.",
      questions: getSmartTemplateQuestions(youtubeInfo.title || "Listening Comprehension")
    };
  }

  const prompt = `
You are an expert Cambridge Primary English examiner designing an authentic Stage 6 (Ages 10-11, CEFR A2+/B1) Listening Comprehension Assessment for primary students in Hanoi, Vietnam.

AUDIO CLIP CONTEXT:
Title: "${youtubeInfo.title || 'Cambridge Listening Audio'}"
Author/Channel: "${youtubeInfo.author || 'Educational Content'}"

SPOKEN TRANSCRIPT / DIALOGUE OF THE AUDIO TRACK:
"""
${transcript || "No transcript available. Use the title and educational listening themes."}
"""

INSTRUCTIONS:
1. Generate exactly 10 high-quality Multiple Choice Questions (A, B, C, D) based SPECIFICALLY on the spoken transcript / audio text above:
   - 3 Questions on Direct Retrieval / Factual Recall of specific words, numbers, or details spoken in the audio.
   - 3 Questions on Vocabulary in Context (e.g. deduce the meaning of challenging words used by the speaker).
   - 2 Questions on Inference and Deduction (what can be inferred from the characters or speaker's dialogue).
   - 2 Questions on Main Idea, Author's Purpose, or Speaker's Tone.
2. The language must be appropriate for Cambridge Primary Stage 6 learners (Ages 10-11).
3. Provide 4 distinct options (A, B, C, D) for each question, with exactly ONE correct answer.
4. Return ONLY a valid JSON array of 10 question objects without markdown ticks or preambles.

Required JSON format:
[
  {
    "id": "q1",
    "question": "Question text based directly on the audio?",
    "options": ["Choice A", "Choice B", "Choice C", "Choice D"],
    "correctAnswer": "A",
    "skill": "Direct Retrieval",
    "explanation": "Why this answer is correct based on the transcript."
  }
]
`;

  const modelsToTry = ["gemini-2.5-flash", "gemini-1.5-flash", "gemini-2.0-flash"];
  let lastError = null;

  for (const model of modelsToTry) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.2,
            responseMimeType: "application/json"
          }
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        lastError = `Model ${model} error (${response.status}): ${errText}`;
        console.error(lastError);
        continue;
      }

      const data = await response.json();
      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) continue;

      let cleanJson = rawText.trim();
      if (cleanJson.startsWith('```json')) {
        cleanJson = cleanJson.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanJson.startsWith('```')) {
        cleanJson = cleanJson.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }

      const questions = JSON.parse(cleanJson);
      if (Array.isArray(questions) && questions.length > 0) {
        return {
          success: true,
          hasTranscript: Boolean(transcript),
          modelUsed: model,
          questions: questions.map((q, idx) => ({
            id: `q${idx + 1}`,
            question: q.question,
            options: q.options || ["Option A", "Option B", "Option C", "Option D"],
            correctAnswer: (q.correctAnswer || "A").toUpperCase(),
            skill: q.skill || "Comprehension",
            explanation: q.explanation || "Correct answer deduced from the audio."
          }))
        };
      }
    } catch (err) {
      lastError = err.message;
      console.error(`Attempt with ${model} failed:`, err);
    }
  }

  // If all models failed
  return {
    success: false,
    error: "API_CALL_FAILED",
    message: `Gemini API call failed: ${lastError || 'Unknown error'}. Please verify your API key in Settings.`,
    questions: getSmartTemplateQuestions(youtubeInfo.title || "Listening Comprehension")
  };
}

function getSmartTemplateQuestions(title) {
  const cleanTitle = title || "The Audio Presentation";
  return [
    {
      id: "q1",
      question: `What is the main topic introduced at the start of "${cleanTitle}"?`,
      options: [
        `The key historical and scientific background of ${cleanTitle}`,
        "A weather forecast for next week",
        "Instructions on how to assemble a toy",
        "A personal complaint about a noisy neighbour"
      ],
      correctAnswer: "A",
      skill: "Main Idea",
      explanation: "The introduction clearly sets out the core theme and background."
    },
    {
      id: "q2",
      question: "Which specific detail did the speaker mention in the opening two minutes?",
      options: [
        "A fascinating factual example supporting their central point",
        "That they had forgotten their notes",
        "That it was raining heavily outside",
        "That the presentation was completely fictional"
      ],
      correctAnswer: "A",
      skill: "Direct Retrieval",
      explanation: "Stage 6 listeners listen for specific facts presented in the early stage."
    },
    {
      id: "q3",
      question: "Based on the speaker's tone, how do they feel about the subject?",
      options: [
        "Bored and ready to leave",
        "Deeply interested, enthusiastic, and knowledgeable",
        "Angry and argumentative",
        "Scared and nervous"
      ],
      correctAnswer: "B",
      skill: "Speaker Tone & Attitude",
      explanation: "The speaker communicates with confidence, clarity, and genuine enthusiasm."
    },
    {
      id: "q4",
      question: "When the narrator used descriptive adjectives, what image were they trying to create?",
      options: [
        "A vivid and memorable mental picture for the audience",
        "A confusing puzzle to trick listeners",
        "A sense of extreme sadness",
        "An advertisement for a local supermarket"
      ],
      correctAnswer: "A",
      skill: "Vocabulary & Imagery",
      explanation: "Cambridge Stage 6 emphasizes recognizing how descriptive language shapes imagery."
    },
    {
      id: "q5",
      question: "What happened immediately after the central event described in the clip?",
      options: [
        "An important consequence or shift took place",
        "The audio abruptly turned into rock music",
        "The speaker decided to switch to a different language",
        "All the characters went to sleep"
      ],
      correctAnswer: "A",
      skill: "Sequence of Events",
      explanation: "Narrative sequencing requires tracking what follows the climax or core point."
    },
    {
      id: "q6",
      question: "Which word best matches the meaning of 'crucial' as used by the presenter?",
      options: [
        "Extremely important or vital",
        "Unpleasant and difficult",
        "Cheap and affordable",
        "Colourful and bright"
      ],
      correctAnswer: "A",
      skill: "Vocabulary in Context",
      explanation: "'Crucial' is a key Cambridge Stage 6 vocabulary word meaning essential or vital."
    },
    {
      id: "q7",
      question: "What conclusion can be inferred from the evidence presented in the audio?",
      options: [
        "Careful observation and listening lead to better understanding",
        "Science and stories never mix together",
        "People should stop asking questions",
        "The problem described can never be solved"
      ],
      correctAnswer: "A",
      skill: "Inference & Deduction",
      explanation: "Students infer broader understanding from the speaker's reasoning."
    },
    {
      id: "q8",
      question: "Why did the speaker ask a rhetorical question during the talk?",
      options: [
        "To encourage the listeners to think carefully about the idea",
        "Because the speaker genuinely didn't know the answer",
        "To test whether the microphone was functioning",
        "To ask the listeners to shout out loud"
      ],
      correctAnswer: "A",
      skill: "Author Purpose",
      explanation: "Rhetorical questions engage the listener's curiosity and reflection."
    },
    {
      id: "q9",
      question: "According to the speaker, what should listeners remember most about this topic?",
      options: [
        "The positive impact that thoughtful actions can create",
        "The exact cost of the project in dollars",
        "What time the audio clip was recorded",
        "Nothing, as it will not matter in the future"
      ],
      correctAnswer: "A",
      skill: "Key Message",
      explanation: "The conclusion stresses the lasting significance of the subject."
    },
    {
      id: "q10",
      question: "Which of the following would be the most suitable summary title for this audio clip?",
      options: [
        `Understanding ${cleanTitle}: Insights and Discoveries`,
        "The Great Silence: When Nothing Happened",
        "A Day at the Local Shopping Centre",
        "The Comical Adventures of Two Lost Puppies"
      ],
      correctAnswer: "A",
      skill: "Synthesis & Summary",
      explanation: "A comprehensive summary encapsulates both insights and core learning."
    }
  ];
}

module.exports = {
  generateQuestionsWithGemini
};
