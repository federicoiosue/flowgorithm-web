
/* ---------------------------------------------------------------- i18n */
var I18N_LANGS = ["it", "en"];
var I18N_CUR = "it";
var I18N_STORAGE_KEY = "flowweb.lang";

var I18N = {
  it: {
    // menu
    "menu.file": "File", "menu.edit": "Programma", "menu.run": "Esegui",
    "menu.view": "Visualizza", "menu.help": "Aiuto",
    "menu.newProgram": "Nuovo programma", "menu.openProgram": "Apri file…",
    "menu.saveProgram": "Salva su file…", "menu.exportPng": "Esporta diagramma (PNG)…",
    "menu.exportCode": "Esporta codice…", "menu.examples": "Esempi ▸",
    "menu.newFunction": "Nuova funzione…", "menu.editFunction": "Modifica funzione corrente…",
    "menu.runGo": "Esegui  (F5)", "menu.runPause": "Pausa / Riprendi",
    "menu.runStep": "Passo  (F10)", "menu.runStop": "Stop",
    "menu.themeAuto": "Tema: Automatico", "menu.themeLight": "Tema: Chiaro", "menu.themeDark": "Tema: Scuro",
    "menu.helpQuick": "Guida rapida", "menu.helpAbout": "Informazioni su FlowWeb",
    "lang.label": "Lingua",
    // toolbar
    "tb.new": "Nuovo", "tb.open": "Apri", "tb.save": "Salva",
    "tb.run": "Esegui", "tb.pause": "Pausa", "tb.step": "Passo", "tb.stop": "Stop",
    "tb.code": "Codice", "tb.png": "PNG",
    "tb.tip.new": "Nuovo programma", "tb.tip.open": "Apri file .json", "tb.tip.save": "Salva file .json",
    "tb.tip.run": "Esegui (F5)", "tb.tip.pause": "Pausa / Riprendi", "tb.tip.step": "Passo (F10)", "tb.tip.stop": "Stop",
    "tb.tip.code": "Esporta codice", "tb.tip.png": "Esporta diagramma PNG",
    "tb.speed": "Velocità", "tb.zoomOut": "Riduci", "tb.zoomIn": "Ingrandisci",
    // palette
    "palette.header": "Blocchi — trascina sul diagramma",
    // function tabs
    "fn.addHint": "Nuova funzione", "fn.editSignature": "Modifica firma", "fn.delete": "Elimina funzione",
    // bottom tabs
    "tab.console": "Console", "tab.vars": "Variabili", "tab.turtle": "Tartaruga",
    "console.clear": "Pulisci",
    "vars.hint": "Le variabili compaiono durante l'esecuzione.",
    // statusbar
    "status.ready": "Pronto.", "status.inExec": "Esecuzione", "status.paused": "(in pausa)", "status.stepping": "(passo a passo)",
    "status.step": "passo", "status.fn": "Funzione", "status.blocks": "Blocchi", "status.zoom": "Zoom",
    "status.pausedLbl": "In pausa.", "status.resumed": "In esecuzione.",
    "status.done": "Fatto", "status.stopped": "Interrotto.", "status.newProgram": "Nuovo programma.",
    "status.exampleLoaded": "Esempio caricato: ", "status.programLoaded": "Programma caricato: ",
    "status.theme": "Tema",
    // block modal titles and field labels
    "dlg.title.declare": "Dichiarazione variabili", "dlg.title.assign": "Assegnazione",
    "dlg.title.input": "Input", "dlg.title.output": "Output", "dlg.title.if": "If / Else",
    "dlg.title.while": "While", "dlg.title.for": "For", "dlg.title.do": "Do While",
    "dlg.title.call": "Chiamata funzione", "dlg.title.return": "Return", "dlg.title.comment": "Commento",
    "dlg.title.newFn": "Nuova funzione", "dlg.title.editFn": "Modifica funzione",
    "dlg.ok": "OK", "dlg.cancel": "Annulla", "dlg.close": "Chiudi",
    "dlg.confirm.title": "Conferma",
    "dlg.expr": "Espressione", "dlg.cond": "Condizione", "dlg.var": "Variabile",
    "dlg.idx": "Indice", "dlg.prompt": "Prompt", "dlg.valueOf": "Valore",
    "dlg.nl": "Vai a capo dopo l'output", "dlg.text": "Testo",
    "dlg.step": "Passo", "dlg.dir": "Direzione",
    "dlg.dirup": "crescente (to)", "dlg.dirdown": "decrescente (downto)",
    "dlg.fn": "Funzione", "dlg.args": "Argomenti",
    "dlg.fnName": "Nome", "dlg.params": "Parametri", "dlg.returns": "Restituisce",
    "dlg.returns.none": "nessuno (void)",
    "dlg.addvar": "+ variabile", "dlg.addparam": "+ parametro",
    "dlg.retNotice": "Questa funzione non restituisce un valore.",
    "dlg.chooseVar": "— scegli variabile —", "dlg.chooseFn": "— scegli funzione —",
    "dlg.varHint": "es. 0", "dlg.exprHint": "es. x + 1",
    "dlg.promptHint": "Domanda mostrata all'utente",
    "dlg.exprOutHint": "es. \"Ciao\" oppure x * 2", "dlg.condHint": "es. x > 0",
    "dlg.retHint": "es. x * 2",
    // function modal
    "err.badName": "Nome non valido", "err.badParamName": "Nome parametro non valido",
    "err.dupFn": "Esiste già una funzione con questo nome",
    // block context menu
    "ctx.edit": "Modifica", "ctx.dup": "Duplica", "ctx.del": "Elimina",
    // export
    "export.title": "Esporta codice", "export.lang": "Linguaggio",
    "export.copy": "Copia", "export.download": "Scarica",
    // help / about
    "help.title": "Guida rapida", "about.title": "Informazioni",
    // confirms / alerts
    "alert.confirmNew": "Creare un nuovo programma vuoto? Le modifiche non salvate andranno perse.",
    "alert.loadExample": "Caricare l'esempio", "alert.replaceNote": "Il programma attuale verrà sostituito.",
    "alert.deleteFn": "Eliminare la funzione",
    "alert.badFile": "File non valido: ",
    "alert.fnTitle": "Doppio clic per modificare la funzione",
    // input dialog
    "input.title": "Input — ", "input.defaultPrompt": "Inserisci un valore per ",
    "input.hint.Boolean": "rispondi true/false", "input.hint.Integer": "numero intero",
    "input.hint.Real": "numero decimale", "input.hint.Char": "un carattere", "input.hint.other": "testo",
    // examples
    "ex.hello.name": "Ciao, mondo!",
    "ex.guess.name": "Indovina il numero",
    "ex.guess.d": "segreto", "ex.guess.t": "tentativo",
    "ex.guess.prompt": "Indovina il numero (1-100)",
    "ex.guess.win": "Hai indovinato in ", "ex.guess.attempts": " tentativi!",
    "ex.guess.low": "Troppo basso!", "ex.guess.high": "Troppo alto!",
    "ex.fact.name": "Fattoriale ricorsivo",
    "ex.fact.prompt": "Un numero intero",
    "ex.fact.msg1": "Il fattoriale di ", "ex.fact.msg2": " e' ",
    "ex.avg.name": "Media di N numeri",
    "ex.avg.promptN": "Quanti numeri?", "ex.avg.promptV": "Numero",
    "ex.avg.msg": "Media: ",
    "ex.spiral.name": "Tartaruga: spirale",
    "ex.done": "Fatto!",
    // runtime prefixes for console
    "run.start": "— esecuzione di '", "run.end": "— fine, ",
    "run.in": " in ", "run.interrupt": "— interrotto —",
    "status.steps": " passi", "status.error": "Errore: ",
    "run.welcome": "Benvenuto in FlowWeb — trascina i blocchi sul diagramma e premi Esegui (F5)."
  },
  en: {
    "menu.file": "File", "menu.edit": "Program", "menu.run": "Run",
    "menu.view": "View", "menu.help": "Help",
    "menu.newProgram": "New program", "menu.openProgram": "Open file…",
    "menu.saveProgram": "Save to file…", "menu.exportPng": "Export diagram (PNG)…",
    "menu.exportCode": "Export code…", "menu.examples": "Examples ▸",
    "menu.newFunction": "New function…", "menu.editFunction": "Edit current function…",
    "menu.runGo": "Run  (F5)", "menu.runPause": "Pause / Resume",
    "menu.runStep": "Step  (F10)", "menu.runStop": "Stop",
    "menu.themeAuto": "Theme: Auto", "menu.themeLight": "Theme: Light", "menu.themeDark": "Theme: Dark",
    "menu.helpQuick": "Quick guide", "menu.helpAbout": "About FlowWeb",
    "lang.label": "Language",
    "tb.new": "New", "tb.open": "Open", "tb.save": "Save",
    "tb.run": "Run", "tb.pause": "Pause", "tb.step": "Step", "tb.stop": "Stop",
    "tb.code": "Code", "tb.png": "PNG",
    "tb.tip.new": "New program", "tb.tip.open": "Open .json file", "tb.tip.save": "Save .json file",
    "tb.tip.run": "Run (F5)", "tb.tip.pause": "Pause / Resume", "tb.tip.step": "Step (F10)", "tb.tip.stop": "Stop",
    "tb.tip.code": "Export code", "tb.tip.png": "Export diagram PNG",
    "tb.speed": "Speed", "tb.zoomOut": "Zoom out", "tb.zoomIn": "Zoom in",
    "palette.header": "Blocks — drag onto the diagram",
    "fn.addHint": "New function", "fn.editSignature": "Edit signature", "fn.delete": "Delete function",
    "tab.console": "Console", "tab.vars": "Variables", "tab.turtle": "Turtle",
    "console.clear": "Clear",
    "vars.hint": "Variables appear during execution.",
    "status.ready": "Ready.", "status.inExec": "Running", "status.paused": "(paused)", "status.stepping": "(stepping)",
    "status.step": "step", "status.fn": "Function", "status.blocks": "Blocks", "status.zoom": "Zoom",
    "status.pausedLbl": "Paused.", "status.resumed": "Running.",
    "status.done": "Done", "status.stopped": "Aborted.", "status.newProgram": "New program.",
    "status.exampleLoaded": "Example loaded: ", "status.programLoaded": "Program loaded: ",
    "status.theme": "Theme",
    "dlg.title.declare": "Variable declarations", "dlg.title.assign": "Assignment",
    "dlg.title.input": "Input", "dlg.title.output": "Output", "dlg.title.if": "If / Else",
    "dlg.title.while": "While", "dlg.title.for": "For", "dlg.title.do": "Do While",
    "dlg.title.call": "Function call", "dlg.title.return": "Return", "dlg.title.comment": "Comment",
    "dlg.title.newFn": "New function", "dlg.title.editFn": "Edit function",
    "dlg.ok": "OK", "dlg.cancel": "Cancel", "dlg.close": "Close",
    "dlg.confirm.title": "Confirm",
    "dlg.expr": "Expression", "dlg.cond": "Condition", "dlg.var": "Variable",
    "dlg.idx": "Index", "dlg.prompt": "Prompt", "dlg.valueOf": "Value",
    "dlg.nl": "New line after output", "dlg.text": "Text",
    "dlg.step": "Step", "dlg.dir": "Direction",
    "dlg.dirup": "ascending (to)", "dlg.dirdown": "descending (downto)",
    "dlg.fn": "Function", "dlg.args": "Arguments",
    "dlg.fnName": "Name", "dlg.params": "Parameters", "dlg.returns": "Returns",
    "dlg.returns.none": "none (void)",
    "dlg.addvar": "+ variable", "dlg.addparam": "+ parameter",
    "dlg.retNotice": "This function does not return a value.",
    "dlg.chooseVar": "— choose a variable —", "dlg.chooseFn": "— choose a function —",
    "dlg.varHint": "e.g. 0", "dlg.exprHint": "e.g. x + 1",
    "dlg.promptHint": "Question shown to the user",
    "dlg.exprOutHint": "e.g. \"Hello\" or x * 2", "dlg.condHint": "e.g. x > 0",
    "dlg.retHint": "e.g. x * 2",
    "err.badName": "Invalid name", "err.badParamName": "Invalid parameter name",
    "err.dupFn": "A function with this name already exists",
    "ctx.edit": "Edit", "ctx.dup": "Duplicate", "ctx.del": "Delete",
    "export.title": "Export code", "export.lang": "Language",
    "export.copy": "Copy", "export.download": "Download",
    "help.title": "Quick guide", "about.title": "About",
    "alert.confirmNew": "Create a new empty program? Unsaved changes will be lost.",
    "alert.loadExample": "Load the example", "alert.replaceNote": "The current program will be replaced.",
    "alert.deleteFn": "Delete the function",
    "alert.badFile": "Invalid file: ",
    "alert.fnTitle": "Double-click to edit the function",
    "input.title": "Input — ", "input.defaultPrompt": "Enter a value for ",
    "input.hint.Boolean": "answer true/false", "input.hint.Integer": "integer",
    "input.hint.Real": "decimal number", "input.hint.Char": "one character", "input.hint.other": "text",
    "ex.hello.name": "Hello, world!",
    "ex.guess.name": "Guess the number",
    "ex.guess.d": "secret", "ex.guess.t": "guess",
    "ex.guess.prompt": "Guess the number (1-100)",
    "ex.guess.win": "You got it in ", "ex.guess.attempts": " tries!",
    "ex.guess.low": "Too low!", "ex.guess.high": "Too high!",
    "ex.fact.name": "Recursive factorial",
    "ex.fact.prompt": "Enter an integer",
    "ex.fact.msg1": "The factorial of ", "ex.fact.msg2": " is ",
    "ex.avg.name": "Average of N numbers",
    "ex.avg.promptN": "How many numbers?", "ex.avg.promptV": "Number",
    "ex.avg.msg": "Average: ",
    "ex.spiral.name": "Turtle: spiral",
    "ex.done": "Done!",
    "run.start": "— execution of '", "run.end": "— done, ",
    "run.in": " in ", "run.interrupt": "— interrupted —",
    "status.steps": " steps", "status.error": "Error: ",
    "run.welcome": "Welcome to FlowWeb — drag blocks onto the diagram and press Run (F5)."
  }
};

function t(key, vars) {
  var s = (I18N[I18N_CUR] && I18N[I18N_CUR][key]) || I18N.it[key];
  if (s === undefined) { console.warn("missing i18n key:", key); s = "[" + key + "]"; }
  if (vars) Object.keys(vars).forEach(function (k) { s = s.split("{" + k + "}").join(vars[k]); });
  return s;
}

function detectLang() {
  var pref = null;
  try { pref = localStorage.getItem(I18N_STORAGE_KEY); } catch (e) {}
  if (pref && I18N_LANGS.indexOf(pref) >= 0) return pref;
  var browser = (typeof navigator !== "undefined" && (navigator.language || navigator.userLanguage || "en")).toLowerCase();
  var base = browser.split("-")[0];
  return I18N_LANGS.indexOf(base) >= 0 ? base : "en";
}

function setLang(lang) {
  if (I18N_LANGS.indexOf(lang) < 0) lang = "en";
  I18N_CUR = lang;
  try { localStorage.setItem(I18N_STORAGE_KEY, lang); } catch (e) {}
  applyI18n();
}

function initI18n() {
  I18N_CUR = detectLang();
}
