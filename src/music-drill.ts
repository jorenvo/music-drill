import * as Vex from "vexflow";

const vf = new Vex.Flow.Factory({
  renderer: { elementId: "music", width: 500, height: 200 },
});

const score = vf.EasyScore();
const system = vf.System();

system
  .addStave({
    voices: [
      score.voice(score.notes("C#5/q, B4, A4, G#4", { stem: "up" }), undefined),
      score.voice(score.notes("C#4/h, C#4", { stem: "down" }), undefined),
    ],
  })
  .addClef("treble")
  .addTimeSignature("4/4");

vf.draw();
