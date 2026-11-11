/* ============================================================== BOOT */
function boot() {
  initTheme();
  initI18n();
  applyI18n();
  setupDnD();
  setupSvgEvents();
  document.querySelectorAll(".btab").forEach(function (t) {
    t.onclick = function () {
      document.querySelectorAll(".btab").forEach(function (x) { x.classList.remove("active"); });
      document.querySelectorAll(".bpanel").forEach(function (p) { p.classList.remove("active"); });
      t.classList.add("active");
      document.getElementById("panel-" + t.dataset.p).classList.add("active");
      if (t.dataset.p === "turtle") turtleDrawMark();
    };
  });
  document.getElementById("console-clear").onclick = consoleClear;
  document.addEventListener("keydown", function (e) {
    if (e.key === "F5") { e.preventDefault(); doRunBtn(); }
    if (e.key === "F10") { e.preventDefault(); doStepBtn(); }
  });
  if (!loadLocal()) {
    PROGRAM = EXAMPLES[1].make(); // Indovina il numero
    curFnId = PROGRAM.functions[0].id;
  }
  render();
  turtleReset();
  consoleAppend(t("run.welcome") + "\n", "sys");
  setStatus("Pronto.");
}

if (typeof document !== "undefined" && document.getElementById("svg")) {
  boot();
}
