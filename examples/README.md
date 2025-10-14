# ByteGrid Examples

This folder contains example files for the ByteGrid plugin.

## How to Use

1. Open the example file you want to use
2. **Select all** content and copy it
3. Create a code block in your Obsidian note:
   ```
   ```bytegrid
   [paste here]
   ```
   ```

## Example Files

### Basic Examples

#### 1. simple-struct.yaml
- Simple 16-byte structure
- 4 fields (ID, Timestamp, Value, Checksum)
- 8 bytes/row layout

#### 2. wav-header.yaml
- WAV audio file header (44 bytes)
- 14 fields (RIFF, WAVE, fmt, data chunks)
- 16 bytes/row layout
- Includes audio format, sample rate, etc.

### Network Protocols

#### 3. tcp-header.yaml
- TCP protocol header (20 bytes)
- 10 fields (ports, sequence number, flags, etc.)
- **Bitfield example**: 8 TCP flags (CWR, ECE, URG, ACK, PSH, RST, SYN, FIN)
- 16 bytes/row layout

#### 4. ip-header.yaml
- IPv4 header (20 bytes)
- 10 fields (Version, DSCP, TTL, Protocol, IP addresses, etc.)
- **Bitfield example**: Version+IHL, DSCP+ECN, Flags+FragmentOffset
- Includes IP fragmentation flags (DF, MF)

### File System & Permissions

#### 5. file-attributes.yaml
- FAT32 file attributes (4 bytes)
- **Bitfield example**: 8 file attribute flags
- READ_ONLY, HIDDEN, SYSTEM, DIRECTORY, ARCHIVE, etc.

#### 6. unix-permissions.yaml
- Unix file permissions (2 bytes)
- **Bitfield example**: rwxrwxrwx (9 bits)
- Owner/Group/Others permissions (read/write/execute)

### Hardware & CPU

#### 7. cpu-flags.yaml
- x86 CPU FLAGS register (4 bytes)
- **Bitfield example**: 16 CPU flags
- CF, ZF, SF, IF, DF, OF, IOPL, etc.

## Important Notes

⚠️ **Watch Out for Indentation When Copying**

Obsidian may automatically add indentation when pasting into code blocks.

**If you encounter issues:**
1. Switch to Obsidian **Source Mode** (Ctrl/Cmd + E)
2. Check the line after ` ```bytegrid`
3. There should be **no spaces** before `name:`
4. Remove any extra spaces if present

## Create Your Own

To visualize a new structure:

```yaml
name: Structure Name
size: total byte size
layout: 16  # bytes per row (optional, default: 16)
legendPosition: right  # right, left, bottom, none (optional, default: right)
showFooter: true  # show/hide footer (optional, default: true)
fields:
  - offset: 0-3
    name: FieldName
    type: uint32_t
    color: blue  # blue, cyan, yellow, green, orange, purple, mint, pink, gray
    description: "Description"  # optional
```

## Bit-Level Layout Examples

### 8. simple-bit-layout.yaml
- Basic bit-level layout test (16 bits)
- **Suffix notation**: `size: 16b`, `layout: 16b`, `offset: 0-7b`
- `layoutUnit` can be omitted (auto-inferred from suffix)

### 9. nibble-test.yaml
- 4-bit field (nibble) test
- Each nibble represented independently

### 10. mixed-bit-byte.yaml
- Mixed bit and byte offsets
- `0-3b` (bit), `1B` (Byte), `2-3` (byte, default)

### 11. ipv4-bit-layout.yaml
- IPv4 header in bit-level representation
- Sub-byte fields like Version(4bit) + IHL(4bit)

**Suffix Notation:**
- `b` (lowercase) = bit: `32b`, `0-7b`
- `B` (uppercase) = Byte: `4B`, `0-3B`
- no suffix = byte (default)

**layoutUnit field:**
- Can be omitted (auto-inferred from suffix)
- Can be explicit (use `layoutUnit: bit` or `layoutUnit: byte` if desired)
