/**
 * Custom error classes for ByteGrid
 */

/**
 * Base error class for ByteGrid
 */
export class ByteGridError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ByteGridError';
    Object.setPrototypeOf(this, ByteGridError.prototype);
  }
}

/**
 * Error thrown during YAML parsing
 */
export class ParseError extends ByteGridError {
  constructor(
    message: string,
    public readonly fieldIndex?: number
  ) {
    super(message);
    this.name = 'ParseError';
    Object.setPrototypeOf(this, ParseError.prototype);
  }
}

/**
 * Error thrown during validation
 */
export class ValidationError extends ByteGridError {
  constructor(
    message: string,
    public readonly fieldIndex?: number
  ) {
    super(message);
    this.name = 'ValidationError';
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

/**
 * Error thrown during rendering
 */
export class RenderError extends ByteGridError {
  constructor(message: string) {
    super(message);
    this.name = 'RenderError';
    Object.setPrototypeOf(this, RenderError.prototype);
  }
}

/**
 * Error thrown during binary parsing
 */
export class BinaryParseError extends ByteGridError {
  constructor(
    message: string,
    public readonly offset?: number
  ) {
    super(message);
    this.name = 'BinaryParseError';
    Object.setPrototypeOf(this, BinaryParseError.prototype);
  }
}
