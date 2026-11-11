/* ---- tabs funzioni ---- */
function updateTabs() {
  var host = document.getElementById("fntabs");
  host.innerHTML = "";
  fns().forEach(function (f) {
    var t = document.createElement("div");
    t.className = "fntab" + (f.id === currentFn().id ? " active" : "");
    t.textContent = f.name;
    t.onclick = function () { if (RT.state !== "running") { curFnId = f.id; render(); } };
    t.oncontextmenu = function (e) {
      e.preventDefault();
      showCtxMenu(e.clientX, e.clientY, [
        { label: t("fn.editSignature"), action: function () { openFunctionModal(f); } },
        { label: t("fn.delete"), disabled: f.name === "Main", action: function () { deleteFunction(f); } }
      ]);
    };
    host.appendChild(t);
  });
  var add = document.createElement("div");
  add.className = "fntab add";
  add.textContent = "+";
  add.title = t("fn.addHint");
  add.onclick = function () { openFunctionModal(null); };
  host.appendChild(add);
}

function deleteFunction(f) {
  var i = fns().indexOf(f);
  if (i < 0) return;
  openConfirm("Eliminare la funzione '" + f.name + "'?", function () {
    fns().splice(i, 1);
    if (curFnId === f.id) curFnId = fns()[0].id;
    commit();
  });
}

function commit() {
  render();
  saveLocal();
}
