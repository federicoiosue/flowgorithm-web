/* ---- help / about ---- */
function openHelpModal() {
  modalOpen(t("help.title"), function (body) {
    body.innerHTML =
      '<div class="helpdoc">' +
      "<h4>Editor</h4>" +
      "<ul>" +
      "<li>Trascina un blocco dalla palette su una <b>linea verde</b> del diagramma.</li>" +
      "<li><b>Doppio clic</b> su un blocco per modificarlo; <b>clic destro</b> per Modifica / Duplica / Elimina.</li>" +
      "<li>Le tab in alto gestiscono le funzioni (clic destro per modificarle/eliminarle; \u201c+\u201d per crearne una).</li>" +
      "</ul>" +
      "<h4>Esecuzione</h4>" +
      "<ul>" +
      "<li><b>Esegui</b> (F5) avvia; <b>Pausa</b> ferma/riprende; <b>Passo</b> (F10) esegue un blocco alla volta; <b>Stop</b> termina.</li>" +
      "<li>Nel pannello <b>Variabili</b> vedi lo stato corrente; il blocco in esecuzione \u00e8 evidenziato.</li>" +
      "</ul>" +
      "<h4>Espressioni</h4>" +
      "<ul>" +
      "<li>Operatori: <code>+ - * /</code> &nbsp; <code>mod</code> &nbsp; <code>^</code> (potenza) &nbsp; <code>&amp;</code> (concatena stringhe)</li>" +
      "<li>Confronti: <code>=</code> <code>!=</code> <code>&lt;</code> <code>&lt;=</code> <code>&gt;</code> <code>&gt;=</code> &nbsp; logici: <code>and</code> <code>or</code> <code>not</code></li>" +
      "<li>Con due Integer la divisione <code>/</code> \u00e8 <b>intera</b> (troncata). Usa <code>ToReal(a)/b</code> o variabili Real per la divisione con decimali.</li>" +
      "<li>Stringhe tra virgolette: <code>\"Ciao\"</code>. Le variabili sono <b>0-based</b>.</li>" +
      "</ul>" +
      "<h4>Funzioni predefinite</h4>" +
      "<ul><li><code>ToInteger ToReal ToString ToChar ToASCII Length Size Char</code></li>" +
      "<li><code>Abs Ceiling Floor Round Sqrt Sin Cos Tan Log Power Random Min Max</code></li></ul>" +
      "<h4>Turtle Graphics</h4>" +
      "<ul><li><code>TurtleMove(d) TurtleTurn(a) TurtleGoTo(x,y) TurtlePenUp TurtlePenDown TurtlePenColor(c) TurtleHome TurtleClear TurtleShow TurtleHide</code></li>" +
      "<li>Origine al centro, angolo in gradi, 0 = verso l'alto.</li></ul>" +
      "</div>";
  }, [{ label: "Chiudi", primary: true, action: function (b, e, close) { close(); } }]);
}
function openAboutModal() {
  var REPO_URL = "https://github.com/federicoiosue/flowgorithm-web";
  var isIt = I18N_CUR === "it";
  var body_html =
    '<div class="helpdoc">' +
      '<p><b>FlowWeb</b> — ' + (isIt
        ? "IDE a flowchart che gira interamente nel browser."
        : "Browser-based flowchart IDE, fully self-contained.") + '</p>' +
      '<p>' + (isIt
        ? "Ispirato all'interfaccia di Flowgorithm, ma \u00e8 un'implementazione originale e indipendente (nessun codice di Flowgorithm \u00e8 stato usato)."
        : "Inspired by Flowgorithm's look &amp; feel, but an original, independent implementation (no Flowgorithm code reused).") + '</p>' +
      '<p>' + (isIt
        ? "Editor drag&amp;drop \u2022 interprete con debug passo-passo \u2022 esportazione Python / JavaScript / C / Java \u2022 turtle graphics \u2022 italiano / inglese \u2022 tema chiaro / scuro Material Design 3."
        : "Drag&amp;drop editor \u2022 step-debugging interpreter \u2022 export to Python / JavaScript / C / Java \u2022 turtle graphics \u2022 Italian / English UI \u2022 light / dark Material Design 3 themes.") + '</p>' +
      '<p class="hint">' + (isIt ? "Salvataggio automatico in localStorage." : "Automatically saved to localStorage.") + '</p>' +
      '<p><a href="' + REPO_URL + '" target="_blank" rel="noopener"' +
          ' style="display:inline-flex;align-items:center;gap:8px;color:var(--md-primary);text-decoration:none;font:500 13px/1 var(--md-font);padding:6px 0">' +
          '<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true"><path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.071 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.03-2.682-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0 1 12 6.836c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.202 2.394.1 2.647.64.698 1.028 1.59 1.028 2.682 0 3.841-2.337 4.687-4.565 4.935.359.31.678.92.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .266.18.577.688.479C19.138 20.166 22 16.418 22 12c0-5.523-4.477-10-10-10z"/></svg>' +
        '<span>' + (isIt ? "Repository su GitHub" : "GitHub repository") + '</span>' +
        '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true" style="opacity:.55"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14 21 3"/></svg>' +
      '</a>' +
      '<span class="hint" style="display:block;margin-top:4px;font:11px var(--md-font-mono);opacity:.7">' + REPO_URL.replace(/^https?:\/\//, "") + '</span>' +
      '</p>' +
    '</div>';
  modalOpen(t("about.title"), function (body) {
    body.innerHTML = body_html;
  }, [{ label: t("dlg.ok"), primary: true, action: function (b, e, close) { close(); } }]);
}
