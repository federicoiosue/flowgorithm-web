/* ---- file ops ---- */
function doNew() {
  openConfirm(t("alert.confirmNew"), function () {
    PROGRAM = newProgram();
    curFnId = PROGRAM.functions[0].id;
    commit();
    consoleClear();
    setStatus(t("status.newProgram"));
  });
}
function doSave() {
  download(promptFileName(), JSON.stringify(PROGRAM, null, 2), "application/json");
}
function promptFileName() {
  return (currentFn() && fns()[0] ? fns()[0].name : "programma").replace(/\W+/g, "_") + ".flowweb.json";
}
function doOpen() {
  var inp = document.createElement("input");
  inp.type = "file";
  inp.accept = ".json,application/json";
  inp.onchange = function () {
    var f = inp.files[0];
    if (!f) return;
    var fr = new FileReader();
    fr.onload = function () {
      try {
        var p = JSON.parse(fr.result);
        if (!p || !p.functions || !p.functions.length) throw new Error("formato non valido");
        PROGRAM = p;
        curFnId = PROGRAM.functions[0].id;
        commit();
        setStatus(t("status.programLoaded") + f.name);
      } catch (e) {
        openAlert(t("alert.badFile") + e.message);
      }
    };
    fr.readAsText(f);
  };
  inp.click();
}
function saveLocal() {
  try { localStorage.setItem("flowweb.autosave", JSON.stringify(PROGRAM)); } catch (e) {}
}
