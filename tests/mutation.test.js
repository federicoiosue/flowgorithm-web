#!/usr/bin/env node
"use strict";
/**
 * Mutation-test runner for FlowWeb.
 *
 * The application is split across small files under `src/` (see `index.html`
 * for the load order). Each mutant targets exactly one file, rewrites it
 * on disk, runs the smoke suite against the modular `index.html`, then
 * restores the original.
 *
 * Every `find` snippet must occur EXACTLY ONCE across all of `src/**` —
 * uniqueness is checked at startup; missing or duplicated snippets are
 * reported as `untestable`.
 *
 * Exit: 0 = every mutant was killed; 1 = anything else.
 */

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const ROOT = path.join(__dirname, "..");
// Each mutant targets a single source file inside src/ and rewrites it on
// disk only for the duration of the smoke run — the original file is
// restored afterwards. The smoke runner consumes the modular index.html
// (which loads every src/*.js via <script src> tags), so a mutant just
// becomes the file we rewrite.
const OUT_DIR = path.join(ROOT, ".mutants");
const SMOKE = path.join(ROOT, "tests", "smoke.test.js");
const INDEX = path.join(ROOT, "index.html");

/*
 * Each mutant:
 *   id     — short stable identifier (used for file path inside .mutants/
 *            and for the report)
 *   desc   — human description
 *   find   — exact substring that MUST occur EXACTLY ONCE across all of
 *            src/**. The file it appears in is back-written with `replace`.
 *   replace — substituted text
 *
 * We pre-scan src/ once at startup, look up each find snippet, and keep a
 * map {mutantId -> srcFilePath}. A snippet that is missing or not unique
 * is reported as untestable.
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

function runSmoke(htmlPath) {
  return spawnSync(process.execPath, [SMOKE, "--html", htmlPath],
    { encoding: "utf8", timeout: 60000 });
}


/** Walk src/ (recursively) and return the absolute path of the file that
 * contains `snippet`, if and only if there is exactly one match. */
function locateSnippets(snippets) {
  const files = [];
  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.isFile()) files.push(full);
    }
  }
  walk(path.join(ROOT, "src"));
  const map = new Map();
  for (const s of snippets) {
    const matches = files.filter((f) => fs.readFileSync(f, "utf8").includes(s));
    if (matches.length !== 1) {
      throw new Error("snippet " + JSON.stringify(s.slice(0, 60)) +
        " must occur exactly once in src/ — found in " + matches.length +
        " file(s): " + matches.map((m) => path.relative(ROOT, m)).join(", "));
    }
    map.set(s, matches[0]);
  }
  return map;
}

function main() {
  fs.rmSync(OUT_DIR, { recursive: true, force: true });
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const where = locateSnippets(MUTANTS.map((m) => m.find));
  const results = [];
  let survivors = 0;
  let untestable = 0;
  let killed = 0;

  for (const m of MUTANTS) {
    const target = where.get(m.find);
    const before = fs.readFileSync(target, "utf8");
    const after = applyOnce(before, m.find, m.replace);
    let status, detail;
    if (after === null) {
      status = "untestable";
      detail = "snippet not found in " + path.relative(ROOT, target);
    } else {
      fs.writeFileSync(target, after);
      const res = runSmoke(INDEX);
      fs.writeFileSync(target, before); // always restore
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
    if (status === "killed") killed++;
    else if (status === "survived") survivors++;
    else untestable++;
    results.push({ id: m.id, desc: m.desc, status, detail });
    console.log(status.toUpperCase().padEnd(10) + m.id.padEnd(28)
      + " — " + m.desc + "   [" + detail + "]");
  }

  console.log("\n" + killed + " killed, " + survivors + " survived, " +
    untestable + " untestable (total " + MUTANTS.length + ")");
  process.exit((survivors + untestable) > 0 ? 1 : 0);
}


main();
