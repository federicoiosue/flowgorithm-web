/* ---- modale export codice ---- */
function openExportModal() {
  var current = "python";
  var txt;
  modalOpen(t("export.title"), function (body, close) {
    var lang = fsel([
      { v: "python", t: "Python" },
      { v: "js", t: "JavaScript" },
      { v: "c", t: "C" },
      { v: "java", t: "Java" }
    ], current);
    body.appendChild(frow(t("export.lang"), lang));
    txt = document.createElement("textarea");
    txt.id = "codegen-text";
    txt.readOnly = true;
    txt.value = genProgram(current);
    body.appendChild(txt);
    lang.onchange = function () {
      current = lang.value;
      txt.value = genProgram(current);
    };
  }, [
    { label: t("dlg.close"), action: function (b, e, close) { close(); } },
    { label: t("export.copy"), action: function () {
        txt.select();
        try { document.execCommand("copy"); } catch (err) {}
    } },
    { label: t("export.download"), primary: true, action: function () {
        var ext = { python: "py", js: "js", c: "c", java: "java" }[current];
        download(fns()[0].name.replace(/\W+/g, "_").toLowerCase() + "." + ext, txt.value);
    } }
  ]);
}
