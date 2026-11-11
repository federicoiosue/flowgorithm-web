
/* ------------------------------------------------------- modello dati */
var TYPES = ["Integer", "Real", "String", "Boolean", "Char"];

function newBlock(type) {
  var b = { id: uid(), type: type };
  switch (type) {
    case "declare": b.vars = [{ name: "x", type: "Integer", arr: false, size: "10" }]; break;
    case "assign": b.var = ""; b.index = null; b.expr = ""; break;
    case "input": b.var = ""; b.index = null; b.prompt = ""; break;
    case "output": b.expr = ""; b.nl = true; break;
    case "if": b.cond = ""; b.then = []; b.else = []; break;
    case "while": b.cond = ""; b.body = []; break;
    case "for": b.var = ""; b.from = "1"; b.to = "10"; b.step = "1"; b.dir = "up"; b.body = []; break;
    case "do": b.cond = ""; b.body = []; break;
    case "call": b.fn = ""; b.args = []; break;
    case "return": b.expr = ""; break;
    case "comment": b.text = ""; break;
  }
  return b;
}

function newFn(name) {
  return { id: uid(), name: name || "Funzione", params: [], ret: null, body: [] };
}
function newProgram() {
  var f = newFn("Main");
  return { app: "flowweb", version: 1, functions: [f] };
}

var PROGRAM = newProgram();
var curFnId = null;

function fns() { return PROGRAM.functions; }
function fnById(id) {
  for (var i = 0; i < fns().length; i++) if (fns()[i].id === id) return fns()[i];
  return null;
}
function currentFn() {
  return fnById(curFnId) || fns()[0];
}
function findFnByName(nm) {
  nm = (nm || "").toLowerCase();
  for (var i = 0; i < fns().length; i++) if (fns()[i].name.toLowerCase() === nm) return fns()[i];
  return null;
}

function walkChain(arr, cb) {
  for (var i = 0; i < arr.length; i++) {
    var b = arr[i];
    cb(b, arr, i);
    if (b.type === "if") { walkChain(b.then, cb); walkChain(b.else, cb); }
    if (b.type === "while" || b.type === "do" || b.type === "for") walkChain(b.body, cb);
  }
}
function findBlock(id) {
  var res = null;
  walkChain(currentFn().body, function (b, arr, i) { if (b.id === id && !res) res = { block: b, arr: arr, index: i }; });
  return res;
}
function collectVars(fn) {
  var out = [];
  (fn.params || []).forEach(function (p) { out.push({ name: p.name, type: p.type, arr: false, size: null, param: true }); });
  walkChain(fn.body, function (b) {
    if (b.type === "declare") b.vars.forEach(function (v) { out.push({ name: v.name, type: v.type, arr: !!v.arr, size: v.size, param: false }); });
  });
  return out;
}
function cloneBlock(b) {
  var c = deepCopy(b);
  c.id = uid();
  if (c.then) { c.then = c.then.map(cloneBlock); c.else = c.else.map(cloneBlock); }
  if (c.body) c.body = c.body.map(cloneBlock);
  return c;
}
function blockText(b) {
  switch (b.type) {
    case "declare": return "Declare " + b.vars.map(function (v) { return v.name + " As " + v.type + (v.arr ? "[" + v.size + "]" : ""); }).join(", ");
    case "assign": return "set " + (b.var || "?") + (b.index ? "[" + b.index + "]" : "") + " to " + (b.expr || "?");
    case "input": return "Input " + (b.var || "?") + (b.index ? "[" + b.index + "]" : "");
    case "output": return "Output " + (b.expr || "?");
    case "if": return "If " + (b.cond || "?") + " Then";
    case "while": return "While " + (b.cond || "?");
    case "for": return "For " + (b.var || "?") + " = " + b.from + " " + (b.dir === "down" ? "downto" : "to") + " " + b.to + (b.step && b.step !== "1" ? " by " + b.step : "");
    case "do": return "Do While " + (b.cond || "?");
    case "call": return "Call " + (b.fn || "?") + "(" + (b.args || []).join(", ") + ")";
    case "return": return b.expr ? "Return " + b.expr : "Return";
    case "comment": return b.text || "commento";
  }
  return "?";
}
function blockTip(b) {
  var s = b.type.toUpperCase() + "\n" + blockText(b);
  if (b.type === "input" && b.prompt) s += "\nprompt: " + b.prompt;
  return s;
}
