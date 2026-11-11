/* ============================================================== RENDER */
var L = { H: 44, GAP: 28, BGAP: 64, MINW: 210, MAXW: 430, HOFF: 70, F0: 380 };
var Z = 1;
var DRAW = { zones: [], els: {}, minX: 1e9, minY: 1e9, maxX: -1e9, maxY: -1e9 };

function svgEl(tag, attrs, parent) {
  var e = document.createElementNS(NS, tag);
  if (attrs) Object.keys(attrs).forEach(function (k) { e.setAttribute(k, attrs[k]); });
  if (parent) parent.appendChild(e);
  return e;
}
function track(x, y, w, h) {
  DRAW.minX = Math.min(DRAW.minX, x); DRAW.minY = Math.min(DRAW.minY, y);
  DRAW.maxX = Math.max(DRAW.maxX, x + (w || 0)); DRAW.maxY = Math.max(DRAW.maxY, y + (h || 0));
}

var COLORS = {
  header: "#2e2e2e", declare: "#009688", assign: "#1e40af", input: "#0b8a3a",
  output: "#4632b8", if: "#e87722", loop: "#bf8f00", call: "#7b1fa2",
  return: "#c62828", comment: "#ffffff"
};

function blockColor(b) {
  if (b.type === "while" || b.type === "for" || b.type === "do") return COLORS.loop;
  return COLORS[b.type] || "#666";
}
function blockWidth(b) {
  var t = blockText(b);
  var extra = (b.type === "if") ? 130 : 90;
  var min = (b.type === "if") ? 280 : L.MINW;
  return clamp(textW(t) + extra, min, L.MAXW);
}
function chainWidth(arr) {
  if (!arr.length) return 170;
  var w = 0;
  arr.forEach(function (b) {
    var bw;
    if (b.type === "if") bw = chainWidth(b.then) + L.BGAP + chainWidth(b.else);
    else if (b.type === "while" || b.type === "for" || b.type === "do") bw = blockWidth(b) + L.HOFF + chainWidth(b.body) + 46;
    else bw = blockWidth(b);
    w = Math.max(w, bw);
  });
  return w;
}

function fitText(s, maxW) {
  if (textW(s) <= maxW) return s;
  while (s.length && textW(s + "\u2026") > maxW) s = s.slice(0, -1);
  return s + "\u2026";
}

function drawTextLine(g, txt, x, y, maxW, cls) {
  var t = svgEl("text", { x: x, y: y, "class": "bt-text" + (cls ? " " + cls : ""), "font-family": "Segoe UI, Tahoma, sans-serif" }, g);
  t.textContent = fitText(txt, maxW);
  return t;
}

function mkBlockGroup(b) {
  var g = svgEl("g", { "class": "blk", "data-id": b.id }, DRAW.gRoot);
  var ti = svgEl("title", {}, g);
  ti.textContent = blockTip(b);
  DRAW.els[b.id] = g;
  return g;
}

function drawShapeRect(g, b, x, y, w, h, fill, rx) {
  svgEl("rect", { x: x, y: y, width: w, height: h, rx: rx || 8, fill: fill, "class": "shape" }, g);
  track(x, y, w, h);
}
function drawShapePar(g, b, x, y, w, h, fill) {
  var s = 16;
  var d = "M " + (x + s) + " " + y + " L " + (x + w) + " " + y + " L " + (x + w - s) + " " + (y + h) + " L " + x + " " + (y + h) + " Z";
  svgEl("path", { d: d, fill: fill, "class": "shape" }, g);
  track(x, y, w, h);
}
function drawShapeDiamond(g, b, x, y, w, h, fill) {
  var d = "M " + x + " " + (y + h / 2) +
    " L " + (x + w * 0.18) + " " + y +
    " L " + (x + w * 0.82) + " " + y +
    " L " + (x + w) + " " + (y + h / 2) +
    " L " + (x + w * 0.82) + " " + (y + h) +
    " L " + (x + w * 0.18) + " " + (y + h) + " Z";
  svgEl("path", { d: d, fill: fill, "class": "shape" }, g);
  track(x, y, w, h);
}
function drawArrowHead(g, x, y) {
  svgEl("polygon", { points: (x - 5) + "," + (y - 9) + " " + (x + 5) + "," + (y - 9) + " " + x + "," + y, "class": "flowarrow" }, g);
}
function drawConnector(g, x, y1, y2) {
  svgEl("line", { x1: x, y1: y1, x2: x, y2: y2 - 1, "class": "flowline" }, g);
  drawArrowHead(g, x, y2);
}
function addZone(arr, index, cx, cy) {
  var g = svgEl("g", { "class": "dz" }, DRAW.gRoot);
  svgEl("rect", { x: cx - 52, y: cy - 15, width: 104, height: 30, rx: 6 }, g);
  DRAW.zones.push({ arr: arr, index: index, cx: cx, cy: cy, el: g });
}

/* disegna una catena sulla linea di flusso x=F partendo dal punto di connessione cy.
   Ritorna il punto di connessione in fondo (endY). */
function drawChain(arr, F, cy) {
  if (!arr.length) {
    var py = cy + L.GAP;
    var g = svgEl("g", {}, DRAW.gRoot);
    svgEl("rect", { x: F - 85, y: py, width: 170, height: 36, rx: 8, "class": "placeholder-box" }, g);
    var t = svgEl("text", { x: F, y: py + 22, "text-anchor": "middle", "class": "placeholder-text", "font-family": "Segoe UI" }, g);
    t.textContent = I18N_CUR === "it" ? "trascina un blocco qui" : "drag a block here";
    track(F - 85, py, 170, 36);
    addZone(arr, 0, F, py + 18);
    return py + 36;
  }
  addZone(arr, 0, F, cy + L.GAP / 2);
  var ey = cy;
  for (var i = 0; i < arr.length; i++) {
    var top = ey + L.GAP;
    ey = drawBlock(arr[i], F, top);
    if (i < arr.length - 1) {
      addZone(arr, i + 1, F, ey + L.GAP / 2);
      var g2 = svgEl("g", {}, DRAW.gRoot);
      drawConnector(g2, F, ey, ey + L.GAP);
    }
  }
  return ey;
}

function drawBlock(b, F, top) {
  var g = mkBlockGroup(b);
  var w = blockWidth(b);
  var x = F - w / 2;
  var endY = top + L.H;

  switch (b.type) {
    case "declare": case "assign": case "call": case "return": {
      drawShapeRect(g, b, x, top, w, L.H, blockColor(b));
      drawTextLine(g, blockText(b), x + 16, top + L.H / 2 + 4.5, w - 30);
      break;
    }
    case "input": case "output": {
      drawShapePar(g, b, x, top, w, L.H, blockColor(b));
      drawTextLine(g, blockText(b), x + 26, top + L.H / 2 + 4.5, w - 46);
      break;
    }
    case "comment": {
      drawShapeRect(g, b, x, top, w, L.H, "#fcfcfc", 8);
      var cRect = g.querySelector("rect.shape");
      cRect.setAttribute("stroke", "#aaa");
      cRect.setAttribute("stroke-dasharray", "5 4");
      drawTextLine(g, blockText(b), x + 16, top + L.H / 2 + 4.5, w - 30, "comment");
      break;
    }
    case "if": {
      var dh = 64;
      drawShapeDiamond(g, b, x, top, w, dh, blockColor(b));
      drawTextLine(g, blockText(b), x + w * 0.22, top + dh / 2 + 4.5, w * 0.6);
      var thenW = chainWidth(b.then), elseW = chainWidth(b.else);
      var total = Math.max(thenW + L.BGAP + elseW, w);
      var F1 = F - total / 2 + thenW / 2;
      var F2 = F + total / 2 - elseW / 2;
      var elbowY = top + dh + 26;
      var gl = svgEl("g", {}, DRAW.gRoot);
      svgEl("line", { x1: F, y1: top + dh, x2: F, y2: elbowY, "class": "flowline" }, gl);
      svgEl("line", { x1: F, y1: elbowY, x2: F1, y2: elbowY, "class": "flowline" }, gl);
      svgEl("line", { x1: F, y1: elbowY, x2: F2, y2: elbowY, "class": "flowline" }, gl);
      var lt = svgEl("text", { x: F1 + 6, y: elbowY - 5, "class": "lbl", "font-family": "Segoe UI" }, gl);
      lt.textContent = I18N_CUR === "it" ? "vero" : "true";
      var lf = svgEl("text", { x: F2 + 6, y: elbowY - 5, "class": "lbl", "font-family": "Segoe UI" }, gl);
      lf.textContent = I18N_CUR === "it" ? "falso" : "false";
      drawConnector(gl, F1, elbowY, elbowY + L.GAP);
      drawConnector(gl, F2, elbowY, elbowY + L.GAP);
      var tEnd = drawChain(b.then, F1, elbowY);
      var eEnd = drawChain(b.else, F2, elbowY);
      var mergeY = Math.max(tEnd, eEnd) + 26;
      svgEl("line", { x1: F1, y1: tEnd, x2: F1, y2: mergeY, "class": "flowline" }, gl);
      svgEl("line", { x1: F2, y1: eEnd, x2: F2, y2: mergeY, "class": "flowline" }, gl);
      svgEl("line", { x1: F1, y1: mergeY, x2: F2, y2: mergeY, "class": "flowline" }, gl);
      svgEl("line", { x1: F, y1: mergeY, x2: F, y2: mergeY, "class": "flowline" }, gl);
      endY = mergeY;
      break;
    }
    case "while": case "for": case "do": {
      drawShapeRect(g, b, x, top, w, L.H, blockColor(b), 14);
      drawTextLine(g, blockText(b), x + 16, top + L.H / 2 + 4.5, w - 30);
      var F2 = F + w / 2 + L.HOFF;
      var elbowY = top + L.H / 2;
      var gl2 = svgEl("g", {}, DRAW.gRoot);
      svgEl("line", { x1: F + w / 2, y1: elbowY, x2: F2, y2: elbowY, "class": "flowline" }, gl2);
      var bodyStart = elbowY + 20;
      drawConnector(gl2, F2, elbowY, bodyStart + L.GAP);
      var bodyEnd = drawChain(b.body, F2, bodyStart);
      // linea di ritorno (tratteggiata)
      var bx = F2 + chainWidth(b.body) / 2 + 46;
      var d2 = "M " + F2 + " " + bodyEnd + " L " + bx + " " + bodyEnd +
        " L " + bx + " " + (top + 10) + " L " + (F + w / 2 + 10) + " " + (top + 10);
      svgEl("path", { d: d2, "class": "flowline", "stroke-dasharray": "5 4", fill: "none" }, gl2);
      var ah = svgEl("polygon", {
        points: (F + w / 2 + 18) + "," + (top + 6) + " " + (F + w / 2 + 18) + "," + (top + 14) + " " + (F + w / 2 + 10) + "," + (top + 10),
        "class": "flowarrow"
      }, gl2);
      track(bx, top + 10, 0, bodyEnd - top);
      break;
    }
  }
  return endY;
}

function fnHeader(fn) {
  var s = fn.name + "(" + (fn.params || []).map(function (p) { return p.name; }).join(", ") + ")";
  if (fn.ret) s += " : " + fn.ret;
  return s;
}

function render() {
  var svg = document.getElementById("svg");
  while (svg.firstChild) svg.removeChild(svg.firstChild);
  DRAW = { zones: [], els: {}, minX: 1e9, minY: 1e9, maxX: -1e9, maxY: -1e9, gRoot: svgEl("g", {}, svg) };
  var fn = currentFn();
  var F = L.F0, y = 24;
  var head = blockWidth({ type: "declare", vars: [] });
  var hw = clamp(textW(fnHeader(fn), true) + 90, 220, 460);
  var hg = svgEl("g", { "class": "blk", "data-id": "__fn__" }, DRAW.gRoot);
  var hi = svgEl("title", {}, hg); hi.textContent = "Doppio clic per modificare la funzione";
  svgEl("rect", { x: F - hw / 2, y: y, width: hw, height: L.H, rx: L.H / 2, fill: COLORS.header, "class": "shape" }, hg);
  var ht = svgEl("text", { x: F, y: y + L.H / 2 + 4.5, "text-anchor": "middle", "font-weight": "bold", "font-family": "Segoe UI", fill: "#fff" }, hg);
  ht.textContent = fitText(fnHeader(fn), hw - 40);
  track(F - hw / 2, y, hw, L.H);
  if (DRAW.els.__fn__) DRAW.els.__fn__ = hg;
  var cy = y + L.H;
  var gl = svgEl("g", {}, DRAW.gRoot);
  drawConnector(gl, F, cy, cy + L.GAP);
  var endY = drawChain(fn.body, F, cy);
  var gl2 = svgEl("g", {}, DRAW.gRoot);
  drawConnector(gl2, F, endY, endY + L.GAP);
  var eg = svgEl("g", {}, DRAW.gRoot);
  svgEl("rect", { x: F - 45, y: endY + L.GAP, width: 90, height: 34, rx: 17, fill: COLORS.header, "class": "shape" }, eg);
  var et = svgEl("text", { x: F, y: endY + L.GAP + 22, "text-anchor": "middle", "font-weight": "bold", "font-family": "Segoe UI", fill: "#fff" }, eg);
  et.textContent = "End";
  track(F - 45, endY + L.GAP, 90, 34);

  DRAW.minX -= 30; DRAW.minY -= 20; DRAW.maxX += 30; DRAW.maxY += 30;
  applyZoom();
  updateTabs();
  updateStatusRight();
}

function applyZoom() {
  var svg = document.getElementById("svg");
  var w = Math.max(60, DRAW.maxX - DRAW.minX), h = Math.max(60, DRAW.maxY - DRAW.minY);
  svg.setAttribute("width", w * Z);
  svg.setAttribute("height", h * Z);
  DRAW.gRoot.setAttribute("transform", "scale(" + Z + ") translate(" + (-DRAW.minX) + "," + (-DRAW.minY) + ")");
}
function svgPoint(e) {
  var svg = document.getElementById("svg");
  var r = svg.getBoundingClientRect();
  return { x: (e.clientX - r.left) / Z + DRAW.minX, y: (e.clientY - r.top) / Z + DRAW.minY };
}
function zoneAt(p) {
  var best = null;
  DRAW.zones.forEach(function (z) {
    if (Math.abs(p.x - z.cx) < 120 && Math.abs(p.y - z.cy) < 26) best = z;
  });
  return best;
}

function renderWatch() {
  var host = document.getElementById("panel-vars");
  var hint = document.getElementById("vars-hint");
  var table = document.getElementById("vars-table");
  if (!RT.frames.length) {
    if (table) table.remove();
    if (!hint) { host.innerHTML = ""; var d = document.createElement("div"); d.id = "vars-hint"; d.textContent = t("vars.hint"); host.appendChild(d); }
    return;
  }
  if (hint) hint.remove();
  var html = '<table id="vars-table"><tr><th>' + t("dlg.var") + '</th><th>' + (I18N_CUR === "it" ? "Tipo" : "Type") + '</th><th>' + (I18N_CUR === "it" ? "Valore" : "Value") + '</th></tr>';
  var prev = host._prev || {};
  var now = {};
  RT.frames.forEach(function (fr) {
    html += '<tr class="fnrow"><td colspan="3">' + esc(fr.fn.name) + "</td></tr>";
    Object.keys(fr.vars).forEach(function (k) {
      var rec = fr.vars[k];
      var valStr;
      if (rec.arr) {
        var parts = rec.items.slice(0, 8).map(fmt);
        valStr = "[" + parts.join(", ") + (rec.items.length > 8 ? ", \u2026" : "") + "]";
      } else valStr = fmt(rec.value);
      var key = fr.fn.name + "." + k;
      now[key] = valStr;
      var changed = prev[key] !== undefined && prev[key] !== valStr;
      html += "<tr><td>" + esc(rec.name) + "</td><td>" + esc(rec.type + (rec.arr ? "[" + rec.size + "]" : "")) + "</td><td" + (changed ? ' class="changed"' : "") + ">" + esc(valStr) + "</td></tr>";
    });
  });
  html += "</table>";
  host.innerHTML = html;
  host._prev = now;
}
