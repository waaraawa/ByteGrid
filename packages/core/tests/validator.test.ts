/**
 * Validator module tests
 * Tests for validating ByteGridConfig
 */

import { validate, parseOffset } from '../src/validator';
import { ValidationError } from '../src/errors';
import { ByteGridConfig } from '../src/types';

describe('Validator', () => {
  describe('parseOffset()', () => {
    it('should parse range offset format "0-3"', () => {
      const result = parseOffset('0-3');

      expect(result.start).toBe(0);
      expect(result.end).toBe(3);
      expect(result.size).toBe(4);
    });

    it('should parse single byte offset format "4"', () => {
      const result = parseOffset('4');

      expect(result.start).toBe(4);
      expect(result.end).toBe(4);
      expect(result.size).toBe(1);
    });

    it('should parse offset with whitespace "0 - 3"', () => {
      const result = parseOffset('0 - 3');

      expect(result.start).toBe(0);
      expect(result.end).toBe(3);
      expect(result.size).toBe(4);
    });

    it('should throw ValidationError for invalid format', () => {
      expect(() => parseOffset('abc')).toThrow(ValidationError);
      expect(() => parseOffset('0-3-5')).toThrow(ValidationError);
      expect(() => parseOffset('')).toThrow(ValidationError);
    });

    it('should throw ValidationError for reverse range "3-0"', () => {
      expect(() => parseOffset('3-0')).toThrow(ValidationError);
      expect(() => parseOffset('3-0')).toThrow(/end.*must be greater/i);
    });

    it('should throw ValidationError for negative offset', () => {
      expect(() => parseOffset('-1')).toThrow(ValidationError);
      expect(() => parseOffset('-5-3')).toThrow(ValidationError);
    });
  });

  describe('validate()', () => {
    it('should validate valid config with no overlaps', () => {
      const config: ByteGridConfig = {
        name: 'Test',
        size: 16,
        fields: [
          { offset: '0-3', name: 'Field1', type: 'uint32_t' },
          { offset: '4-7', name: 'Field2', type: 'uint32_t' },
          { offset: '8-15', name: 'Field3', type: 'uint64_t' },
        ],
      };

      expect(() => validate(config)).not.toThrow();
    });

    it('should throw ValidationError for overlapping fields', () => {
      const config: ByteGridConfig = {
        name: 'Test',
        size: 16,
        fields: [
          { offset: '0-7', name: 'Field1', type: 'uint64_t' },
          { offset: '4-11', name: 'Field2', type: 'uint64_t' }, // overlaps with Field1
        ],
      };

      expect(() => validate(config)).toThrow(ValidationError);
      expect(() => validate(config)).toThrow(/overlap/i);
    });

    it('should throw ValidationError for field exceeding total size', () => {
      const config: ByteGridConfig = {
        name: 'Test',
        size: 16,
        fields: [
          { offset: '0-7', name: 'Field1', type: 'uint64_t' },
          { offset: '8-19', name: 'Field2', type: 'uint64_t' }, // exceeds size 16
        ],
      };

      expect(() => validate(config)).toThrow(ValidationError);
      expect(() => validate(config)).toThrow(/exceeds total size/i);
    });

    it('should throw ValidationError for field starting beyond total size', () => {
      const config: ByteGridConfig = {
        name: 'Test',
        size: 16,
        fields: [
          { offset: '20-23', name: 'Field1', type: 'uint32_t' },
        ],
      };

      expect(() => validate(config)).toThrow(ValidationError);
      expect(() => validate(config)).toThrow(/exceeds total size/i);
    });

    it('should throw ValidationError for unsupported type', () => {
      const config: ByteGridConfig = {
        name: 'Test',
        size: 16,
        fields: [
          { offset: '0-3', name: 'Field1', type: 'invalid_type' },
        ],
      };

      expect(() => validate(config)).toThrow(ValidationError);
      expect(() => validate(config)).toThrow(/unsupported type/i);
    });

    it('should allow reserved and padding types', () => {
      const config: ByteGridConfig = {
        name: 'Test',
        size: 16,
        fields: [
          { offset: '0-3', name: 'Reserved1', type: 'reserved' },
          { offset: '4-7', name: 'Padding1', type: 'padding' },
        ],
      };

      expect(() => validate(config)).not.toThrow();
    });

    it('should allow array types like char[4]', () => {
      const config: ByteGridConfig = {
        name: 'Test',
        size: 20,
        fields: [
          { offset: '0-3', name: 'ChunkID', type: 'char[4]' },
          { offset: '4-19', name: 'Buffer', type: 'uint8_t[16]' },
        ],
      };

      expect(() => validate(config)).not.toThrow();
    });

    it('should detect multiple overlapping fields', () => {
      const config: ByteGridConfig = {
        name: 'Test',
        size: 32,
        fields: [
          { offset: '0-7', name: 'Field1', type: 'uint64_t' },
          { offset: '4-11', name: 'Field2', type: 'uint64_t' },
          { offset: '8-15', name: 'Field3', type: 'uint64_t' },
        ],
      };

      expect(() => validate(config)).toThrow(ValidationError);
      expect(() => validate(config)).toThrow(/overlap/i);
    });

    it('should allow adjacent fields with no gap', () => {
      const config: ByteGridConfig = {
        name: 'Test',
        size: 12,
        fields: [
          { offset: '0-3', name: 'Field1', type: 'uint32_t' },
          { offset: '4-7', name: 'Field2', type: 'uint32_t' },
          { offset: '8-11', name: 'Field3', type: 'uint32_t' },
        ],
      };

      expect(() => validate(config)).not.toThrow();
    });

    it('should throw ValidationError for invalid offset format in field', () => {
      const config: ByteGridConfig = {
        name: 'Test',
        size: 16,
        fields: [
          { offset: 'invalid', name: 'Field1', type: 'uint32_t' },
        ],
      };

      expect(() => validate(config)).toThrow(ValidationError);
    });

    it('should validate bitfields within a field', () => {
      const config: ByteGridConfig = {
        name: 'Test',
        size: 16,
        fields: [
          {
            offset: '0',
            name: 'Flags',
            type: 'uint8_t',
            bitfields: [
              { name: 'Bit7', bits: '7' },
              { name: 'Bit6', bits: '6' },
            ],
          },
        ],
      };

      expect(() => validate(config)).not.toThrow();
    });

    it('should throw ValidationError for invalid bitfield bits format', () => {
      const config: ByteGridConfig = {
        name: 'Test',
        size: 16,
        fields: [
          {
            offset: '0',
            name: 'Flags',
            type: 'uint8_t',
            bitfields: [
              { name: 'Bit', bits: 'invalid' },
            ],
          },
        ],
      };

      expect(() => validate(config)).toThrow(ValidationError);
      expect(() => validate(config)).toThrow(/bitfield.*invalid/i);
    });

    it('should throw ValidationError for bitfield bit out of range', () => {
      const config: ByteGridConfig = {
        name: 'Test',
        size: 16,
        fields: [
          {
            offset: '0',
            name: 'Flags',
            type: 'uint8_t',
            bitfields: [
              { name: 'Bit', bits: '8' }, // uint8_t has bits 0-7
            ],
          },
        ],
      };

      expect(() => validate(config)).toThrow(ValidationError);
      expect(() => validate(config)).toThrow(/bit.*out of range/i);
    });
  });
});
