/**
 * Validator module tests
 * Tests for validating ByteGridConfig
 */

import { validate, parseOffset } from '../src/validator';
import { ValidationError } from '../src/errors';
import { ByteGridConfig, DataType } from '../src/types';

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
        fields: [{ offset: '20-23', name: 'Field1', type: 'uint32_t' }],
      };

      expect(() => validate(config)).toThrow(ValidationError);
      expect(() => validate(config)).toThrow(/exceeds total size/i);
    });

    it('should throw ValidationError for unsupported type', () => {
      const config: ByteGridConfig = {
        name: 'Test',
        size: 16,
        fields: [{ offset: '0-3', name: 'Field1', type: 'invalid_type' as DataType }],
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
        fields: [{ offset: 'invalid', name: 'Field1', type: 'uint32_t' }],
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
            bitfields: [{ name: 'Bit', bits: 'invalid' }],
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

  describe('parseOffset() - bit/byte suffix', () => {
    it('should parse bit offset with b suffix: 0-7b', () => {
      const result = parseOffset('0-7b');

      expect(result.start).toBe(0);
      expect(result.end).toBe(7);
      expect(result.size).toBe(8);
      expect(result.unit).toBe('bit');
    });

    it('should parse single bit with b suffix: 5b', () => {
      const result = parseOffset('5b');

      expect(result.start).toBe(5);
      expect(result.end).toBe(5);
      expect(result.size).toBe(1);
      expect(result.unit).toBe('bit');
    });

    it('should parse Byte offset with B suffix: 0B', () => {
      const result = parseOffset('0B');

      expect(result.start).toBe(0);
      expect(result.end).toBe(0);
      expect(result.size).toBe(1);
      expect(result.unit).toBe('byte');
    });

    it('should parse Byte range with B suffix: 1-3B', () => {
      const result = parseOffset('1-3B');

      expect(result.start).toBe(1);
      expect(result.end).toBe(3);
      expect(result.size).toBe(3);
      expect(result.unit).toBe('byte');
    });

    it('should default to byte unit when no suffix: 0-3', () => {
      const result = parseOffset('0-3');

      expect(result.start).toBe(0);
      expect(result.end).toBe(3);
      expect(result.size).toBe(4);
      expect(result.unit).toBe('byte');
    });

    it('should parse with whitespace: 0 - 7b', () => {
      const result = parseOffset('0 - 7b');

      expect(result.start).toBe(0);
      expect(result.end).toBe(7);
      expect(result.size).toBe(8);
      expect(result.unit).toBe('bit');
    });
  });

  describe('validate() - bit-unit layout', () => {
    it('should validate bit-unit layout with bit offsets', () => {
      const config: ByteGridConfig = {
        name: 'Bit Layout',
        size: 16, // 16 bits = 2 bytes
        layoutUnit: 'bit',
        layout: 16,
        fields: [
          { offset: '0-7b', name: 'FirstByte', type: 'uint8_t' },
          { offset: '8-15b', name: 'SecondByte', type: 'uint8_t' },
        ],
      };

      expect(() => validate(config)).not.toThrow();
    });

    it('should validate mixed bit and Byte offsets', () => {
      const config: ByteGridConfig = {
        name: 'Mixed Layout',
        size: 32, // 32 bits = 4 bytes
        layoutUnit: 'bit',
        layout: 32,
        fields: [
          { offset: '0-3b', name: 'Version', type: 'bits' },
          { offset: '4-7b', name: 'IHL', type: 'bits' },
          { offset: '1B', name: 'DSCP', type: 'uint8_t' },
        ],
      };

      expect(() => validate(config)).not.toThrow();
    });

    it('should detect overlap in bit-unit layout', () => {
      const config: ByteGridConfig = {
        name: 'Overlap Test',
        size: 16, // 16 bits = 2 bytes
        layoutUnit: 'bit',
        fields: [
          { offset: '0-7b', name: 'Field1', type: 'uint8_t' },
          { offset: '4-11b', name: 'Field2', type: 'uint8_t' }, // overlaps bits 4-7
        ],
      };

      expect(() => validate(config)).toThrow(ValidationError);
      expect(() => validate(config)).toThrow(/overlap/i);
    });

    it('should detect overlap between bit and Byte offsets', () => {
      const config: ByteGridConfig = {
        name: 'Mixed Overlap',
        size: 16, // 16 bits = 2 bytes
        layoutUnit: 'bit',
        fields: [
          { offset: '0-3b', name: 'Version', type: 'bits' },
          { offset: '0B', name: 'FullByte', type: 'uint8_t' }, // overlaps bits 0-3
        ],
      };

      expect(() => validate(config)).toThrow(ValidationError);
      expect(() => validate(config)).toThrow(/overlap/i);
    });

    it('should throw ValidationError if bit offset exceeds size', () => {
      const config: ByteGridConfig = {
        name: 'Size Test',
        size: 16, // 16 bits
        layoutUnit: 'bit',
        fields: [
          { offset: '0-19b', name: 'TooBig', type: 'bits' }, // exceeds 16 bits
        ],
      };

      expect(() => validate(config)).toThrow(ValidationError);
      expect(() => validate(config)).toThrow(/exceeds total size/i);
    });
  });
});
