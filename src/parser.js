
/* ------------------------------------------------- espressioni: tokenizer */
var PUNCT2 = ["<=", ">=", "==", "!=", "<>"];
function perr(msg) { var e = new Error(msg); e.parse = true; return e; }

function tokenize(src) {
  var toks = [], i = 0, n = src.length;
  while (i < n) {
    var c = src[i];
    if (c === " " || c === "\t" || c === "\n" || c === "\r") { i++; continue; }
    if (/[0-9]/.test(c) || (c === "." && /[0-9]/.test(src[i + 1] || ""))) {
      var j = i, dot = false;
      while (j < n && /[0-9]/.test(src[j])) j++;
      if (src[j] === ".") { dot = true; j++; while (j < n && /[0-9]/.test(src[j])) j++; }
      toks.push({ k: "num", raw: src.slice(i, j), int: !dot }); i = j; continue;
    }
    if (c === '"') {
      var j2 = i + 1, s = "";
      while (j2 < n && src[j2] !== '"') {
        if (src[j2] === "\\" && j2 + 1 < n) { s += src[j2 + 1]; j2 += 2; }
        else if (src[j2] === '"' && src[j2 + 1] === '"') { s += '"'; j2 += 2; }
        else { s += src[j2]; j2++; }
      }
      if (j2 >= n) throw perr("Stringa non terminata (manca \" finale)");
      toks.push({ k: "str", v: s }); i = j2 + 1; continue;
    }
    if (/[A-Za-z_]/.test(c)) {
      var j3 = i;
      while (j3 < n && /[A-Za-z0-9_]/.test(src[j3])) j3++;
      var w = src.slice(i, j3), lw = w.toLowerCase();
      if (lw === "true" || lw === "false") toks.push({ k: "bool", v: lw === "true" });
      else if (lw === "and" || lw === "or" || lw === "not") toks.push({ k: "op", v: lw });
      else if (lw === "mod") toks.push({ k: "op", v: "%" });
      else toks.push({ k: "id", v: w });
      i = j3; continue;
    }
    var two = src.substr(i, 2);
    if (PUNCT2.indexOf(two) >= 0) {
      toks.push({ k: "op", v: two === "<>" ? "!=" : (two === "=" ? "==" : two) });
      i += 2; continue;
    }
    if ("+-*/%^()[],&<>=".indexOf(c) >= 0) {
      toks.push({ k: "op", v: c === "=" ? "==" : c });
      i++; continue;
    }
    throw perr("Carattere non valido: '" + c + "'");
  }
  toks.push({ k: "end" });
  return toks;
}

var PREC = { "or": 1, "and": 2, "==": 3, "!=": 3, "<": 4, "<=": 4, ">": 4, ">=": 4, "&": 5, "+": 6, "-": 6, "*": 7, "/": 7, "%": 7, "^": 8 };

function parse(src) {
  src = (src || "").trim();
  if (!src) throw perr("Espressione vuota");
  var toks = tokenize(src), p = 0;
  function peek() { return toks[p]; }
  function next() { return toks[p++]; }
  function expect(v) {
    var t = next();
    if (t.k !== "op" || t.v !== v) throw perr("Atteso '" + v + "'");
  }
  function atom() {
    var t = next();
    if (t.k === "end") throw perr("Espressione incompleta");
    if (t.k === "num") return { t: "num", raw: t.raw, int: t.int };
    if (t.k === "str") return { t: "str", v: t.v };
    if (t.k === "bool") return { t: "bool", v: t.v };
    if (t.k === "id") {
      if (peek().k === "op" && peek().v === "(") {
        next();
        var args = [];
        if (!(peek().k === "op" && peek().v === ")")) {
          for (;;) {
            args.push(expr(1));
            if (peek().k === "op" && peek().v === ",") { next(); continue; }
            break;
          }
        }
        expect(")");
        return { t: "call", name: t.v, args: args };
      }
      if (peek().k === "op" && peek().v === "[") {
        next();
        var idx = expr(1);
        expect("]");
        return { t: "idx", name: t.v, idx: idx };
      }
      return { t: "id", name: t.v };
    }
    if (t.k === "op" && t.v === "(") { var e = expr(1); expect(")"); return e; }
    if (t.k === "op" && (t.v === "-" || t.v === "+")) return { t: "un", op: t.v, v: atom() };
    if (t.k === "op" && t.v === "not") return { t: "un", op: "not", v: expr(3) };
    throw perr("Token inatteso: '" + (t.v !== undefined ? t.v : "") + "'");
  }
  function expr(minP) {
    var l = atom();
    for (;;) {
      var t = peek();
      if (t.k !== "op") break;
      var pr = PREC[t.v];
      if (!pr || pr < minP) break;
      next();
      var r = expr(t.v === "^" ? pr : pr + 1);
      l = { t: "bin", op: t.v, l: l, r: r };
    }
    return l;
  }
  var e = expr(1);
  if (peek().k !== "end") throw perr("C'è del testo in più dopo l'espressione");
  return e;
}
