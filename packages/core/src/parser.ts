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

  if (!obj.size) {
    throw new ParseError('Missing or invalid required field: size');
  }

  if (!obj.fields || !Array.isArray(obj.fields)) {
    throw new ParseError('Missing or invalid required field: fields');
  }

  if (obj.fields.length === 0) {
    throw new ParseError('Fields array must contain at least one field');
  }

  // Parse layoutUnit (optional)
  let layoutUnit: 'byte' | 'bit' | undefined = obj.layoutUnit && typeof obj.layoutUnit === 'string'
    ? (obj.layoutUnit as 'byte' | 'bit')
    : undefined;

  // Parse layout (optional, defaults to 16) and infer layoutUnit if not specified
  let layout: number;
  if (obj.layout === undefined) {
    layout = 16;
  } else if (typeof obj.layout === 'number') {
    layout = obj.layout;
  } else if (typeof obj.layout === 'string') {
    const layoutStr = obj.layout.trim();
    let layoutValue: number;
    let layoutUnitSuffix: 'byte' | 'bit' | undefined;

    // Extract suffix
    if (layoutStr.endsWith('b')) {
      layoutValue = parseInt(layoutStr.slice(0, -1).trim());
      layoutUnitSuffix = 'bit';
      // Auto-infer layoutUnit from suffix if not explicitly set
      if (!layoutUnit) layoutUnit = 'bit';
    } else if (layoutStr.endsWith('B')) {
      layoutValue = parseInt(layoutStr.slice(0, -1).trim());
      layoutUnitSuffix = 'byte';
    } else {
      layoutValue = parseInt(layoutStr);
      layoutUnitSuffix = undefined;
    }

    if (isNaN(layoutValue) || layoutValue <= 0) {
      throw new ParseError('Invalid layout value');
    }

    // Default layoutUnit to byte if still not set
    const effectiveLayoutUnit = layoutUnit || 'byte';
    const effectiveSuffix = layoutUnitSuffix || effectiveLayoutUnit;

    // Convert to the layoutUnit
    if (effectiveLayoutUnit === 'bit') {
      // In bit layout mode, layout must be in bits
      layout = effectiveSuffix === 'byte' ? layoutValue * 8 : layoutValue;
    } else {
      // In byte layout mode, layout must be in bytes
      layout = effectiveSuffix === 'bit' ? Math.ceil(layoutValue / 8) : layoutValue;
    }
  } else {
    layout = 16;
  }

  // Parse size (supports suffix: b = bit, B = Byte, no suffix = depends on layoutUnit) and infer layoutUnit if not specified
  let size: number;
  if (typeof obj.size === 'number') {
    size = obj.size;
  } else if (typeof obj.size === 'string') {
    const sizeStr = obj.size.trim();
    let sizeValue: number;
    let sizeUnitSuffix: 'byte' | 'bit' | undefined;

    // Extract suffix
    if (sizeStr.endsWith('b')) {
      sizeValue = parseInt(sizeStr.slice(0, -1).trim());
      sizeUnitSuffix = 'bit';
      // Auto-infer layoutUnit from suffix if not explicitly set
      if (!layoutUnit) layoutUnit = 'bit';
    } else if (sizeStr.endsWith('B')) {
      sizeValue = parseInt(sizeStr.slice(0, -1).trim());
      sizeUnitSuffix = 'byte';
    } else {
      sizeValue = parseInt(sizeStr);
      sizeUnitSuffix = undefined;
    }

    if (isNaN(sizeValue) || sizeValue <= 0) {
      throw new ParseError('Invalid size value');
    }

    // Default layoutUnit to byte if still not set
    const effectiveLayoutUnit = layoutUnit || 'byte';
    const effectiveSizeUnit = sizeUnitSuffix || effectiveLayoutUnit;

    // Convert to the layoutUnit
    if (effectiveLayoutUnit === 'bit') {
      // In bit layout mode, size must be in bits
      size = effectiveSizeUnit === 'byte' ? sizeValue * 8 : sizeValue;
    } else {
      // In byte layout mode, size must be in bytes
      size = effectiveSizeUnit === 'bit' ? Math.ceil(sizeValue / 8) : sizeValue;
    }
  } else {
    throw new ParseError('Size must be a number or string');
  }

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

  // Parse legendPosition (optional)
  const legendPosition = obj.legendPosition && typeof obj.legendPosition === 'string'
    ? (obj.legendPosition as 'right' | 'left' | 'bottom' | 'none')
    : undefined;

  // Parse showFooter (optional)
  const showFooter = obj.showFooter !== undefined && typeof obj.showFooter === 'boolean'
    ? obj.showFooter
    : undefined;

  // Set final layoutUnit (default to byte if not inferred)
  const finalLayoutUnit = layoutUnit || 'byte';

  return {
    name: obj.name,
    size,
    layout,
    layoutUnit: finalLayoutUnit,
    colorScheme,
    legendPosition,
    showFooter,
    fields,
  };
}
