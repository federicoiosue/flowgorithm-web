/* ---- modale funzione ---- */
function openFunctionModal(fn) {
  var isNew = !fn;
  var data = fn ? { name: fn.name, params: deepCopy(fn.params || []), ret: fn.ret } : { name: "Funzione" + (fns().length + 1), params: [], ret: null };
  var el;
  modalOpen(isNew ? t("dlg.title.newFn") : t("dlg.title.editFn"), function (body) {
    var name = ftext(data.name);
    body.appendChild(frow(t("dlg.fnName"), name));
    var table = document.createElement("table");
    table.className = "rows-table";
    function renderP() {
      table.innerHTML = "<tr><td>Parametro</td><td>Tipo</td><td></td></tr>";
      data.params.forEach(function (p, i) {
        var tr = document.createElement("tr");
        var pn = document.createElement("input"); pn.value = p.name;
        pn.oninput = function () { p.name = pn.value; };
        var pt = fsel(TYPES.map(function (t) { return { v: t, t: t }; }), p.type);
        pt.onchange = function () { p.type = pt.value; };
        var del = document.createElement("button"); del.className = "btn small"; del.textContent = "\u2715";
        del.onclick = function () { data.params.splice(i, 1); renderP(); };
        [pn, pt].forEach(function (c) { var td = document.createElement("td"); td.appendChild(c); tr.appendChild(td); });
        var tdd = document.createElement("td"); tdd.className = "delrow"; tdd.appendChild(del); tr.appendChild(tdd);
        table.appendChild(tr);
      });
    }
    renderP();
    body.appendChild(frow(t("dlg.params"), table));
    var addP = document.createElement("button");
    addP.className = "btn small";
    addP.textContent = t("dlg.addparam");
    addP.onclick = function () { data.params.push({ name: "p" + (data.params.length + 1), type: "Integer" }); renderP(); };
    body.appendChild(frow("", addP));
    var ret = fsel([{ v: "", t: t("dlg.returns.none") }].concat(TYPES.map(function (t) { return { v: t, t: t }; })), data.ret || "");
    body.appendChild(frow(t("dlg.returns"), ret));
    el = { get: function () { return { name: name.value.trim(), params: data.params, ret: ret.value || null }; } };
  }, [
    { label: "Annulla", action: function (b, e, close) { close(); } },
    { label: "OK", primary: true, action: function (b, e, close) {
        var d = el.get();
        if (!/^[A-Za-z_]\w*$/.test(d.name)) { e.textContent = t("err.badName"); return; }
        var clash = fns().some(function (f) { return f !== fn && f.name.toLowerCase() === d.name.toLowerCase(); });
        if (clash) { e.textContent = t("err.dupFn"); return; }
        for (var i = 0; i < d.params.length; i++) {
          if (!/^[A-Za-z_]\w*$/.test(d.params[i].name)) { e.textContent = t("err.badParamName"); return; }
        }
        if (d.name.toLowerCase() === "main" && !isNew && fn && fn.name !== "Main" && fns()[0] !== fn) { /* ok */ }
        if (isNew) {
          var f2 = newFn(d.name);
          f2.params = d.params; f2.ret = d.ret;
          fns().push(f2);
          curFnId = f2.id;
        } else {
          fn.name = d.name; fn.params = d.params; fn.ret = d.ret;
        }
        close();
        commit();
      } }
  ]);
}
