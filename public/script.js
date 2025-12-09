// --- PERSONA BUTTON SELECTION ---
document.querySelectorAll(".persona-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".persona-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
  });
});

// --- MAIN REWRITE ACTION ---
document.getElementById("rewriteBtn").addEventListener("click", async () => {
  const msg = document.getElementById("inputMessage").value.trim();
  const tone = document.getElementById("toneSelect").value;
  const mode = document.getElementById("unfilteredToggle").checked ? "unfiltered" : "safe";
  const persona =
    document.querySelector(".persona-btn.active")?.dataset.persona || "Default";

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
      body: JSON.stringify({ message: msg, tone, mode, persona }),
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
