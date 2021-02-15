import { Controller } from "controller";

export abstract class Quiz {
  protected totalQuestions: number;
  protected remainingQuestions: number;
  protected startTimeMs: number;
  protected controller: Controller;

  constructor(controller: Controller) {
    this.controller = controller;
    this.totalQuestions = 5;
    this.remainingQuestions = 0;
    this.startTimeMs = Date.now();
    this.init();
  }

  protected abstract init(): void;
}

export class PitchQuiz extends Quiz {
  private currentAnswer: string;

  constructor(controller: Controller) {
    super(controller);
    this.currentAnswer = this.newQuestion();
  }

  protected init() {
    const answerEl = this.controller.getAnswerEl();
    answerEl.addEventListener("keypress", this.checkAnswer.bind(this));

    // TODO: probably set up input here, it's not used by RhythmQuiz
    answerEl.focus();
  }

  private checkAnswer(ev: KeyboardEvent) {
    if (
      this.remainingQuestions > 0 &&
      this.currentAnswer.toLowerCase() === ev.key
    ) {
      console.log("correct answer");
      this.currentAnswer = this.newQuestion();
      this.remainingQuestions--;
      this.controller.updateProgress(
        this.totalQuestions - this.remainingQuestions,
        this.totalQuestions
      );

      if (this.remainingQuestions <= 0) {
        this.controller.showTakenSeconds(
          (Date.now() - this.startTimeMs) / 1_000
        );
      }

      ev.preventDefault();
    }
  }
}

export class RhythmQuiz extends Quiz {
  protected init() {}
}
