/* ---- modal framework ---- */
function modalOpen(title, buildBody, footBtns) {
  var root = document.getElementById("modal-root");
  var ov = document.createElement("div");
  ov.className = "overlay";
  var dlg = document.createElement("div");
  dlg.className = "dialog";
  dlg.innerHTML = '<div class="dialog-title"><span>' + esc(title) + '</span><span class="x">\u2715</span></div>';
  var body = document.createElement("div");
  body.className = "dialog-body";
  dlg.appendChild(body);
  var foot = document.createElement("div");
  foot.className = "dialog-foot";
  var errEl = document.createElement("span");
  errEl.className = "modalerr";
  foot.appendChild(errEl);
  footBtns.forEach(function (b) {
    var btn = document.createElement("button");
    btn.className = "btn" + (b.primary ? " primary" : "");
    btn.textContent = b.label;
    btn.onclick = function () { b.action(body, errEl, close, dlg); };
    foot.appendChild(btn);
  });
  dlg.appendChild(foot);
  ov.appendChild(dlg);
  root.appendChild(ov);
  function close() { ov.remove(); }
  dlg.querySelector(".x").onclick = close;
  buildBody(body, close, dlg);
  return close;
}
function openAlert(msg) {
  modalOpen("FlowWeb", function (body) {
    var p = document.createElement("p");
    p.textContent = msg;
    body.appendChild(p);
  }, [{ label: t("dlg.ok"), primary: true, action: function (b, e, close) { close(); } }]);
}
function openConfirm(msg, onOk) {
  modalOpen(t("dlg.confirm.title"), function (body) {
    var p = document.createElement("p");
    p.textContent = msg;
    body.appendChild(p);
  }, [
    { label: t("dlg.cancel"), action: function (b, e, close) { close(); } },
    { label: t("dlg.ok"), primary: true, action: function (b, e, close) { close(); onOk(); } }
  ]);
}
