
/* ---------------------------------------------------------- esempi */
var EXAMPLES = [
  {
    key: "hello",
    make: function () {
      var p = newProgram();
      var o = newBlock("output");
      o.expr = '"Ciao, mondo!"';
      p.functions[0].body.push(o);
      return p;
    }
  },
  {
    key: "guess",
    make: function () {
      var p = newProgram();
      var m = p.functions[0];
      var d = newBlock("declare");
      d.vars = [
        { name: t("ex.guess.d"), type: "Integer", arr: false, size: "10" },
        { name: t("ex.guess.t"), type: "Integer", arr: false, size: "10" },
        { name: "n", type: "Integer", arr: false, size: "10" }
      ];
      m.body.push(d);
      var a1 = newBlock("assign"); a1.var = t("ex.guess.d"); a1.expr = "Random(100) + 1"; m.body.push(a1);
      var a2 = newBlock("assign"); a2.var = "n"; a2.expr = "0"; m.body.push(a2);
      var w = newBlock("while"); w.cond = t("ex.guess.t") + " != " + t("ex.guess.d"); w.body = [];
      var inp = newBlock("input"); inp.var = t("ex.guess.t"); inp.prompt = t("ex.guess.prompt");
      var inc = newBlock("assign"); inc.var = "n"; inc.expr = "n + 1";
      var iff = newBlock("if"); iff.cond = t("ex.guess.t") + " < " + t("ex.guess.d");
      var o1 = newBlock("output"); o1.expr = '"' + t("ex.guess.low") + '"'; iff.then.push(o1);
      var iff2 = newBlock("if"); iff2.cond = t("ex.guess.t") + " > " + t("ex.guess.d");
      var o2 = newBlock("output"); o2.expr = '"' + t("ex.guess.high") + '"'; iff2.then.push(o2);
      iff.else.push(iff2);
      w.body.push(inp); w.body.push(inc); w.body.push(iff);
      m.body.push(w);
      var fin = newBlock("output"); fin.expr = '"' + t("ex.guess.win") + '" & n & "' + t("ex.guess.attempts") + '"'; m.body.push(fin);
      return p;
    }
  },
  {
    key: "fact",
    make: function () {
      var p = newProgram();
      var m = p.functions[0];
      var d = newBlock("declare");
      d.vars = [{ name: "n", type: "Integer", arr: false, size: "10" }, { name: "r", type: "Integer", arr: false, size: "10" }];
      m.body.push(d);
      var i = newBlock("input"); i.var = "n"; i.prompt = t("ex.fact.prompt"); m.body.push(i);
      var a = newBlock("assign"); a.var = "r"; a.expr = "Fattoriale(n)"; m.body.push(a);
      var o = newBlock("output"); o.expr = '"' + t("ex.fact.msg1") + '" & n & "' + t("ex.fact.msg2") + '" & r'; m.body.push(o);
      var f = newFn("Fattoriale");
      f.params = [{ name: "n", type: "Integer" }];
      f.ret = "Integer";
      var fi = newBlock("if"); fi.cond = "n <= 1";
      var r1 = newBlock("return"); r1.expr = "1"; fi.then.push(r1);
      var r2 = newBlock("return"); r2.expr = "n * Fattoriale(n - 1)"; fi.else.push(r2);
      f.body.push(fi);
      p.functions.push(f);
      return p;
    }
  },
  {
    key: "avg",
    make: function () {
      var p = newProgram();
      var m = p.functions[0];
      var d = newBlock("declare");
      d.vars = [{ name: "n", type: "Integer", arr: false, size: "10" }, { name: "i", type: "Integer", arr: false, size: "10" }, { name: "s", type: "Real", arr: false, size: "10" }, { name: "v", type: "Real", arr: false, size: "10" }];
      m.body.push(d);
      var i1 = newBlock("input"); i1.var = "n"; i1.prompt = t("ex.avg.promptN"); m.body.push(i1);
      var az = newBlock("assign"); az.var = "s"; az.expr = "0"; m.body.push(az);
      var f = newBlock("for"); f.var = "i"; f.from = "1"; f.to = "n"; f.step = "1";
      var iv = newBlock("input"); iv.var = "v"; iv.prompt = t("ex.avg.promptV");
      var aa = newBlock("assign"); aa.var = "s"; aa.expr = "s + v";
      f.body.push(iv); f.body.push(aa);
      m.body.push(f);
      var o = newBlock("output"); o.expr = '"' + t("ex.avg.msg") + '" & (s / n)'; m.body.push(o);
      return p;
    }
  },
  {
    key: "spiral",
    make: function () {
      var p = newProgram();
      var m = p.functions[0];
      var d = newBlock("declare");
      d.vars = [{ name: "i", type: "Integer", arr: false, size: "10" }];
      m.body.push(d);
      var f = newBlock("for"); f.var = "i"; f.from = "1"; f.to = "40"; f.step = "1";
      var mv = newBlock("call"); mv.fn = "TurtleMove"; mv.args = ["i * 2"];
      var tn = newBlock("call"); tn.fn = "TurtleTurn"; tn.args = ["90"];
      f.body.push(mv); f.body.push(tn);
      m.body.push(f);
      var o = newBlock("output"); o.expr = '"' + t("ex.done") + '"'; m.body.push(o);
      return p;
    }
  }
];
