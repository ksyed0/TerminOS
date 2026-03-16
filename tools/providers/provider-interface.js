'use strict';

// ---------------------------------------------------------------------------
// IntegrationError — thrown when a provider cannot reach its backend
// ---------------------------------------------------------------------------

/**
 * @param {string} message
 * @param {{ provider?: string, attempt?: number, cause?: Error }} [opts]
 */
function IntegrationError(message, { provider, attempt, cause } = {}) {
  this.name = 'IntegrationError';
  this.message = message;
  this.provider = provider || null;
  this.attempt = attempt != null ? attempt : null;
  this.cause = cause || null;
  if (Error.captureStackTrace) {
    Error.captureStackTrace(this, IntegrationError);
  } else {
    this.stack = new Error(message).stack;
  }
}
IntegrationError.prototype = Object.create(Error.prototype);
IntegrationError.prototype.constructor = IntegrationError;

// ---------------------------------------------------------------------------
// ValidationError — thrown when a payload or response fails schema validation
// ---------------------------------------------------------------------------

/**
 * @param {string} message
 * @param {{ field?: string }} [opts]
 */
function ValidationError(message, { field } = {}) {
  this.name = 'ValidationError';
  this.message = message;
  this.field = field || null;
  if (Error.captureStackTrace) {
    Error.captureStackTrace(this, ValidationError);
  } else {
    this.stack = new Error(message).stack;
  }
}
ValidationError.prototype = Object.create(Error.prototype);
ValidationError.prototype.constructor = ValidationError;

// ---------------------------------------------------------------------------
// ProviderInterface — abstract base; prevents direct instantiation
// ---------------------------------------------------------------------------

/**
 * Abstract base for all AI provider implementations.
 * Subclasses MUST override `interpret` and `testConnection`.
 */
function ProviderInterface() {
  if (new.target === ProviderInterface) {
    throw new Error(
      'ProviderInterface is abstract and cannot be instantiated directly. ' +
        'Use ClaudeProvider, OpenAIProvider, or OllamaProvider.'
    );
  }
}

/**
 * Send a natural-language request to the provider.
 * @param {AIRequest} payload
 * @returns {Promise<AIResponse>}
 */
ProviderInterface.prototype.interpret = async function interpret(_payload) {
  throw new Error(
    `${this.constructor.name} must implement interpret(payload)`
  );
};

/**
 * Verify that the provider is reachable and credentials are valid.
 * @returns {Promise<boolean>}
 */
ProviderInterface.prototype.testConnection = async function testConnection() {
  throw new Error(
    `${this.constructor.name} must implement testConnection()`
  );
};

// ---------------------------------------------------------------------------
// Pure validators — used by all provider implementations
// ---------------------------------------------------------------------------

/**
 * Validate an outbound AI request payload.
 * @param {unknown} payload
 * @throws {ValidationError}
 */
function validateAIRequest(payload) {
  if (!payload || typeof payload !== 'object') {
    throw new ValidationError('payload must be a non-null object', {
      field: 'payload',
    });
  }
  if (typeof payload.userInput !== 'string' || payload.userInput.trim() === '') {
    throw new ValidationError(
      'payload.userInput must be a non-empty string',
      { field: 'userInput' }
    );
  }
}

/**
 * Validate an inbound AI response object.
 * @param {unknown} response
 * @throws {ValidationError}
 */
function validateAIResponse(response) {
  if (!response || typeof response !== 'object') {
    throw new ValidationError('response must be a non-null object', {
      field: 'response',
    });
  }
  if (typeof response.command !== 'string') {
    throw new ValidationError(
      'response.command must be a string',
      { field: 'command' }
    );
  }
  if (typeof response.explanation !== 'string') {
    throw new ValidationError(
      'response.explanation must be a string',
      { field: 'explanation' }
    );
  }
  const validRisks = ['safe', 'caution', 'destructive'];
  if (!validRisks.includes(response.riskLevel)) {
    throw new ValidationError(
      `response.riskLevel must be one of: ${validRisks.join(', ')}`,
      { field: 'riskLevel' }
    );
  }
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

module.exports = {
  ProviderInterface,
  IntegrationError,
  ValidationError,
  validateAIRequest,
  validateAIResponse,
};
