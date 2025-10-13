import { Plugin } from 'obsidian';
import * as yaml from 'js-yaml';

interface Field {
  offset: string;
  name: string;
  type: string;
  value?: string;
  description?: string;
  color?: string;
}

interface ByteGridConfig {
  name: string;
  size: number;
  layout?: number;
  fields: Field[];
}

// Simple color palette
const COLORS: Record<string, string> = {
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

export default class ByteGridPlugin extends Plugin {
  async onload(): Promise<void> {
    console.log('ByteGrid plugin loading...');

    this.registerMarkdownCodeBlockProcessor('bytegrid', (source, el, ctx) => {
      try {
        const config = yaml.load(source) as ByteGridConfig;
        const svg = this.renderSimpleSVG(config);
        el.innerHTML = svg;
      } catch (error) {
        const container = el.createDiv({ cls: 'bytegrid-error' });
        container.createEl('h4', { text: '❌ ByteGrid Error' });
        container.createEl('p', { text: error.message });
        container.createEl('pre', { text: source });
      }
    });

    console.log('ByteGrid plugin loaded successfully!');
  }

  onunload(): void {
    console.log('ByteGrid plugin unloading...');
  }

  private parseOffset(offset: string): { start: number; end: number } {
    if (offset.includes('-')) {
      const [start, end] = offset.split('-').map((s) => parseInt(s.trim()));
      return { start, end };
    }
    const start = parseInt(offset.trim());
    return { start, end: start };
  }

  private renderSimpleSVG(config: ByteGridConfig): string {
    const layout = config.layout || 16;
    const cellWidth = 30;
    const cellHeight = 30;
    const legendWidth = 200;
    const margin = 20;

    // Calculate rows needed
    const rows = Math.ceil(config.size / layout);
    const gridWidth = layout * cellWidth;
    const totalWidth = margin + gridWidth + margin + legendWidth + margin;
    const totalHeight = margin + 40 + rows * cellHeight + margin + 80;

    let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="${totalHeight}" style="font-family: monospace; background: white;">`;

    // Title
    svg += `<text x="${totalWidth / 2}" y="30" text-anchor="middle" font-size="16" font-weight="bold">${config.name
      }</text>`;

    // Draw grid and fields
    const gridStartX = margin;
    const gridStartY = margin + 60;

    // Draw column headers (byte offsets)
    for (let col = 0; col < layout; col++) {
      const x = gridStartX + col * cellWidth + cellWidth / 2;
      const y = gridStartY - 10;
      svg += `<text x="${x}" y="${y}" text-anchor="middle" font-size="9" fill="#666">${col}</text>`;
    }

    // Draw each field
    config.fields.forEach((field) => {
      const { start, end } = this.parseOffset(field.offset);
      const color = COLORS[field.color || 'gray'] || COLORS.gray;

      for (let byte = start; byte <= end; byte++) {
        const row = Math.floor(byte / layout);
        const col = byte % layout;
        const x = gridStartX + col * cellWidth;
        const y = gridStartY + row * cellHeight;

        // Draw cell
        svg += `<rect x="${x}" y="${y}" width="${cellWidth}" height="${cellHeight}" fill="${color}" stroke="#333" stroke-width="1"/>`;

        // Draw byte number
        svg += `<text x="${x + cellWidth / 2}" y="${y + cellHeight / 2 + 5}" text-anchor="middle" font-size="10" fill="#333">${byte}</text>`;
      }
    });

    // Draw legend on the right
    const legendX = margin + gridWidth + margin * 2;
    const legendStartY = gridStartY;

    svg += `<text x="${legendX}" y="${legendStartY - 20}" font-size="12" font-weight="bold" fill="#333">Fields</text>`;

    config.fields.forEach((field, index) => {
      const { start, end } = this.parseOffset(field.offset);
      const color = COLORS[field.color || 'gray'] || COLORS.gray;
      const y = legendStartY + index * 50;

      // Color box
      svg += `<rect x="${legendX}" y="${y}" width="20" height="20" fill="${color}" stroke="#333" stroke-width="1"/>`;

      // Field name
      svg += `<text x="${legendX + 30}" y="${y + 12}" font-size="11" font-weight="bold" fill="#333">${field.name}</text>`;

      // Type and offset
      svg += `<text x="${legendX + 30}" y="${y + 24}" font-size="9" fill="#666">${field.type}</text>`;
      svg += `<text x="${legendX + 30}" y="${y + 36}" font-size="9" fill="#999">offset: ${start}-${end} (${end - start + 1} bytes)</text>`;
    });

    // Footer
    const footerY = totalHeight - 40;
    svg += `<text x="${totalWidth / 2}" y="${footerY}" text-anchor="middle" font-size="11" fill="#999">Total size: ${config.size} bytes | Layout: ${layout} bytes/row</text>`;

    svg += `</svg>`;
    return svg;
  }
}
