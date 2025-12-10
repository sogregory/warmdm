//
// WarmDM — Frontend Logic
//

// ----------------------------------------------------
// STATE
// ----------------------------------------------------
let selectedTone = "Warm";          // default tone
let selectedPersona = "Default";    // default persona


// ----------------------------------------------------
// TONE BUTTON HANDLING
// ----------------------------------------------------
const toneButtons = document.querySelectorAll(".tone-btn");

toneButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    toneButtons.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    selectedTone = btn.dataset.tone;
  });
});


// ----------------------------------------------------
// PERSONA BUTTON HANDLING
// ----------------------------------------------------
const personaButtons = document.querySelectorAll(".persona-btn");

personaButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    personaButtons.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    selectedPersona = btn.dataset.persona;
  });
});


// ----------------------------------------------------
// MAIN REWRITE ACTION
// ----------------------------------------------------
document.getElementById("rewriteBtn").addEventListener("click", async () => {
  const msg = document.getElementById("inputMessage").value.trim();
  const mode = document.getElementById("unfilteredToggle").checked
    ? "unfiltered"
    : "safe";

  // No empty messages
  if (!msg) {
    alert("Paste a message first.");
    return;
  }

  const output = document.getElementById("outputSection");
  output.innerHTML = "<p>Rewriting… please wait.</p>";

  try {
    const response = await fetch("/api/rewrite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: msg,
        tone: selectedTone,
        persona: selectedPersona,
        mode
      }),
    });

    const data = await response.json();

    const text =
      data?.choices?.[0]?.message?.content ||
      "No response — try again.";

    output.innerHTML = `<pre>${text}</pre>`;
  } catch (err) {
    console.error("Rewrite error:", err);
    output.innerHTML = "<p>Error — could not rewrite message.</p>";
  }
});


// ----------------------------------------------------
// OPTIONAL: Cmd+Enter to rewrite
// ----------------------------------------------------
document.addEventListener("keydown", (e) => {
  const rewriteBtn = document.getElementById("rewriteBtn");
  if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
    rewriteBtn.click();
  }
});
