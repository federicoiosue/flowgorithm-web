# FlowWeb

A browser-based flowchart IDE inspired by [Flowgorithm](http://flowgorithm.org), packaged as a **single self-contained HTML file**. No server, no install, no dependencies.

## What it does

FlowWeb lets you design, run, debug and export algorithms as flowcharts — the same workflow Flowgorithm popularized for teaching programming:

- **Visual drag & drop editor** — pull blocks (Declare, Assign, Input, Output, If/Else, While, For, Do, Call, Return, Comment) from the left palette and drop them onto the green insertion lines of the diagram. Double-click a block to edit it, right-click to duplicate or delete. Multiple user functions with parameters and return types, arrays with indexing, and zoom.
- **Interpreter with debugging** — Run (F5), Pause, Step-over (F10), Stop; the block currently executing is highlighted live, a Variables panel watches values as they change, execution speed is adjustable, input is asked through a modal dialog, and runtime errors highlight the offending block.
- **Code generation** — translate the flowchart into Python, JavaScript, C or Java (all four backends are tested: generated code compiles and runs). Export the diagram itself as PNG. Save/load programs as JSON; auto-saved to localStorage.
- **Turtle graphics** — TurtleMove, TurtleTurn, TurtleGoTo, pen up/down, colors, home, clear, show/hide.

## Getting started

Just open `index.html` in a browser. That's it.

Optionally serve it over HTTP:

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

Try **File → Examples** for ready-made demo programs (number guessing game, recursive factorial, average of N numbers, turtle spiral), then press F5.

## Tips

- Division between two Integers is **integer division** (like Flowgorithm). Use `ToReal(a) / b` for decimals.
- Concatenate strings with `&`, power with `^`, modulo with `mod`.
- Comparisons use `=`, `!=`, `<`, `<=`, `>`, `>=`; logical operators are `and`, `or`, `not`.
- Built-in functions: `ToInteger ToReal ToString ToChar ToASCII Length Size Char Abs Ceiling Floor Round Sqrt Sin Cos Tan Log Power Random Min Max`.

## Legal notes

This is an **original, independent implementation**: no Flowgorithm code was decompiled or reused. The interface is merely inspired by Flowgorithm's look & feel (Flowgorithm is a trademark of its respective owners). The `.flowweb.json` file format is specific to this project.
