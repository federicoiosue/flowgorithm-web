/* ---- form helpers ---- */
function frow(label, ctl) {
  var d = document.createElement("div");
  d.className = "formrow";
  var l = document.createElement("label");
  l.textContent = label;
  d.appendChild(l);
  var wrap = document.createElement("div");
  wrap.className = "fill";
  wrap.appendChild(ctl);
  d.appendChild(wrap);
  return d;
}
function ftext(value, placeholder, withDatalist) {
  var i = document.createElement("input");
  i.type = "text";
  i.value = value || "";
  if (placeholder) i.placeholder = placeholder;
  if (withDatalist) i.setAttribute("list", "fndatalist");
  return i;
}
function fsel(options, value) {
  var s = document.createElement("select");
  options.forEach(function (o) {
    var opt = document.createElement("option");
    opt.value = o.v; opt.textContent = o.t;
    s.appendChild(opt);
  });
  s.value = value;
  return s;
}
function fcheck(value, label) {
  var l = document.createElement("label");
  var i = document.createElement("input");
  i.type = "checkbox";
  i.checked = !!value;
  l.appendChild(i);
  l.appendChild(document.createTextNode(" " + label));
  return l;
}
function varSelect(fn, filter) {
  var vars = collectVars(fn).filter(function (v) { return !filter || filter(v); });
  var opts = [{ v: "", t: t("dlg.chooseVar") }].concat(vars.map(function (v) {
    return { v: v.name, t: v.name + " (" + v.type + (v.arr ? "[]" : "") + ")" };
  }));
  return fsel(opts, "");
}

var BUILTIN_LIST = ["ToInteger", "ToReal", "ToString", "ToChar", "ToASCII", "Length", "Size", "Char", "Abs", "Ceiling", "Floor", "Round", "Sqrt", "Sin", "Cos", "Tan", "Log", "Power", "Random", "Min", "Max", "TurtleMove", "TurtleTurn", "TurtleGoTo", "TurtlePenUp", "TurtlePenDown", "TurtlePenColor", "TurtleHome", "TurtleClear", "TurtleShow", "TurtleHide"];
