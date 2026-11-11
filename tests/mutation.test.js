#!/usr/bin/env node
"use strict";
/**
 * Mutation-test runner for FlowWeb.
 *
 * The application under test is the inline <script> block inside index.html, so
 * off-the-shelf runners (Stryker, PIT, ...) cannot consume it directly. This
 * script does it manually:
 *
 *   1. Reads index.html once.
 *   2. For each entry in MUTANTS, applies a single localized string replacement.
 *      Each `find` snippet must occur exactly once and exactly match the source;
 *      otherwise the mutant is reported as `untestable` (a hard failure).
 *   3. Writes the mutated HTML to .mutants/<name>.html.
 *   4. Runs `node tests/smoke.test.js --html <mutant>` synchronously and
 *      captures its exit code.
 *   5. Dies with non-zero exit if any mutant `survived` (smoke exited 0) or
 *      `untestable` (mutation produced no change). Prints one report line per
 *      mutant and a final summary.
 *
 * Run:  node tests/mutation.test.js
 * Exit: 0 = every expected-kill mutant was killed; 1 = anything else.
 */

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const ROOT = path.join(__dirname, "..");
const SOURCE = path.join(ROOT, "index.html");
const OUT_DIR = path.join(ROOT, ".mutants");
const SMOKE = path.join(ROOT, "tests", "smoke.test.js");

/*
 * Each mutant:
 *   id     — short stable identifier (used for file name + report)
 *   desc   — human description of the mutation
 *   find   — exact source substring; must occur exactly once in index.html
 *   replace — substituted text
 */
const MUTANTS = [
  {
    id: "binop-plus-to-minus",
    desc: "binop '+' case computes a - b instead of a + b",
    find: 'case "+": return { t: bothInt ? "Integer" : "Real", v: a.v + b.v };',
    replace: 'case "+": return { t: bothInt ? "Integer" : "Real", v: a.v - b.v };',
  },
  {
    id: "intdiv-drop-trunc",
    desc: "integer '/' drops Math.trunc, returning a Real-shaped quotient",
    find: 'if (bothInt) return { t: "Integer", v: Math.trunc(a.v / b.v) };',
    replace: 'if (bothInt) return { t: "Integer", v: a.v / b.v };',
  },
  {
    id: "mod-off-by-one",
    desc: "'mod' normalization ((a % b) + b) % b is shifted by 1",
    find: 'return { t: "Integer", v: ((a.v % b.v) + b.v) % b.v };',
    replace: 'return { t: "Integer", v: ((a.v % b.v) + b.v + 1) % b.v };',
  },
  {
    id: "pow-becomes-product",
    desc: "binop '^' computes a * b instead of Math.pow(a, b)",
    find: 'var r = Math.pow(a.v, b.v);',
    replace: 'var r = a.v * b.v;',
  },
  {
    id: "factorial-base-returns-zero",
    desc: "factorial base case 'return 1' becomes 'return 0'",
    find: 'var r1 = newBlock("return"); r1.expr = "1"; fi.then.push(r1);',
    replace: 'var r1 = newBlock("return"); r1.expr = "0"; fi.then.push(r1);',
  },
  {
    id: "guess-inc-off-by-one",
    desc: "guess-the-number counts attempts with '+ 2' instead of '+ 1'",
    find: 'inc = newBlock("assign"); inc.var = "n"; inc.expr = "n + 1";',
    replace: 'inc = newBlock("assign"); inc.var = "n"; inc.expr = "n + 2";',
  },
  {
    id: "for-loop-excludes-limit",
    desc: "for-loop upward break uses '>=' so the upper bound is skipped",
    find: 'if (dirUp && rec2.value.v > lim.v) break;',
    replace: 'if (dirUp && rec2.value.v >= lim.v) break;',
  },
  {
    id: "factorial-cond-inverted",
    desc: "factorial base condition 'n <= 1' inverted to 'n >= 1'",
    find: 'var fi = newBlock("if"); fi.cond = "n <= 1";',
    replace: 'var fi = newBlock("if"); fi.cond = "n >= 1";',
  },
  {
    id: "py-renames-user-functions",
    desc: "python codegen renames user functions to Fattoriale_XXX",
    find: 'lines.push("def " + (fn.name === "Main" ? "main" : fn.name)',
    replace: 'lines.push("def " + (fn.name === "Main" ? "main" : "Fattoriale_XXX")',
  },
  {
    id: "py-drops-main-guard",
    desc: "python codegen drops the '__main__' guard",
    find: 'out.push(\'if __name__ == "__main__":\');',
    replace: 'out.push(\'if False:\');',
  },
  {
    id: "js-renames-main",
    desc: "javascript codegen renames the entry point to 'entry'",
    find: 'lines.push("function " + (fn.name === "Main" ? "main" : fn.name)',
    replace: 'lines.push("function " + (fn.name === "Main" ? "entry" : fn.name)',
  },
];

function applyOnce(html, find, replace) {
  const firstIx = html.indexOf(find);
  if (firstIx < 0) return null;
  if (html.indexOf(find, firstIx + find.length) >= 0) {
    throw new Error("snippet is not unique: " + find.slice(0, 60));
  }
  const next = html.slice(0, firstIx) + replace + html.slice(firstIx + find.length);
  if (next === html) return null;
  return next;
}

function runSmoke(mutantPath) {
  const res = spawnSync(
    process.execPath,
    [SMOKE, "--html", mutantPath],
    { encoding: "utf8", timeout: 60000 }
  );
  return res;
}

function main() {
  const html = fs.readFileSync(SOURCE, "utf8");
  fs.rmSync(OUT_DIR, { recursive: true, force: true });
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const results = [];
  let survivors = 0;
  let untestable = 0;
  let killed = 0;

  for (const m of MUTANTS) {
    let mutated;
    let status, detail;
    try {
      mutated = applyOnce(html, m.find, m.replace);
    } catch (e) {
      status = "untestable";
      detail = "snippet not unique: " + e.message;
    }

    if (!status) {
      if (mutated === null) {
        status = "untestable";
        detail = "snippet not found in index.html";
      } else {
        const out = path.join(OUT_DIR, m.id + ".html");
        fs.writeFileSync(out, mutated);
        const res = runSmoke(out);
        if (res.error || res.signal === "SIGTERM") {
          status = "killed";
          detail = "smoke run timed out / errored (" + (res.error ? res.error.message : res.signal) + ")";
        } else if (res.status === 0) {
          status = "survived";
          detail = "smoke suite passed (expected a failure)";
        } else {
          status = "killed";
          const tail = (res.stdout + res.stderr)
            .split(/\r?\n/)
            .filter((l) => /FAIL|SUITE ERROR/.test(l))
            .slice(0, 2)
            .join(" | ")
            .slice(0, 200);
          detail = tail || ("exit=" + res.status);
        }
      }
    }

    if (status === "killed") killed++;
    else if (status === "survived") survivors++;
    else untestable++;

    results.push({ id: m.id, desc: m.desc, status, detail });
    console.log(
      status.toUpperCase().padEnd(11) +
      " " + m.id.padEnd(30) +
      " — " + m.desc + (detail ? "   [" + detail + "]" : "")
    );
  }

  const total = results.length;
  console.log("\n" + killed + " killed, " + survivors + " survived, " + untestable + " untestable (total " + total + ")");
  process.exit(survivors === 0 && untestable === 0 ? 0 : 1);
}

main();
