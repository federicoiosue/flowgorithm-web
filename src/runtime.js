
/* ----------------------------------------------------------- runtime */
var RT = {
  state: "idle",           // idle | running
  paused: false,
  stepping: false,
  stopFlag: false,
  speed: 350,
  steps: 0,
  frames: [],
  currentBlock: null,
  _pauseP: null, _pauseR: null, _stepP: null, _stepR: null,

  reset: function () {
    this.state = "idle"; this.paused = false; this.stepping = false; this.stopFlag = false;
    this.steps = 0; this.frames = []; this.currentBlock = null;
    this._pauseP = this._pauseR = this._stepP = this._stepR = null;
    this.highlight(null); this.updateWatch();
  },

  status: function () {
    if (typeof document === "undefined") return;
    var el = document.getElementById("status-left");
    if (el) el.textContent = this.state === "idle" ? t("status.ready") : (t("status.inExec") + " \u2014 " + t("status.step") + " " + this.steps + (this.paused ? " " + t("status.paused") : (this.stepping ? " " + t("status.stepping") : "")));
  },

  highlight: function (id) {
    if (typeof document === "undefined") return;
    DRAW.els = DRAW.els || {};
    Object.keys(DRAW.els).forEach(function (k) {
      var g = DRAW.els[k];
      if (g) g.classList.toggle("current", k === id);
    });
    if (id && DRAW.els[id]) {
      var wrap = document.getElementById("canvaswrap");
      var r = DRAW.els[id].getBoundingClientRect(), w = wrap.getBoundingClientRect();
      if (r.top < w.top + 40 || r.bottom > w.bottom - 40) {
        wrap.scrollTop += (r.top + r.height / 2) - (w.top + w.height / 2);
      }
    }
  },

  updateWatch: function () {
    if (typeof document === "undefined") return;
    renderWatch();
  },

  outLine: function (text, cls) {
    if (typeof document === "undefined") return;
    consoleAppend(text, cls);
  },

  askInput: function (b, typeName, varName) {
    if (typeof document === "undefined") return Promise.resolve(null);
    return askInputModal(b, typeName, varName);
  },

  gate: async function (b) {
    this.steps++;
    this.currentBlock = b;
    this.highlight(b ? b.id : null);
    this.updateWatch();
    this.status();
    if (this.stepping) {
      this._stepP = new Promise(function (r) { RT._stepR = r; });
      await this._stepP;
    } else {
      while (this.paused) {
        this._pauseP = new Promise(function (r) { RT._pauseR = r; });
        await this._pauseP;
      }
      await sleep(this.speed);
    }
    if (this.stopFlag) throw { stop: true };
  },

  pause: function () { this.paused = true; this.status(); },
  resume: function () {
    this.paused = false;
    if (this._pauseR) { var r = this._pauseR; this._pauseR = null; r(); }
    this.status();
  },
  doStep: function () {
    this.stepping = true; this.paused = false;
    if (this._pauseR) { var r = this._pauseR; this._pauseR = null; r(); }
    if (this._stepR) { var s = this._stepR; this._stepR = null; s(); }
  },
  stop: function () {
    this.stopFlag = true;
    if (this._pauseR) { var r = this._pauseR; this._pauseR = null; r(); }
    if (this._stepR) { var s = this._stepR; this._stepR = null; s(); }
  }
};

function makeFrame(fn) {
  var vars = {};
  (fn.params || []).forEach(function (p) {
    vars[p.name.toLowerCase()] = { name: p.name, type: p.type, arr: false, size: 0, value: null };
  });
  walkChain(fn.body, function (b) {
    if (b.type !== "declare") return;
    b.vars.forEach(function (v) {
      var key = v.name.toLowerCase();
      if (vars[key]) throw rtErr("Variabile dichiarata due volte: " + v.name);
      if (v.arr) {
        var size = constEval(v.size);
        if (size === null || size < 1 || size > 100000) throw rtErr(I18N_CUR==="it"?"Dimensione array non valida per ":"Invalid array size for " + v.name + ": " + v.size);
        var items = [];
        for (var i = 0; i < size; i++) items.push(defaultVal(v.type));
        vars[key] = { name: v.name, type: v.type, arr: true, size: size, items: items };
      } else {
        vars[key] = { name: v.name, type: v.type, arr: false, size: 0, value: defaultVal(v.type) };
      }
    });
  });
  return { fn: fn, vars: vars };
}

function constEval(src) {
  try {
    var ast = parse(String(src));
    return constAst(ast);
  } catch (e) { return null; }
}
function constAst(n) {
  if (n.t === "num") return +n.raw;
  if (n.t === "un" && n.op === "-") return -constAst(n.v);
  if (n.t === "bin") {
    var a = constAst(n.l), b = constAst(n.r);
    if (a === null || b === null) return null;
    switch (n.op) { case "+": return a + b; case "-": return a - b; case "*": return a * b; case "/": return b === 0 ? null : a / b; }
  }
  return null;
}

/* --- valutazione espressioni --- */
async function ev(n, frame) {
  switch (n.t) {
    case "num": return { t: n.int ? "Integer" : "Real", v: +n.raw };
    case "str": return { t: "String", v: n.v };
    case "bool": return { t: "Boolean", v: n.v };
    case "id": {
      var rec = frame.vars[n.name.toLowerCase()];
      if (!rec) throw rtErr("Variabile non dichiarata: " + n.name);
      if (rec.arr) return { t: "Array", ref: rec };
      return { t: rec.type, v: rec.value.v };
    }
    case "idx": {
      var rec2 = frame.vars[n.name.toLowerCase()];
      if (!rec2) throw rtErr("Variabile non dichiarata: " + n.name);
      if (!rec2.arr) throw rtErr(n.name + " non \u00e8 un array");
      var iv = await ev(n.idx, frame);
      return arrayGet(rec2, iv);
    }
    case "un": {
      if (n.op === "not") {
        var v0 = await ev(n.v, frame);
        if (v0.t !== "Boolean") throw rtErr("'not' richiede un Boolean");
        return { t: "Boolean", v: !v0.v };
      }
      var v1 = await ev(n.v, frame);
      if (!isNum(v1)) throw rtErr("Operando non numerico per '" + n.op + "'");
      return { t: v1.t, v: n.op === "-" ? -v1.v : v1.v };
    }
    case "bin": {
      if ((n.op === "and" || n.op === "or")) {
        var l = await ev(n.l, frame);
        if (l.t !== "Boolean") throw rtErr("'" + n.op + "' richiede Boolean");
        if (n.op === "and" && !l.v) return { t: "Boolean", v: false };
        if (n.op === "or" && l.v) return { t: "Boolean", v: true };
        var r = await ev(n.r, frame);
        if (r.t !== "Boolean") throw rtErr("'" + n.op + "' richiede Boolean");
        return { t: "Boolean", v: r.v };
      }
      var a = await ev(n.l, frame);
      var b2 = await ev(n.r, frame);
      return binop(n.op, a, b2);
    }
    case "call": return callExpr(n, frame);
  }
  throw rtErr("Espressione non valida");
}

function binop(op, a, b) {
  if (op === "&") return { t: "String", v: fmt(a) + fmt(b) };
  if (["==", "!=", "<", "<=", ">", ">="].indexOf(op) >= 0) {
    var ok = false, res;
    if (isNum(a) && isNum(b)) { ok = true; res = cmp(op, a.v, b.v); }
    else if (a.t === "String" && b.t === "String") { ok = true; res = cmp(op, a.v, b.v); }
    else if (a.t === "Boolean" && b.t === "Boolean") { ok = true; res = cmp(op, a.v ? 1 : 0, b.v ? 1 : 0); }
    else if (a.t === "Char" && b.t === "Char") { ok = true; res = cmp(op, a.v, b.v); }
    if (!ok) throw rtErr("Confronto non valido tra " + a.t + " e " + b.t);
    return { t: "Boolean", v: res };
  }
  if (!isNum(a) || !isNum(b)) throw rtErr("Operando non numerico per '" + op + "' (" + a.t + " " + op + " " + b.t + ")");
  var bothInt = a.t === "Integer" && b.t === "Integer";
  switch (op) {
    case "+": return { t: bothInt ? "Integer" : "Real", v: a.v + b.v };
    case "-": return { t: bothInt ? "Integer" : "Real", v: a.v - b.v };
    case "*": return { t: bothInt ? "Integer" : "Real", v: a.v * b.v };
    case "/":
      if (b.v === 0) throw rtErr("Divisione per zero");
      if (bothInt) return { t: "Integer", v: Math.trunc(a.v / b.v) };
      return { t: "Real", v: a.v / b.v };
    case "%":
      if (a.t !== "Integer" || b.t !== "Integer") throw rtErr("'mod' richiede due Integer");
      if (b.v === 0) throw rtErr("Modulo per zero");
      return { t: "Integer", v: ((a.v % b.v) + b.v) % b.v };
    case "^": {
      var r = Math.pow(a.v, b.v);
      if (bothInt && b.v >= 0 && Number.isFinite(r)) return { t: "Integer", v: Math.round(r) };
      return { t: "Real", v: r };
    }
  }
  throw rtErr("Operatore non valido: " + op);
}
function cmp(op, a, b) {
  switch (op) { case "==": return a === b; case "!=": return a !== b; case "<": return a < b; case "<=": return a <= b; case ">": return a > b; case ">=": return a >= b; }
  return false;
}

function arrayGet(rec, iv) {
  if (iv.t !== "Integer") throw rtErr("L'indice di un array deve essere Integer");
  if (iv.v < 0 || iv.v >= rec.size) throw rtErr("Indice fuori dai limiti: " + iv.v + " (dimensione " + rec.size + ")");
  return deepCopy(rec.items[iv.v]);
}
function arraySet(rec, iv, val) {
  if (iv.t !== "Integer") throw rtErr("L'indice di un array deve essere Integer");
  if (iv.v < 0 || iv.v >= rec.size) throw rtErr("Indice fuori dai limiti: " + iv.v + " (dimensione " + rec.size + ")");
  rec.items[iv.v] = coerce(val, rec.type);
}

var TRUE_WORDS = ["true", "vero", "1", "si", "s\u00ec", "yes", "y", "vrai"];
var FALSE_WORDS = ["false", "falso", "0", "no", "n"];

function parseBoolWord(s) {
  var w = String(s).trim().toLowerCase();
  if (TRUE_WORDS.indexOf(w) >= 0) return true;
  if (FALSE_WORDS.indexOf(w) >= 0) return false;
  return null;
}

/* --- chiamate a funzioni builtin --- */
async function callExpr(n, frame) {
  var nm = n.name.toLowerCase();
  var fn = findFnByName(n.name);
  if (fn) {
    if (n.args.length !== (fn.params || []).length)
      throw rtErr(fn.name + " richiede " + (fn.params || []).length + " parametri, ricevuti " + n.args.length);
    var vals = [];
    for (var i = 0; i < n.args.length; i++) vals.push(await ev(n.args[i], frame));
    return callFn(fn, vals);
  }
  return callBuiltin(nm, n.args, frame);
}

async function callBuiltin(nm, argNodes, frame) {
  function arg(i) { return ev(argNodes[i], frame); }
  function need(k) {
    if (argNodes.length !== k) throw rtErr("La funzione richiede " + k + " argomento/i");
  }
  switch (nm) {
    case "size": {
      need(1);
      var nd = argNodes[0];
      if (nd.t !== "id") throw rtErr("Size richiede una variabile array");
      var rec = frame.vars[nd.name.toLowerCase()];
      if (!rec || !rec.arr) throw rtErr(nd.name + " non \u00e8 un array");
      return { t: "Integer", v: rec.size };
    }
    case "turtlemove": { need(1); var d = await arg(0); if (!isNum(d)) throw rtErr("TurtleMove richiede un numero"); showTurtleTab(); turtleMove(d.v); return { t: "Boolean", v: true }; }
    case "turtleturn": { need(1); var a = await arg(0); if (!isNum(a)) throw rtErr("TurtleTurn richiede un numero"); showTurtleTab(); turtleTurn(a.v); return { t: "Boolean", v: true }; }
    case "turtlegoto": { need(2); var x = await arg(0), y = await arg(1); if (!isNum(x) || !isNum(y)) throw rtErr("TurtleGoTo richiede due numeri"); showTurtleTab(); turtleGoTo(x.v, y.v); return { t: "Boolean", v: true }; }
    case "turtlepenup": case "turtlependown": TURTLE.pen = (nm === "turtlependown"); showTurtleTab(); return { t: "Boolean", v: true };
    case "turtlepencolor": { need(1); var c = await arg(0); if (c.t !== "String") throw rtErr("TurtlePenColor richiede una stringa"); TURTLE.color = c.v; showTurtleTab(); return { t: "Boolean", v: true }; }
    case "turtlehome": { TURTLE.x = 0; TURTLE.y = 0; TURTLE.ang = 0; showTurtleTab(); turtleDrawMark(); turtleHud(); return { t: "Boolean", v: true }; }
    case "turtleclear": { var ctx = turtleCtx(); if (ctx) ctx.clearRect(0, 0, TURTLE.W, TURTLE.H); showTurtleTab(); return { t: "Boolean", v: true }; }
    case "turtleshow": { TURTLE.visible = true; showTurtleTab(); turtleDrawMark(); return { t: "Boolean", v: true }; }
    case "turtlehide": { TURTLE.visible = false; showTurtleTab(); turtleDrawMark(); return { t: "Boolean", v: true }; }
  }

  function s1() { need(1); return arg(0); }
  switch (nm) {
    case "tointeger": {
      var v = await s1();
      if (v.t === "String") {
        var t = v.v.trim();
        if (!/^[+-]?\d+$/.test(t)) throw rtErr("'" + v.v + "' non \u00e8 un numero intero valido");
        return { t: "Integer", v: parseInt(t, 10) };
      }
      if (isNum(v)) return { t: "Integer", v: Math.trunc(v.v) };
      if (v.t === "Boolean") return { t: "Integer", v: v.v ? 1 : 0 };
      if (v.t === "Char") return { t: "Integer", v: v.v.charCodeAt(0) || 0 };
      throw rtErr("ToInteger non supporta " + v.t);
    }
    case "toreal": {
      var v2 = await s1();
      if (v2.t === "String") {
        var f = parseFloat(v2.v);
        if (isNaN(f)) throw rtErr("'" + v2.v + "' non \u00e8 un numero valido");
        return { t: "Real", v: f };
      }
      if (isNum(v2)) return { t: "Real", v: v2.v };
      throw rtErr("ToReal non supporta " + v2.t);
    }
    case "tostring": { var v3 = await s1(); return { t: "String", v: fmt(v3) }; }
    case "tochar": { var v4 = await s1(); if (v4.t !== "Integer") throw rtErr("ToChar richiede un Integer"); return { t: "Char", v: String.fromCharCode(v4.v) }; }
    case "toascii": { var v5 = await s1(); if (v5.t !== "String" && v5.t !== "Char") throw rtErr("ToASCII richiede un carattere/stringa"); return { t: "Integer", v: (v5.v.length ? v5.v.charCodeAt(0) : 0) }; }
    case "length": { var v6 = await s1(); if (v6.t !== "String") throw rtErr("Length richiede una String"); return { t: "Integer", v: v6.v.length }; }
    case "char": {
      need(2);
      var s = await arg(0), ix = await arg(1);
      if (s.t !== "String") throw rtErr("Char richiede una String");
      if (ix.t !== "Integer") throw rtErr("Char richiede un indice Integer");
      if (ix.v < 0 || ix.v >= s.v.length) throw rtErr("Indice fuori dai limiti: " + ix.v + " (lunghezza " + s.v.length + ")");
      return { t: "Char", v: s.v[ix.v] };
    }
    case "abs": { var v7 = await s1(); if (!isNum(v7)) throw rtErr("Abs richiede un numero"); return { t: v7.t, v: Math.abs(v7.v) }; }
    case "ceiling": { var v8 = await s1(); if (!isNum(v8)) throw rtErr("Ceiling richiede un numero"); return { t: "Integer", v: Math.ceil(v8.v) }; }
    case "floor": { var v9 = await s1(); if (!isNum(v9)) throw rtErr("Floor richiede un numero"); return { t: "Integer", v: Math.floor(v9.v) }; }
    case "round": { var v10 = await s1(); if (!isNum(v10)) throw rtErr("Round richiede un numero"); return { t: "Integer", v: Math.round(v10.v) }; }
    case "sqrt": { var v11 = await s1(); if (!isNum(v11) || v11.v < 0) throw rtErr("Sqrt richiede un numero >= 0"); return { t: "Real", v: Math.sqrt(v11.v) }; }
    case "sin": { var v12 = await s1(); if (!isNum(v12)) throw rtErr("Sin richiede un numero"); return { t: "Real", v: Math.sin(v12.v) }; }
    case "cos": { var v13 = await s1(); if (!isNum(v13)) throw rtErr("Cos richiede un numero"); return { t: "Real", v: Math.cos(v13.v) }; }
    case "tan": { var v14 = await s1(); if (!isNum(v14)) throw rtErr("Tan richiede un numero"); return { t: "Real", v: Math.tan(v14.v) }; }
    case "log": { var v15 = await s1(); if (!isNum(v15) || v15.v <= 0) throw rtErr("Log richiede un numero > 0"); return { t: "Real", v: Math.log(v15.v) }; }
    case "power": {
      need(2);
      var a2 = await arg(0), b3 = await arg(1);
      if (!isNum(a2) || !isNum(b3)) throw rtErr("Power richiede due numeri");
      var rr = Math.pow(a2.v, b3.v);
      if (a2.t === "Integer" && b3.t === "Integer" && b3.v >= 0) return { t: "Integer", v: Math.round(rr) };
      return { t: "Real", v: rr };
    }
    case "random": { var v16 = await s1(); if (v16.t !== "Integer" || v16.v < 1) throw rtErr("Random richiede un Integer > 0"); return { t: "Integer", v: Math.floor(Math.random() * v16.v) }; }
    case "min": { need(2); var a3 = await arg(0), b4 = await arg(1); if (!isNum(a3) || !isNum(b4)) throw rtErr("Min richiede due numeri"); return { t: (a3.t === "Integer" && b4.t === "Integer") ? "Integer" : "Real", v: Math.min(a3.v, b4.v) }; }
    case "max": { need(2); var a4 = await arg(0), b5 = await arg(1); if (!isNum(a4) || !isNum(b5)) throw rtErr("Max richiede due numeri"); return { t: (a4.t === "Integer" && b5.t === "Integer") ? "Integer" : "Real", v: Math.max(a4.v, b5.v) }; }
  }
  throw rtErr("Funzione non definita: " + nm);
}

async function callFn(fn, argVals) {
  if (RT.frames.length > 400) throw rtErr("Ricorsione troppo profonda (limite 400 chiamate)");
  var frame = makeFrame(fn);
  (fn.params || []).forEach(function (p, i) {
    frame.vars[p.name.toLowerCase()].value = coerce(argVals[i], p.type);
  });
  RT.frames.push(frame);
  RT.updateWatch();
  var ret = defaultVal(fn.ret || "Integer");
  try {
    await execChain(fn.body, frame);
  } catch (e) {
    if (e && e.__ret) { ret = e.value; }
    else { RT.frames.pop(); RT.updateWatch(); throw e; }
  }
  RT.frames.pop();
  RT.updateWatch();
  return ret;
}

async function execChain(arr, frame) {
  for (var i = 0; i < arr.length; i++) {
    await RT.gate(arr[i]);
    await execBlock(arr[i], frame);
  }
}

async function execBlock(b, frame) {
  switch (b.type) {
    case "declare": case "comment": return;
    case "assign": {
      var val = await ev(parse(b.expr), frame);
      setTarget(frame, b, val);
      return;
    }
    case "input": {
      var rec = targetRec(frame, b);
      var typeName = rec.arr ? rec.type : rec.type;
      var dispName = rec.name + (b.index ? "[" + b.index + "]" : "");
      var ans = await RT.askInput(b, rec.type, dispName);
      if (ans === null) throw { stop: true };
      var v2 = coerceInput(ans, rec.type);
      if (rec.arr) arraySet(rec, (await ev(parse(b.index), frame)), v2);
      else rec.value = v2;
      RT.outLine("> " + fmt(v2) + "\n", "in");
      return;
    }
    case "output": {
      var o = await ev(parse(b.expr), frame);
      RT.outLine(fmt(o) + (b.nl !== false ? "\n" : ""));
      return;
    }
    case "if": {
      var c = await ev(parse(b.cond), frame);
      if (c.t !== "Boolean") throw rtErr("La condizione di If deve essere Boolean (ricevuto " + c.t + ")");
      await execChain(c.v ? b.then : b.else, frame);
      return;
    }
    case "while": {
      for (;;) {
        var w = await ev(parse(b.cond), frame);
        if (w.t !== "Boolean") throw rtErr("La condizione di While deve essere Boolean");
        if (!w.v) break;
        await execChain(b.body, frame);
        await RT.gate(b);
      }
      return;
    }
    case "for": {
      var rec2 = frame.vars[(b.var || "").toLowerCase()];
      if (!rec2) throw rtErr("Variabile non dichiarata: " + b.var);
      if (rec2.arr || rec2.type !== "Integer") throw rtErr("La variabile del For deve essere Integer");
      var from = await ev(parse(b.from), frame);
      var step = await ev(parse(b.step || "1"), frame);
      if (!isNum(from) || !isNum(step)) throw rtErr("For: inizio e passo devono essere numerici");
      if (step.v === 0) throw rtErr("For: il passo non pu\u00f2 essere 0");
      var dirUp = b.dir !== "down";
      if ((dirUp && step.v < 0) || (!dirUp && step.v > 0)) step = { t: step.t, v: -step.v };
      rec2.value = { t: "Integer", v: Math.trunc(from.v) };
      for (;;) {
        var lim = await ev(parse(b.to), frame);
        if (!isNum(lim)) throw rtErr("For: il limite deve essere numerico");
        if (dirUp && rec2.value.v > lim.v) break;
        if (!dirUp && rec2.value.v < lim.v) break;
        await execChain(b.body, frame);
        await RT.gate(b);
        rec2.value = { t: "Integer", v: rec2.value.v + Math.trunc(step.v) };
      }
      return;
    }
    case "do": {
      do {
        await execChain(b.body, frame);
        var d = await ev(parse(b.cond), frame);
        if (d.t !== "Boolean") throw rtErr("La condizione di Do deve essere Boolean");
        await RT.gate(b);
      } while (d.v);
      return;
    }
    case "call": {
      var vals = [];
      for (var i = 0; i < (b.args || []).length; i++) vals.push(await ev(parse(b.args[i]), frame));
      var fn = findFnByName(b.fn);
      if (fn) {
        if ((b.args || []).length !== (fn.params || []).length)
          throw rtErr(fn.name + " richiede " + (fn.params || []).length + " parametri");
        var res = await callFn(fn, vals);
        if (fn.ret) RT.lastCallResult = res;
      } else {
        // funzione predefinita (turtle, ecc.) richiamata come statement
        await callBuiltin(b.fn.toLowerCase(), (b.args || []).map(function (a) { return parse(a); }), frame);
      }
      return;
    }
    case "return": {
      var rv = b.expr ? await ev(parse(b.expr), frame) : defaultVal(frame.fn.ret || "Integer");
      var e = { __ret: true, value: rv };
      throw e;
    }
  }
}

function targetRec(frame, b) {
  var rec = frame.vars[(b.var || "").toLowerCase()];
  if (!rec) throw rtErr("Variabile non dichiarata: " + b.var);
  if (b.index && !rec.arr) throw rtErr(rec.name + " non \u00e8 un array");
  if (rec.arr && !b.index) throw rtErr("Serve un indice per l'array " + rec.name);
  return rec;
}
function setTarget(frame, b, val) {
  var rec = targetRec(frame, b);
  if (rec.arr) {
    var iv = evSync(parse(b.index), frame);
    arraySet(rec, iv, val);
  } else {
    rec.value = coerce(val, rec.type);
  }
}
function evSync(n, frame) {
  if (n.t === "num") return { t: n.int ? "Integer" : "Real", v: +n.raw };
  if (n.t === "id") {
    var r = frame.vars[n.name.toLowerCase()];
    if (!r) throw rtErr("Variabile non dichiarata: " + n.name);
    if (r.arr) throw rtErr("Serve un indice per l'array " + r.name);
    return r.value;
  }
  if (n.t === "bin") return binop(n.op, evSync(n.l, frame), evSync(n.r, frame));
  if (n.t === "un") {
    var v = evSync(n.v, frame);
    if (n.op === "-") { if (!isNum(v)) throw rtErr("Operando non numerico"); return { t: v.t, v: -v.v }; }
    if (n.op === "not") { if (v.t !== "Boolean") throw rtErr("'not' richiede Boolean"); return { t: "Boolean", v: !v.v }; }
    return v;
  }
  throw rtErr("Indice array troppo complesso: usa una variabile");
}
function coerceInput(ans, type) {
  switch (type) {
    case "Integer":
      if (!/^[+-]?\d+$/.test(ans.trim())) throw rtErr("'" + ans + "' non \u00e8 un numero intero valido");
      return { t: "Integer", v: parseInt(ans.trim(), 10) };
    case "Real": {
      var f = parseFloat(ans);
      if (isNaN(f)) throw rtErr("'" + ans + "' non \u00e8 un numero valido");
      return { t: "Real", v: f };
    }
    case "Boolean": {
      var b = parseBoolWord(ans);
      if (b === null) throw rtErr("'" + ans + "' non \u00e8 un Boolean (usa true/false)");
      return { t: "Boolean", v: b };
    }
    case "Char": return { t: "Char", v: ans.length ? ans[0] : "" };
    default: return { t: "String", v: ans };
  }
}
