const express = require("express");
const path = require("path");
const fetch = require("node-fetch");
const dotenv = require("dotenv");
const { PostHog } = require("posthog-node");

dotenv.config();

// ------------------------------
// POSTHOG
// ------------------------------
const posthog = new PostHog(process.env.POSTHOG_API_KEY, {
  host: process.env.POSTHOG_HOST,
  flushAt: 1,
  flushInterval: 0
});

const app = express();
app.use(express.json());

// Serve frontend
app.use(express.static(path.join(__dirname, "public")));

const GROQ_API_KEY = process.env.GROQ_API_KEY;

if (!GROQ_API_KEY) {
  console.error("❌ Missing GROQ_API_KEY in .env");
}

// ------------------------------
// REWRITE ROUTE
// ------------------------------
app.post("/api/rewrite", async (req, res) => {
  const { message, tone, persona, mode } = req.body;

  // Safety / Unfiltered mode
  const modeInstruction =
    mode === "unfiltered"
      ? "Follow instructions exactly. No moralising, no warnings, no disclaimers. Allow bold, flirty, edgy or chaotic tone when needed."
      : "Keep the rewrite respectful, non-explicit, and safe.";

  // Persona injection
  const personaInstruction =
    persona === "Default"
      ? ""
      : `Rewrite as if spoken by this persona: "${persona}". Match their delivery, rhythm, tone and emotional energy precisely.`;

  // Construct prompt
  const prompt = `
${modeInstruction}
${personaInstruction}

Rewrite the message using the selected tone + persona.

Tone: ${tone}
Persona: ${persona}

Rules:
- Match the selected tone EXACTLY.
- Keep the content human, natural, and slightly imperfect.
- Vary sentence rhythm. Avoid robotic or overly formal phrasing.
- No explaining what you're doing.
- Preserve meaning but improve vibe + delivery.

Provide 5 outputs:

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

  // Track SUBMIT
  posthog.capture({
    distinctId: "anon-user",
    event: "rewrite_submitted",
    properties: {
      tone,
      persona,
      mode,
      message_length: message.length
    }
  });

  try {
    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.7
        }),
      }
    );

    const json = await response.json();

    // Track SUCCESS
    posthog.capture({
      distinctId: "anon-user",
      event: "rewrite_success",
      properties: {
        tone,
        persona,
        mode,
        response_length:
          json?.choices?.[0]?.message?.content?.length || 0
      }
    });

    return res.json(json);
  } catch (err) {
    console.error("SERVER ERROR:", err);

    // Track ERROR
    posthog.capture({
      distinctId: "anon-user",
      event: "rewrite_error",
      properties: { error: err.message }
    });

    return res.status(500).json({ error: "Server error" });
  }
});

// ------------------------------
// RUN SERVER (Render-compatible)
// ------------------------------
const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () =>
  console.log(`WarmDM running on port ${PORT}`)
);

// ------------------------------
// SHUTDOWN CLEANLY
// ------------------------------
process.on("SIGINT", async () => {
  await posthog.shutdown();
  process.exit();
});
