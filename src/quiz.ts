import { Controller } from "~controller";

export abstract class Quiz {
  protected totalQuestions: number;
  protected remainingQuestions: number;
  protected startTimeMs: number;
  protected controller: Controller;

  constructor(controller: Controller) {
    this.controller = controller;
    this.totalQuestions = 5;
    this.remainingQuestions = this.totalQuestions;
    this.startTimeMs = Date.now();
    this.updateProgress();
  }

  protected updateProgress() {
    this.controller.updateProgress(
      this.totalQuestions - this.remainingQuestions + 1,
      this.totalQuestions
    );
  }
}

export class PitchQuiz extends Quiz {
  private currentAnswer: string;
  private answerEl: HTMLInputElement;

  constructor(controller: Controller) {
    super(controller);
    this.currentAnswer = this.newQuestion();
    this.answerEl = document.createElement("input");
    this.answerEl.id = "answer";
    this.answerEl.type = "text";
    this.controller.setAnswerContainer(this.answerEl);
    this.answerEl.addEventListener("keypress", this.checkAnswer.bind(this));
    this.answerEl.focus();
  }

  private newQuestion(): string {
    // a b c d e f g
    // 0 1 2 3 4 5 6
    const randomNoteNr = Math.floor(Math.random() * 7);
    const noteName = String.fromCharCode("A".charCodeAt(0) + randomNoteNr);

    const randomOctave = Math.floor(Math.random() * 4) + 3;

    this.controller.renderNotes(`${noteName}${randomOctave}/w`);

    return noteName;
  }

  private checkAnswer(ev: KeyboardEvent) {
    if (
      this.remainingQuestions > 0 &&
      this.currentAnswer.toLowerCase() === ev.key
    ) {
      console.log("correct answer");
      this.currentAnswer = this.newQuestion();
      this.remainingQuestions--;

      if (this.remainingQuestions <= 0) {
        this.controller.showTakenSeconds(
          (Date.now() - this.startTimeMs) / 1_000
        );
      } else {
        this.updateProgress();
      }

      ev.preventDefault();
    }
  }
}

export class RhythmQuiz extends Quiz {
  constructor(controller: Controller) {
    super(controller);

    const micEl = document.createElement("div");
    micEl.id = "answer";
    micEl.innerHTML = "🎙";
    this.controller.setAnswerContainer(micEl);
  }
}
