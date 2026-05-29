export class AiConfigError extends Error {
  constructor(message = 'Brak konfiguracji GEMINI_API_KEY') {
    super(message);
    this.name = 'AiConfigError';
    this.statusCode = 503;
  }
}

export class AiValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'AiValidationError';
    this.statusCode = 400;
  }
}

export class AiBusyError extends Error {
  constructor(message = 'Generacja AI już trwa') {
    super(message);
    this.name = 'AiBusyError';
    this.statusCode = 409;
  }
}
