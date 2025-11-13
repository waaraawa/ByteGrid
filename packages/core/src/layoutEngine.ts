/**
 * LayoutEngine module
 * Converts Fields to LayoutBlocks for rendering
 */

import { ByteGridConfig, LayoutBlock, ColorName } from './types';
import { parseOffset } from './validator';

/**
 * Create layout blocks from ByteGrid configuration
 *
 * @param config ByteGridConfig
 * @returns Array of LayoutBlocks ready for rendering
 */
export function createLayout(config: ByteGridConfig): LayoutBlock[] {
  const layout = config.layout || 16;
  const layoutUnit = config.layoutUnit || 'byte';
  const blocks: LayoutBlock[] = [];

  // Auto color enabled by default
  const autoColor = config.autoColor !== undefined ? config.autoColor : true;

  // Colors for auto-assignment (excluding gray for non-padding fields)
  const autoColors: ColorName[] = ['blue', 'cyan', 'yellow', 'green', 'orange', 'purple', 'mint', 'pink'];

  // Convert offset to bits for unified processing
  const toBits = (offset: ReturnType<typeof parseOffset>): { start: number; end: number; size: number } => {
    if (layoutUnit === 'bit') {
      // In bit layout mode, convert everything to bits
      if (offset.unit === 'bit') {
        return { start: offset.start, end: offset.end, size: offset.size };
      }
      // Convert byte offset to bits
      return { start: offset.start * 8, end: offset.end * 8 + 7, size: (offset.end - offset.start + 1) * 8 };
    }
    // In byte layout mode, keep as bytes
    return { start: offset.start, end: offset.end, size: offset.size };
  };

  for (let fieldIndex = 0; fieldIndex < config.fields.length; fieldIndex++) {
    const field = config.fields[fieldIndex];
    const offset = parseOffset(field.offset);
    const offsetInUnits = toBits(offset);
    const isPadding = field.type === 'reserved' || field.type === 'padding';

    // Determine color
    let color: ColorName;
    if (field.color) {
      // Explicit color specified
      color = field.color;
    } else if (autoColor && !isPadding) {
      // Auto-assign color for non-padding fields
      color = autoColors[fieldIndex % autoColors.length];
    } else {
      // Default to gray (manual mode or padding)
      color = 'gray';
    }

    // Check if field spans multiple rows
    const startRow = Math.floor(offsetInUnits.start / layout);
    const endRow = Math.floor(offsetInUnits.end / layout);

    if (startRow === endRow) {
      // Field fits in a single row
      const col = offsetInUnits.start % layout;
      const span = offsetInUnits.size;

      blocks.push({
        row: startRow,
        col,
        span,
        fieldName: field.name,
        fieldType: field.type,
        color,
        value: field.value,
        description: field.description,
        offsetStart: offsetInUnits.start,
        offsetEnd: offsetInUnits.end,
        isPadding,
        bitfields: field.bitfields,
      });
    } else {
      // Field spans multiple rows - split it
      let currentUnit = offsetInUnits.start;

      while (currentUnit <= offsetInUnits.end) {
        const row = Math.floor(currentUnit / layout);
        const col = currentUnit % layout;

        // Calculate how many units fit in this row
        const unitsLeftInRow = layout - col;
        const unitsLeftInField = offsetInUnits.end - currentUnit + 1;
        const unitsInThisBlock = Math.min(unitsLeftInRow, unitsLeftInField);

        const blockEnd = currentUnit + unitsInThisBlock - 1;

        blocks.push({
          row,
          col,
          span: unitsInThisBlock,
          fieldName: field.name,
          fieldType: field.type,
          color,
          value: field.value,
          description: field.description,
          offsetStart: currentUnit,
          offsetEnd: blockEnd,
          isPadding,
          bitfields: field.bitfields,
        });

        currentUnit += unitsInThisBlock;
      }
    }
  }

  return blocks;
}
