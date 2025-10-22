# Auto Color Examples

ByteGrid supports automatic color assignment for fields. This feature makes it easy to create visualizations without manually specifying colors for each field.

## Example 1: Basic Auto Color (Default)

When `autoColor` is enabled (default), fields without explicit colors are automatically assigned distinct colors in sequence: blue, cyan, yellow, green, orange, purple, mint, pink.

```bytegrid
name: WAV Header (Auto Color)
size: 44
layout: 16

fields:
  - offset: 0-3
    name: ChunkID
    type: char[4]
    description: "RIFF magic number"
  - offset: 4-7
    name: ChunkSize
    type: uint32_t
    description: "File size - 8"
  - offset: 8-11
    name: Format
    type: char[4]
    description: "WAVE format"
  - offset: 12-15
    name: Subchunk1ID
    type: char[4]
    description: "fmt subchunk"
  - offset: 16-19
    name: Subchunk1Size
    type: uint32_t
    description: "Size of fmt chunk"
  - offset: 20-21
    name: AudioFormat
    type: uint16_t
    description: "Audio format (1=PCM)"
  - offset: 22-23
    name: NumChannels
    type: uint16_t
    description: "Number of channels"
  - offset: 24-27
    name: SampleRate
    type: uint32_t
    description: "Sample rate (Hz)"
  - offset: 28-31
    name: ByteRate
    type: uint32_t
    description: "Byte rate"
```

**Result**: Each field gets a different color automatically!

---

## Example 2: Manual Color Mode

When `autoColor: false`, only explicitly specified colors are used. Fields without colors default to gray.

```bytegrid
name: TCP Header (Manual Colors)
size: 20
layout: 16
autoColor: false

fields:
  - offset: 0-1
    name: SourcePort
    type: uint16_t
    color: blue
    description: "Source port number"
  - offset: 2-3
    name: DestPort
    type: uint16_t
    color: cyan
    description: "Destination port number"
  - offset: 4-7
    name: SeqNumber
    type: uint32_t
    description: "Sequence number (no color = gray)"
  - offset: 8-11
    name: AckNumber
    type: uint32_t
    description: "Acknowledgment number (gray)"
  - offset: 12-13
    name: Flags
    type: uint16_t
    color: yellow
    description: "Flags and offset"
  - offset: 14-15
    name: WindowSize
    type: uint16_t
    description: "Window size (gray)"
```

**Result**: Only SourcePort (blue), DestPort (cyan), and Flags (yellow) have colors. Others are gray.

---

## Example 3: Mixed Mode (Auto + Manual)

You can combine automatic colors with explicit colors. Explicit colors always take precedence.

```bytegrid
name: Custom Packet (Mixed Colors)
size: 32
layout: 16

fields:
  - offset: 0-3
    name: MagicNumber
    type: uint32_t
    color: pink
    description: "Custom magic number (explicit pink)"
  - offset: 4-7
    name: Version
    type: uint32_t
    description: "Protocol version (auto: cyan)"
  - offset: 8-11
    name: Length
    type: uint32_t
    description: "Packet length (auto: yellow)"
  - offset: 12-15
    name: Checksum
    type: uint32_t
    color: mint
    description: "CRC32 checksum (explicit mint)"
  - offset: 16-19
    name: Timestamp
    type: uint32_t
    description: "Unix timestamp (auto: green)"
  - offset: 20-23
    name: SourceID
    type: uint32_t
    description: "Source identifier (auto: orange)"
  - offset: 24-27
    name: DestID
    type: uint32_t
    description: "Destination ID (auto: purple)"
  - offset: 28-31
    name: Payload
    type: uint32_t
    description: "Payload data (auto: mint again, cycles)"
```

**Result**: MagicNumber is pink (explicit), Checksum is mint (explicit), others are auto-assigned.

---

## Example 4: With Padding/Reserved Fields

Padding and reserved fields are always gray, regardless of `autoColor` setting.

```bytegrid
name: File Header (With Padding)
size: 24
layout: 16

fields:
  - offset: 0-3
    name: Signature
    type: char[4]
    description: "File signature (auto: blue)"
  - offset: 4-7
    name: Version
    type: uint32_t
    description: "File version (auto: cyan)"
  - offset: 8-11
    name: Reserved1
    type: reserved
    description: "Reserved for future use (always gray)"
  - offset: 12-15
    name: DataOffset
    type: uint32_t
    description: "Offset to data (auto: green)"
  - offset: 16-19
    name: DataSize
    type: uint32_t
    description: "Size of data (auto: orange)"
  - offset: 20-23
    name: Padding
    type: padding
    description: "Alignment padding (always gray)"
```

**Result**: Reserved1 and Padding are gray (special types), others are auto-colored.

---

## Color Cycle

When you have more than 8 fields, colors cycle back to the beginning:

1. blue
2. cyan
3. yellow
4. green
5. orange
6. purple
7. mint
8. pink
9. **blue** (cycles back)
10. **cyan**
11. ...

---

## Summary

- **Default behavior**: `autoColor: true` (automatic colors)
- **Manual mode**: `autoColor: false` (only explicit colors, others gray)
- **Mixed mode**: Combine auto and manual colors
- **Special fields**: `reserved` and `padding` are always gray
- **8 colors**: blue, cyan, yellow, green, orange, purple, mint, pink
