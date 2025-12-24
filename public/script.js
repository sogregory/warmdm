document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("signal-form");
  const result = document.getElementById("result");

  const explanationEl = document.getElementById("explanation");
  const outcomeEl = document.getElementById("outcome");
  const definitionEl = document.getElementById("definition");

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    explanationEl.textContent =
      "This ranking change isn’t being driven by reviews, app age, featuring, or ads. " +
      "For this keyword, Apple is prioritizing how users behave after seeing apps in search — " +
      "which apps they choose and whether they keep them installed.";

    outcomeEl.textContent = "Search Satisfaction Gap";

    definitionEl.textContent =
      "Competing apps are performing better after users see search results, not because of age or review volume.";

    result.style.display = "block";
  });
});
