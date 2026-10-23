(function () {
  "use strict";
  const stages = [
    { id: "overview", label: "Overview", title: "Ice demo", body: "A static demonstration surface. No live roster, player record, schedule, or seat has been loaded." },
    { id: "skills", label: "Skills", title: "Practice guidance", body: "General practice ideas only. These cards are not athlete assessments and do not load private performance data." },
    { id: "gameday", label: "Game day", title: "Game-day status", body: "Live schedule and TeamSnap data are unavailable until an authorized integration is configured and verified." }
  ];
  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }
  function render() {
    const rail = document.getElementById("iceRail");
    const stage = document.getElementById("iceStage");
    if (!rail || !stage) return;
    rail.replaceChildren();
    stage.replaceChildren();
    stages.forEach((item, index) => {
      const button = el("button", "", item.label);
      button.type = "button";
      button.setAttribute("aria-current", index === 0 ? "page" : "false");
      button.addEventListener("click", () => {
        rail.querySelectorAll("button").forEach((candidate) => candidate.setAttribute("aria-current", "false"));
        button.setAttribute("aria-current", "page");
        stage.replaceChildren();
        const card = el("section", "ice-stage-card");
        card.append(el("h1", "", item.title));
        card.append(el("p", "ice-note", item.body));
        const status = el("p", "ice-status", "Status: demo only · protected integrations remain closed.");
        card.append(status);
        if (item.id === "skills" && Array.isArray(window.DC_ICE_SKILLS)) {
          const grid = el("div", "ice-skills-grid");
          window.DC_ICE_SKILLS.forEach((skill) => {
            const article = el("article", "ice-skill");
            article.append(el("h3", "", skill.title));
            article.append(el("p", "", skill.description));
            grid.append(article);
          });
          card.append(grid);
        }
        if (item.id === "gameday" && window.DC_ICE_GAMEDAY) {
          const box = el("div", "ice-gameday-status");
          const state = el("p", "", window.DC_ICE_GAMEDAY.message);
          state.dataset.state = "unavailable";
          box.append(state);
          card.append(box);
        }
        stage.append(card);
      });
      rail.append(button);
    });
    rail.querySelector("button")?.click();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", render, { once: true });
  else render();
})();
