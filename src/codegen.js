/* ============================================================= CODEGEN */
function typeOfName(name, fn) {
  var nm = name.toLowerCase();
  var found = null;
  (fn.params || []).forEach(function (p) { if (p.name.toLowerCase() === nm) found = p.type; });
  if (found) return found;
  walkChain(fn.body, function (b) {
    if (b.type === "declare") b.vars.forEach(function (v) { if (v.name.toLowerCase() === nm) found = v.type; });
  });
  return found;
}

var BUILTIN_RET = {
  tointeger: "Integer", toreal: "Real", tostring: "String", tochar: "Char",
  toascii: "Integer", length: "Integer", size: "Integer", char: "Char",
  ceiling: "Integer", floor: "Integer", round: "Integer", random: "Integer",
  sqrt: "Real", sin: "Real", cos: "Real", tan: "Real", log: "Real",
  turtlemove: "Boolean", turtleturn: "Boolean", turtlegoto: "Boolean",
  turtlepenup: "Boolean", turtlependown: "Boolean", turtlepencolor: "Boolean",
  turtlehome: "Boolean", turtleclear: "Boolean", turtleshow: "Boolean", turtlehide: "Boolean"
};

function inferType(n, fn) {
  switch (n.t) {
    case "num": return n.int ? "Integer" : "Real";
    case "str": return "String";
    case "bool": return "Boolean";
    case "id": { var t = typeOfName(n.name, fn); return t || "Unknown"; }
    case "idx": { var t2 = typeOfName(n.name, fn); return t2 || "Unknown"; }
    case "un": {
      if (n.op === "not") return "Boolean";
      var ut = inferType(n.v, fn);
      return ut === "Real" ? "Real" : "Integer";
    }
    case "call": {
      var f = findFnByName(n.name);
      if (f) return f.ret || "Unknown";
      var nm = n.name.toLowerCase();
      if (BUILTIN_RET[nm]) return BUILTIN_RET[nm];
      if (nm === "abs") return inferType(n.args[0], fn) === "Real" ? "Real" : "Integer";
      if (nm === "power") return (inferType(n.args[0], fn) === "Integer" && inferType(n.args[1], fn) === "Integer") ? "Integer" : "Real";
      if (nm === "min" || nm === "max") return (inferType(n.args[0], fn) === "Integer" && inferType(n.args[1], fn) === "Integer") ? "Integer" : "Real";
      return "Unknown";
    }
    case "bin": {
      if (n.op === "&") return "String";
      if (["==", "!=", "<", "<=", ">", ">="].indexOf(n.op) >= 0) return "Boolean";
      var lt = inferType(n.l, fn), rt2 = inferType(n.r, fn);
      if (lt === "String" || rt2 === "String") return "String";
      if (lt === "Real" || rt2 === "Real") return "Real";
      return "Integer";
    }
  }
  return "Unknown";
}

function q(s) { return '"' + String(s).replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n") + '"'; }

function emitStrC(n, fn) {
  var t = inferType(n, fn);
  var e = emit(n, "c", fn);
  if (t === "String" || t === "Unknown") return e;
  if (t === "Integer") return "str_int(" + e + ")";
  if (t === "Real") return "str_real(" + e + ")";
  if (t === "Boolean") return "str_bool(" + e + ")";
  if (t === "Char") return "str_char(" + e + ")";
  return e;
}

function emit(n, lang, fn) {
  switch (n.t) {
    case "num": return n.raw;
    case "str": return q(n.v);
    case "bool": return lang === "python" ? (n.v ? "True" : "False") : String(n.v);
    case "id": return n.name;
    case "idx": return n.name + "[" + emit(n.idx, lang, fn) + "]";
    case "un": {
      if (n.op === "not") return lang === "python" ? "not (" + emit(n.v, lang, fn) + ")" : "!(" + emit(n.v, lang, fn) + ")";
      return n.op + "(" + emit(n.v, lang, fn) + ")";
    }
    case "call": return emitCall(n, lang, fn);
    case "bin": {
      var l = emit(n.l, lang, fn), r = emit(n.r, lang, fn);
      switch (n.op) {
        case "==": return "(" + l + " == " + r + ")";
        case "!=": return "(" + l + " != " + r + ")";
        case "<": case "<=": case ">": case ">=": return "(" + l + " " + n.op + " " + r + ")";
        case "+": case "-": case "*": return "(" + l + " " + n.op + " " + r + ")";
        case "%": return "(" + l + " % " + r + ")";
        case "&":
          if (lang === "c") return "concat(" + emitStrC(n.l, fn) + ", " + emitStrC(n.r, fn) + ")";
          return "(_fmt(" + l + ") + _fmt(" + r + "))";
        case "/":
          if (inferType(n.l, fn) === "Integer" && inferType(n.r, fn) === "Integer") {
            if (lang === "c" || lang === "java") return "(" + l + " / " + r + ")";
            if (lang === "python") return "_tdiv(" + l + ", " + r + ")";
            return "Math.trunc(" + l + " / " + r + ")";
          }
          return "(" + l + " / " + r + ")";
        case "^":
          if (lang === "python") return "(" + l + " ** " + r + ")";
          if (lang === "js") return "Math.pow(" + l + ", " + r + ")";
          if (inferType(n, fn) === "Integer")
            return (lang === "c" ? "(int)pow(" + l + ", " + r + ")" : "(int)Math.pow(" + l + ", " + r + ")");
          return (lang === "c" ? "pow(" + l + ", " + r + ")" : "Math.pow(" + l + ", " + r + ")");
      }
    }
  }
  return "???";
}

function emitCall(n, lang, fn) {
  var nm = n.name.toLowerCase();
  var a = n.args.map(function (x) { return emit(x, lang, fn); });
  var uf = findFnByName(n.name);
  if (uf) return n.name + "(" + a.join(", ") + ")";
  function A(i) { return a[i]; }
  function AN(i) { return n.args[i]; }
  switch (nm) {
    case "tointeger":
      return lang === "python" ? "int(" + A(0) + ")" : lang === "js" ? "Math.trunc(" + A(0) + ")" : "(int)(" + A(0) + ")";
    case "toreal":
      return lang === "python" ? "float(" + A(0) + ")" : lang === "js" ? "Number(" + A(0) + ")" : "(double)(" + A(0) + ")";
    case "tostring":
      return lang === "c" ? emitStrC(AN(0), fn) : "_fmt(" + A(0) + ")";
    case "tochar":
      return lang === "python" ? "chr(" + A(0) + ")" : lang === "js" ? "String.fromCharCode(" + A(0) + ")" : "(char)(" + A(0) + ")";
    case "toascii":
      return lang === "python" ? "ord(" + A(0) + ")" : lang === "js" ? "(" + A(0) + ").charCodeAt(0)" : "(int)(" + A(0) + ")";
    case "length":
      return lang === "python" ? "len(" + A(0) + ")" : lang === "js" ? "(" + A(0) + ").length" : "strlen(" + A(0) + ")";
    case "size":
      if (lang === "c") { var nmv = AN(0).name; return "(sizeof(" + nmv + ")/sizeof(" + nmv + "[0]))"; }
      return lang === "python" ? "len(" + A(0) + ")" : "(" + A(0) + ").length";
    case "char":
      return lang === "python" ? "(" + A(0) + "[" + A(1) + "])" : lang === "js" ? "(" + A(0) + "[" + A(1) + "])" : lang === "c" ? "(" + A(0) + "[" + A(1) + "])" : "(" + A(0) + ").charAt(" + A(1) + ")";
    case "abs":
      return lang === "python" ? "abs(" + A(0) + ")" : lang === "js" ? "Math.abs(" + A(0) + ")" : (inferType(AN(0), fn) === "Real" ? "fabs(" + A(0) + ")" : "abs(" + A(0) + ")");
    case "ceiling": return lang === "python" ? "math.ceil(" + A(0) + ")" : lang === "js" ? "Math.ceil(" + A(0) + ")" : "ceil(" + A(0) + ")";
    case "floor": return lang === "python" ? "math.floor(" + A(0) + ")" : lang === "js" ? "Math.floor(" + A(0) + ")" : "floor(" + A(0) + ")";
    case "round": return lang === "python" ? "round(" + A(0) + ")" : lang === "js" ? "Math.round(" + A(0) + ")" : "round(" + A(0) + ")";
    case "sqrt": return lang === "python" ? "math.sqrt(" + A(0) + ")" : lang === "js" ? "Math.sqrt(" + A(0) + ")" : "sqrt(" + A(0) + ")";
    case "sin": return lang === "python" ? "math.sin(" + A(0) + ")" : lang === "js" ? "Math.sin(" + A(0) + ")" : "sin(" + A(0) + ")";
    case "cos": return lang === "python" ? "math.cos(" + A(0) + ")" : lang === "js" ? "Math.cos(" + A(0) + ")" : "cos(" + A(0) + ")";
    case "tan": return lang === "python" ? "math.tan(" + A(0) + ")" : lang === "js" ? "Math.tan(" + A(0) + ")" : "tan(" + A(0) + ")";
    case "log": return lang === "python" ? "math.log(" + A(0) + ")" : lang === "js" ? "Math.log(" + A(0) + ")" : "log(" + A(0) + ")";
    case "power": return emit({ t: "bin", op: "^", l: n.args[0], r: n.args[1] }, lang, fn);
    case "random":
      return lang === "python" ? "random.randrange(" + A(0) + ")" : lang === "js" ? "Math.floor(Math.random()*" + A(0) + ")" : lang === "c" ? "(rand()%(" + A(0) + "))" : "(int)(Math.random()*" + A(0) + ")";
    case "min": return lang === "c" ? "_min(" + A(0) + ", " + A(1) + ")" : "min(" + A(0) + ", " + A(1) + ")";
    case "max": return lang === "c" ? "_max(" + A(0) + ", " + A(1) + ")" : "max(" + A(0) + ", " + A(1) + ")";
  }
  // funzioni turtle: fuori dall'interprete non hanno effetto
  return n.name + "(" + a.join(", ") + ")";
}

var CTYPE = { Integer: "int", Real: "double", String: "char*", Boolean: "bool", Char: "char" };
var JTYPE = { Integer: "int", Real: "double", String: "String", Boolean: "boolean", Char: "char" };
var PYDEF = { Integer: "0", Real: "0.0", String: "''", Boolean: "False", Char: "' '" };
var JSDEF = { Integer: "0", Real: "0.0", String: "''", Boolean: "false", Char: "' '" };

function genChain(arr, lang, fn, ind, opts) {
  var out = [];
  var I = lang === "python" ? "    " : "  ";
  var pad = new Array(ind + 1).join(I);
  opts = opts || {};
  arr.forEach(function (b) {
    switch (b.type) {
      case "declare": break; // gestito in testa alla funzione
      case "comment":
        out.push(pad + (lang === "python" ? "# " : "// ") + b.text);
        break;
      case "assign": {
        var dst = b.var + (b.index ? "[" + emit(parse(b.index), lang, fn) + "]" : "");
        var ex = emit(parse(b.expr), lang, fn);
        var t = typeOfName(b.var, fn);
        if (lang === "c" && t === "String") {
          var sexp = parse(b.expr);
          var sval = inferType(sexp, fn) === "Char" ? "ctos(" + emit(sexp, "c", fn) + ")" : emit(sexp, "c", fn);
          out.push(pad + "strcpy(" + dst + ", " + sval + ");");
        }
        else if (lang === "python") out.push(pad + dst + " = " + ex);
        else out.push(pad + dst + " = " + ex + ";");
        break;
      }
      case "input": {
        var t2 = typeOfName(b.var, fn);
        var dst2 = b.var + (b.index ? "[" + emit(parse(b.index), lang, fn) + "]" : "");
        var pr = b.prompt ? q(b.prompt) : null;
        var ref = b.index ? dst2 : ("&" + dst2);
        if (lang === "python") {
          var p = pr ? "input(" + pr + ")" : "input()";
          if (t2 === "Integer") out.push(pad + dst2 + " = int(" + p + ")");
          else if (t2 === "Real") out.push(pad + dst2 + " = float(" + p + ")");
          else if (t2 === "Boolean") out.push(pad + dst2 + " = _pb(" + p + ")");
          else if (t2 === "Char") out.push(pad + dst2 + " = (" + p + " or ' ')[0]");
          else out.push(pad + dst2 + " = " + p);
        } else if (lang === "js") {
          var p2 = pr ? "prompt(" + pr + ")" : "prompt('')";
          if (t2 === "Integer") out.push(pad + dst2 + " = parseInt(" + p2 + ", 10)");
          else if (t2 === "Real") out.push(pad + dst2 + " = parseFloat(" + p2 + ")");
          else if (t2 === "Boolean") out.push(pad + dst2 + " = _pb(" + p2 + ")");
          else if (t2 === "Char") out.push(pad + dst2 + " = (" + p2 + " || ' ')[0]");
          else out.push(pad + dst2 + " = " + p2);
        } else if (lang === "c") {
          if (pr) out.push(pad + "printf(" + pr + ");");
          if (t2 === "Integer") out.push(pad + 'scanf("%d", ' + ref + ");");
          else if (t2 === "Real") out.push(pad + 'scanf("%lf", ' + ref + ");");
          else if (t2 === "String") out.push(pad + 'scanf("%255s", ' + dst2 + ");");
          else if (t2 === "Boolean") out.push(pad + dst2 + " = read_bool();");
          else if (t2 === "Char") out.push(pad + 'scanf(" %c", ' + ref + ");");
        } else { // java
          if (pr) out.push(pad + "System.out.print(" + pr + ");");
          if (t2 === "Integer") out.push(pad + dst2 + " = _sc.nextInt();");
          else if (t2 === "Real") out.push(pad + dst2 + " = _sc.nextDouble();");
          else if (t2 === "String") out.push(pad + dst2 + " = _sc.next();");
          else if (t2 === "Boolean") out.push(pad + dst2 + " = _jb(_sc.next());");
          else if (t2 === "Char") out.push(pad + dst2 + " = _jc(_sc.next());");
        }
        break;
      }
      case "output": {
        var ex2 = parse(b.expr);
        var e2 = emit(ex2, lang, fn);
        var nl = b.nl !== false;
        if (lang === "python") out.push(pad + "print(_fmt(" + e2 + ")" + (nl ? "" : ', end=""') + ")");
        else if (lang === "js") out.push(pad + (nl ? "console.log(_fmt(" : "process.stdout.write(_fmt(") + e2 + "));");
        else if (lang === "c") {
          var t3 = inferType(ex2, fn) || "Real";
          var fmtc = { Integer: "%d\\n", Real: "%g\\n", String: "%s\\n", Boolean: "%s\\n", Char: "%c\\n", Unknown: "%g\\n" }[t3];
          if (!nl) fmtc = fmtc.replace("\\n", "");
          if (t3 === "Integer") out.push(pad + 'printf("' + fmtc + '", (int)(' + e2 + "));");
          else if (t3 === "Real" || t3 === "Unknown") out.push(pad + 'printf("' + fmtc + '", (double)(' + e2 + "));");
          else if (t3 === "Boolean") out.push(pad + 'printf("' + fmtc + '", (' + e2 + ') ? "true" : "false");');
          else out.push(pad + 'printf("' + fmtc + '", ' + e2 + ");");
        } else out.push(pad + "System.out." + (nl ? "println" : "print") + "(_fmt(" + e2 + "));");
        break;
      }
      case "if": {
        var c = emit(parse(b.cond), lang, fn);
        if (lang === "python") {
          out.push(pad + "if " + c + ":");
          out.push.apply(out, genChain(b.then, lang, fn, ind + 1));
          if (b.else.length) {
            out.push(pad + "else:");
            out.push.apply(out, genChain(b.else, lang, fn, ind + 1));
          }
        } else {
          out.push(pad + "if (" + c + ") {");
          out.push.apply(out, genChain(b.then, lang, fn, ind + 1));
          if (b.else.length) {
            out.push(pad + "} else {");
            out.push.apply(out, genChain(b.else, lang, fn, ind + 1));
          }
          out.push(pad + "}");
        }
        break;
      }
      case "while": {
        var c2 = emit(parse(b.cond), lang, fn);
        if (lang === "python") {
          out.push(pad + "while " + c2 + ":");
          out.push.apply(out, genChain(b.body, lang, fn, ind + 1));
        } else {
          out.push(pad + "while (" + c2 + ") {");
          out.push.apply(out, genChain(b.body, lang, fn, ind + 1));
          out.push(pad + "}");
        }
        break;
      }
      case "for": {
        var fE = emit(parse(b.from), lang, fn), tE = emit(parse(b.to), lang, fn);
        var sE = emit(parse(b.step || "1"), lang, fn);
        var down = b.dir === "down";
        if (lang === "python") {
          out.push(pad + "for " + b.var + " in range(" + fE + ", " + tE + (down ? " - 1" : " + 1") + ", " + (down ? "-" + sE : sE) + "):");
          out.push.apply(out, genChain(b.body, lang, fn, ind + 1));
        } else {
          out.push(pad + "for (" + b.var + " = " + fE + "; " + b.var + (down ? " >= " : " <= ") + tE + "; " + b.var + (down ? " -= " : " += ") + sE + ") {");
          out.push.apply(out, genChain(b.body, lang, fn, ind + 1));
          out.push(pad + "}");
        }
        break;
      }
      case "do": {
        if (lang === "python") {
          out.push(pad + "while True:");
          out.push.apply(out, genChain(b.body, lang, fn, ind + 1));
          var cd = emit(parse(b.cond), lang, fn);
          out.push(new Array(ind + 2).join("    ") + "if not (" + cd + "):");
          out.push(new Array(ind + 3).join("    ") + "break");
        } else {
          out.push(pad + "do {");
          out.push.apply(out, genChain(b.body, lang, fn, ind + 1));
          out.push(pad + "} while (" + emit(parse(b.cond), lang, fn) + ");");
        }
        break;
      }
      case "call": {
        var uf = findFnByName(b.fn);
        var args = (b.args || []).map(function (x) { return emit(parse(x), lang, fn); }).join(", ");
        var nm2 = b.fn;
        if (lang === "java" && uf && uf.name === "Main") nm2 = "Main_";
        if (lang === "c" && uf && uf.name === "Main") nm2 = "main";
        out.push(pad + nm2 + "(" + args + ")" + (lang === "python" ? "" : ";"));
        break;
      }
      case "return": {
        if (b.expr) {
          var rv = emit(parse(b.expr), lang, fn);
          if (lang === "python") out.push(pad + "return " + rv);
          else if (lang === "c" && opts.isMain) out.push(pad + "return 0;");
          else out.push(pad + "return " + rv + ";");
        } else {
          if (lang === "python") out.push(pad + "return");
          else if (lang === "c" && opts.isMain) out.push(pad + "return 0;");
          else out.push(pad + "return;");
        }
        break;
      }
    }
  });
  return out;
}

function declaresOf(fn) {
  var out = [];
  walkChain(fn.body, function (b) {
    if (b.type === "declare") b.vars.forEach(function (v) { out.push(v); });
  });
  return out;
}

function genFunction(lang, fn) {
  var lines = [];
  var vars = declaresOf(fn);
  var I = lang === "python" ? "    " : "  ";
  if (lang === "python") {
    lines.push("def " + (fn.name === "Main" ? "main" : fn.name) + "(" + (fn.params || []).map(function (p) { return p.name; }).join(", ") + "):");
    vars.forEach(function (v) {
      if (v.arr) lines.push(I + v.name + " = [" + PYDEF[v.type].replace(/'/g, '"') + "] * " + emit(parse(v.size), "python", fn));
      else lines.push(I + v.name + " = " + PYDEF[v.type]);
    });
    if (!vars.length) lines.push(I + "pass");
    lines.push.apply(lines, genChain(fn.body, "python", fn, 1));
  } else if (lang === "js") {
    lines.push("function " + (fn.name === "Main" ? "main" : fn.name) + "(" + (fn.params || []).map(function (p) { return p.name; }).join(", ") + ") {");
    var names = (fn.params || []).map(function (p) { return p.name; });
    vars.forEach(function (v) { if (names.indexOf(v.name) < 0) names.push(v.name); });
    vars.forEach(function (v) {
      if (v.arr) lines.push(I + "var " + v.name + " = new Array(" + emit(parse(v.size), "js", fn) + ").fill(" + JSDEF[v.type] + ");");
    });
    if (names.length) lines.push(I + "var " + names.filter(function (nm3, ix) { return vars.some(function (v) { return v.name === nm3; }); }).join(", ") + ";");
    lines.push.apply(lines, genChain(fn.body, "js", fn, 1));
    lines.push("}");
  } else if (lang === "c") {
    var rt = fn.name === "Main" ? "int" : (fn.ret ? CTYPE[fn.ret] : "void");
    var ps = (fn.params || []).map(function (p) { return CTYPE[p.type] + " " + p.name; }).join(", ");
    var nm = fn.name === "Main" ? "main" : fn.name;
    lines.push(rt + " " + nm + "(" + (ps || (fn.name === "Main" ? "void" : "void")) + ") {");
    var byType = {};
    vars.forEach(function (v) { (byType[v.type] = byType[v.type] || []).push(v); });
    Object.keys(byType).forEach(function (t) {
      var scal = byType[t].filter(function (v) { return !v.arr; });
      var arrs = byType[t].filter(function (v) { return v.arr; });
      if (scal.length) lines.push(I + CTYPE[t] + " " + scal.map(function (v) { return v.name + (t === "String" ? "[256]" : ""); }).join(", ") + ";");
      arrs.forEach(function (v) {
        var size = constEval(v.size) || 100;
        if (t === "String") lines.push(I + "char " + v.name + "[" + size + "][256];");
        else lines.push(I + CTYPE[t] + " " + v.name + "[" + size + "];");
      });
    });
    lines.push.apply(lines, genChain(fn.body, "c", fn, 1, { isMain: fn.name === "Main" }));
    if (fn.name === "Main") lines.push(I + "return 0;");
    lines.push("}");
  } else { // java
    var rt2 = fn.ret ? JTYPE[fn.ret] : "void";
    var ps2 = (fn.params || []).map(function (p) { return JTYPE[p.type] + " " + p.name; }).join(", ");
    var nm2 = fn.name === "Main" ? "main" : fn.name;
    lines.push("    static " + rt2 + " " + nm2 + "(" + (fn.name === "Main" ? "String[] args" : ps2) + ") {");
    vars.forEach(function (v) {
      if (v.arr) lines.push("        " + JTYPE[v.type] + "[] " + v.name + " = new " + JTYPE[v.type] + "[" + emit(parse(v.size), "java", fn) + "];");
      else if (v.type !== "String") lines.push("        " + JTYPE[v.type] + " " + v.name + " = " + { Integer: "0", Real: "0.0", Boolean: "false", Char: "' '" }[v.type] + ";");
      else lines.push("        String " + v.name + ' = "";');
    });
    lines.push.apply(lines, genChain(fn.body, "java", fn, 2).map(function (s) { return "    " + s; }));
    lines.push("    }");
  }
  return lines;
}

function genProgram(lang) {
  var out = [];
  var mains = fns()[0];
  var rest = fns().slice(1);
  if (lang === "python") {
    out.push("# Generato con FlowWeb (flowchart -> Python)");
    out.push("import math, random");
    out.push("");
    out.push("def _fmt(x):");
    out.push("    if isinstance(x, bool):");
    out.push('        return "true" if x else "false"');
    out.push("    return str(x)");
    out.push("");
    out.push("def _tdiv(a, b):");
    out.push("    return int(a / b)");
    out.push("");
    out.push('def _pb(s):');
    out.push('    return s.strip().lower() in ("true", "vero", "1", "si", "s\u00ec", "yes", "y")');
    out.push("");
    rest.forEach(function (f) { out.push.apply(out, genFunction("python", f)); out.push(""); });
    out.push.apply(out, genFunction("python", mains));
    out.push("");
    out.push('if __name__ == "__main__":');
    out.push("    main()");
  } else if (lang === "js") {
    out.push("// Generato con FlowWeb (flowchart -> JavaScript)");
    out.push("function _fmt(x) {");
    out.push("    if (typeof x === \"boolean\") return x ? \"true\" : \"false\";");
    out.push("    if (typeof x === \"number\" && !Number.isInteger(x)) {");
    out.push("        let s = x.toPrecision(10);");
    out.push("        if (s.indexOf(\".\") >= 0) s = s.replace(/0+$/, \"\").replace(/\\.$/, \"\");");
    out.push("        return s;");
    out.push("    }");
    out.push("    return String(x);");
    out.push("}");
    out.push('function _pb(s) { return ["true", "vero", "1", "si", "s\u00ec", "yes", "y"].includes(s.trim().toLowerCase()); }');
    out.push("");
    rest.forEach(function (f) { out.push.apply(out, genFunction("js", f)); out.push(""); });
    out.push.apply(out, genFunction("js", mains));
    out.push("");
    out.push("main();");
  } else if (lang === "c") {
    out.push("/* Generato con FlowWeb (flowchart -> C) */");
    out.push("#include <stdio.h>");
    out.push("#include <stdlib.h>");
    out.push("#include <string.h>");
    out.push("#include <math.h>");
    out.push("#include <stdbool.h>");
    out.push("#include <time.h>");
    out.push("");
    out.push("static char* concat(const char* a, const char* b) { char* r = malloc(strlen(a)+strlen(b)+1); strcpy(r, a); strcat(r, b); return r; }");
    out.push("static char* str_int(int v) { char* r = malloc(32); sprintf(r, \"%d\", v); return r; }");
    out.push("static char* str_real(double v) { char* r = malloc(32); sprintf(r, \"%g\", v); return r; }");
    out.push("static char* str_bool(bool v) { char* r = malloc(6); strcpy(r, v ? \"true\" : \"false\"); return r; }");
    out.push("static char* str_char(char v) { char* r = malloc(2); r[0] = v; r[1] = 0; return r; }");
    out.push("static char* ctos(char v) { char* r = malloc(2); r[0] = v; r[1] = 0; return r; }");
    out.push("static bool read_bool() { int t; scanf(\"%d\", &t); return t != 0; }");
    out.push("static double _min(double a, double b) { return a < b ? a : b; }");
    out.push("static double _max(double a, double b) { return a > b ? a : b; }");
    out.push("");
    rest.forEach(function (f) {
      var rt = f.ret ? CTYPE[f.ret] : "void";
      var ps = (f.params || []).map(function (p) { return CTYPE[p.type] + " " + p.name; }).join(", ");
      out.push(rt + " " + f.name + "(" + ps + ");");
    });
    out.push("");
    rest.forEach(function (f) { out.push.apply(out, genFunction("c", f)); out.push(""); });
    out.push.apply(out, genFunction("c", mains));
  } else { // java
    out.push("// Generato con FlowWeb (flowchart -> Java)");
    out.push("import java.util.Scanner;");
    out.push("");
    out.push("public class Program {");
    out.push("    static Scanner _sc = new Scanner(System.in);");
    out.push("");
    out.push("    static String _fmt(Object x) {");
    out.push("        if (x instanceof Boolean) return ((Boolean) x) ? \"true\" : \"false\";");
    out.push("        if (x instanceof Double) {");
    out.push("            double d = (Double) x;");
    out.push("            if (d == Math.floor(d) && !Double.isInfinite(d)) return String.valueOf((long) d);");
    out.push("            return String.valueOf(d);");
    out.push("        }");
    out.push("        return String.valueOf(x);");
    out.push("    }");
    out.push('    static boolean _jb(String s) { String w = s.trim().toLowerCase(); return "true".equals(w) || "vero".equals(w) || "1".equals(w) || "si".equals(w) || "s\u00ec".equals(w) || "yes".equals(w) || "y".equals(w); }');
    out.push('    static char _jc(String s) { return (s + " ").charAt(0); }');
    out.push("");
    rest.forEach(function (f) { out.push.apply(out, genFunction("java", f)); out.push(""); });
    out.push.apply(out, genFunction("java", mains));
    out.push("}");
  }
  return out.join("\n");
}
