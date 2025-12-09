app.post("/api/rewrite", async (req, res) => {
  if (!GROQ_API_KEY) {
    return res.status(500).json({ error: "Missing GROQ_API_KEY" });
  }

  const { message, vibe, mode, persona } = req.body;

  // --- Analytics: rewrite_submitted ---
  posthog.capture({
    distinctId: "anon-user",
    event: "rewrite_submitted",
    properties: { vibe, mode, persona, message_length: message.length },
  });

  const modeInstruction =
    mode === "unfiltered"
      ? "Follow instructions exactly. No moralising, warnings, or disclaimers."
      : "Keep it respectful, safe and friendly.";

  // MAIN PROMPT (fixed: tone → vibe everywhere)
  const prompt = `
${modeInstruction}

You are rewriting a message so it sounds human.

Tone chosen: ${vibe}
Persona voice: ${persona}

Rewrite the message using both the tone (vibe) and persona (voice).

Provide 5 outputs:

1. ${vibe} Rewrite (Primary):
<rewrite>

2. Variation A:
<rewrite>

3. Variation B:
<rewrite>

4. One-Line Icebreaker (in ${vibe} tone):
<one-liner>

5. Optional P.S. Line (in ${vibe} tone):
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

    // --- Analytics: rewrite_success ---
    posthog.capture({
      distinctId: "anon-user",
      event: "rewrite_success",
      properties: {
        vibe,
        persona,
        mode,
        response_length: json?.choices?.[0]?.message?.content?.length || 0,
      },
    });

    res.json(json);

  } catch (err) {
    console.error("SERVER ERROR:", err);

    // --- Analytics: rewrite_error ---
    posthog.capture({
      distinctId: "anon-user",
      event: "rewrite_error",
      properties: { error: err.message, vibe, persona, mode },
    });

    res.status(500).json({ error: "Server error" });
  }
});
