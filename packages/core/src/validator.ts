/**
 * Validator module
 * Validates ByteGridConfig for correctness
 */

import { ByteGridConfig, OffsetRange, DataType } from './types';
import { ValidationError } from './errors';

/**
 * Supported data types
 */
const SUPPORTED_TYPES: Set<string> = new Set([
  'char',
  'int8_t',
  'uint8_t',
  'int16_t',
  'uint16_t',
  'short',
  'int32_t',
  'uint32_t',
  'int',
  'int64_t',
  'uint64_t',
  'long',
  'float',
  'double',
  'reserved',
  'padding',
]);

/**
 * Type size in bits for bitfield validation
 */
const TYPE_BITS: Record<string, number> = {
  'int8_t': 8,
  'uint8_t': 8,
  'int16_t': 16,
  'uint16_t': 16,
  'short': 16,
  'int32_t': 32,
  'uint32_t': 32,
  'int': 32,
  'int64_t': 64,
  'uint64_t': 64,
  'long': 64,
};

/**
 * Parse offset string to OffsetRange
 * Supports formats: "0-3" (range) or "4" (single byte)
 *
 * @param offset Offset string
 * @returns Parsed offset range
 * @throws ValidationError if format is invalid
 */
export function parseOffset(offset: string): OffsetRange {
  const trimmed = offset.trim();

  if (!trimmed) {
    throw new ValidationError('Offset cannot be empty');
  }

  // Check for range format "0-3"
  if (trimmed.includes('-')) {
    const parts = trimmed.split('-');

    if (parts.length !== 2) {
      throw new ValidationError(`Invalid offset format: "${offset}"`);
    }

    const start = parseInt(parts[0].trim());
    const end = parseInt(parts[1].trim());

    if (isNaN(start) || isNaN(end)) {
      throw new ValidationError(`Invalid offset format: "${offset}"`);
    }

    if (start < 0 || end < 0) {
      throw new ValidationError(`Offset cannot be negative: "${offset}"`);
    }

    if (end < start) {
      throw new ValidationError(
        `Offset end (${end}) must be greater than or equal to start (${start})`
      );
    }

    return {
      start,
      end,
      size: end - start + 1,
    };
  }

  // Single byte format "4"
  const value = parseInt(trimmed);

  if (isNaN(value)) {
    throw new ValidationError(`Invalid offset format: "${offset}"`);
  }

  if (value < 0) {
    throw new ValidationError(`Offset cannot be negative: "${offset}"`);
  }

  return {
    start: value,
    end: value,
    size: 1,
  };
}

/**
 * Check if a type is supported
 * Also supports array types like "char[4]"
 */
function isValidType(type: DataType): boolean {
  // Check base types
  if (SUPPORTED_TYPES.has(type)) {
    return true;
  }

  // Check array types like "char[4]"
  const arrayMatch = type.match(/^(\w+)\[(\d+)\]$/);
  if (arrayMatch) {
    const baseType = arrayMatch[1];
    return SUPPORTED_TYPES.has(baseType);
  }

  return false;
}

/**
 * Parse bitfield bits string
 * Supports "7" (single bit) or "4-7" (range)
 */
function parseBitfieldBits(bits: string): { start: number; end: number } {
  const trimmed = bits.trim();

  if (trimmed.includes('-')) {
    const parts = trimmed.split('-');
    if (parts.length !== 2) {
      throw new ValidationError(`Invalid bitfield bits format: "${bits}"`);
    }

    const start = parseInt(parts[0].trim());
    const end = parseInt(parts[1].trim());

    if (isNaN(start) || isNaN(end)) {
      throw new ValidationError(`Invalid bitfield bits format: "${bits}"`);
    }

    return { start, end };
  }

  const value = parseInt(trimmed);
  if (isNaN(value)) {
    throw new ValidationError(`Invalid bitfield bits format: "${bits}"`);
  }

  return { start: value, end: value };
}

/**
 * Validate ByteGridConfig
 *
 * @param config ByteGridConfig to validate
 * @throws ValidationError if validation fails
 */
export function validate(config: ByteGridConfig): void {
  const parsedFields: Array<{
    index: number;
    offset: OffsetRange;
    name: string;
    type: DataType;
  }> = [];

  // Parse and validate each field
  for (let i = 0; i < config.fields.length; i++) {
    const field = config.fields[i];

    // Parse offset
    let offset: OffsetRange;
    try {
      offset = parseOffset(field.offset);
    } catch (error) {
      throw new ValidationError(
        `Field "${field.name}" at index ${i}: ${error instanceof Error ? error.message : String(error)}`,
        i
      );
    }

    // Validate field doesn't exceed total size
    if (offset.end >= config.size) {
      throw new ValidationError(
        `Field "${field.name}" at index ${i} (offset ${offset.start}-${offset.end}) exceeds total size ${config.size}`,
        i
      );
    }

    // Validate type
    if (!isValidType(field.type)) {
      throw new ValidationError(
        `Field "${field.name}" at index ${i} has unsupported type: "${field.type}"`,
        i
      );
    }

    // Validate bitfields if present
    if (field.bitfields) {
      const typeBits = TYPE_BITS[field.type];
      if (!typeBits) {
        throw new ValidationError(
          `Field "${field.name}" at index ${i}: bitfields are only supported for integer types`,
          i
        );
      }

      for (const bf of field.bitfields) {
        try {
          const bits = parseBitfieldBits(bf.bits);

          // Check bit range
          if (bits.start < 0 || bits.end < 0) {
            throw new ValidationError(
              `Bitfield "${bf.name}" has negative bit number`,
              i
            );
          }

          if (bits.end >= typeBits) {
            throw new ValidationError(
              `Bitfield "${bf.name}" bit ${bits.end} is out of range for type ${field.type} (max: ${typeBits - 1})`,
              i
            );
          }
        } catch (error) {
          throw new ValidationError(
            `Field "${field.name}" at index ${i}, bitfield "${bf.name}": ${error instanceof Error ? error.message : String(error)}`,
            i
          );
        }
      }
    }

    parsedFields.push({
      index: i,
      offset,
      name: field.name,
      type: field.type,
    });
  }

  // Check for overlapping fields
  for (let i = 0; i < parsedFields.length; i++) {
    for (let j = i + 1; j < parsedFields.length; j++) {
      const field1 = parsedFields[i];
      const field2 = parsedFields[j];

      // Check if ranges overlap
      const overlap =
        (field1.offset.start <= field2.offset.end && field1.offset.end >= field2.offset.start) ||
        (field2.offset.start <= field1.offset.end && field2.offset.end >= field1.offset.start);

      if (overlap) {
        throw new ValidationError(
          `Field "${field2.name}" at index ${field2.index} (offset ${field2.offset.start}-${field2.offset.end}) ` +
            `overlaps with field "${field1.name}" (offset ${field1.offset.start}-${field1.offset.end})`,
          field2.index
        );
      }
    }
  }
}
