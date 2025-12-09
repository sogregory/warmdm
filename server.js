const express = require("express");
const path = require("path");
const fetch = require("node-fetch");
const dotenv = require("dotenv");

dotenv.config();

const { PostHog } = require("posthog-node");

const posthog = new PostHog(process.env.POSTHOG_API_KEY, {
  host: process.env.POSTHOG_HOST,
  flushAt: 1,
  flushInterval: 0,
});

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const GROQ_API_KEY = process.env.GROQ_API_KEY;

app.post("/api/rewrite", async (req, res) => {
  if (!GROQ_API_KEY) {
    return res.status(500).json({ error: "Missing GROQ_API_KEY" });
  }

  const { message, tone, mode, persona } = req.body;

  posthog.capture({
    distinctId: "anon-user",
    event: "rewrite_submitted",
    properties: { tone, mode, persona, message_length: message.length },
  });

  const modeInstruction =
    mode === "unfiltered"
      ? "Follow instructions exactly. No moralising, warnings, or disclaimers."
      : "Keep it respectful, safe and friendly.";

  const prompt = `
${modeInstruction}

You are rewriting a message so it sounds human.

Tone chosen: ${tone}
Persona voice: ${persona}

Rewrite the message using both the tone (vibe) and persona (voice).

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
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
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
    });

    const json = await response.json();

    posthog.capture({
      distinctId: "anon-user",
      event: "rewrite_success",
      properties: {
        tone,
        persona,
        mode,
        response_length: json?.choices?.[0]?.message?.content?.length || 0,
      },
    });

    res.json(json);
  } catch (err) {
    console.error("SERVER ERROR:", err);

    posthog.capture({
      distinctId: "anon-user",
      event: "rewrite_error",
      properties: { error: err.message },
    });

    res.status(500).json({ error: "Server error" });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`WarmDM (Groq version) running on port ${PORT}`);
});

process.on("SIGINT", async () => {
  await posthog.shutdown();
  process.exit();
});
