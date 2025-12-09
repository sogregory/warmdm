// ===== VIBE SELECTION =====
const vibeButtons = document.querySelectorAll('.vibe-btn');
let selectedVibe = "AI-Undetectable";

vibeButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    vibeButtons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    selectedVibe = btn.dataset.vibe;
  });
});

// ===== PERSONA SELECTION =====
const personaButtons = document.querySelectorAll('.persona-btn');
let selectedPersona = "Default";

personaButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    personaButtons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    selectedPersona = btn.dataset.persona;
  });
});

// ===== REWRITE LOGIC =====
document.getElementById("rewriteBtn").addEventListener("click", async () => {
  const msg = document.getElementById("inputMessage").value.trim();
  const mode = document.getElementById("unfilteredToggle").checked ? "unfiltered" : "safe";
  const output = document.getElementById("outputText");

  if (!msg) {
    output.textContent = "Please paste a message first.";
    return;
  }

  output.textContent = "Rewriting... please wait.";

  try {
    const res = await fetch("/api/rewrite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: msg,
        vibe: selectedVibe,
        persona: selectedPersona,
        mode
      })
    });

    const data = await res.json();
    const text =
      data?.choices?.[0]?.message?.content ||
      "No response. Something went wrong.";

    output.textContent = text;
  } catch (err) {
    console.error(err);
    output.textContent = "Error. Could not rewrite the message.";
  }
});
