# ByteGrid

> Binary data and C struct memory layout visualization for Obsidian

## Overview

**ByteGrid** is an Obsidian plugin that visualizes binary data and C structure memory layouts as interactive SVG diagrams.

## Features

- 🎨 Color-coded field visualization
- 📏 Byte-accurate grid layout
- 🔍 Bitfield support
- 📊 Hex dump integration
- 🎯 Interactive tooltips
- 📤 Multiple export formats (SVG, PNG, C code, Markdown)

## Project Status

🚧 **In Development** - Currently in Phase 1 (MVP)

## Quick Start

```bash
# Install dependencies
npm install

# Build all packages
npm run build

# Run tests
npm run test

# Lint
npm run lint

# Format code
npm run format
```

## Project Structure

```
bytegrid/
├── packages/
│   ├── core/              # Core rendering logic
│   └── obsidian-plugin/   # Obsidian plugin
├── docs/                  # Design documentation
└── examples/              # Example files
```

## Documentation

See [CLAUDE.md](./CLAUDE.md) for detailed project guidelines and architecture.

## Development

This project follows **Test-Driven Development (TDD)**:

1. Write tests first
2. Implement minimal code to pass tests
3. Refactor

### Key Principles

- **offset is SSOT** - Field size calculated from offset ranges
- **No magic numbers** - Use constants for all layout values
- **Dynamic height** - SVG dimensions calculated from content
- **Explicit padding** - Use `reserved` or `padding` types

## License

MIT License - see [LICENSE](./LICENSE) for details

## Contributing

Currently in initial development phase. Contribution guidelines will be added soon.
