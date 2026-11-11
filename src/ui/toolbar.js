/* ---- toolbar ---- */
var TB = {};
function buildToolbar() {
  var host = document.getElementById("toolbar");
  host.innerHTML = "";
  function btn(id, title, svg, label, onclick) {
    var b = document.createElement("button");
    b.className = "tbtn"; b.id = "tb-" + id; b.title = title;
    b.innerHTML = svg + (label ? "<span>" + label + "</span>" : "");
    b.onclick = onclick;
    host.appendChild(b);
    TB[id] = b;
    return b;
  }
  function sep() { var s = document.createElement("div"); s.className = "tsep"; host.appendChild(s); }

  btn("run", t("tb.tip.run"), ICONS.run, t("tb.run"), function () { doRunBtn(); });
  btn("pause", t("tb.tip.pause"), ICONS.pause, t("tb.pause"), function () { doPauseBtn(); });
  btn("step", t("tb.tip.step"), ICONS.step, t("tb.step"), function () { doStepBtn(); });
  btn("stop", t("tb.tip.stop"), ICONS.stop, t("tb.stop"), function () { doStopBtn(); });
  sep();
  var sw = document.createElement("div");
  sw.id = "speed-wrap";
  sw.innerHTML = '<label>' + t("tb.speed") + '</label><input id="speed" type="range" min="0" max="2000" step="50" value="350"><span id="speed-val">350ms</span>';
  host.appendChild(sw);
  sw.querySelector("#speed").addEventListener("input", function () {
    RT.speed = +this.value;
    document.getElementById("speed-val").textContent = this.value === "0" ? "max" : this.value + "ms";
    this.style.setProperty("--fill", (100 - (+this.value / 2000 * 100)) + "%");
  });
  var sp0 = sw.querySelector("#speed");
  sp0.style.setProperty("--fill", (100 - (+sp0.value / 2000 * 100)) + "%");
  sep();
  var zw = document.createElement("div");
  zw.id = "zoom-wrap";
  zw.innerHTML = '<button class="btn zbtn" id="zoom-out" title="' + t("tb.zoomOut") + '">\u2212</button><span id="zoom-val">100%</span><button class="btn zbtn" id="zoom-in" title="' + t("tb.zoomIn") + '">+</button>';
  host.appendChild(zw);
  zw.querySelector("#zoom-out").onclick = function () { Z = clamp(Z - 0.1, 0.5, 1.6); applyZoom(); updateStatusRight(); };
  zw.querySelector("#zoom-in").onclick = function () { Z = clamp(Z + 0.1, 0.5, 1.6); applyZoom(); updateStatusRight(); };
  sep();
  btn("code", t("tb.tip.code"), ICONS.code, t("tb.code"), function () { openExportModal(); });
  btn("png", t("tb.tip.png"), ICONS.png, t("tb.png"), function () { exportPNG(); });
  setRunUI();
}
function setRunUI() {
  var running = RT.state === "running";
  TB.run && (TB.run.disabled = running);
  TB.pause && (TB.pause.disabled = !running);
  TB.step && (TB.step.disabled = false);
  TB.stop && (TB.stop.disabled = !running);
}
function doRunBtn() {
  if (RT.state === "running") { RT.resume(); setStatus(t("status.resumed")); }
  else startRun("run");
}
function doPauseBtn() {
  if (RT.state !== "running") return;
  if (RT.paused) { RT.resume(); setStatus(t("status.resumed")); }
  else { RT.pause(); setStatus(t("status.pausedLbl")); }
}
function doStepBtn() {
  if (RT.state === "idle") startRun("step");
  else RT.doStep();
}
function doStopBtn() {
  if (RT.state === "running") RT.stop();
}

var ICONS = {
  new: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M13 2v7h7"/></svg>',
  open: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5V5a2 2 0 0 1 2-2h3l2 3h7a2 2 0 0 1 2 2v9.5"/><path d="M2 19.5V7a2 2 0 0 1 2-2h2l2 3h6a2 2 0 0 1 2 2v7.5l-2 3H4z" opacity=".5"/></svg>',
  save: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><path d="M17 21v-8H7v8M7 3v5h8"/></svg>',
  run: '<svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1" stroke-linejoin="round"><path d="M6 4l14 8-14 8z"/></svg>',
  pause: '<svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1" stroke-linejoin="round"><rect x="5" y="4" width="5" height="16" rx="1"/><rect x="14" y="4" width="5" height="16" rx="1"/></svg>',
  step: '<svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1" stroke-linejoin="round"><path d="M3 4l11 8-11 8z"/><rect x="16" y="4" width="5" height="16" rx="1"/></svg>',
  stop: '<svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1" stroke-linejoin="round"><rect x="5" y="5" width="14" height="14" rx="2"/></svg>',
  code: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M8 6l-6 6 6 6M16 6l6 6-6 6"/></svg>',
  png: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2.5" y="4" width="19" height="16" rx="2"/><path d="M2.5 16l6-6 4.5 4.5 3-3 5.5 5.5" /><circle cx="8" cy="8" r="1.8"/></svg>'
};
