/* ---- theme (Material Design 3: auto / light / dark) ---- */
var THEME_PREF = "auto";
function setThemePref(pref) {
  THEME_PREF = pref;
  try { localStorage.setItem("flowweb.theme", pref); } catch (e) {}
  applyTheme();
  setStatus(t("status.theme") + ": " + t("menu.theme" + pref.charAt(0).toUpperCase() + pref.slice(1)).split(": ")[1]);
}
function applyTheme() {
  var dark = THEME_PREF === "dark" ||
    (THEME_PREF === "auto" && window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
}
function initTheme() {
  try { THEME_PREF = localStorage.getItem("flowweb.theme") || "auto"; } catch (e) {}
  applyTheme();
  if (window.matchMedia) {
    var mq = window.matchMedia("(prefers-color-scheme: dark)");
    var onChange = function () { if (THEME_PREF === "auto") applyTheme(); };
    if (mq.addEventListener) mq.addEventListener("change", onChange);
    else if (mq.addListener) mq.addListener(onChange);
  }
}
function loadLocal() {
  try {
    var s = localStorage.getItem("flowweb.autosave");
    if (s) {
      var p = JSON.parse(s);
      if (p && p.functions && p.functions.length) { PROGRAM = p; curFnId = PROGRAM.functions[0].id; return true; }
    }
  } catch (e) {}
  return false;
}

function exportPNG() {
  var svg = document.getElementById("svg");
  var clone = svg.cloneNode(true);
  clone.querySelectorAll(".dz").forEach(function (x) { x.remove(); });
  clone.querySelectorAll(".blk.current, .blk.err").forEach(function (x) { x.classList.remove("current"); x.classList.remove("err"); });
  clone.setAttribute("xmlns", NS);
  /* embed the stylesheet so exported blocks keep colors, strokes and fonts */
  var style = document.createElementNS(NS, "style");
  style.textContent = Array.prototype.slice.call(document.styleSheets[0].cssRules).map(function (r) { return r.cssText; }).join("\n");
  clone.insertBefore(style, clone.firstChild);
  var w = DRAW.maxX - DRAW.minX, h = DRAW.maxY - DRAW.minY;
  clone.setAttribute("width", w); clone.setAttribute("height", h);
  var data = new XMLSerializer().serializeToString(clone);
  var img = new Image();
  img.onload = function () {
    var c = document.createElement("canvas");
    c.width = w * 2; c.height = h * 2;
    var ctx = c.getContext("2d");
    ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, c.width, c.height);
    ctx.drawImage(img, 0, 0, c.width, c.height);
    var a = document.createElement("a");
    a.href = c.toDataURL("image/png");
    a.download = (fns()[0].name || "diagramma") + ".png";
    a.click();
  };
  img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(data);
}
