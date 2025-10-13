/**
 * Parser module
 * Parses YAML input to ByteGridConfig
 */

import * as yaml from 'js-yaml';
import { ByteGridConfig, Field } from './types';
import { ParseError } from './errors';

/**
 * Parse YAML string to ByteGridConfig
 * @param source YAML string
 * @returns Parsed ByteGridConfig
 * @throws ParseError if parsing fails or required fields are missing
 */
export function parse(source: string): ByteGridConfig {
  let parsed: unknown;

  // Parse YAML
  try {
    parsed = yaml.load(source);
  } catch (error) {
    throw new ParseError(
      `Failed to parse YAML: ${error instanceof Error ? error.message : String(error)}`
    );
  }

  // Validate parsed result is an object
  if (!parsed || typeof parsed !== 'object') {
    throw new ParseError('Invalid YAML: expected an object');
  }

  const obj = parsed as Record<string, unknown>;

  // Validate required top-level fields
  if (!obj.name || typeof obj.name !== 'string') {
    throw new ParseError('Missing or invalid required field: name');
  }

  if (!obj.size || typeof obj.size !== 'number') {
    throw new ParseError('Missing or invalid required field: size');
  }

  if (!obj.fields || !Array.isArray(obj.fields)) {
    throw new ParseError('Missing or invalid required field: fields');
  }

  if (obj.fields.length === 0) {
    throw new ParseError('Fields array must contain at least one field');
  }

  // Parse layout (optional, defaults to 16)
  const layout = obj.layout !== undefined ? Number(obj.layout) : 16;

  // Parse fields
  const fields: Field[] = obj.fields.map((fieldObj, index) => {
    if (!fieldObj || typeof fieldObj !== 'object') {
      throw new ParseError(`Field at index ${index} is not an object`, index);
    }

    const field = fieldObj as Record<string, unknown>;

    // Validate required field properties
    if (field.offset === undefined) {
      throw new ParseError(`Field at index ${index} is missing required property: offset`, index);
    }

    // offset can be string or number (YAML parses "12" as number)
    const offset = typeof field.offset === 'number' ? String(field.offset) : field.offset;
    if (typeof offset !== 'string') {
      throw new ParseError(`Field at index ${index} has invalid offset type`, index);
    }

    if (!field.name || typeof field.name !== 'string') {
      throw new ParseError(`Field at index ${index} is missing required property: name`, index);
    }

    if (!field.type || typeof field.type !== 'string') {
      throw new ParseError(`Field at index ${index} is missing required property: type`, index);
    }

    // Build field object with required properties
    const parsedField: Field = {
      offset: offset,
      name: field.name,
      type: field.type,
    };

    // Add optional properties if present
    if (field.value !== undefined) {
      parsedField.value = String(field.value);
    }

    if (field.description !== undefined) {
      parsedField.description = String(field.description);
    }

    if (field.color !== undefined && typeof field.color === 'string') {
      parsedField.color = field.color as import('./types').ColorName;
    }

    if (field.endianness !== undefined && typeof field.endianness === 'string') {
      parsedField.endianness = field.endianness as 'little' | 'big';
    }

    // Parse bitfields if present
    if (field.bitfields !== undefined) {
      if (!Array.isArray(field.bitfields)) {
        throw new ParseError(
          `Field at index ${index} has invalid bitfields: expected array`,
          index
        );
      }

      parsedField.bitfields = field.bitfields.map((bf, bfIndex) => {
        if (!bf || typeof bf !== 'object') {
          throw new ParseError(
            `Field at index ${index}, bitfield at index ${bfIndex} is not an object`,
            index
          );
        }

        const bitfield = bf as Record<string, unknown>;

        if (!bitfield.name || typeof bitfield.name !== 'string') {
          throw new ParseError(
            `Field at index ${index}, bitfield at index ${bfIndex} is missing required property: name`,
            index
          );
        }

        if (!bitfield.bits || typeof bitfield.bits !== 'string') {
          throw new ParseError(
            `Field at index ${index}, bitfield at index ${bfIndex} is missing required property: bits`,
            index
          );
        }

        return {
          name: bitfield.name,
          bits: bitfield.bits,
          description: bitfield.description !== undefined ? String(bitfield.description) : undefined,
        };
      });
    }

    return parsedField;
  });

  // Parse colorScheme (optional)
  const colorScheme = obj.colorScheme && typeof obj.colorScheme === 'string'
    ? (obj.colorScheme as 'default' | 'dark' | 'light')
    : undefined;

  return {
    name: obj.name,
    size: obj.size,
    layout,
    colorScheme,
    fields,
  };
}
