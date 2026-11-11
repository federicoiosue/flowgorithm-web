/* ---- drag & drop ---- */
var DRAG_TYPE = null;
function setupDnD() {
  var svg = document.getElementById("svg");
  svg.addEventListener("dragover", function (e) {
    e.preventDefault();
    if (!DRAG_TYPE) return;
    svg.classList.add("dragging");
    var z = zoneAt(svgPoint(e));
    DRAW.zones.forEach(function (zz) { zz.el.classList.toggle("hot", zz === z); });
  });
  svg.addEventListener("drop", function (e) {
    e.preventDefault();
    svg.classList.remove("dragging");
    var t = DRAG_TYPE || e.dataTransfer.getData("text/blocktype");
    var z = zoneAt(svgPoint(e));
    if (t && z) {
      var b = newBlock(t);
      z.arr.splice(z.index, 0, b);
      commit();
      openBlockModal(b, true);
    }
    DRAG_TYPE = null;
  });
  svg.addEventListener("dragleave", function () { /* zone evidenziate gestite in dragover */ });

  document.addEventListener("dragend", function () {
    document.getElementById("svg").classList.remove("dragging");
    DRAG_TYPE = null;
  });
}
