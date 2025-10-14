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

    // Bit-unit layout tests
    describe('Bit-unit layout', () => {
      it('should parse layoutUnit: bit', () => {
        const yaml = `
name: Bit Layout Test
size: 2
layoutUnit: bit
layout: 16
fields:
  - offset: 0-7b
    name: BitField
    type: uint8_t
`;

        const result = parse(yaml);

        expect(result.layoutUnit).toBe('bit');
        expect(result.layout).toBe(16);
      });

      it('should default layoutUnit to byte', () => {
        const yaml = `
name: Test
size: 16
fields:
  - offset: 0-3
    name: Field1
    type: uint32_t
`;

        const result = parse(yaml);

        expect(result.layoutUnit).toBe('byte');
      });

      it('should parse bit offset with b suffix: 0-7b', () => {
        const yaml = `
name: Test
size: 2
layoutUnit: bit
fields:
  - offset: 0-7b
    name: BitField
    type: uint8_t
`;

        const result = parse(yaml);

        expect(result.fields[0].offset).toBe('0-7b');
      });

      it('should parse Byte offset with B suffix: 0B', () => {
        const yaml = `
name: Test
size: 2
layoutUnit: bit
fields:
  - offset: 0B
    name: ByteField
    type: uint8_t
`;

        const result = parse(yaml);

        expect(result.fields[0].offset).toBe('0B');
      });

      it('should parse offset without suffix as Byte', () => {
        const yaml = `
name: Test
size: 2
layoutUnit: bit
fields:
  - offset: 0-1
    name: TwoBytes
    type: uint16_t
`;

        const result = parse(yaml);

        expect(result.fields[0].offset).toBe('0-1');
      });

      it('should parse mixed bit and Byte offsets', () => {
        const yaml = `
name: IPv4 Header
size: 4
layoutUnit: bit
layout: 32
fields:
  - offset: 0-3b
    name: Version
    type: bits
  - offset: 4-7b
    name: IHL
    type: bits
  - offset: 1B
    name: DSCP
    type: uint8_t
`;

        const result = parse(yaml);

        expect(result.fields).toHaveLength(3);
        expect(result.fields[0].offset).toBe('0-3b');
        expect(result.fields[1].offset).toBe('4-7b');
        expect(result.fields[2].offset).toBe('1B');
      });

      it('should parse size with B suffix (Byte)', () => {
        const yaml = `
name: Test
size: 4B
layoutUnit: bit
fields:
  - offset: 0-31b
    name: Field1
    type: uint32_t
`;

        const result = parse(yaml);

        expect(result.size).toBe(32); // 4 bytes = 32 bits (in bit layout mode)
      });

      it('should parse size with b suffix (bit)', () => {
        const yaml = `
name: Test
size: 32b
layoutUnit: bit
fields:
  - offset: 0-31b
    name: Field1
    type: uint32_t
`;

        const result = parse(yaml);

        expect(result.size).toBe(32); // 32 bits
      });

      it('should parse size without suffix (uses layoutUnit)', () => {
        const yaml = `
name: Test
size: 4
layoutUnit: byte
fields:
  - offset: 0-3
    name: Field1
    type: uint32_t
`;

        const result = parse(yaml);

        expect(result.size).toBe(4); // 4 bytes (layoutUnit=byte)
      });

      it('should parse layout with B suffix (Byte)', () => {
        const yaml = `
name: Test
size: 16b
layoutUnit: bit
layout: 2B
fields:
  - offset: 0-15b
    name: Field1
    type: uint16_t
`;

        const result = parse(yaml);

        expect(result.layout).toBe(16); // 2 Bytes = 16 bits (in bit layout mode)
      });

      it('should parse layout with b suffix (bit)', () => {
        const yaml = `
name: Test
size: 32b
layoutUnit: bit
layout: 24b
fields:
  - offset: 0-31b
    name: Field1
    type: uint32_t
`;

        const result = parse(yaml);

        expect(result.layout).toBe(24); // 24 bits
      });

      it('should parse layout without suffix (uses layoutUnit)', () => {
        const yaml = `
name: Test
size: 32
layoutUnit: byte
layout: 8
fields:
  - offset: 0-31
    name: Field1
    type: uint8_t[32]
`;

        const result = parse(yaml);

        expect(result.layout).toBe(8); // 8 bytes (layoutUnit=byte)
      });

      it('should auto-infer layoutUnit=bit from b suffix', () => {
        const yaml = `
name: Test
size: 32b
layout: 16b
fields:
  - offset: 0-7b
    name: Field1
    type: uint8_t
`;

        const result = parse(yaml);

        expect(result.layoutUnit).toBe('bit'); // Auto-inferred from b suffix
        expect(result.size).toBe(32);
        expect(result.layout).toBe(16);
      });

      it('should default to byte when no layoutUnit and no b suffix', () => {
        const yaml = `
name: Test
size: 4B
layout: 16
fields:
  - offset: 0-3
    name: Field1
    type: uint32_t
`;

        const result = parse(yaml);

        expect(result.layoutUnit).toBe('byte'); // Default
        expect(result.size).toBe(4);
        expect(result.layout).toBe(16);
      });

      it('should prefer explicit layoutUnit over suffix inference', () => {
        const yaml = `
name: Test
size: 4B
layoutUnit: byte
layout: 16
fields:
  - offset: 0-31b
    name: Field1
    type: bits
`;

        const result = parse(yaml);

        expect(result.layoutUnit).toBe('byte'); // Explicit wins
      });
    });

    // Legend position tests
    describe('Legend position', () => {
      it('should parse legendPosition: right', () => {
        const yaml = `
name: Test
size: 16
legendPosition: right
fields:
  - offset: 0-3
    name: Field1
    type: uint32_t
`;

        const result = parse(yaml);

        expect(result.legendPosition).toBe('right');
      });

      it('should parse legendPosition: left', () => {
        const yaml = `
name: Test
size: 16
legendPosition: left
fields:
  - offset: 0-3
    name: Field1
    type: uint32_t
`;

        const result = parse(yaml);

        expect(result.legendPosition).toBe('left');
      });

      it('should parse legendPosition: bottom', () => {
        const yaml = `
name: Test
size: 16
legendPosition: bottom
fields:
  - offset: 0-3
    name: Field1
    type: uint32_t
`;

        const result = parse(yaml);

        expect(result.legendPosition).toBe('bottom');
      });

      it('should parse legendPosition: none', () => {
        const yaml = `
name: Test
size: 16
legendPosition: none
fields:
  - offset: 0-3
    name: Field1
    type: uint32_t
`;

        const result = parse(yaml);

        expect(result.legendPosition).toBe('none');
      });

      it('should return undefined when legendPosition is not specified', () => {
        const yaml = `
name: Test
size: 16
fields:
  - offset: 0-3
    name: Field1
    type: uint32_t
`;

        const result = parse(yaml);

        expect(result.legendPosition).toBeUndefined();
      });
    });

    // showFooter tests
    describe('showFooter', () => {
      it('should parse showFooter: true', () => {
        const yaml = `
name: Test
size: 16
showFooter: true
fields:
  - offset: 0-3
    name: Field1
    type: uint32_t
`;

        const result = parse(yaml);

        expect(result.showFooter).toBe(true);
      });

      it('should parse showFooter: false', () => {
        const yaml = `
name: Test
size: 16
showFooter: false
fields:
  - offset: 0-3
    name: Field1
    type: uint32_t
`;

        const result = parse(yaml);

        expect(result.showFooter).toBe(false);
      });

      it('should return undefined when showFooter is not specified', () => {
        const yaml = `
name: Test
size: 16
fields:
  - offset: 0-3
    name: Field1
    type: uint32_t
`;

        const result = parse(yaml);

        expect(result.showFooter).toBeUndefined();
      });
    });
  });
});
