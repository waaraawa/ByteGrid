import { Plugin, parseYaml } from 'obsidian';
import { parse, validate, createLayout, renderSVG } from '@bytegrid/core';

export default class ByteGridPlugin extends Plugin {
  onload(): void {
    this.registerMarkdownCodeBlockProcessor('bytegrid', (source, el, ctx) => {
      try {
        // Parse YAML input
        const parsed = parseYaml(source);
        const config = parse(parsed);

        // Validate configuration
        validate(config);

        // Create layout blocks
        const blocks = createLayout(config);

        // Render to SVG integrating with Obsidian's CSS variables
        const svg = renderSVG(config, blocks, {
          theme: {
            background: 'transparent',
            textNormal: 'var(--text-normal)',
            textMuted: 'var(--text-muted)',
            textFaint: 'var(--text-faint)',
            border: 'var(--background-modifier-border)',
            gridLine: 'var(--background-modifier-border)',
            gridLineSubtle: 'var(--background-modifier-border-hover)',
            // For block cell text, using var(--text-normal) might lack contrast against colored blocks. 
            // We use a high-contrast fallback variable or default to white/black via CSS if available.
            // Obsidian's callouts use --callout-title-color which might be good, but for now we rely on standard text-muted.
            // Let's omit cellText overrides to fallback to textNormal/textMuted,
            palette: {
              blue: 'var(--color-blue)',
              cyan: 'var(--color-cyan)',
              yellow: 'var(--color-yellow)',
              green: 'var(--color-green)',
              orange: 'var(--color-orange)',
              purple: 'var(--color-purple)',
              mint: 'var(--color-green)', // No mint in standard Obsidian, fallback to green
              pink: 'var(--color-pink)',
              gray: 'var(--color-base-40)',
            }
          }
        });

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
        container.createEl('h4', { text: 'Bytegrid error' });
        container.createEl('p', { text: error instanceof Error ? error.message : String(error) });
        container.createEl('pre', { text: source });
      }
    });
  }
}
