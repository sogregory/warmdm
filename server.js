//
// WarmDM — Backend Server
//

import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import Groq from "groq-sdk";

const app = express();
app.use(express.json());

// Resolve directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve static files (index.html, style.css, script.js, etc.)
app.use(express.static(__dirname));

// ------------------------------
// Groq Client Setup
// ------------------------------
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// ------------------------------
// Rewrite Route
// ------------------------------
app.post("/api/rewrite", async (req, res) => {
  try {
    const { message, tone, persona, mode } = req.body;

    if (!message || !tone || !persona) {
      return res.status(400).json({ error: "Missing fields." });
    }

    const systemPrompt = `
WarmDM rewrites messages so they sound human — no AI stiffness.
Tone = how it should sound (Warm, Casual, Authority, Cheeky, AI-Undetectable).
Persona = who is saying it (Default, Friendly founder, Dry professional, etc.).

Rules:
- Keep the user's meaning.
- Rewrite in the chosen tone and persona.
- Remove AI patterns (no excessive em-dashes, no robotic cadence).
- Make it natural and readable.
- Provide 1 primary rewrite plus a few variations.
- If mode = unfiltered, remove politeness or safety softening.
    `;

    const userPrompt = `
Rewrite this message:

"${message}"

Tone: ${tone}
Persona: ${persona}
Mode: ${mode}
    `;

    const completion = await groq.chat.completions.create({
      model: "llama3-70b-8192",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 800,
    });

    res.json(completion);
  } catch (err) {
    console.error("Rewrite error:", err);
    res.status(500).json({ error: "Rewrite failed." });
  }
});

// ------------------------------
// Start Server
// ------------------------------
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`WarmDM running on port ${PORT}`);
});
