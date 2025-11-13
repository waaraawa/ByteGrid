import { Plugin } from 'obsidian';
import { parse, validate, createLayout, renderSVG } from '../../core/dist/index.js';

export default class ByteGridPlugin extends Plugin {
  onload(): void {
    this.registerMarkdownCodeBlockProcessor('bytegrid', (source, el, ctx) => {
      try {
        // Parse YAML input
        const config = parse(source);

        // Validate configuration
        validate(config);

        // Create layout blocks
        const blocks = createLayout(config);

        // Render to SVG
        const svg = renderSVG(config, blocks);

        // Display SVG safely using DOMParser
        const parser = new DOMParser();
        const svgDoc = parser.parseFromString(svg, 'image/svg+xml');
        const svgElement = svgDoc.documentElement;

        if (svgElement.tagName === 'svg') {
          el.appendChild(svgElement);
        } else {
          throw new Error('Invalid SVG output');
        }
      } catch (error) {
        // Display error
        const container = el.createDiv({ cls: 'bytegrid-error' });
        container.createEl('h4', { text: 'ByteGrid error' });
        container.createEl('p', { text: error instanceof Error ? error.message : String(error) });
        container.createEl('pre', { text: source });
      }
    });
  }
}
