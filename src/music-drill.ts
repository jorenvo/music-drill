import Vex from "vexflow";

const musicId = "music";
const musicElement = document.getElementById(musicId)!;

function renderNotes(notes: string) {
  musicElement.innerHTML = "";
  const vf = new Vex.Flow.Factory({
    renderer: { elementId: musicId, width: 500, height: 200 },
  });

  const score = vf.EasyScore();
  const system = vf.System();
  system.addStave({
    // voices: [
    //   score.voice(score.notes("C#5/q, B4, A4, G#4", { stem: "up" }), undefined),
    //   score.voice(score.notes("C#4/h, C#4", { stem: "down" }), undefined),
    // ],
    voices: [score.voice(score.notes(notes), undefined)],
  });
  // .addClef("treble")
  // .addTimeSignature("4/4");

  vf.draw();
}

function newQuestion(): string {
  // a b c d e f g
  // 0 1 2 3 4 5 6
  const randomNoteNr = Math.floor(Math.random() * 7);
  const noteName = String.fromCharCode("A".charCodeAt(0) + randomNoteNr);

  renderNotes(`${noteName}4/w`);

  return noteName;
}

let remaining = 5;
let answer = newQuestion();
const input = document.getElementById("answer")!;
input.addEventListener("keypress", (ev: KeyboardEvent) => {
  console.log(ev.key);
  if (remaining > 0 && answer[0].toLowerCase() === ev.key) {
    console.log("correct answer");
    answer = newQuestion();
    remaining--;
  }
});
