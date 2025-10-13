/**
 * LayoutEngine module tests
 * Tests for converting Fields to LayoutBlocks
 */

import { createLayout } from '../src/layoutEngine';
import { ByteGridConfig } from '../src/types';

describe('LayoutEngine', () => {
  describe('createLayout()', () => {
    it('should create layout blocks for single-row fields', () => {
      const config: ByteGridConfig = {
        name: 'Test',
        size: 16,
        layout: 16,
        fields: [
          { offset: '0-3', name: 'Field1', type: 'uint32_t', color: 'blue' },
          { offset: '4-7', name: 'Field2', type: 'uint32_t', color: 'cyan' },
        ],
      };

      const blocks = createLayout(config);

      expect(blocks).toHaveLength(2);

      // Field1: bytes 0-3
      expect(blocks[0].row).toBe(0);
      expect(blocks[0].col).toBe(0);
      expect(blocks[0].span).toBe(4);
      expect(blocks[0].fieldName).toBe('Field1');
      expect(blocks[0].color).toBe('blue');
      expect(blocks[0].offsetStart).toBe(0);
      expect(blocks[0].offsetEnd).toBe(3);

      // Field2: bytes 4-7
      expect(blocks[1].row).toBe(0);
      expect(blocks[1].col).toBe(4);
      expect(blocks[1].span).toBe(4);
      expect(blocks[1].fieldName).toBe('Field2');
      expect(blocks[1].color).toBe('cyan');
    });

    it('should split field across multiple rows', () => {
      const config: ByteGridConfig = {
        name: 'Test',
        size: 32,
        layout: 8,
        fields: [
          { offset: '0-15', name: 'LargeField', type: 'uint8_t[16]', color: 'green' },
        ],
      };

      const blocks = createLayout(config);

      // Should split into 2 blocks (8 bytes each)
      expect(blocks).toHaveLength(2);

      // First row: bytes 0-7
      expect(blocks[0].row).toBe(0);
      expect(blocks[0].col).toBe(0);
      expect(blocks[0].span).toBe(8);
      expect(blocks[0].fieldName).toBe('LargeField');
      expect(blocks[0].offsetStart).toBe(0);
      expect(blocks[0].offsetEnd).toBe(7);

      // Second row: bytes 8-15
      expect(blocks[1].row).toBe(1);
      expect(blocks[1].col).toBe(0);
      expect(blocks[1].span).toBe(8);
      expect(blocks[1].fieldName).toBe('LargeField');
      expect(blocks[1].offsetStart).toBe(8);
      expect(blocks[1].offsetEnd).toBe(15);
    });

    it('should handle field starting mid-row', () => {
      const config: ByteGridConfig = {
        name: 'Test',
        size: 16,
        layout: 8,
        fields: [
          { offset: '0-3', name: 'Field1', type: 'uint32_t' },
          { offset: '4-11', name: 'Field2', type: 'uint64_t', color: 'purple' },
        ],
      };

      const blocks = createLayout(config);

      expect(blocks).toHaveLength(3);

      // Field1: bytes 0-3 (row 0, col 0)
      expect(blocks[0].row).toBe(0);
      expect(blocks[0].col).toBe(0);
      expect(blocks[0].span).toBe(4);

      // Field2 part 1: bytes 4-7 (row 0, col 4)
      expect(blocks[1].row).toBe(0);
      expect(blocks[1].col).toBe(4);
      expect(blocks[1].span).toBe(4);
      expect(blocks[1].fieldName).toBe('Field2');
      expect(blocks[1].offsetStart).toBe(4);
      expect(blocks[1].offsetEnd).toBe(7);

      // Field2 part 2: bytes 8-11 (row 1, col 0)
      expect(blocks[2].row).toBe(1);
      expect(blocks[2].col).toBe(0);
      expect(blocks[2].span).toBe(4);
      expect(blocks[2].fieldName).toBe('Field2');
      expect(blocks[2].offsetStart).toBe(8);
      expect(blocks[2].offsetEnd).toBe(11);
    });

    it('should default to gray color for fields without color', () => {
      const config: ByteGridConfig = {
        name: 'Test',
        size: 8,
        fields: [
          { offset: '0-3', name: 'Field1', type: 'uint32_t' },
        ],
      };

      const blocks = createLayout(config);

      expect(blocks[0].color).toBe('gray');
    });

    it('should mark reserved and padding types', () => {
      const config: ByteGridConfig = {
        name: 'Test',
        size: 16,
        fields: [
          { offset: '0-3', name: 'Data', type: 'uint32_t' },
          { offset: '4-7', name: 'Reserved', type: 'reserved' },
          { offset: '8-11', name: 'Padding', type: 'padding' },
        ],
      };

      const blocks = createLayout(config);

      expect(blocks[0].isPadding).toBe(false);
      expect(blocks[1].isPadding).toBe(true);
      expect(blocks[2].isPadding).toBe(true);
    });

    it('should preserve field metadata', () => {
      const config: ByteGridConfig = {
        name: 'Test',
        size: 16,
        fields: [
          {
            offset: '0-3',
            name: 'ChunkID',
            type: 'char[4]',
            value: 'RIFF',
            description: 'RIFF magic number',
            color: 'blue',
          },
        ],
      };

      const blocks = createLayout(config);

      expect(blocks[0].value).toBe('RIFF');
      expect(blocks[0].description).toBe('RIFF magic number');
    });

    it('should handle single-byte fields', () => {
      const config: ByteGridConfig = {
        name: 'Test',
        size: 8,
        fields: [
          { offset: '0', name: 'Byte0', type: 'uint8_t' },
          { offset: '1', name: 'Byte1', type: 'uint8_t' },
        ],
      };

      const blocks = createLayout(config);

      expect(blocks).toHaveLength(2);
      expect(blocks[0].span).toBe(1);
      expect(blocks[1].span).toBe(1);
    });

    it('should handle bitfields', () => {
      const config: ByteGridConfig = {
        name: 'Test',
        size: 8,
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

      const blocks = createLayout(config);

      expect(blocks[0].bitfields).toBeDefined();
      expect(blocks[0].bitfields).toHaveLength(2);
    });

    it('should work with layout=16 (default)', () => {
      const config: ByteGridConfig = {
        name: 'Test',
        size: 32,
        fields: [
          { offset: '0-15', name: 'Row1', type: 'uint8_t[16]' },
          { offset: '16-31', name: 'Row2', type: 'uint8_t[16]' },
        ],
      };

      const blocks = createLayout(config);

      expect(blocks).toHaveLength(2);
      expect(blocks[0].row).toBe(0);
      expect(blocks[1].row).toBe(1);
    });

    it('should handle complex field arrangement', () => {
      const config: ByteGridConfig = {
        name: 'WAV Header',
        size: 44,
        layout: 16,
        fields: [
          { offset: '0-3', name: 'ChunkID', type: 'char[4]', color: 'blue' },
          { offset: '4-7', name: 'ChunkSize', type: 'uint32_t', color: 'cyan' },
          { offset: '8-11', name: 'Format', type: 'char[4]', color: 'blue' },
          { offset: '12-15', name: 'Subchunk1ID', type: 'char[4]', color: 'orange' },
        ],
      };

      const blocks = createLayout(config);

      // All in first row
      expect(blocks).toHaveLength(4);
      blocks.forEach((block) => {
        expect(block.row).toBe(0);
      });

      expect(blocks[0].col).toBe(0);
      expect(blocks[1].col).toBe(4);
      expect(blocks[2].col).toBe(8);
      expect(blocks[3].col).toBe(12);
    });
  });
});
