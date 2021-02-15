import { PitchQuiz, Quiz, RhythmQuiz } from "~quiz";
import Vex from "vexflow";

export class Controller {
  private musicEl: HTMLElement;
  private progressEl: HTMLElement;
  private answerEl: HTMLElement;
  private quiz: Quiz;

  constructor() {
    this.musicEl = document.getElementById("music")!;
    this.progressEl = document.getElementById("progress")!;
    this.answerEl = document.getElementById("answer")!;

    this.setupQuizSelection();

    this.quiz = new PitchQuiz(this);
  }

  private setupQuizSelection() {
    const pitchId = "startPitch";
    const rhythmId = "startRhythm";

    document
      .querySelectorAll(`#${pitchId}, #${rhythmId}`)
      .forEach((el: Element) =>
        el.addEventListener("click", (_ev: Event) => this.selectNewQuiz(el.id))
      );
  }

  private buttonIdToQuiz(id: string): Quiz {
    switch (id) {
      case "startPitch":
        return new PitchQuiz(this);
        break;
      case "startRhythm":
        return new RhythmQuiz(this);
        break;
      default:
        throw new Error(`Unknown button id ${id}`);
    }
  }

  private selectNewQuiz(id: string) {
    console.log(`starting ${id}`);
    this.quiz = this.buttonIdToQuiz(id);
  }

  getAnswerEl() {
    return this.answerEl;
  }

  updateProgress(current: number, remaining: number) {
    this.progressEl.innerHTML = `${current} / ${remaining}`;
  }

  showTakenSeconds(seconds: number) {
    window.alert(`Completed in ${seconds} seconds.`);
  }

  renderNotes(notes: string) {
    this.musicEl.innerHTML = "";
    const vf = new Vex.Flow.Factory({
      renderer: { elementId: this.musicEl.id, width: 89, height: 150 },
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
}
