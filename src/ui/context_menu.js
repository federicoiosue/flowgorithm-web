/* ---- context menu / click su blocchi ---- */
function showCtxMenu(x, y, items) {
  var old = document.getElementById("ctxmenu"); if (old) old.remove();
  var m = document.createElement("div");
  m.id = "ctxmenu";
  items.forEach(function (it) {
    if (it.sep) { var s = document.createElement("div"); s.className = "sep"; m.appendChild(s); return; }
    var d = document.createElement("div");
    d.className = "di" + (it.disabled ? " disabled" : "");
    d.textContent = it.label;
    if (!it.disabled) d.onclick = function () { m.remove(); it.action(); };
    m.appendChild(d);
  });
  document.body.appendChild(m);
  m.style.left = Math.min(x, window.innerWidth - 200) + "px";
  m.style.top = Math.min(y, window.innerHeight - 30 - items.length * 26) + "px";
  setTimeout(function () {
    document.addEventListener("mousedown", function h(e) {
      if (!m.contains(e.target)) { m.remove(); document.removeEventListener("mousedown", h); }
    });
  }, 0);
}

function setupSvgEvents() {
  var svg = document.getElementById("svg");
  svg.addEventListener("dblclick", function (e) {
    var g = e.target.closest(".blk");
    if (!g) return;
    if (g.dataset.id === "__fn__") { openFunctionModal(currentFn()); return; }
    var ref = findBlock(g.dataset.id);
    if (ref) openBlockModal(ref.block, false);
  });
  svg.addEventListener("contextmenu", function (e) {
    var g = e.target.closest(".blk");
    if (!g) return;
    e.preventDefault();
    if (g.dataset.id === "__fn__") return;
    var ref = findBlock(g.dataset.id);
    if (!ref) return;
    showCtxMenu(e.clientX, e.clientY, [
      { label: "Modifica", action: function () { openBlockModal(ref.block, false); } },
      { label: "Duplica", action: function () { ref.arr.splice(ref.index + 1, 0, cloneBlock(ref.block)); commit(); } },
      { sep: true },
      { label: "Elimina", action: function () { ref.arr.splice(ref.index, 1); commit(); } }
    ]);
  });
}
