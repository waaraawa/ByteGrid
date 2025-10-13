/**
 * SVGRenderer module tests
 * Tests for rendering LayoutBlocks to SVG
 */

import { renderSVG } from '../src/svgRenderer';
import { ByteGridConfig, LayoutBlock, RenderOptions } from '../src/types';

describe('SVGRenderer', () => {
  describe('renderSVG()', () => {
    const sampleConfig: ByteGridConfig = {
      name: 'Test Structure',
      size: 16,
      layout: 16,
      fields: [
        { offset: '0-3', name: 'Field1', type: 'uint32_t', color: 'blue' },
        { offset: '4-7', name: 'Field2', type: 'uint32_t', color: 'cyan' },
      ],
    };

    const sampleBlocks: LayoutBlock[] = [
      {
        row: 0,
        col: 0,
        span: 4,
        fieldName: 'Field1',
        fieldType: 'uint32_t',
        color: 'blue',
        offsetStart: 0,
        offsetEnd: 3,
        isPadding: false,
      },
      {
        row: 0,
        col: 4,
        span: 4,
        fieldName: 'Field2',
        fieldType: 'uint32_t',
        color: 'cyan',
        offsetStart: 4,
        offsetEnd: 7,
        isPadding: false,
      },
    ];

    it('should return a string', () => {
      const svg = renderSVG(sampleConfig, sampleBlocks);

      expect(typeof svg).toBe('string');
      expect(svg.length).toBeGreaterThan(0);
    });

    it('should contain SVG opening and closing tags', () => {
      const svg = renderSVG(sampleConfig, sampleBlocks);

      expect(svg).toContain('<svg');
      expect(svg).toContain('</svg>');
    });

    it('should include config name as title', () => {
      const svg = renderSVG(sampleConfig, sampleBlocks);

      expect(svg).toContain('Test Structure');
    });

    it('should render blocks with colors', () => {
      const svg = renderSVG(sampleConfig, sampleBlocks);

      // Should contain rect elements
      expect(svg).toContain('<rect');
      expect(svg).toContain('fill');
    });

    it('should render legend with field names', () => {
      const svg = renderSVG(sampleConfig, sampleBlocks);

      expect(svg).toContain('Field1');
      expect(svg).toContain('Field2');
    });

    it('should render footer with size and layout info', () => {
      const svg = renderSVG(sampleConfig, sampleBlocks);

      expect(svg).toContain('16 bytes');
      expect(svg).toContain('16 bytes/row');
    });

    it('should handle custom render options', () => {
      const options: RenderOptions = {
        cellWidth: 40,
        cellHeight: 40,
        showGrid: true,
        showLegend: true,
      };

      const svg = renderSVG(sampleConfig, sampleBlocks, options);

      expect(typeof svg).toBe('string');
      expect(svg).toContain('<svg');
    });

    it('should render byte numbers in cells', () => {
      const svg = renderSVG(sampleConfig, sampleBlocks);

      // Should contain byte numbers
      expect(svg).toMatch(/>\s*0\s*</);
      expect(svg).toMatch(/>\s*1\s*</);
    });

    it('should handle blocks across multiple rows', () => {
      const config: ByteGridConfig = {
        name: 'Multi-row Test',
        size: 32,
        layout: 8,
        fields: [{ offset: '0-15', name: 'LargeField', type: 'uint8_t[16]' }],
      };

      const blocks: LayoutBlock[] = [
        {
          row: 0,
          col: 0,
          span: 8,
          fieldName: 'LargeField',
          fieldType: 'uint8_t[16]',
          color: 'green',
          offsetStart: 0,
          offsetEnd: 7,
          isPadding: false,
        },
        {
          row: 1,
          col: 0,
          span: 8,
          fieldName: 'LargeField',
          fieldType: 'uint8_t[16]',
          color: 'green',
          offsetStart: 8,
          offsetEnd: 15,
          isPadding: false,
        },
      ];

      const svg = renderSVG(config, blocks);

      expect(svg).toContain('LargeField');
      expect(svg).toContain('<svg');
    });

    it('should handle empty blocks array', () => {
      const config: ByteGridConfig = {
        name: 'Empty',
        size: 16,
        fields: [],
      };

      const svg = renderSVG(config, []);

      expect(svg).toContain('<svg');
      expect(svg).toContain('Empty');
    });

    it('should render with default options when not provided', () => {
      const svg = renderSVG(sampleConfig, sampleBlocks);

      expect(svg).toContain('<svg');
    });

    // Bitfield visualization tests
    describe('Bitfield visualization', () => {
      const bitfieldConfig: ByteGridConfig = {
        name: 'Test Bitfields',
        size: 2,
        layout: 8,
        fields: [
          {
            offset: '0',
            name: 'Flags',
            type: 'uint8_t',
            color: 'yellow',
            bitfields: [
              { name: 'BIT0', bits: '0' },
              { name: 'BIT1', bits: '1' },
              { name: 'BIT7', bits: '7' },
            ],
          },
          {
            offset: '1',
            name: 'Value',
            type: 'uint8_t',
            color: 'blue',
          },
        ],
      };

      const bitfieldBlocks: LayoutBlock[] = [
        {
          row: 0,
          col: 0,
          span: 1,
          fieldName: 'Flags',
          fieldType: 'uint8_t',
          color: 'yellow',
          offsetStart: 0,
          offsetEnd: 0,
          isPadding: false,
          bitfields: [
            { name: 'BIT0', bits: '0' },
            { name: 'BIT1', bits: '1' },
            { name: 'BIT7', bits: '7' },
          ],
        },
        {
          row: 0,
          col: 1,
          span: 1,
          fieldName: 'Value',
          fieldType: 'uint8_t',
          color: 'blue',
          offsetStart: 1,
          offsetEnd: 1,
          isPadding: false,
        },
      ];

      it('should render bit grid lines for cells with bitfields', () => {
        const svg = renderSVG(bitfieldConfig, bitfieldBlocks);

        // Should contain vertical lines for bit divisions
        expect(svg).toContain('<line');
        expect(svg).toContain('stroke="#ccc"');
      });

      it('should render bit numbers (0-7) in bitfield cells', () => {
        const svg = renderSVG(bitfieldConfig, bitfieldBlocks);

        // Should contain bit numbers
        expect(svg).toContain('>0<');
        expect(svg).toContain('>7<');
      });

      it('should use increased height (45px) for bitfield rows by default', () => {
        const svg = renderSVG(bitfieldConfig, bitfieldBlocks);

        // Should have 45px height for bitfield cells
        expect(svg).toContain('height="45"');
      });

      it('uniformRowHeight: false - bitfield rows are taller', () => {
        const svg = renderSVG(bitfieldConfig, bitfieldBlocks, {
          uniformRowHeight: false,
        });

        // Should have 45px for bitfield row
        expect(svg).toContain('height="45"');
      });

      it('uniformRowHeight: true - all rows have same height', () => {
        const svg = renderSVG(bitfieldConfig, bitfieldBlocks, {
          uniformRowHeight: true,
        });

        // All cells should be 45px when there are bitfields and uniformRowHeight is true
        expect(svg).toContain('height="45"');
      });

      it('should NOT render bit grid for cells without bitfields', () => {
        const noBitfieldBlocks: LayoutBlock[] = [
          {
            row: 0,
            col: 0,
            span: 1,
            fieldName: 'Value',
            fieldType: 'uint8_t',
            color: 'blue',
            offsetStart: 0,
            offsetEnd: 0,
            isPadding: false,
          },
        ];

        const svg = renderSVG(bitfieldConfig, noBitfieldBlocks);

        // Should use default height (30px) when no bitfields
        expect(svg).toContain('height="30"');
      });
    });
  });
});
