/**
 * SVGRenderer module
 * Renders LayoutBlocks to SVG string
 */

import { ByteGridConfig, LayoutBlock, RenderOptions, ColorName, LegendPosition, ColorScheme, CustomTheme } from './types';

/**
 * Color palette mapping (default scheme)
 */
const COLORS: Record<ColorName, string> = {
  blue: '#93c5fd',
  cyan: '#67e8f9',
  yellow: '#fde047',
  green: '#86efac',
  orange: '#fdba74',
  purple: '#c4b5fd',
  mint: '#6ee7b7',
  pink: '#f9a8d4',
  gray: '#d1d5db',
};

/**
 * Convert hex color to RGB
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 0, g: 0, b: 0 };
}

/**
 * Convert RGB to HSL
 */
function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return { h, s, l };
}

/**
 * Convert HSL to RGB
 */
function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  let r, g, b;

  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;

    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  };
}

/**
 * Convert RGB to hex
 */
function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(x => {
    const hex = x.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
}

/**
 * Transform color based on color scheme
 */
function transformColor(hexColor: string, scheme: ColorScheme): string {
  // If the color is a CSS variable, we can't transform it via JS,
  // we rely on the theme to provide the correct dark/light variants natively.
  if (hexColor.startsWith('var(')) {
    return hexColor;
  }

  if (scheme === 'default') {
    return hexColor;
  }

  const rgb = hexToRgb(hexColor);
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);

  if (scheme === 'dark') {
    // Dark scheme: reduce saturation and lightness
    hsl.s = Math.max(0, hsl.s - 0.2);
    hsl.l = Math.max(0, hsl.l - 0.1);
  } else if (scheme === 'light') {
    // Light scheme: increase lightness
    hsl.l = Math.min(1, hsl.l + 0.2);
  }

  const newRgb = hslToRgb(hsl.h, hsl.s, hsl.l);
  return rgbToHex(newRgb.r, newRgb.g, newRgb.b);
}

/**
 * Default render options
 */
const DEFAULT_OPTIONS: Required<RenderOptions> = {
  colorScheme: 'default',
  showHexDump: false,
  showLegend: true,
  legendPosition: 'right',
  legendColumns: 1,
  showFooter: true,
  showGrid: true,
  cellWidth: 40, // Increased from 30 to make bit numbers readable
  cellHeight: 30,
  fontSize: 10,
  uniformRowHeight: false, // Bitfield rows are taller by default
  theme: {
    background: 'white',
    textNormal: '#333',
    textMuted: '#666',
    textFaint: '#999',
    border: '#333',
    gridLine: '#ccc',
    gridLineSubtle: '#ddd',
  }
};

/**
 * Render LayoutBlocks to SVG string
 *
 * @param config ByteGrid configuration
 * @param blocks Layout blocks to render
 * @param options Render options
 * @returns SVG string
 */
export function renderSVG(
  config: ByteGridConfig,
  blocks: LayoutBlock[],
  options?: RenderOptions
): string {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const theme: CustomTheme = opts.theme || {
    background: 'white',
    textNormal: '#333',
    textMuted: '#666',
    textFaint: '#999',
    border: '#333',
    gridLine: '#ccc',
    gridLineSubtle: '#ddd',
  };
  const layoutUnit = config.layoutUnit || 'byte';
  const layout = config.layout || 16;

  // Adjust cellWidth for bit layout
  if (layoutUnit === 'bit' && !options?.cellWidth) {
    opts.cellWidth = 10; // Smaller cells for bit-level layout
  }

  // Determine legend position
  // Priority: options.legendPosition > config.legendPosition > options.showLegend (backward compat) > default
  let effectiveLegendPosition: LegendPosition;
  if (options?.legendPosition !== undefined) {
    effectiveLegendPosition = options.legendPosition;
  } else if (config.legendPosition !== undefined) {
    effectiveLegendPosition = config.legendPosition;
  } else if (options?.showLegend === false) {
    effectiveLegendPosition = 'none';
  } else {
    effectiveLegendPosition = 'right'; // default
  }

  // Determine showFooter
  // Priority: options.showFooter > config.showFooter > default (true)
  const effectiveShowFooter = options?.showFooter !== undefined
    ? options.showFooter
    : config.showFooter !== undefined
    ? config.showFooter
    : opts.showFooter;

  // Determine legendColumns
  // Priority: options.legendColumns > config.legendColumns > default (1)
  const effectiveLegendColumns = options?.legendColumns !== undefined
    ? Math.max(1, Math.floor(options.legendColumns))
    : config.legendColumns !== undefined
    ? Math.max(1, Math.floor(config.legendColumns))
    : opts.legendColumns;

  // Determine colorScheme
  // Priority: options.colorScheme > config.colorScheme > default ('default')
  const effectiveColorScheme = options?.colorScheme !== undefined
    ? options.colorScheme
    : config.colorScheme !== undefined
    ? config.colorScheme
    : opts.colorScheme;

  // Detect rows with bitfields
  const rowsWithBitfields = new Set<number>();
  for (const block of blocks) {
    if (block.bitfields && block.bitfields.length > 0) {
      rowsWithBitfields.add(block.row);
    }
  }

  // Determine cell height based on uniformRowHeight option
  const hasBitfields = rowsWithBitfields.size > 0;
  const bitfieldCellHeight = 45;
  const normalCellHeight = opts.cellHeight;

  // Calculate dimensions
  const rows = Math.ceil(config.size / layout);
  const gridWidth = layout * opts.cellWidth;
  const legendColumnWidth = 200; // Width of each legend column
  const legendWidth = effectiveLegendPosition !== 'none' && effectiveLegendPosition !== 'bottom'
    ? legendColumnWidth * effectiveLegendColumns
    : 0;
  const margin = 20;

  // Count unique fields for legend height calculation
  const uniqueFieldNames = new Set(blocks.map((b) => b.fieldName));
  const fieldCount = uniqueFieldNames.size;

  // Calculate legend height (for 'bottom' position or side positions)
  let legendHeight = 0;
  if (effectiveLegendPosition !== 'none' && fieldCount > 0) {
    // Calculate actual height needed based on bitfields (row-major order)
    let totalLegendHeight = 40; // Header space
    const uniqueFields = new Map<string, LayoutBlock>();
    for (const block of blocks) {
      if (!uniqueFields.has(block.fieldName)) {
        uniqueFields.set(block.fieldName, block);
      }
    }

    // For multi-column row-major, we need to find the tallest entry in each row
    const rowHeights: number[] = [];
    let fieldIndex = 0;
    for (const [, block] of uniqueFields) {
      const rowIndex = Math.floor(fieldIndex / effectiveLegendColumns);
      let entryHeight = 50;
      if (block.bitfields && block.bitfields.length > 0) {
        entryHeight = 50 + block.bitfields.length * 12;
      }
      rowHeights[rowIndex] = Math.max(rowHeights[rowIndex] || 0, entryHeight);
      fieldIndex++;
    }

    // Sum up all row heights
    for (const h of rowHeights) {
      totalLegendHeight += h;
    }

    legendHeight = totalLegendHeight;
  }

  // Calculate grid height based on row heights
  let gridHeight = 0;
  if (opts.uniformRowHeight && hasBitfields) {
    // All rows use bitfield height
    gridHeight = rows * bitfieldCellHeight;
  } else {
    // Each row may have different height
    for (let row = 0; row < rows; row++) {
      if (rowsWithBitfields.has(row)) {
        gridHeight += bitfieldCellHeight;
      } else {
        gridHeight += normalCellHeight;
      }
    }
  }

  // Calculate total width and height based on legend position
  const footerHeight = effectiveShowFooter ? 60 : 20; // Footer space or just bottom margin
  let totalWidth: number;
  let totalHeight: number;
  let gridStartX: number;
  let gridStartY: number;

  if (effectiveLegendPosition === 'left') {
    // Legend on left, grid on right
    totalWidth = margin + legendWidth + margin + gridWidth + margin;
    totalHeight = margin + 60 + Math.max(gridHeight, legendHeight) + margin + footerHeight;
    gridStartX = margin + legendWidth + margin;
    gridStartY = margin + 60;
  } else if (effectiveLegendPosition === 'bottom') {
    // Legend at bottom (with extra 30px spacing for title)
    // Need to account for multi-column legend width
    const bottomLegendWidth = legendColumnWidth * effectiveLegendColumns;
    totalWidth = margin + Math.max(gridWidth, bottomLegendWidth) + margin;
    totalHeight = margin + 60 + gridHeight + margin + 30 + legendHeight + footerHeight;
    gridStartX = margin;
    gridStartY = margin + 60;
  } else {
    // Legend on right (default) or none
    const contentHeight = Math.max(gridHeight, legendHeight);
    totalWidth = margin + gridWidth + margin + legendWidth + margin;
    totalHeight = margin + 60 + contentHeight + margin + footerHeight;
    gridStartX = margin;
    gridStartY = margin + 60;
  }

  // Calculate cumulative Y position for each row
  const rowYPositions = new Map<number, number>();
  let cumulativeY = gridStartY;
  for (let row = 0; row < rows; row++) {
    rowYPositions.set(row, cumulativeY);
    if (opts.uniformRowHeight && hasBitfields) {
      cumulativeY += bitfieldCellHeight;
    } else if (rowsWithBitfields.has(row)) {
      cumulativeY += bitfieldCellHeight;
    } else {
      cumulativeY += normalCellHeight;
    }
  }

  // Helper function to get cell height for a block
  const getCellHeight = (block: LayoutBlock): number => {
    if (opts.uniformRowHeight && hasBitfields) {
      return bitfieldCellHeight;
    }
    return block.bitfields && block.bitfields.length > 0 ? bitfieldCellHeight : normalCellHeight;
  };

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="${totalHeight}" style="font-family: monospace; background: ${theme.background};">`;

  // Title
  svg += `<text x="${totalWidth / 2}" y="30" text-anchor="middle" font-size="16" font-weight="bold" fill="${theme.textNormal}">${escapeXml(config.name)}</text>`;

  // Column headers
  if (opts.showGrid) {
    for (let col = 0; col < layout; col++) {
      const x = gridStartX + col * opts.cellWidth + opts.cellWidth / 2;
      const y = gridStartY - 10;
      // For bit layout, show index 0-7 pattern, for byte layout show hex position
      const headerLabel = layoutUnit === 'bit'
        ? col % 8
        : '0x' + col.toString(16).toUpperCase().padStart(2, '0');
      svg += `<text x="${x}" y="${y}" text-anchor="middle" font-size="9" fill="${theme.textMuted}">${headerLabel}</text>`;
    }
  }

  // Row headers (left side) for bit layout
  if (opts.showGrid && layoutUnit === 'bit') {
    for (let row = 0; row < rows; row++) {
      const y = rowYPositions.get(row) || gridStartY;
      const cellHeight = rowsWithBitfields.has(row)
        ? (opts.uniformRowHeight && hasBitfields ? bitfieldCellHeight : bitfieldCellHeight)
        : (opts.uniformRowHeight && hasBitfields ? bitfieldCellHeight : normalCellHeight);
      const startOffset = row * layout;
      const hexOffset = '0x' + startOffset.toString(16).toUpperCase().padStart(2, '0');
      const textY = y + cellHeight / 2 + 4;
      svg += `<text x="${gridStartX - 5}" y="${textY}" text-anchor="end" font-size="9" fill="${theme.textMuted}">${hexOffset}</text>`;
    }
  }

  // Render blocks
  for (const block of blocks) {
    const x = gridStartX + block.col * opts.cellWidth;
    const y = rowYPositions.get(block.row) || gridStartY;
    const width = block.span * opts.cellWidth;
    const cellHeight = getCellHeight(block);
    const baseColor = theme.palette?.[block.color] || COLORS[block.color] || COLORS.gray;
    const color = transformColor(baseColor, effectiveColorScheme);

    // Draw block rectangle
    svg += `<rect x="${x}" y="${y}" width="${width}" height="${cellHeight}" fill="${color}" stroke="${theme.border}" stroke-width="1"/>`;

    // Draw numbers inside cells (only for byte layout)
    if (layoutUnit !== 'bit') {
      for (let i = 0; i < block.span; i++) {
        const byteNum = block.offsetStart + i;
        const hexNum = '0x' + byteNum.toString(16).toUpperCase().padStart(2, '0');
        const cellX = x + i * opts.cellWidth + opts.cellWidth / 2;
        const cellY = y + (cellHeight / 3); // Upper third for byte number
        const textFill = theme.cellText || theme.textNormal;
        svg += `<text x="${cellX}" y="${cellY}" text-anchor="middle" font-size="${opts.fontSize}" fill="${textFill}">${hexNum}</text>`;
      }
    }

    // Draw bit grid for bitfield cells (only in byte layout mode)
    if (block.bitfields && block.bitfields.length > 0 && layoutUnit !== 'bit') {
      for (let i = 0; i < block.span; i++) {
        const cellX = x + i * opts.cellWidth;
        const bitCellWidth = opts.cellWidth / 8;

        // Draw vertical lines dividing 8 bits
        for (let bit = 1; bit < 8; bit++) {
          const lineX = cellX + bit * bitCellWidth;
          svg += `<line x1="${lineX}" y1="${y}" x2="${lineX}" y2="${y + cellHeight}" stroke="${theme.gridLine}" stroke-width="0.5"/>`;
        }

        // Draw bit numbers (0-7)
        for (let bit = 0; bit < 8; bit++) {
          const bitX = cellX + bit * bitCellWidth + bitCellWidth / 2;
          const bitY = y + (cellHeight * 2 / 3) + 5; // Lower third for bit numbers
          const bitTextFill = theme.cellTextMuted || theme.textMuted;
          svg += `<text x="${bitX}" y="${bitY}" text-anchor="middle" font-size="7" fill="${bitTextFill}">${7 - bit}</text>`;
        }
      }
    }
  }

  // Draw bit boundary lines for bit layout
  if (layoutUnit === 'bit') {
    for (let col = 1; col < layout; col++) {
      const lineX = gridStartX + col * opts.cellWidth;
      // Every 8 bits: darker dotted line (byte boundary)
      // Other bits: lighter dotted line (bit boundary)
      if (col % 8 === 0) {
        svg += `<line x1="${lineX}" y1="${gridStartY}" x2="${lineX}" y2="${gridStartY + gridHeight}" stroke="${theme.textFaint}" stroke-width="1" stroke-dasharray="3,3"/>`;
      } else {
        svg += `<line x1="${lineX}" y1="${gridStartY}" x2="${lineX}" y2="${gridStartY + gridHeight}" stroke="${theme.gridLineSubtle}" stroke-width="0.5" stroke-dasharray="2,2"/>`;
      }
    }
  }

  // Legend
  if (effectiveLegendPosition !== 'none' && blocks.length > 0) {
    let legendX: number;
    let legendStartY: number;
    let legendTitleY: number;

    // Position legend based on effectiveLegendPosition
    if (effectiveLegendPosition === 'left') {
      legendX = margin;
      legendStartY = gridStartY;
      legendTitleY = legendStartY - 20;
    } else if (effectiveLegendPosition === 'bottom') {
      legendX = margin;
      legendStartY = gridStartY + gridHeight + margin + 30; // Extra space for title
      legendTitleY = gridStartY + gridHeight + margin + 10;
    } else {
      // 'right' (default)
      legendX = margin + gridWidth + margin * 2;
      legendStartY = gridStartY;
      legendTitleY = legendStartY - 20;
    }

    svg += `<text x="${legendX}" y="${legendTitleY}" font-size="12" font-weight="bold" fill="${theme.textNormal}">Fields</text>`;

    // Group blocks by field name to avoid duplicates
    const uniqueFields = new Map<string, LayoutBlock>();
    for (const block of blocks) {
      if (!uniqueFields.has(block.fieldName)) {
        uniqueFields.set(block.fieldName, block);
      }
    }

    // Calculate number of rows (row-major order: fill columns left-to-right)
    const totalFields = uniqueFields.size;
    const totalRows = Math.ceil(totalFields / effectiveLegendColumns);

    // Calculate cumulative Y positions for each row (to handle variable heights)
    const rowYPositions: number[] = [legendStartY];
    const fieldsArray = Array.from(uniqueFields.entries());

    for (let row = 0; row < totalRows; row++) {
      let maxHeightInRow = 50; // Default height

      // Check all fields in this row across all columns (row-major)
      for (let col = 0; col < effectiveLegendColumns; col++) {
        const fieldIndex = row * effectiveLegendColumns + col;
        if (fieldIndex < totalFields) {
          const [, block] = fieldsArray[fieldIndex];
          let entryHeight = 50;
          if (block.bitfields && block.bitfields.length > 0) {
            entryHeight = 50 + block.bitfields.length * 12;
          }
          maxHeightInRow = Math.max(maxHeightInRow, entryHeight);
        }
      }

      if (row < totalRows - 1) {
        rowYPositions.push(rowYPositions[row] + maxHeightInRow);
      }
    }

    // Render fields in row-major order (left-to-right, then top-to-bottom)
    let fieldIndex = 0;
    for (const [fieldName, block] of uniqueFields) {
      // Calculate row and column for this field (row-major)
      const row = Math.floor(fieldIndex / effectiveLegendColumns);
      const col = fieldIndex % effectiveLegendColumns;

      // Calculate position
      const x = legendX + col * legendColumnWidth;
      const y = rowYPositions[row];

      const baseColor = theme.palette?.[block.color] || COLORS[block.color] || COLORS.gray;
      const color = transformColor(baseColor, effectiveColorScheme);

      // Color box
      svg += `<rect x="${x}" y="${y}" width="20" height="20" fill="${color}" stroke="${theme.border}" stroke-width="1"/>`;

      // Field name
      svg += `<text x="${x + 30}" y="${y + 12}" font-size="11" font-weight="bold" fill="${theme.textNormal}">${escapeXml(fieldName)}</text>`;

      // Type
      svg += `<text x="${x + 30}" y="${y + 24}" font-size="9" fill="${theme.textMuted}">${escapeXml(block.fieldType)}</text>`;

      // Offset info
      const unit = layoutUnit === 'bit' ? 'bits' : 'bytes';
      const size = block.offsetEnd - block.offsetStart + 1;
      // Use hex for byte offsets, decimal for bit offsets
      const offsetStartStr = layoutUnit === 'bit'
        ? block.offsetStart.toString()
        : '0x' + block.offsetStart.toString(16).toUpperCase().padStart(2, '0');
      const offsetEndStr = layoutUnit === 'bit'
        ? block.offsetEnd.toString()
        : '0x' + block.offsetEnd.toString(16).toUpperCase().padStart(2, '0');
      svg += `<text x="${x + 30}" y="${y + 36}" font-size="9" fill="${theme.textFaint}">offset: ${offsetStartStr}-${offsetEndStr} (${size} ${unit})</text>`;

      // Bitfields (if any)
      if (block.bitfields && block.bitfields.length > 0) {
        svg += `<text x="${x + 30}" y="${y + 48}" font-size="9" font-weight="bold" fill="${theme.textMuted}">Bits:</text>`;

        block.bitfields.forEach((bf, bfIndex) => {
          const bfY = y + 60 + bfIndex * 12;
          svg += `<text x="${x + 35}" y="${bfY}" font-size="8" fill="${theme.textFaint}">`;
          svg += `bit ${escapeXml(bf.bits)}: ${escapeXml(bf.name)}`;
          svg += `</text>`;
        });
      }

      fieldIndex++;
    }
  }

  // Footer
  if (effectiveShowFooter) {
    const footerY = totalHeight - 40;
    const sizeUnit = layoutUnit === 'bit' ? 'bits' : 'bytes';
    const layoutUnitText = layoutUnit === 'bit' ? 'bits/row' : 'bytes/row';
    svg += `<text x="${totalWidth / 2}" y="${footerY}" text-anchor="middle" font-size="11" fill="${theme.textFaint}">Total size: ${config.size} ${sizeUnit} | Layout: ${layout} ${layoutUnitText}</text>`;
  }

  svg += `</svg>`;
  return svg;
}

/**
 * Escape XML special characters
 */
function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
