//
// WarmDM — Frontend Logic
//

// ----------------------------------------------------
// State
// ----------------------------------------------------
let selectedTone = "Warm";           // Default tone
let selectedPersona = "Default";     // Default persona


// ----------------------------------------------------
// Tone Button Handling
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
// Persona Button Handling
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
// Tooltip Handling (small, simple)
// ----------------------------------------------------
const tooltipIcon = document.getElementById("unfilteredTooltip");
if (tooltipIcon) {
  tooltipIcon.addEventListener("mouseenter", () => {
    tooltipIcon.setAttribute("title",
      "Removes filters and guardrails. Use only if you want a version without safety softening."
    );
  });
}


// ----------------------------------------------------
// Main Rewrite
// ----------------------------------------------------
document.getElementById("rewriteBtn").addEventListener("click", async () => {
  const msg = document.getElementById("inputMessage").value.trim();
  const mode = document.getElementById("unfilteredToggle").checked
    ? "unfiltered"
    : "safe";

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
    console.error(err);
    output.innerHTML = "<p>Error — could not rewrite message.</p>";
  }
});


// ----------------------------------------------------
// Cmd+Enter / Ctrl+Enter Shortcut
// ----------------------------------------------------
document.addEventListener("keydown", (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
    document.getElementById("rewriteBtn").click();
  }
});
