#!/usr/bin/env node
"use strict";
/**
 * Headless smoke tests for FlowWeb.
 *
 * Extracts the inline application script from index.html, runs it inside a
 * Node VM with minimal DOM stubs and exercises:
 *
 *   1. the expression parser (precedence, concatenation, indexing, calls)
 *   2. arithmetic semantics (integer division, modulo, power, div by zero)
 *   3. the interpreter, on the built-in example programs
 *   4. runtime error reporting
 *   5. the code generators (Python, JavaScript, C, Java)
 *
 * Run:  node tests/smoke.test.js
 * Exit: 0 = all passed, 1 = failures
 */

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.join(__dirname, "..");

/* ---------- pick which HTML to load (default: index.html) ---------- */
const argv = process.argv.slice(2);
const htmlFlagIx = argv.indexOf("--html");
const htmlPath = htmlFlagIx >= 0
  ? path.resolve(argv[htmlFlagIx + 1])
  : (process.env.FLOWWEB_HTML ? path.resolve(process.env.FLOWWEB_HTML) : path.join(ROOT, "index.html"));

/* ---------- Build the list of <script> sources: either the inline bundle
   (legacy single-file dist) or the external script srcs introduced by the
   vanilla-modules split. ---------- */
const html = fs.readFileSync(htmlPath, "utf8");
const inline = html.match(/<script>([\s\S]*?)<\/script>/);
const scriptTags = [...html.matchAll(/<script\s+src="([^"]+)"/g)].map((m) => m[1]);

let sourcesToEval;
if (scriptTags.length) {
  // vanilla-modules layout: load each script in markup order.
  sourcesToEval = scriptTags.map((rel) => {
    const abs = path.join(path.dirname(htmlPath), rel);
    return fs.readFileSync(abs, "utf8");
  });
} else if (inline) {
  sourcesToEval = [inline[1]];
} else {
  console.error("FATAL: cannot find any <script> in " + htmlPath);
  process.exit(1);
}

/* ---------- minimal DOM stubs ---------- */
function makeCanvas() {
  const ctx2d = new Proxy({}, {
    get: (t, k) => (k === "measureText" ? (s) => ({ width: s.length * 7 }) : () => {}),
  });
  return { width: 420, height: 420, getContext: () => ctx2d };
}
function makeEl(id) {
  return {
    id,
    firstChild: null,
    innerHTML: "", textContent: "", value: "", style: {}, dataset: {},
    classList: { toggle() {}, add() {}, remove() {}, contains: () => false },
    appendChild() {}, removeChild() {}, remove() {},
    querySelector: () => null, querySelectorAll: () => [],
    addEventListener() {}, setAttribute() {}, focus() {},
    getBoundingClientRect: () => ({ top: 0, left: 0, bottom: 420, right: 420, width: 420, height: 420 }),
  };
}
const elements = {};
// #svg is null while the sources load (prevents the browser-only boot()) and
// only materialises afterwards, so render() can be exercised headlessly.
let svgEnabled = false;
const documentStub = {
  createElement: (tag) => (tag === "canvas" ? makeCanvas() : makeEl()),
  createElementNS: () => makeEl(),
  getElementById(id) {
    if (id === "svg") {
      if (!svgEnabled) return null;
      if (!elements.svg) elements.svg = makeEl("svg");
      return elements.svg;
    }
    if (!elements[id]) {
      elements[id] = (id === "turtle-path" || id === "turtle-mark") ? makeCanvas() : makeEl(id);
    }
    return elements[id];
  },
  querySelectorAll: () => [],
  addEventListener() {},
  body: makeEl("body"),
};

const ctx = vm.createContext({
  document: documentStub,
  console,
  setTimeout,
  Math,
  JSON,
  Promise,
  localStorage: { getItem: () => null, setItem() {} },
  alert(msg) { throw new Error("unexpected alert(): " + msg); },
});
sourcesToEval.forEach((code) => vm.runInContext(code, ctx));

/* Capture console output in a plain string and make execution instant. */
vm.runInContext(`
  globalThis.__log = "";
  consoleAppend = (text) => { globalThis.__log += text; };
  RT.speed = 0;
  RT.gate = async function (b) {
    this.steps++;
    this.currentBlock = b;
    if (this.stopFlag) throw { stop: true };
  };
  globalThis.__answers = [];
  RT.askInput = async (b, t) => String(globalThis.__answers.shift());
  globalThis.__test = {
    setProgram(p) { PROGRAM = p; curFnId = p.functions[0].id; },
    async run() { globalThis.__log = ""; await startRun("run"); return globalThis.__log; },
    setAnswers(a) { globalThis.__answers = a.slice(); },
    gen(lang) { return genProgram(lang); },
    makeExample(i) { return EXAMPLES[i].make(); },
    fns() { return PROGRAM.functions; },
    // renders a small program with a nested loop body so drawChain is
    // exercised both at top level and inside a nested chain
    renderZones() {
      const p = newProgram();
      const m = p.functions[0];
      const a1 = newBlock("assign"); a1.var = "x"; a1.expr = "1"; m.body.push(a1);
      const w = newBlock("while"); w.cond = "x < 3";
      const b1 = newBlock("assign"); b1.var = "x"; b1.expr = "x + 1"; w.body.push(b1);
      m.body.push(w);
      const a2 = newBlock("assign"); a2.var = "x"; a2.expr = "0"; m.body.push(a2);
      PROGRAM = p; curFnId = m.id;
      render();
      const idx = (arr) => DRAW.zones.filter((z) => z.arr === arr)
        .map((z) => z.index).sort((a, b) => a - b);
      return { body: m.body, loopBody: w.body, bodyIdx: idx(m.body), loopIdx: idx(w.body) };
    },
    // declares x and runs the given blocks as Main, returning the console log
    async runProgram(specs) {
      const p = newProgram();
      const m = p.functions[0];
      const d = newBlock("declare");
      d.vars = [{ name: "x", type: "Integer", arr: false, size: "10" }];
      m.body.push(d);
      for (const s of specs) {
        const b = newBlock(s.type);
        for (const k in s) if (k !== "type") b[k] = s[k];
        m.body.push(b);
      }
      PROGRAM = p; curFnId = m.id;
      globalThis.__log = "";
      await startRun("run");
      return globalThis.__log;
    },
    parse, binop, EXAMPLES,
  };
`, ctx);

const T = vm.runInContext("globalThis.__test", ctx);

/* ---------- assertions ---------- */
let passed = 0;
let failed = 0;
function check(name, cond, extra) {
  if (cond) { passed++; console.log("ok   " + name); }
  else { failed++; console.error("FAIL " + name + (extra ? "  <<< " + extra + " >>>" : "")); }
}

(async () => {
  /* 1. parser */
  const e1 = T.parse("1 + 2 * 3");
  check("parser: * binds tighter than +", e1.op === "+" && e1.r.op === "*");
  const e2 = T.parse('"a" & "b"');
  check("parser: & concatenation", e2.op === "&");
  const e3 = T.parse("x[2]");
  check("parser: array indexing", e3.t === "idx");
  const e4 = T.parse("Random(100) + 1");
  check("parser: call inside expression", e4.t === "bin" && e4.l.t === "call");
  const e5 = T.parse("not (a and b)");
  check("parser: logical not/and", e5.t === "un" && e5.op === "not");

  /* 2. arithmetic semantics */
  const I = (v) => ({ t: "Integer", v });
  check("semantics: integer division truncates (7/2 = 3)", T.binop("/", I(7), I(2)).v === 3);
  check("semantics: modulo (7 mod 3 = 1)", T.binop("%", I(7), I(3)).v === 1);
  check("semantics: power (2^10 = 1024)", T.binop("^", I(2), I(10)).v === 1024);
  const rd = T.binop("/", { t: "Real", v: 7 }, I(2));
  check("semantics: real division keeps decimals", rd.t === "Real" && rd.v === 3.5);
  let threw = false;
  try { T.binop("/", I(1), I(0)); } catch (e) { threw = !!e.rt; }
  check("semantics: division by zero raises runtime error", threw);

  /* 3. interpreter on built-in examples */
  T.setProgram(T.makeExample(1)); // guess the number
  T.fns()[0].body[1].expr = "42"; // deterministic secret
  T.setAnswers(["42"]);
  const log1 = await T.run();
  check("interpreter: guess-the-number wins in one try", /Hai indovinato in 1 tentativi/.test(log1), log1);

  T.setProgram(T.makeExample(2)); // recursive factorial
  T.setAnswers(["5"]);
  const log2 = await T.run();
  check("interpreter: recursive factorial of 5 = 120", log2.includes("120"), log2);

  T.setProgram(T.makeExample(3)); // average of n numbers
  T.setAnswers(["3", "2", "4", "6"]);
  const log3 = await T.run();
  check("interpreter: average of 2,4,6 = 4", log3.includes("Media: 4"), log3);

  T.setProgram(T.makeExample(4)); // turtle spiral
  const log4 = await T.run();
  check("interpreter: turtle spiral completes", log4.includes("Fatto!"), log4);

  /* 3b. console line breaks */
  T.setAnswers(["5"]);
  const logIn = await T.runProgram([
    { type: "input", var: "x" },
    { type: "output", expr: '"Hello"' },
  ]);
  check("interpreter: input echo ends its line before the next output",
    logIn.includes("> 5\nHello\n") && !logIn.includes("> 5Hello"), logIn);
  const logNl = await T.runProgram([{ type: "output", expr: '"Hi"', nl: undefined }]);
  check("interpreter: output without nl field still emits a newline", logNl.includes("Hi\n"), logNl);

  /* 4. runtime error reporting */
  const divZero = vm.runInContext(`(function () {
    const p = newProgram();
    const m = p.functions[0];
    const d = newBlock("declare");
    d.vars = [{ name: "a", type: "Integer", arr: false, size: "10" }];
    m.body.push(d);
    const a1 = newBlock("assign"); a1.var = "a"; a1.expr = "1/0"; m.body.push(a1);
    const o = newBlock("output"); o.expr = "a"; m.body.push(o);
    return p;
  })()`, ctx);
  T.setProgram(divZero);
  const log5 = await T.run();
  check("interpreter: reports division by zero", log5.includes("Divisione per zero"), log5);

  /* 5. code generators */
  T.setProgram(T.makeExample(2));
  const py = T.gen("python");
  check("codegen: python emits recursive function", py.includes("def Fattoriale(n):"));
  check("codegen: python emits main entrypoint", py.includes('if __name__ == "__main__":'));
  const js = T.gen("js");
  check("codegen: javascript emits main", js.includes("function main()"));
  check("codegen: javascript declares locals", js.includes("var n, r;"));
  const c = T.gen("c");
  check("codegen: C declares prototypes", c.includes("int Fattoriale(int n);"));
  check("codegen: C main returns int", /int main\(void\)/.test(c));
  const jv = T.gen("java");
  check("codegen: Java wraps in Program class", jv.includes("public class Program"));

  /* 5b. render layout: insertion zones (DRAW.zones) */
  svgEnabled = true;
  const Z1 = T.renderZones();
  const len = Z1.body.length;
  check("render: chain has a trailing insertion zone after the last block",
    Z1.bodyIdx.indexOf(len) >= 0, "zones at " + Z1.bodyIdx.join(",") + " for len " + len);
  check("render: zone indices for a chain are exactly 0..len, no gaps or duplicates",
    Z1.bodyIdx.length === len + 1 && Z1.bodyIdx.every((n, i) => n === i),
    Z1.bodyIdx.join(","));
  check("render: nested loop body also ends with a trailing insertion zone",
    Z1.loopIdx.length === Z1.loopBody.length + 1 &&
    Z1.loopIdx.every((n, i) => n === i), Z1.loopIdx.join(","));


  /* 6. i18n */
  vm.runInContext(`
    globalThis.__i18nTest = {
      lang: () => I18N_CUR,
      set(l) { I18N_CUR = l; },
      keys() { return Object.keys(I18N.it).length + "/" + Object.keys(I18N.en).length; },
      missing() {
        const missing = [];
        for (const k of Object.keys(I18N.it)) if (!I18N.en[k]) missing.push(k);
        for (const k of Object.keys(I18N.en)) if (!I18N.it[k]) missing.push("en:" + k);
        return missing;
      },
      sample(k) { return t(k); },
    };
  `, ctx);
  const I18 = vm.runInContext("globalThis.__i18nTest", ctx);
  const missing = I18.missing();
  check("i18n: it/en dictionaries cover the same keys", missing.length === 0, missing.slice(0,6).join(", "));
  I18.set("en");
  check("i18n: english toolbar label", I18.sample("tb.run") === "Run");
  check("i18n: english palette header", I18.sample("palette.header").indexOf("Blocks") === 0);
  I18.set("it");
  check("i18n: italian toolbar label", I18.sample("tb.run") === "Esegui");
  check("i18n: unknown key returns placeholder", I18.sample("no.such.key").indexOf("no.such.key") >= 0);

  /* static key completeness across every literal t("...") call in src/ +
     every dynamic prefix list used by the dialogs (dlg.title.<blocktype>,
     input.hint.<Type>, tab.<panel>, menu.theme<Pref>, ex.<example>.<key>). */
  vm.runInContext(`
    globalThis.__blockTypes = ["declare", "assign", "input", "output", "if", "while", "for", "do", "call", "return", "comment"];
  `, ctx);
  const blockTypes = vm.runInContext("globalThis.__blockTypes", ctx);
  for (const t of blockTypes) {
    const key = "dlg.title." + t;
    const missing = !I18.sample(key) || I18.sample(key).startsWith("[" + key + "]");
    check("i18n: block-modal title translates for type " + t, !missing, key);
  }
  for (const code of ["Boolean", "Integer", "Real", "Char", "other"]) {
    const key = "input.hint." + code;
    const s = I18.sample(key);
    check("i18n: input-hint translates for " + code, !!s && !s.startsWith("[" + key + "]"), key);
  }
  for (const p of ["console", "vars", "turtle"]) {
    const key = "tab." + p;
    const s = I18.sample(key);
    check("i18n: bottom-tab label translates for " + p, !!s && !s.startsWith("[" + key + "]"), key);
  }
  for (const pref of ["Auto", "Light", "Dark"]) {
    const key = "menu.theme" + pref;
    const s = I18.sample(key);
    check("i18n: theme menu label translates for " + pref, !!s && !s.startsWith("[" + key + "]"), key);
  }

  console.log("\n" + passed + " passed, " + failed + " failed");
  process.exit(failed ? 1 : 0);
})().catch((e) => {
  console.error("SUITE ERROR:", e);
  process.exit(1);
});
