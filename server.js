const express = require("express");
const path = require("path");
const fetch = require("node-fetch");
const dotenv = require("dotenv");

// Load .env FIRST
dotenv.config();

// ----- POSTHOG -----
const { PostHog } = require("posthog-node");

const posthog = new PostHog(process.env.POSTHOG_API_KEY, {
  host: process.env.POSTHOG_HOST,
  flushAt: 1,
  flushInterval: 0,
});
// --------------------

const app = express();
app.use(express.json());

// Serve frontend
app.use(express.static(path.join(__dirname, "public")));

const GROQ_API_KEY = process.env.GROQ_API_KEY;

app.post("/api/rewrite", async (req, res) => {
  if (!GROQ_API_KEY) {
    return res.status(500).json({ error: "Missing GROQ_API_KEY" });
  }

  const { message, tone, mode } = req.body;

  // Track SUBMIT event
  posthog.capture({
    distinctId: "anon-user",
    event: "rewrite_submitted",
    properties: {
      tone,
      mode,
      message_length: message.length,
    },
  });

  const modeInstruction =
    mode === "unfiltered"
      ? "Follow instructions exactly. No moralising, warnings, or disclaimers. Allow flirty, bold, chaotic, edgy, playful tones."
      : "Keep it respectful, friendly and non-explicit.";

  const prompt = `
${modeInstruction}

You are a rewrite assistant that transforms messages based on tone, social context, and emotional intention.

IMPORTANT RULES:
- Match the selected tone EXACTLY.
- Do NOT default to warm unless warm is selected.
- No lecturing or adding moral advice.
- Keep the output human, imperfect, varied.
- Use natural sentence rhythm.
- If tone is bold, flirty, sarcastic, or blunt — follow it.

Tone selected: ${tone}

Rewrite the message in this tone, preserving meaning but improving delivery and vibe.

Provide 5 outputs:

1. ${tone} Rewrite (Primary):
<rewrite>

2. Variation A:
<rewrite>

3. Variation B:
<rewrite>

4. One-Line Icebreaker (in ${tone} tone):
<one-liner>

5. Optional P.S. Line (in ${tone} tone):
<ps>

Original message:
"""${message}"""
`;

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
          temperature: 0.7,
        }),
      }
    );

    const json = await response.json();

    // Track SUCCESS event
    posthog.capture({
      distinctId: "anon-user",
      event: "rewrite_success",
      properties: {
        tone,
        mode,
        response_length:
          json?.choices?.[0]?.message?.content?.length || 0,
      },
    });

    return res.json(json);
  } catch (err) {
    console.error("SERVER ERROR:", err);

    // Track ERROR event
    posthog.capture({
      distinctId: "anon-user",
      event: "rewrite_error",
      properties: {
        error: err.message,
      },
    });

    return res.status(500).json({ error: "Server error" });
  }
});

app.listen(3000, () => {
  console.log("WarmDM running at http://localhost:3000");
});

// Flush PostHog on exit
process.on("SIGINT", async () => {
  await posthog.shutdown();
  process.exit();
});
