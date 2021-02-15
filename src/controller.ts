import { PitchQuiz, Quiz } from "quiz";

export class Controller {
  private musicEl: HTMLElement;
  private progressEl: HTMLElement;
  private answerEl: HTMLElement;
  private quiz: Quiz;

  constructor() {
    this.musicEl = document.getElementById("music")!;
    this.progressEl = document.getElementById("progress")!;
    this.answerEl = document.getElementById("answer")!;

    this.quiz = new PitchQuiz(this);
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
}
