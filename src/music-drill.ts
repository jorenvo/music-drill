import Vex from "vexflow";

const musicId = "music";
const progressElement = document.getElementsByTagName("progressQuiz")[0]!;
const musicElement = document.getElementById(musicId)!;
const input: HTMLInputElement = document.getElementById(
  "answer"
)! as HTMLInputElement;

function renderNotes(notes: string) {
  musicElement.innerHTML = "";
  const vf = new Vex.Flow.Factory({
    renderer: { elementId: musicId, width: 89, height: 150 },
  });

  const score = vf.EasyScore();
  const system = vf.System();
  system
    .addStave({
      // voices: [
      //   score.voice(score.notes("C#5/q, B4, A4, G#4", { stem: "up" }), undefined),
      //   score.voice(score.notes("C#4/h, C#4", { stem: "down" }), undefined),
      // ],
      voices: [score.voice(score.notes(notes), undefined)],
    })
    .addClef("treble");
  // .addTimeSignature("4/4");

  vf.draw();
}

function newQuestion(): string {
  // a b c d e f g
  // 0 1 2 3 4 5 6
  const randomNoteNr = Math.floor(Math.random() * 7);
  const noteName = String.fromCharCode("A".charCodeAt(0) + randomNoteNr);

  const randomOctave = Math.floor(Math.random() * 4) + 3;

  renderNotes(`${noteName}${randomOctave}/w`);

  return noteName;
}

function updateProgress() {
  progressElement.innerHTML = `${total - remaining}/${total}`;
}

let total = 5;
let remaining = total;
let answer = newQuestion();
input.focus();
const startTimeMs = Date.now();
updateProgress();

input.addEventListener("keypress", (ev: KeyboardEvent) => {
  if (remaining > 0 && answer[0].toLowerCase() === ev.key) {
    console.log("correct answer");
    answer = newQuestion();
    remaining--;
    updateProgress();

    if (remaining <= 0) {
      window.alert(
        `Completed in ${(Date.now() - startTimeMs) / 1_000} seconds`
      );
    }
    ev.preventDefault();
  }
});
