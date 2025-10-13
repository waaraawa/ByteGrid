/**
 * Core type definitions for ByteGrid
 */

/**
 * Supported data types in ByteGrid
 */
export type DataType =
  | 'char'
  | 'int8_t'
  | 'uint8_t'
  | 'int16_t'
  | 'uint16_t'
  | 'short'
  | 'int32_t'
  | 'uint32_t'
  | 'int'
  | 'int64_t'
  | 'uint64_t'
  | 'long'
  | 'float'
  | 'double'
  | 'reserved'
  | 'padding'
  | string; // For array types like 'char[4]'

/**
 * Endianness for multi-byte fields
 */
export type Endianness = 'little' | 'big';

/**
 * Color names for field visualization
 */
export type ColorName =
  | 'blue'
  | 'cyan'
  | 'yellow'
  | 'green'
  | 'orange'
  | 'purple'
  | 'mint'
  | 'pink'
  | 'gray';

/**
 * Color scheme variants
 */
export type ColorScheme = 'default' | 'dark' | 'light';

/**
 * Bitfield definition within a field
 */
export interface Bitfield {
  name: string;
  bits: string; // e.g., "0-3" or "7"
  description?: string;
}

/**
 * Field definition
 * Note: size is calculated from offset (SSOT principle)
 */
export interface Field {
  offset: string; // e.g., "0-3" or "4" (SSOT for size calculation)
  name: string;
  type: DataType;
  value?: string;
  description?: string;
  color?: ColorName;
  endianness?: Endianness;
  bitfields?: Bitfield[];
}

/**
 * Main configuration for ByteGrid visualization
 */
export interface ByteGridConfig {
  name: string;
  size: number; // Total size in bytes
  layout?: number; // Bytes per row (default: 16)
  colorScheme?: ColorScheme;
  fields: Field[];
}

/**
 * Parsed offset information
 */
export interface OffsetRange {
  start: number;
  end: number;
  size: number;
}

/**
 * Layout block for rendering (after layout engine processing)
 */
export interface LayoutBlock {
  row: number;
  col: number;
  span: number; // Number of columns this block spans
  fieldName: string;
  fieldType: DataType;
  color: ColorName;
  value?: string;
  description?: string;
  offsetStart: number;
  offsetEnd: number;
  isPadding: boolean;
  bitfields?: Bitfield[];
}

/**
 * Rendering options
 */
export interface RenderOptions {
  showHexDump?: boolean;
  showLegend?: boolean;
  showGrid?: boolean;
  cellWidth?: number;
  cellHeight?: number;
  fontSize?: number;
}
