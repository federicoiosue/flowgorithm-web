/* ---- menu ---- */
function menuModel() {
  return [
    { key: "menu.file", items: [
      { key: "menu.newProgram", action: function () { doNew(); } },
      { key: "menu.openProgram", action: function () { doOpen(); } },
      { key: "menu.saveProgram", action: function () { doSave(); } },
      { sep: true },
      { key: "menu.exportPng", action: function () { exportPNG(); } },
      { key: "menu.exportCode", action: function () { openExportModal(); } },
      { sep: true },
      { key: "menu.examples", action: function (ev, anchor) { showExampleMenu(anchor); } }
    ]},
    { key: "menu.edit", items: [
      { key: "menu.newFunction", action: function () { openFunctionModal(null); } },
      { key: "menu.editFunction", action: function () { openFunctionModal(currentFn()); } }
    ]},
    { key: "menu.run", items: [
      { key: "menu.runGo", action: function () { doRunBtn(); } },
      { key: "menu.runPause", action: function () { doPauseBtn(); } },
      { key: "menu.runStep", action: function () { doStepBtn(); } },
      { key: "menu.runStop", action: function () { doStopBtn(); } }
    ]},
    { key: "menu.view", items: [
      { key: "menu.themeAuto", action: function () { setThemePref("auto"); } },
      { key: "menu.themeLight", action: function () { setThemePref("light"); } },
      { key: "menu.themeDark", action: function () { setThemePref("dark"); } }
    ]},
    { key: "menu.help", items: [
      { key: "menu.helpQuick", action: function () { openHelpModal(); } },
      { key: "menu.helpAbout", action: function () { openAboutModal(); } }
    ]}
  ];
}
function closeAllMenus() {
  document.querySelectorAll(".menu-item.open").forEach(function (x) { x.classList.remove("open"); var d = x.querySelector(".dropdown"); if (d) d.remove(); });
}
var MENUBAR_OUTSIDE_BOUND = false;
// buildMenubar runs again whenever the chrome is rebuilt, so bind the
// document listener once instead of stacking a new one per call
function bindMenubarOutsideClose() {
  if (MENUBAR_OUTSIDE_BOUND) return;
  MENUBAR_OUTSIDE_BOUND = true;
  document.addEventListener("mousedown", function (e) {
    if (e.target.closest && e.target.closest("#menubar")) return;
    closeAllMenus();
  });
}
function buildMenubar() {
  var bar = document.getElementById("menubar");
  bar.innerHTML = "";
  bindMenubarOutsideClose();
  var logo = document.createElement("div");
  logo.id = "app-title";
  logo.innerHTML = "<b>Flow</b>Web";
  bar.appendChild(logo);
  menuModel().forEach(function (m) {
    var it = document.createElement("div");
    it.className = "menu-item";
    it.textContent = t(m.key);
    var dd = null;
    var openedByHover = false;
    function open(byHover) {
      closeAllMenus();
      openedByHover = !!byHover;
      it.classList.add("open");
      dd = document.createElement("div");
      dd.className = "dropdown";
      m.items.forEach(function (mi) {
        if (mi.sep) { var s = document.createElement("div"); s.className = "sep"; dd.appendChild(s); return; }
        var d = document.createElement("div");
        d.className = "di" + (mi.disabled ? " disabled" : "");
        d.textContent = t(mi.key);
        d.onclick = function (e) { closeAllMenus(); mi.action(e, it); };
        dd.appendChild(d);
      });
      it.appendChild(dd);
    }
    it.onclick = function () {
      if (it.classList.contains("open")) {
        // apostrophic close only on a deliberate second click (not when it
        // opened because the mouse hovered over it while another was open)
        if (openedByHover) { openedByHover = false; return; }
        closeAllMenus();
      } else open(false);
    };
    it.onmouseenter = function () {
      if (document.querySelector(".menu-item.open") && !it.classList.contains("open")) open(true);
    };
    bar.appendChild(it);
  });
  var spacer = document.createElement("span");
  spacer.className = "grow";
  spacer.style.flex = "1";
  bar.appendChild(spacer);
  var langBtn = document.createElement("button");
  langBtn.id = "lang-btn";
  langBtn.className = "menu-item";
  langBtn.setAttribute("aria-label", t("lang.label"));
  langBtn.title = t("lang.label");
  langBtn.innerHTML = '<span class="lang-flag">' + langFlag(I18N_CUR) + '</span> <span class="lang-code">' + I18N_CUR.toUpperCase() + "</span>";
  bar.appendChild(langBtn);
  langBtn.onclick = function (e) { e.stopPropagation(); openLangMenu(langBtn); };
}
function langFlag(code) { return code === "it" ? "\ud83c\uddee\ud83c\uddf9" : "\ud83c\uddec\ud83c\udde7"; }
function openLangMenu(anchor) {
  closeLangMenu();
  var m = document.createElement("div");
  m.id = "langmenu";
  m.className = "dropdown";
  document.body.appendChild(m);
  I18N_LANGS.forEach(function (code) {
    var d = document.createElement("div");
    d.className = "di" + (code === I18N_CUR ? " selected" : "");
    d.innerHTML = '<span class="lang-flag">' + langFlag(code) + '</span> ' + ({ it: "Italiano", en: "English" }[code]) + (code === I18N_CUR ? " ✓" : "");
    d.onclick = function () { closeLangMenu(); setLang(code); };
    m.appendChild(d);
  });
  var r = anchor.getBoundingClientRect();
  m.style.position = "fixed";
  m.style.left = "auto";
  m.style.top = (r.bottom + 4) + "px";
  m.style.right = Math.max(6, window.innerWidth - r.right) + "px";
  m.style.minWidth = "180px";
  m.style.zIndex = "700";
  setTimeout(function () {
    document.addEventListener("mousedown", function h(e) {
      if (!m.contains(e.target)) { closeLangMenu(); document.removeEventListener("mousedown", h); }
    });
  }, 0);
}
function closeLangMenu() {
  var m = document.getElementById("langmenu"); if (m) m.remove();
}
function applyI18n() {
  buildMenubar();
  buildToolbar();
  buildPalette();
  updateTabs();
  document.querySelectorAll(".btab").forEach(function (b) { b.textContent = t("tab." + b.dataset.p); });
  document.getElementById("console-clear").textContent = t("console.clear");
  var hint = document.getElementById("vars-hint"); if (hint) hint.textContent = t("vars.hint");
  setStatus(t("status.ready"));
  updateStatusRight();
}
function showExampleMenu(anchor) {
  var r = anchor.getBoundingClientRect();
  showCtxMenu(r.left, r.bottom, EXAMPLES.map(function (ex) {
    return { label: t("ex." + ex.key + ".name"), action: function () {
      openConfirm(t("alert.loadExample") + " '" + t("ex." + ex.key + ".name") + "'. " + t("alert.replaceNote"), function () {
        PROGRAM = ex.make();
        curFnId = PROGRAM.functions[0].id;
        commit();
        setStatus(t("status.exampleLoaded") + t("ex." + ex.key + ".name"));
      });
    } };
  }));
}
