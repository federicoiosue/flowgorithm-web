/* ============================================================== UI: base */
function setStatus(msg, isErr) {
  var el = document.getElementById("status-left");
  el.textContent = msg;
  document.getElementById("statusbar").classList.toggle("err", !!isErr);
}
function updateStatusRight() {
  var n = 0;
  walkChain(currentFn().body, function () { n++; });
  document.getElementById("status-right").textContent =
    t("status.fn") + ": " + currentFn().name + "  \u2022  " + t("status.blocks") + ": " + n + "  \u2022  " + t("status.zoom") + ": " + Math.round(Z * 100) + "%";
}
function consoleAppend(text, cls) {
  var c = document.getElementById("console");
  var span = document.createElement("span");
  if (cls) span.className = cls;
  span.textContent = text;
  c.appendChild(span);
  c.scrollTop = c.scrollHeight;
}
function consoleClear() {
  document.getElementById("console").textContent = "";
}
function showTurtleTab() {
  document.querySelectorAll(".btab").forEach(function (t) {
    t.classList.toggle("active", t.dataset.p === "turtle");
  });
  document.querySelectorAll(".bpanel").forEach(function (p) {
    p.classList.toggle("active", p.id === "panel-turtle");
  });
}
