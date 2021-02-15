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

  abstract cleanUp(): void;
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

  cleanUp() {}

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

// AudioContext is called webkitAudioContext in Safar, and TS doesn't know about it
declare global {
  interface Window {
    webkitAudioContext: typeof AudioContext;
  }
}

export class RhythmQuiz extends Quiz {
  private canvasEl: HTMLCanvasElement;
  private canvasCtx: CanvasRenderingContext2D;

  private waitingAnimationFrame: number | undefined;
  private analyser: AnalyserNode | undefined;

  constructor(controller: Controller) {
    super(controller);

    this.canvasEl = document.createElement("canvas");
    this.canvasEl.width = 65;
    this.canvasEl.height = 65;
    this.canvasEl.id = "answer";
    this.canvasCtx = this.canvasEl.getContext("2d")!;
    this.controller.setAnswerContainer(this.canvasEl);

    this.initAudio();
  }

  cleanUp() {
    if (this.waitingAnimationFrame !== undefined) {
      window.cancelAnimationFrame(this.waitingAnimationFrame);
    }
  }

  private renderWave(samples: Uint8Array) {
    const width = this.canvasEl.width;
    const height = this.canvasEl.height;
    const ctx = this.canvasCtx;

    ctx.fillStyle = "black";
    ctx.clearRect(0, 0, width, height);

    for (let x = 0; x < width; x++) {
      const sample = samples[x * Math.floor(samples.length / width)];
      ctx.fillRect(x, height - (sample / 255) * height, 1, 1);
    }
  }

  private processAudio(timestamp: number) {
    if (!this.analyser) {
      throw new Error("Analyser not initialized.");
    }

    this.waitingAnimationFrame = window.requestAnimationFrame(
      this.processAudio.bind(this)
    );

    const samples = new Uint8Array(this.analyser.fftSize);
    this.analyser.getByteTimeDomainData(samples);
    this.renderWave(samples);
  }

  private initAudio() {
    const handleSuccess = (stream: MediaStream) => {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      const context = new AudioContext();
      const source = context.createMediaStreamSource(stream);
      this.analyser = context.createAnalyser();

      source.connect(this.analyser);
      this.analyser.connect(context.destination);
      this.processAudio(0);
    };

    navigator.mediaDevices
      .getUserMedia({ audio: true, video: false })
      .then(handleSuccess);
  }
}
