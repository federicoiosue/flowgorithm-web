/* ---- palette ---- */
var PAL = [
  { type: "declare", label: "Dichiarazione", icon: '<rect x="4" y="7" width="56" height="18" rx="4" fill="#009688"/>' },
  { type: "assign", label: "Assegnazione", icon: '<rect x="4" y="7" width="56" height="18" rx="4" fill="#1e40af"/>' },
  { type: "input", label: "Input", icon: '<path d="M12 7 L64 7 L56 25 L4 25 Z" fill="#0b8a3a"/>' },
  { type: "output", label: "Output", icon: '<path d="M12 7 L64 7 L56 25 L4 25 Z" fill="#4632b8"/>' },
  { type: "if", label: "If / Else", icon: '<path d="M4 16 L18 7 L50 7 L64 16 L50 25 L18 25 Z" fill="#e87722"/>' },
  { type: "while", label: "While", icon: '<rect x="4" y="8" width="48" height="16" rx="8" fill="#bf8f00"/><path d="M52 12 q12 0 12 8" stroke="#bf8f00" stroke-width="3" fill="none"/><path d="M64 20 l-5 -6 M64 20 l2 -8" stroke="#bf8f00" stroke-width="2" fill="none"/>' },
  { type: "for", label: "For", icon: '<rect x="4" y="8" width="48" height="16" rx="8" fill="#bf8f00"/><circle cx="12" cy="16" r="6" fill="none" stroke="#fff" stroke-width="2"/><path d="M12 11 l0 5 l4 2" stroke="#fff" stroke-width="1.6" fill="none"/>' },
  { type: "do", label: "Do", icon: '<rect x="4" y="8" width="48" height="16" rx="8" fill="#bf8f00"/><path d="M8 26 q28 4 44 -6" stroke="#bf8f00" stroke-width="2.5" fill="none" stroke-dasharray="4 3"/>' },
  { type: "call", label: "Call", icon: '<rect x="4" y="7" width="56" height="18" rx="9" fill="#7b1fa2"/>' },
  { type: "return", label: "Return", icon: '<rect x="4" y="7" width="56" height="18" rx="4" fill="#c62828"/>' },
  { type: "comment", label: "Commento", icon: '<rect x="4" y="7" width="56" height="18" rx="4" fill="#fcfcfc" stroke="#aaa" stroke-dasharray="4 3"/><line x1="10" y1="16" x2="54" y2="16" stroke="#999"/>' }
];
function buildPalette() {
  var host = document.getElementById("palette");
  host.innerHTML = "<h3>" + t("palette.header") + "</h3>";
  PAL.forEach(function (p) {
    var d = document.createElement("div");
    d.className = "pal-item";
    d.draggable = true;
    d.innerHTML = '<svg viewBox="0 0 68 32">' + p.icon + "</svg><span>" + p.label + "</span>";
    d.addEventListener("dragstart", function (e) {
      DRAG_TYPE = p.type;
      e.dataTransfer.setData("text/blocktype", p.type);
      e.dataTransfer.effectAllowed = "copy";
    });
    host.appendChild(d);
  });
}
