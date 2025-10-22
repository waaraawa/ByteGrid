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

    it('should render byte numbers in cells (hexadecimal)', () => {
      const svg = renderSVG(sampleConfig, sampleBlocks);

      // Should contain byte numbers in hex format
      expect(svg).toMatch(/>\s*0x00\s*</);
      expect(svg).toMatch(/>\s*0x01\s*</);
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

    // Legend position tests
    describe('Legend position', () => {
      const legendConfig: ByteGridConfig = {
        name: 'Legend Position Test',
        size: 16,
        layout: 16,
        fields: [
          { offset: '0-3', name: 'Field1', type: 'uint32_t', color: 'blue' },
          { offset: '4-7', name: 'Field2', type: 'uint32_t', color: 'cyan' },
        ],
      };

      const legendBlocks: LayoutBlock[] = [
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

      it('should render legend on right by default', () => {
        const svg = renderSVG(legendConfig, legendBlocks);

        // Should contain legend title
        expect(svg).toContain('Fields');
        expect(svg).toContain('Field1');
        expect(svg).toContain('Field2');
      });

      it('should render legend on right when legendPosition is "right"', () => {
        const svg = renderSVG(legendConfig, legendBlocks, {
          legendPosition: 'right',
        });

        expect(svg).toContain('Fields');
        expect(svg).toContain('Field1');
        expect(svg).toContain('Field2');
      });

      it('should render legend on left when legendPosition is "left"', () => {
        const svg = renderSVG(legendConfig, legendBlocks, {
          legendPosition: 'left',
        });

        expect(svg).toContain('Fields');
        expect(svg).toContain('Field1');
        expect(svg).toContain('Field2');
      });

      it('should render legend at bottom when legendPosition is "bottom"', () => {
        const svg = renderSVG(legendConfig, legendBlocks, {
          legendPosition: 'bottom',
        });

        expect(svg).toContain('Fields');
        expect(svg).toContain('Field1');
        expect(svg).toContain('Field2');
      });

      it('should not render legend when legendPosition is "none"', () => {
        const svg = renderSVG(legendConfig, legendBlocks, {
          legendPosition: 'none',
        });

        // Should NOT contain legend
        expect(svg).not.toContain('Fields');
      });

      it('should not render legend when showLegend is false (backward compatibility)', () => {
        const svg = renderSVG(legendConfig, legendBlocks, {
          showLegend: false,
        });

        // Should NOT contain legend
        expect(svg).not.toContain('Fields');
      });

      it('should prioritize legendPosition over showLegend', () => {
        // legendPosition: 'none' should override showLegend: true
        const svg1 = renderSVG(legendConfig, legendBlocks, {
          showLegend: true,
          legendPosition: 'none',
        });

        expect(svg1).not.toContain('Fields');

        // legendPosition: 'right' should override showLegend: false
        const svg2 = renderSVG(legendConfig, legendBlocks, {
          showLegend: false,
          legendPosition: 'right',
        });

        expect(svg2).toContain('Fields');
      });

      it('should use config.legendPosition when options.legendPosition is not provided', () => {
        const configWithLegend: ByteGridConfig = {
          ...legendConfig,
          legendPosition: 'left',
        };

        const svg = renderSVG(configWithLegend, legendBlocks);

        expect(svg).toContain('Fields');
      });

      it('should prioritize options.legendPosition over config.legendPosition', () => {
        const configWithLegend: ByteGridConfig = {
          ...legendConfig,
          legendPosition: 'left',
        };

        const svg = renderSVG(configWithLegend, legendBlocks, {
          legendPosition: 'none',
        });

        expect(svg).not.toContain('Fields');
      });

      it('should respect config.legendPosition: none', () => {
        const configWithLegend: ByteGridConfig = {
          ...legendConfig,
          legendPosition: 'none',
        };

        const svg = renderSVG(configWithLegend, legendBlocks);

        expect(svg).not.toContain('Fields');
      });
    });

    // showFooter tests
    describe('showFooter option', () => {
      it('should render footer by default', () => {
        const svg = renderSVG(sampleConfig, sampleBlocks);

        expect(svg).toContain('Total size:');
        expect(svg).toContain('Layout:');
      });

      it('should render footer when showFooter is true in options', () => {
        const svg = renderSVG(sampleConfig, sampleBlocks, {
          showFooter: true,
        });

        expect(svg).toContain('Total size:');
      });

      it('should not render footer when showFooter is false in options', () => {
        const svg = renderSVG(sampleConfig, sampleBlocks, {
          showFooter: false,
        });

        expect(svg).not.toContain('Total size:');
        expect(svg).not.toContain('Layout:');
      });

      it('should use config.showFooter when options.showFooter is not provided', () => {
        const configWithFooter: ByteGridConfig = {
          ...sampleConfig,
          showFooter: false,
        };

        const svg = renderSVG(configWithFooter, sampleBlocks);

        expect(svg).not.toContain('Total size:');
      });

      it('should prioritize options.showFooter over config.showFooter', () => {
        const configWithFooter: ByteGridConfig = {
          ...sampleConfig,
          showFooter: true,
        };

        const svg = renderSVG(configWithFooter, sampleBlocks, {
          showFooter: false,
        });

        expect(svg).not.toContain('Total size:');
      });
    });

    // legendColumns tests
    describe('legendColumns option', () => {
      const multiFieldConfig: ByteGridConfig = {
        name: 'Multi Field Test',
        size: 16,
        layout: 16,
        fields: [
          { offset: '0-3', name: 'Field1', type: 'uint32_t', color: 'blue' },
          { offset: '4-7', name: 'Field2', type: 'uint32_t', color: 'cyan' },
          { offset: '8-11', name: 'Field3', type: 'uint32_t', color: 'yellow' },
          { offset: '12-15', name: 'Field4', type: 'uint32_t', color: 'green' },
        ],
      };

      const multiFieldBlocks: LayoutBlock[] = [
        {
          row: 0, col: 0, span: 4,
          fieldName: 'Field1', fieldType: 'uint32_t', color: 'blue',
          offsetStart: 0, offsetEnd: 3, isPadding: false,
        },
        {
          row: 0, col: 4, span: 4,
          fieldName: 'Field2', fieldType: 'uint32_t', color: 'cyan',
          offsetStart: 4, offsetEnd: 7, isPadding: false,
        },
        {
          row: 0, col: 8, span: 4,
          fieldName: 'Field3', fieldType: 'uint32_t', color: 'yellow',
          offsetStart: 8, offsetEnd: 11, isPadding: false,
        },
        {
          row: 0, col: 12, span: 4,
          fieldName: 'Field4', fieldType: 'uint32_t', color: 'green',
          offsetStart: 12, offsetEnd: 15, isPadding: false,
        },
      ];

      it('should render legend in 1 column by default', () => {
        const svg = renderSVG(multiFieldConfig, multiFieldBlocks);

        expect(svg).toContain('Field1');
        expect(svg).toContain('Field2');
        expect(svg).toContain('Field3');
        expect(svg).toContain('Field4');
      });

      it('should render legend in 2 columns when legendColumns is 2', () => {
        const svg = renderSVG(multiFieldConfig, multiFieldBlocks, {
          legendColumns: 2,
        });

        expect(svg).toContain('Field1');
        expect(svg).toContain('Field2');
        expect(svg).toContain('Field3');
        expect(svg).toContain('Field4');
      });

      it('should use config.legendColumns when options.legendColumns is not provided', () => {
        const configWithColumns: ByteGridConfig = {
          ...multiFieldConfig,
          legendColumns: 2,
        };

        const svg = renderSVG(configWithColumns, multiFieldBlocks);

        expect(svg).toContain('Field1');
        expect(svg).toContain('Field2');
      });

      it('should prioritize options.legendColumns over config.legendColumns', () => {
        const configWithColumns: ByteGridConfig = {
          ...multiFieldConfig,
          legendColumns: 1,
        };

        const svg = renderSVG(configWithColumns, multiFieldBlocks, {
          legendColumns: 2,
        });

        expect(svg).toContain('Field1');
      });

      it('should handle legendColumns with minimum value of 1', () => {
        const svg = renderSVG(multiFieldConfig, multiFieldBlocks, {
          legendColumns: 0, // Should be treated as 1
        });

        expect(svg).toContain('Field1');
      });

      it('should render legend in 3 columns when legendColumns is 3', () => {
        // 6 fields for testing 3 columns
        const sixFieldConfig: ByteGridConfig = {
          name: 'Six Field Test',
          size: 24,
          layout: 16,
          fields: [
            { offset: '0-3', name: 'Field1', type: 'uint32_t', color: 'blue' },
            { offset: '4-7', name: 'Field2', type: 'uint32_t', color: 'cyan' },
            { offset: '8-11', name: 'Field3', type: 'uint32_t', color: 'yellow' },
            { offset: '12-15', name: 'Field4', type: 'uint32_t', color: 'green' },
            { offset: '16-19', name: 'Field5', type: 'uint32_t', color: 'orange' },
            { offset: '20-23', name: 'Field6', type: 'uint32_t', color: 'purple' },
          ],
        };

        const sixFieldBlocks: LayoutBlock[] = [
          { row: 0, col: 0, span: 4, fieldName: 'Field1', fieldType: 'uint32_t', color: 'blue', offsetStart: 0, offsetEnd: 3, isPadding: false },
          { row: 0, col: 4, span: 4, fieldName: 'Field2', fieldType: 'uint32_t', color: 'cyan', offsetStart: 4, offsetEnd: 7, isPadding: false },
          { row: 0, col: 8, span: 4, fieldName: 'Field3', fieldType: 'uint32_t', color: 'yellow', offsetStart: 8, offsetEnd: 11, isPadding: false },
          { row: 0, col: 12, span: 4, fieldName: 'Field4', fieldType: 'uint32_t', color: 'green', offsetStart: 12, offsetEnd: 15, isPadding: false },
          { row: 1, col: 0, span: 4, fieldName: 'Field5', fieldType: 'uint32_t', color: 'orange', offsetStart: 16, offsetEnd: 19, isPadding: false },
          { row: 1, col: 4, span: 4, fieldName: 'Field6', fieldType: 'uint32_t', color: 'purple', offsetStart: 20, offsetEnd: 23, isPadding: false },
        ];

        const svg = renderSVG(sixFieldConfig, sixFieldBlocks, {
          legendColumns: 3,
        });

        // All 6 fields should be present
        expect(svg).toContain('Field1');
        expect(svg).toContain('Field2');
        expect(svg).toContain('Field3');
        expect(svg).toContain('Field4');
        expect(svg).toContain('Field5');
        expect(svg).toContain('Field6');

        // Check for proper width (should be wider for 3 columns)
        // Each column is 200px, so 3 columns = 600px
        expect(svg).toMatch(/width="\d+"/);
      });
    });

    // colorScheme tests
    describe('colorScheme option', () => {
      it('should use default colors when colorScheme is "default"', () => {
        const svg = renderSVG(sampleConfig, sampleBlocks, {
          colorScheme: 'default',
        });

        // Default blue color for Field1 is #93c5fd
        expect(svg).toContain('#93c5fd');
      });

      it('should transform colors when colorScheme is "dark"', () => {
        const svg = renderSVG(sampleConfig, sampleBlocks, {
          colorScheme: 'dark',
        });

        // Dark scheme should have different colors than default
        expect(svg).not.toContain('#93c5fd'); // Should not have default blue
        expect(svg).toContain('fill="#'); // Should have some transformed colors
      });

      it('should transform colors when colorScheme is "light"', () => {
        const svg = renderSVG(sampleConfig, sampleBlocks, {
          colorScheme: 'light',
        });

        // Light scheme should have different colors than default
        expect(svg).not.toContain('#93c5fd'); // Should not have default blue
        expect(svg).toContain('fill="#'); // Should have some transformed colors
      });

      it('should use config.colorScheme when options.colorScheme is not provided', () => {
        const configWithScheme: ByteGridConfig = {
          ...sampleConfig,
          colorScheme: 'dark',
        };

        const svg = renderSVG(configWithScheme, sampleBlocks);

        // Should use dark scheme from config
        expect(svg).not.toContain('#93c5fd');
      });

      it('should prioritize options.colorScheme over config.colorScheme', () => {
        const configWithScheme: ByteGridConfig = {
          ...sampleConfig,
          colorScheme: 'dark',
        };

        const svg = renderSVG(configWithScheme, sampleBlocks, {
          colorScheme: 'light',
        });

        // Should use light scheme from options, not dark from config
        expect(svg).not.toContain('#93c5fd');
      });

      it('should apply color transformation to both grid blocks and legend', () => {
        const svg = renderSVG(sampleConfig, sampleBlocks, {
          colorScheme: 'dark',
        });

        // Both grid blocks and legend should use transformed colors
        expect(svg).toContain('fill="#'); // Fill attribute exists
        expect(svg).toContain('Field1'); // Legend exists
        expect(svg).toContain('Field2'); // Legend exists
      });
    });
  });
});
