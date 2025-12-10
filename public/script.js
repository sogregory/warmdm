//
// WarmDM Frontend Logic
//

let selectedTone = "AI-Undetectable";
let selectedPersona = "Default";

// TONE BUTTONS
document.querySelectorAll(".tone-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tone-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    selectedTone = btn.dataset.tone;
  });
});

// PERSONA BUTTONS
document.querySelectorAll(".persona-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".persona-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    selectedPersona = btn.dataset.persona;
  });
});

// MAIN ACTION
document.getElementById("rewriteBtn").addEventListener("click", async () => {
  const msg = document.getElementById("inputMessage").value.trim();
  const mode = document.getElementById("unfilteredToggle").checked ? "unfiltered" : "safe";
  const output = document.getElementById("outputSection");

  if (!msg) {
    alert("Paste a message first.");
    return;
  }

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
      })
    });

    const data = await response.json();
    const text = data?.choices?.[0]?.message?.content || "No response.";

    output.innerHTML = `<pre>${text}</pre>`;
  }
  catch (err) {
    console.error(err);
    output.innerHTML = "<p>Error — try again.</p>";
  }
});
