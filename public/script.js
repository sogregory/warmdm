// ===============================
// PERSONA HANDLING
// ===============================

// Default selected persona
let selectedPersona = "Default";

// Connect persona buttons
document.addEventListener("DOMContentLoaded", () => {
  const personaButtons = document.querySelectorAll(".persona-btn");

  personaButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      personaButtons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      selectedPersona = btn.dataset.persona || "Default";
    });
  });
});

// ===============================
// REWRITE BUTTON HANDLER
// ===============================
document.getElementById("rewriteBtn").addEventListener("click", async () => {
  const msg = document.getElementById("inputMessage").value.trim();
  const tone = document.getElementById("toneSelect").value;
  const mode = document.getElementById("unfilteredToggle").checked
    ? "unfiltered"
    : "safe";

  if (!msg) {
    alert("Please paste a message first.");
    return;
  }

  const output = document.getElementById("outputSection");
  output.innerHTML = "<p>Rewriting... please wait.</p>";

  try {
    const response = await fetch("/api/rewrite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: msg,
        tone,
        mode,
        persona: selectedPersona, // ← NEW!
      }),
    });

    const data = await response.json();

    const text =
      data?.choices?.[0]?.message?.content ||
      "No response. Try again or check server.";

    output.innerHTML = `<pre>${text}</pre>`;
  } catch (err) {
    console.error(err);
    output.innerHTML = "<p>Error. Could not rewrite message.</p>";
  }
});
