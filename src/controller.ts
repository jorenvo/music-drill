import { PitchQuiz, Quiz, RhythmQuiz } from "~quiz";
import Vex from "vexflow";

export class Controller {
  private musicEl: HTMLElement;
  private progressEl: HTMLElement;
  private answerEl: HTMLElement;
  private startPitchQuizEl: HTMLElement;
  private startRhythmQuizEl: HTMLElement;
  private quiz: Quiz;

  constructor() {
    this.musicEl = document.getElementById("music")!;
    this.progressEl = document.getElementById("progress")!;
    this.answerEl = document.getElementById("answer")!;
    this.startPitchQuizEl = document.getElementById("startPitch")!;
    this.startRhythmQuizEl = document.getElementById("startRhythm")!;

    this.setupQuizSelection();

    this.quiz = new PitchQuiz(this);
  }

  private setupQuizSelection() {
    [this.startPitchQuizEl, this.startRhythmQuizEl].forEach((el: Element) =>
      el.addEventListener("click", (_ev: Event) =>
        this.selectNewQuiz(el as HTMLElement)
      )
    );
  }

  private buttonIdToQuiz(el: HTMLElement): Quiz {
    switch (el) {
      case this.startPitchQuizEl:
        return new PitchQuiz(this);
      case this.startRhythmQuizEl:
        return new RhythmQuiz(this);
      default:
        throw new Error(`Unknown button ${el}`);
    }
  }

  private selectNewQuiz(el: HTMLElement) {
    this.quiz = this.buttonIdToQuiz(el);
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
