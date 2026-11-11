/* ---- modali dei blocchi ---- */
function openBlockModal(b, fresh) {
  var fn = currentFn();
  var title = t("dlg.title." + b.type);
  var el;

  modalOpen(title, function (body, close) {
    switch (b.type) {
      case "declare": {
        el = buildDeclareRows(b.vars);
        body.appendChild(el.table);
        var add = document.createElement("button");
        add.className = "btn small";
        add.textContent = t("dlg.addvar");
        add.onclick = function () { el.addRow({ name: "", type: "Integer", arr: false, size: "10" }); };
        body.appendChild(add);
        break;
      }
      case "assign": {
        var vs = varSelect(fn);
        vs.value = b.var || "";
        var row1 = frow(t("dlg.var"), vs);
        body.appendChild(row1);
        var idxWrap = document.createElement("div");
        var idxInp = ftext(b.index || "", t("dlg.varHint"));
        idxWrap.appendChild(idxInp);
        var idxRow = frow(t("dlg.idx"), idxWrap);
        idxRow.style.display = "none";
        body.appendChild(idxRow);
        function syncIdx() {
          var v = collectVars(fn).filter(function (x) { return x.name === vs.value; })[0];
          idxRow.style.display = v && v.arr ? "" : "none";
        }
        vs.onchange = syncIdx; syncIdx();
        var ex = ftext(b.expr || "", t("dlg.exprHint"), true);
        body.appendChild(frow(t("dlg.expr"), ex));
        el = { get: function () { return { var: vs.value, index: idxRow.style.display === "none" ? null : idxInp.value, expr: ex.value }; } };
        break;
      }
      case "input": {
        var vs2 = varSelect(fn);
        vs2.value = b.var || "";
        body.appendChild(frow(t("dlg.var"), vs2));
        var idxWrap2 = document.createElement("div");
        var idxInp2 = ftext(b.index || "", t("dlg.varHint"));
        idxWrap2.appendChild(idxInp2);
        var idxRow2 = frow(t("dlg.idx"), idxWrap2);
        idxRow2.style.display = "none";
        body.appendChild(idxRow2);
        function syncIdx2() {
          var v = collectVars(fn).filter(function (x) { return x.name === vs2.value; })[0];
          idxRow2.style.display = v && v.arr ? "" : "none";
        }
        vs2.onchange = syncIdx2; syncIdx2();
        var pr = ftext(b.prompt || "", t("dlg.promptHint"));
        body.appendChild(frow(t("dlg.prompt"), pr));
        el = { get: function () { return { var: vs2.value, index: idxRow2.style.display === "none" ? null : idxInp2.value, prompt: pr.value }; } };
        break;
      }
      case "output": {
        var ex2 = ftext(b.expr || "", t("dlg.exprOutHint"), true);
        body.appendChild(frow(t("dlg.expr"), ex2));
        body.appendChild(frow("", fcheck(b.nl !== false, t("dlg.nl"))));
        el = { get: function () {
          var chk = body.querySelector('input[type="checkbox"]');
          return { expr: ex2.value, nl: chk.checked };
        } };
        break;
      }
      case "if": case "while": case "do": {
        var c = ftext(b.cond || "", t("dlg.condHint"), true);
        body.appendChild(frow(t("dlg.cond"), c));
        el = { get: function () { return { cond: c.value }; } };
        break;
      }
      case "for": {
        var vs3 = varSelect(fn, function (v) { return v.type === "Integer" && !v.arr; });
        vs3.value = b.var || "";
        body.appendChild(frow(t("dlg.var"), vs3));
        var fr = ftext(b.from || "1", "es. 1");
        body.appendChild(frow("Da", fr));
        var to = ftext(b.to || "10", "es. 10");
        body.appendChild(frow("A", to));
        var st = ftext(b.step || "1", "es. 2");
        body.appendChild(frow(t("dlg.step"), st));
        var dir = fsel([{ v: "up", t: t("dlg.dirup") }, { v: "down", t: t("dlg.dirdown") }], b.dir || "up");
        body.appendChild(frow(t("dlg.dir"), dir));
        el = { get: function () { return { var: vs3.value, from: fr.value, to: to.value, step: st.value, dir: dir.value }; } };
        break;
      }
      case "call": {
        var fopts = [{ v: "", t: t("dlg.chooseFn") }].concat(fns().map(function (f) {
          return { v: f.name, t: f.name + "(" + (f.params || []).map(function (p) { return p.name; }).join(", ") + ")" + (f.ret ? " : " + f.ret : "") };
        }));
        var fs = fsel(fopts, b.fn || "");
        body.appendChild(frow(t("dlg.fn"), fs));
        var argsHost = document.createElement("div");
        body.appendChild(frow(t("dlg.args"), argsHost));
        function rebuildArgs(sel) {
          argsHost.innerHTML = "";
          var f = findFnByName(sel);
          if (!f) return;
          (f.params || []).forEach(function (p, i) {
            var a = ftext((b.args && b.args[i]) || "", p.name + " (" + p.type + ")", true);
            argsHost.appendChild(a);
          });
        }
        fs.onchange = function () { rebuildArgs(fs.value); };
        rebuildArgs(b.fn);
        el = { get: function () {
          return { fn: fs.value, args: Array.prototype.slice.call(argsHost.querySelectorAll("input")).map(function (i) { return i.value; }) };
        } };
        break;
      }
      case "return": {
        if (fn.ret) {
          var ex3 = ftext(b.expr || "", t("dlg.retHint"), true);
          body.appendChild(frow(t("dlg.valueOf") + " (" + fn.ret + ")", ex3));
          el = { get: function () { return { expr: ex3.value }; } };
        } else {
          var p = document.createElement("p");
          p.textContent = t("dlg.retNotice");
          body.appendChild(p);
          el = { get: function () { return { expr: "" }; } };
        }
        break;
      }
      case "comment": {
        var ta = document.createElement("textarea");
        ta.rows = 3; ta.style.width = "100%";
        ta.value = b.text || "";
        body.appendChild(frow(t("dlg.text"), ta));
        el = { get: function () { return { text: ta.value }; } };
        break;
      }
    }
  }, [
    { label: t("dlg.cancel"), action: function (bd, errEl, close) {
        if (fresh) { var ref = findBlock(b.id); if (ref) ref.arr.splice(ref.index, 1); commit(); }
        close();
      } },
    { label: t("dlg.ok"), primary: true, action: function (bd, errEl, close) {
        var data = el.get();
        var err = validateBlock(b, data);
        if (err) { errEl.textContent = err; return; }
        Object.keys(data).forEach(function (k) { b[k] = data[k]; });
        close();
        commit();
      } }
  ]);
}

function validateBlock(b, d) {
  function tryParse(s, what) {
    try { parse(s); return null; } catch (e) { return what + ": " + e.message; }
  }
  var fn = currentFn();
  switch (b.type) {
    case "declare":
      if (!d.vars.length) return I18N_CUR==="it"?"Serve almeno una variabile":"At least one variable is required";
      for (var i = 0; i < d.vars.length; i++) {
        var v = d.vars[i];
        if (!/^[A-Za-z_]\w*$/.test(v.name)) return I18N_CUR==="it"?"Nome variabile non valido: '":"Invalid variable name: '" + v.name + "'";
        if (v.arr && (constEval(v.size) === null || constEval(v.size) < 1)) return "Dimensione array non valida per " + v.name;
      }
      return null;
    case "assign": case "input":
      if (!d.var) return I18N_CUR==="it"?"Scegli una variabile":"Choose a variable";
      if (d.index) { var e1 = tryParse(d.index, "Indice"); if (e1) return e1; }
      if (b.type === "assign") { if (!d.expr) return I18N_CUR==="it"?"Manca l'espressione":"Missing expression"; var e2 = tryParse(d.expr, "Espressione"); if (e2) return e2; }
      return null;
    case "output":
      if (!d.expr) return "Manca l'espressione";
      return tryParse(d.expr, "Espressione");
    case "if": case "while": case "do":
      if (!d.cond) return I18N_CUR==="it"?"Manca la condizione":"Missing condition";
      return tryParse(d.cond, "Condizione");
    case "for":
      if (!d.var) return I18N_CUR==="it"?"Scegli la variabile contatore":"Choose the counter variable";
      if (constEval(d.step) === 0) return I18N_CUR==="it"?"Il passo non pu\u00f2 essere 0":"The step cannot be 0";
      var eF = tryParse(d.from, "Da"); if (eF) return eF;
      var eT = tryParse(d.to, "A"); if (eT) return eT;
      var eS = tryParse(d.step, "Passo"); if (eS) return eS;
      return null;
    case "call":
      if (!d.fn) return I18N_CUR==="it"?"Scegli una funzione":"Choose a function";
      var f = findFnByName(d.fn);
      if (!f) return I18N_CUR==="it"?"Funzione inesistente":"Unknown function";
      if (d.args.length !== (f.params || []).length) return (I18N_CUR==="it"?"Attesi ":"Expected ") + (f.params || []).length + (I18N_CUR==="it"?" argomenti":" arguments");
      for (var j = 0; j < d.args.length; j++) {
        if (!d.args[j]) return (I18N_CUR==="it"?"Manca l'argomento ":"Missing argument ") + (j + 1);
        var eA = tryParse(d.args[j], "Argomento " + (j + 1)); if (eA) return eA;
      }
      return null;
    case "return":
      if (fn.ret && d.expr) return tryParse(d.expr, "Espressione");
      return null;
  }
  return null;
}

function buildDeclareRows(vars) {
  var table = document.createElement("table");
  table.className = "rows-table";
  var rows = deepCopy(vars);
  function render() {
    table.innerHTML = "<tr><td></td><td>Nome</td><td>Tipo</td><td>Array</td><td>Dim.</td><td></td></tr>";
    rows.forEach(function (r, i) {
      var tr = document.createElement("tr");
      var td0 = document.createElement("td"); td0.textContent = "var";
      var name = document.createElement("input"); name.value = r.name;
      name.oninput = function () { r.name = name.value; };
      var type = fsel(TYPES.map(function (t) { return { v: t, t: t }; }), r.type);
      type.onchange = function () { r.type = type.value; };
      var arr = document.createElement("input"); arr.type = "checkbox"; arr.checked = r.arr;
      arr.onchange = function () { r.arr = arr.checked; render(); };
      var size = document.createElement("input"); size.value = r.size || "10";
      size.oninput = function () { r.size = size.value; };
      var del = document.createElement("button");
      del.className = "btn small";
      del.textContent = "\u2715";
      del.onclick = function () { rows.splice(i, 1); render(); };
      [name, type, arr, size].forEach(function (c) { var td = document.createElement("td"); td.appendChild(c); tr.appendChild(td); });
      var tdd = document.createElement("td"); tdd.className = "delrow"; tdd.appendChild(del); tr.appendChild(tdd);
      table.appendChild(tr);
    });
  }
  render();
  return {
    table: table,
    addRow: function (r) { rows.push(r); render(); },
    get: function () { return { vars: rows }; }
  };
}
