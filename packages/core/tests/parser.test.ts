/**
 * Parser module tests
 * Tests for parsing YAML input to ByteGridConfig
 */

import { parse } from '../src/parser';
import { ParseError } from '../src/errors';

describe('Parser', () => {
  describe('parse()', () => {
    it('should parse valid YAML with minimal fields', () => {
      const yaml = `
name: Test Structure
size: 16
fields:
  - offset: 0-3
    name: Header
    type: uint32_t
`;

      const result = parse(yaml);

      expect(result.name).toBe('Test Structure');
      expect(result.size).toBe(16);
      expect(result.fields).toHaveLength(1);
      expect(result.fields[0].offset).toBe('0-3');
      expect(result.fields[0].name).toBe('Header');
      expect(result.fields[0].type).toBe('uint32_t');
    });

    it('should apply default layout value of 16', () => {
      const yaml = `
name: Test
size: 32
fields:
  - offset: 0-3
    name: Field1
    type: uint32_t
`;

      const result = parse(yaml);

      expect(result.layout).toBe(16);
    });

    it('should use custom layout if provided', () => {
      const yaml = `
name: Test
size: 32
layout: 8
fields:
  - offset: 0-3
    name: Field1
    type: uint32_t
`;

      const result = parse(yaml);

      expect(result.layout).toBe(8);
    });

    it('should parse fields with all optional properties', () => {
      const yaml = `
name: WAV Header
size: 44
fields:
  - offset: 0-3
    name: ChunkID
    type: char[4]
    value: "RIFF"
    description: "RIFF magic number"
    color: blue
    endianness: little
`;

      const result = parse(yaml);

      const field = result.fields[0];
      expect(field.value).toBe('RIFF');
      expect(field.description).toBe('RIFF magic number');
      expect(field.color).toBe('blue');
      expect(field.endianness).toBe('little');
    });

    it('should parse multiple fields', () => {
      const yaml = `
name: Test
size: 16
fields:
  - offset: 0-3
    name: Field1
    type: uint32_t
  - offset: 4-7
    name: Field2
    type: uint32_t
  - offset: 8-15
    name: Field3
    type: uint64_t
`;

      const result = parse(yaml);

      expect(result.fields).toHaveLength(3);
      expect(result.fields[0].name).toBe('Field1');
      expect(result.fields[1].name).toBe('Field2');
      expect(result.fields[2].name).toBe('Field3');
    });

    it('should parse bitfields', () => {
      const yaml = `
name: TCP Header
size: 20
fields:
  - offset: 12
    name: Flags
    type: uint8_t
    bitfields:
      - name: CWR
        bits: "7"
      - name: ECE
        bits: "6"
      - name: URG
        bits: "5"
`;

      const result = parse(yaml);

      const field = result.fields[0];
      expect(field.bitfields).toBeDefined();
      expect(field.bitfields).toHaveLength(3);
      expect(field.bitfields![0].name).toBe('CWR');
      expect(field.bitfields![0].bits).toBe('7');
    });

    it('should throw ParseError for invalid YAML', () => {
      const yaml = `
name: Test
size: 16
fields:
  - offset: 0-3
  name: Field1  # Wrong indentation
  type: uint32_t
`;

      expect(() => parse(yaml)).toThrow(ParseError);
    });

    it('should throw ParseError for missing required field: name', () => {
      const yaml = `
size: 16
fields:
  - offset: 0-3
    name: Field1
    type: uint32_t
`;

      expect(() => parse(yaml)).toThrow(ParseError);
      expect(() => parse(yaml)).toThrow(/required field.*name/i);
    });

    it('should throw ParseError for missing required field: size', () => {
      const yaml = `
name: Test
fields:
  - offset: 0-3
    name: Field1
    type: uint32_t
`;

      expect(() => parse(yaml)).toThrow(ParseError);
      expect(() => parse(yaml)).toThrow(/required field.*size/i);
    });

    it('should throw ParseError for missing required field: fields', () => {
      const yaml = `
name: Test
size: 16
`;

      expect(() => parse(yaml)).toThrow(ParseError);
      expect(() => parse(yaml)).toThrow(/required field.*fields/i);
    });

    it('should throw ParseError for empty fields array', () => {
      const yaml = `
name: Test
size: 16
fields: []
`;

      expect(() => parse(yaml)).toThrow(ParseError);
      expect(() => parse(yaml)).toThrow(/at least one field/i);
    });

    it('should throw ParseError for field missing offset', () => {
      const yaml = `
name: Test
size: 16
fields:
  - name: Field1
    type: uint32_t
`;

      expect(() => parse(yaml)).toThrow(ParseError);
      expect(() => parse(yaml)).toThrow(/field.*offset/i);
    });

    it('should throw ParseError for field missing name', () => {
      const yaml = `
name: Test
size: 16
fields:
  - offset: 0-3
    type: uint32_t
`;

      expect(() => parse(yaml)).toThrow(ParseError);
      expect(() => parse(yaml)).toThrow(/field.*name/i);
    });

    it('should throw ParseError for field missing type', () => {
      const yaml = `
name: Test
size: 16
fields:
  - offset: 0-3
    name: Field1
`;

      expect(() => parse(yaml)).toThrow(ParseError);
      expect(() => parse(yaml)).toThrow(/field.*type/i);
    });
  });
});
