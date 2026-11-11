/* ---- input dialog durante l'esecuzione ---- */
function askInputModal(b, typeName, varName) {
  return new Promise(function (resolve) {
    var done = false;
    function finish(v) { if (!done) { done = true; close(); resolve(v); } }
    var close = modalOpen(t("input.title") + varName, function (body, closeRef) {
      var prompt = (b && b.prompt) ? b.prompt : (t("input.defaultPrompt") + varName + " (" + typeName + ")");
      var p = document.createElement("p");
      p.textContent = prompt;
      body.appendChild(p);
      var inp = document.createElement("input");
      inp.style.width = "100%";
      inp.autofocus = true;
      body.appendChild(inp);
      var hint = document.createElement("div");
      hint.className = "hint";
      hint.textContent = t("input.hint." + (["Boolean","Integer","Real","Char"].indexOf(typeName) >= 0 ? typeName : "other"));
      body.appendChild(hint);
      inp.onkeydown = function (e) {
        if (e.key === "Enter") {
          if (validInput(inp.value, typeName)) finish(inp.value);
        }
      };
      setTimeout(function () { inp.focus(); }, 30);
    }, [
      { label: t("dlg.cancel"), action: function () { finish(null); } },
      { label: t("dlg.ok"), primary: true, action: function (body) {
          var inp = body.querySelector("input");
          if (validInput(inp.value, typeName)) finish(inp.value);
          else inp.focus();
        } }
    ]);
  });
}
function validInput(s, typeName) {
  try { coerceInput(s, typeName); return true; }
  catch (err) { setStatus(t("input.title") + (I18N_CUR==="it"?"non valido":"invalid") + ": " + err.message, true); return false; }
}
