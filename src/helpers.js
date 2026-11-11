
/* ---------------------------------------------------------------- utils */
var NS = "http://www.w3.org/2000/svg";var MEAS = null;
function textW(s, bold) {
  if (typeof document !== "undefined") {
    if (!MEAS) MEAS = document.createElement("canvas").getContext("2d");
    MEAS.font = (bold ? "bold " : "") + '13px "Segoe UI", Tahoma, sans-serif';
    return MEAS.measureText(s).width;
  }
  return s.length * 7;
}
var _uid = 1;
function uid() { return "b" + (_uid++) + "_" + Math.floor(Math.random() * 1e6); }
function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
function esc(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function download(name, text, mime) {
  var blob = new Blob([text], { type: mime || "text/plain" });
  var a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(function () { URL.revokeObjectURL(a.href); }, 5000);
}
function deepCopy(o) { return JSON.parse(JSON.stringify(o)); }
