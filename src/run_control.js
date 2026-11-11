
/* ------------------------------------------------ avvio / controlli run */
async function startRun(mode) {
  if (RT.state === "running") return;
  RT.state = "running";
  RT.paused = false; RT.stepping = (mode === "step");
  RT.stopFlag = false; RT.steps = 0; RT.frames = []; RT.currentBlock = null;
  consoleClear();
  turtleReset();
  setRunUI();
  RT.outLine(t("run.start") + fns()[0].name + "' " + "\u2014\n", "sys");
  var t0 = Date.now();
  try {
    await callFn(fns()[0], []);
    RT.outLine(t("run.end") + RT.steps + t("status.steps") + t("run.in") + ((Date.now() - t0) / 1000).toFixed(1) + "s \u2014", "sys");
    setStatus(t("status.done") + ": " + RT.steps + t("status.steps") + ".");
  } catch (e) {
    if (e && e.stop) {
      RT.outLine(t("run.interrupt"), "sys");
      setStatus(t("status.stopped"));
    } else {
      var msg = (e && e.message) ? e.message : String(e);
      RT.outLine(t("status.error") + msg, "err");
      setStatus(t("status.error") + msg, true);
      if (e && e.block) { RT.highlight(e.block.id); DRAW.els[e.block.id] && DRAW.els[e.block.id].classList.add("err"); }
    }
  } finally {
    RT.state = "idle"; RT.paused = false; RT.stepping = false;
    RT.highlight(null);
    setRunUI();
  }
}
