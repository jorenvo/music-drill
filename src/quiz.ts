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
  private canvasWaveEl: HTMLCanvasElement;
  private canvasWaveCtx: CanvasRenderingContext2D;
  private canvasFreqEl: HTMLCanvasElement;
  private canvasFreqCtx: CanvasRenderingContext2D;

  private sampleRate: number;
  private waitingAnimationFrame: number | undefined;
  private renderedWave: number[];
  private analyser: AnalyserNode | undefined;
  private inPeak: boolean;

  constructor(controller: Controller) {
    super(controller);

    const VISUALIZATION_SIZE = 512;
    const container = document.createElement("span");
    this.canvasWaveEl = document.createElement("canvas");
    this.canvasWaveEl.width = VISUALIZATION_SIZE;
    this.canvasWaveEl.height = VISUALIZATION_SIZE;
    this.canvasWaveEl.classList.add("visualization");
    this.canvasWaveCtx = this.canvasWaveEl.getContext("2d")!;
    container.appendChild(this.canvasWaveEl);

    this.canvasFreqEl = document.createElement("canvas");
    this.canvasFreqEl.width = VISUALIZATION_SIZE;
    this.canvasFreqEl.height = VISUALIZATION_SIZE;
    this.canvasFreqEl.classList.add("visualization");
    this.canvasFreqCtx = this.canvasFreqEl.getContext("2d")!;
    container.appendChild(this.canvasFreqEl);

    this.sampleRate = 0;
    this.renderedWave = [];

    this.controller.setAnswerContainer(container);

    this.inPeak = false;
    this.initAudio();
  }

  cleanUp() {
    if (this.waitingAnimationFrame !== undefined) {
      window.cancelAnimationFrame(this.waitingAnimationFrame);
    }
  }

  private renderWave(samples: Uint8Array) {
    const GAIN = 4;
    const PREV_WINDOWS = 25;
    const RENDERED_WAVE_SIZE = this.analyser!.fftSize * PREV_WINDOWS;
    this.renderedWave = Array.from(samples).concat(this.renderedWave);
    this.renderedWave = this.renderedWave.slice(0, RENDERED_WAVE_SIZE);

    const width = this.canvasWaveEl.width;
    const height = this.canvasWaveEl.height;
    const ctx = this.canvasWaveCtx;

    ctx.fillStyle = "black";
    ctx.clearRect(0, 0, width, height);

    for (let x = 0; x < width; x++) {
      let sample = this.renderedWave[
        x * Math.floor(this.renderedWave.length / width)
      ];

      // center on 0
      sample -= 127;
      sample *= GAIN;

      // gate noise
      if (sample > -10 && sample < 10) {
        sample = 0;
      }

      // center back on 127
      sample += 127;

      ctx.fillRect(x, height - (sample / 255) * height, 1, 1);
    }
  }

  private renderFreq(samples: Uint8Array) {
    const width = this.canvasFreqEl.width;
    const height = this.canvasFreqEl.height;
    const ctx = this.canvasFreqCtx;

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

    let samples = new Uint8Array(this.analyser.fftSize);
    this.analyser.getByteTimeDomainData(samples);
    this.renderWave(samples);

    samples = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(samples);
    this.renderFreq(samples);

    const magicAmplitude = 10_000;
    const noiseGate = 75;
    const totalAmplitude = samples.reduce((prev, curr) => {
      if (curr > 127 - noiseGate && curr < 127 + noiseGate) {
        // noise (avoid reverb)
        return prev;
      }
      return prev + curr;
    }, 0);

    if (totalAmplitude > magicAmplitude) {
      if (!this.inPeak) {
        console.log("spike");
        this.inPeak = true;
      }
    } else {
      this.inPeak = false;
    }

    // console.log(totalAmplitude);
  }

  private initAudio() {
    const handleSuccess = (stream: MediaStream) => {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      const context = new AudioContext();
      this.sampleRate = context.sampleRate;
      console.log(`Using samplerate ${this.sampleRate}`);
      const source = context.createMediaStreamSource(stream);
      this.analyser = context.createAnalyser();
      // this.analyser.fftSize = 256;
      console.log(`Using fftsize ${this.analyser.fftSize}`);

      source.connect(this.analyser);
      this.analyser.connect(context.destination);
      this.processAudio(0);
    };

    navigator.mediaDevices
      .getUserMedia({ audio: true, video: false })
      .then(handleSuccess);
  }
}
