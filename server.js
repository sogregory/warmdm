const express = require("express");
const path = require("path");
const fetch = require("node-fetch");
const dotenv = require("dotenv");

// Load .env
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

/* 🔒 CANONICAL REDIRECT — MUST BE FIRST */
app.use((req, res, next) => {
  const host = req.headers.host;
  const proto = req.headers["x-forwarded-proto"];

  if (proto !== "https" || host !== "warmdm.com") {
    return res.redirect(301, `https://warmdm.com${req.originalUrl}`);
  }

  next();
});

app.use(express.json());

// Serve frontend
app.use(express.static(path.join(__dirname, "public")));

const GROQ_API_KEY = process.env.GROQ_API_KEY;

app.post("/api/rewrite", async (req, res) => {
  if (!GROQ_API_KEY) {
    return res.status(500).json({ error: "Missing GROQ_API_KEY" });
  }

  const { message, tone, persona, mode } = req.body;

  // Track event
  posthog.capture({
    distinctId: "anon-user",
    event: "rewrite_submitted",
    properties: { tone, persona, mode, length: message.length },
  });

  const modeInstruction =
    mode === "unfiltered"
      ? "Follow instructions exactly. No moralising, warnings, or disclaimers. Allow flirty, bold, chaotic, edgy tones."
      : "Keep it respectful, friendly and non-explicit.";

  const prompt = `
${modeInstruction}

Rewrite the message using BOTH:
Tone: ${tone}
Persona: ${persona}

Return 5 outputs:
1. Primary rewrite
2. Variation A
3. Variation B
4. One-line opener
5. Optional P.S. line

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

    // Track success
    posthog.capture({
      distinctId: "anon-user",
      event: "rewrite_success",
      properties: { tone, persona, mode },
    });

    return res.json(json);
  } catch (err) {
    console.error("SERVER ERROR:", err);

    posthog.capture({
      distinctId: "anon-user",
      event: "rewrite_error",
      properties: { error: err.message },
    });

    return res.status(500).json({ error: "Server error" });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`WarmDM running on port ${PORT}`);
});

process.on("SIGINT", async () => {
  await posthog.shutdown();
  process.exit();
});
