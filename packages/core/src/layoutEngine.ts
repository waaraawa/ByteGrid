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
  const blocks: LayoutBlock[] = [];

  for (const field of config.fields) {
    const offset = parseOffset(field.offset);
    const color = (field.color || 'gray') as ColorName;
    const isPadding = field.type === 'reserved' || field.type === 'padding';

    // Check if field spans multiple rows
    const startRow = Math.floor(offset.start / layout);
    const endRow = Math.floor(offset.end / layout);

    if (startRow === endRow) {
      // Field fits in a single row
      const col = offset.start % layout;
      const span = offset.size;

      blocks.push({
        row: startRow,
        col,
        span,
        fieldName: field.name,
        fieldType: field.type,
        color,
        value: field.value,
        description: field.description,
        offsetStart: offset.start,
        offsetEnd: offset.end,
        isPadding,
        bitfields: field.bitfields,
      });
    } else {
      // Field spans multiple rows - split it
      let currentByte = offset.start;

      while (currentByte <= offset.end) {
        const row = Math.floor(currentByte / layout);
        const col = currentByte % layout;

        // Calculate how many bytes fit in this row
        const bytesLeftInRow = layout - col;
        const bytesLeftInField = offset.end - currentByte + 1;
        const bytesInThisBlock = Math.min(bytesLeftInRow, bytesLeftInField);

        const blockEnd = currentByte + bytesInThisBlock - 1;

        blocks.push({
          row,
          col,
          span: bytesInThisBlock,
          fieldName: field.name,
          fieldType: field.type,
          color,
          value: field.value,
          description: field.description,
          offsetStart: currentByte,
          offsetEnd: blockEnd,
          isPadding,
          bitfields: field.bitfields,
        });

        currentByte += bytesInThisBlock;
      }
    }
  }

  return blocks;
}
