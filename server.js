const express = require("express");
const path = require("path");
const fetch = require("node-fetch");
const dotenv = require("dotenv");
const { PostHog } = require("posthog-node");

dotenv.config();

const posthog = new PostHog(process.env.POSTHOG_API_KEY, {
  host: process.env.POSTHOG_HOST,
  flushAt: 1,
  flushInterval: 0
});

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const GROQ_API_KEY = process.env.GROQ_API_KEY;

// =============== ROUTE ===============
app.post("/api/rewrite", async (req, res) => {
  const { message, tone, persona, mode } = req.body;

  const personaInstruction =
    persona === "Default"
      ? ""
      : `Write as if spoken by this persona: "${persona}". Match their energy and delivery style.`

  const modeInstruction =
    mode === "unfiltered"
      ? "Follow instructions exactly. No moralising, warnings, or filters."
      : "Keep it respectful and non-explicit.";

  const prompt = `
${modeInstruction}
${personaInstruction}

Rewrite the message based on the selected tone and persona.

Tone: ${tone}
Persona: ${persona}

Provide these outputs:

1. ${tone} Rewrite (Primary):
<rewrite>

2. Variation A:
<rewrite>

3. Variation B:
<rewrite>

4. One-line opener (in ${tone} tone):
<one-liner>

5. Optional P.S. line:
<ps>

Original message:
"""${message}"""
`;

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7
      })
    });

    const json = await response.json();
    res.json(json);
  } catch (err) {
    console.error("SERVER ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () =>
  console.log(`WarmDM running on port ${PORT}`)
);

process.on("SIGINT", async () => {
  await posthog.shutdown();
  process.exit();
});
