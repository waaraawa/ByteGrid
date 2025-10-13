import { Plugin } from 'obsidian';
import { parse, validate, createLayout, renderSVG } from '../../core/dist/index.js';

export default class ByteGridPlugin extends Plugin {
  async onload(): Promise<void> {
    console.log('ByteGrid plugin loading...');

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

        // Display SVG
        el.innerHTML = svg;
      } catch (error) {
        // Display error
        const container = el.createDiv({ cls: 'bytegrid-error' });
        container.createEl('h4', { text: '❌ ByteGrid Error' });
        container.createEl('p', { text: error instanceof Error ? error.message : String(error) });
        container.createEl('pre', { text: source });
      }
    });

    console.log('ByteGrid plugin loaded successfully!');
  }

  onunload(): void {
    console.log('ByteGrid plugin unloading...');
  }
}
