
/* ------------------------------------------------- valori e tipi (run) */
function defaultVal(type) {
  switch (type) {
    case "Integer": return { t: "Integer", v: 0 };
    case "Real": return { t: "Real", v: 0 };
    case "String": return { t: "String", v: "" };
    case "Boolean": return { t: "Boolean", v: false };
    case "Char": return { t: "Char", v: "" };
  }
  return { t: "Integer", v: 0 };
}
function isNum(v) { return v.t === "Integer" || v.t === "Real"; }
function fmt(v) {
  if (v.t === "Integer") return String(Math.trunc(v.v));
  if (v.t === "Real") {
    var x = v.v;
    if (!isFinite(x)) return String(x);
    if (Number.isInteger(x)) return String(x);
    var s = x.toPrecision(10).replace(/0+$/, "").replace(/\.$/, "");
    return s;
  }
  if (v.t === "Boolean") return v.v ? "true" : "false";
  return String(v.v);
}
function rtErr(msg) {
  var e = new Error(msg);
  e.rt = true;
  e.block = RT.currentBlock;
  return e;
}
function coerce(val, type) {
  if (val.t === type) return val;
  if (type === "Real" && val.t === "Integer") return { t: "Real", v: val.v };
  if (type === "String" && val.t === "Char") return { t: "String", v: val.v };
  throw rtErr("Tipo non compatibile: non posso assegnare " + val.t + " a " + type + (val.t === "Real" && type === "Integer" ? " (usa ToInteger)" : ""));
}
