
/* ------------------------------------------------------------ turtle */
var TURTLE = {
  x: 0, y: 0, ang: 0, pen: true, color: "black", visible: true,
  W: 420, H: 420
};
function turtleCtx() {
  if (typeof document === "undefined") return null;
  var c = document.getElementById("turtle-path");
  return c ? c.getContext("2d") : null;
}
function turtleReset() {
  TURTLE.x = 0; TURTLE.y = 0; TURTLE.ang = 0; TURTLE.pen = true; TURTLE.color = "black"; TURTLE.visible = true;
  var ctx = turtleCtx();
  if (ctx) { ctx.clearRect(0, 0, TURTLE.W, TURTLE.H); }
  turtleDrawMark();
  turtleHud();
}
function toCanvas(x, y) { return [TURTLE.W / 2 + x, TURTLE.H / 2 - y]; }
function turtleLine(x1, y1, x2, y2) {
  var ctx = turtleCtx(); if (!ctx) return;
  ctx.strokeStyle = TURTLE.color; ctx.lineWidth = 2; ctx.lineCap = "round";
  var a = toCanvas(x1, y1), b = toCanvas(x2, y2);
  ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
}
function turtleMove(d) {
  var rad = TURTLE.ang * Math.PI / 180;
  var nx = TURTLE.x + d * Math.sin(rad);
  var ny = TURTLE.y + d * Math.cos(rad);
  if (TURTLE.pen) turtleLine(TURTLE.x, TURTLE.y, nx, ny);
  TURTLE.x = nx; TURTLE.y = ny;
  turtleDrawMark(); turtleHud();
}
function turtleGoTo(x, y) {
  if (TURTLE.pen) turtleLine(TURTLE.x, TURTLE.y, x, y);
  TURTLE.x = x; TURTLE.y = y;
  turtleDrawMark(); turtleHud();
}
function turtleTurn(a) { TURTLE.ang = (TURTLE.ang + a) % 360; turtleDrawMark(); turtleHud(); }
function turtleDrawMark() {
  if (typeof document === "undefined") return;
  var c = document.getElementById("turtle-mark"); if (!c) return;
  var ctx = c.getContext("2d");
  ctx.clearRect(0, 0, TURTLE.W, TURTLE.H);
  if (!TURTLE.visible) return;
  var p = toCanvas(TURTLE.x, TURTLE.y);
  var rad = TURTLE.ang * Math.PI / 180;
  var dx = Math.sin(rad), dy = -Math.cos(rad); // direzione in coords canvas
  ctx.save();
  ctx.translate(p[0], p[1]);
  ctx.rotate(Math.atan2(dy, dx));
  ctx.fillStyle = "#1a5fb4";
  ctx.beginPath();
  ctx.moveTo(11, 0); ctx.lineTo(-7, -7); ctx.lineTo(-3, 0); ctx.lineTo(-7, 7);
  ctx.closePath(); ctx.fill();
  ctx.restore();
}
function turtleHud() {
  if (typeof document === "undefined") return;
  var h = document.getElementById("turtle-hud"); if (!h) return;
  h.textContent = "x: " + Math.round(TURTLE.x) + "  y: " + Math.round(TURTLE.y) + "  \u00e0ng: " + Math.round((TURTLE.ang + 360) % 360) + "\u00b0  penna: " + (TURTLE.pen ? "gi\u00f9" : "su");
}
