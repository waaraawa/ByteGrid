# ByteGrid Examples

이 폴더에는 ByteGrid 플러그인에서 사용할 수 있는 예시 파일들이 있습니다.

## 사용 방법

1. 원하는 예시 파일을 엽니다
2. 내용을 **모두 선택**하여 복사합니다
3. Obsidian 노트에서 코드블록을 만듭니다:
   ```
   ```bytegrid
   [여기에 붙여넣기]
   ```
   ```

## 예시 파일 목록

### 기본 예시

#### 1. simple-struct.yaml
- 간단한 16바이트 구조체
- 4개 필드 (ID, Timestamp, Value, Checksum)
- 8바이트/행 레이아웃

#### 2. wav-header.yaml
- WAV 오디오 파일 헤더 (44바이트)
- 14개 필드 (RIFF, WAVE, fmt, data 청크)
- 16바이트/행 레이아웃
- 오디오 형식, 샘플레이트 등 포함

### 네트워크 프로토콜

#### 3. tcp-header.yaml
- TCP 프로토콜 헤더 (20바이트)
- 10개 필드 (포트, 시퀀스 번호, 플래그 등)
- **비트필드 예시**: 8개 TCP 플래그 (CWR, ECE, URG, ACK, PSH, RST, SYN, FIN)
- 16바이트/행 레이아웃

#### 4. ip-header.yaml
- IPv4 헤더 (20바이트)
- 10개 필드 (Version, DSCP, TTL, Protocol, IP 주소 등)
- **비트필드 예시**: Version+IHL, DSCP+ECN, Flags+FragmentOffset
- IP 단편화 플래그 포함 (DF, MF)

### 파일 시스템 & 권한

#### 5. file-attributes.yaml
- FAT32 파일 속성 (4바이트)
- **비트필드 예시**: 8개 파일 속성 플래그
- READ_ONLY, HIDDEN, SYSTEM, DIRECTORY, ARCHIVE 등

#### 6. unix-permissions.yaml
- Unix 파일 권한 (2바이트)
- **비트필드 예시**: rwxrwxrwx (9비트)
- Owner/Group/Others 권한 (읽기/쓰기/실행)

### 하드웨어 & CPU

#### 7. cpu-flags.yaml
- x86 CPU FLAGS 레지스터 (4바이트)
- **비트필드 예시**: 16개 CPU 플래그
- CF, ZF, SF, IF, DF, OF, IOPL 등

## 주의사항

⚠️ **복사 시 들여쓰기 주의**

Obsidian 코드블록에 붙여넣을 때 자동으로 들여쓰기가 추가될 수 있습니다.

**문제 발생 시:**
1. Obsidian **소스 모드**로 전환 (Ctrl/Cmd + E)
2. ` ```bytegrid` 다음 줄 확인
3. `name:` 앞에 공백이 **없어야** 정상
4. 공백이 있다면 제거

## 직접 만들기

새로운 구조체를 시각화하려면:

```yaml
name: 구조체 이름
size: 전체 바이트 크기
layout: 16  # 한 행당 바이트 수 (선택, 기본값: 16)
fields:
  - offset: 0-3
    name: 필드명
    type: uint32_t
    color: blue  # blue, cyan, yellow, green, orange, purple, mint, pink, gray
    description: "설명"  # 선택사항
```

더 자세한 내용은 [CLAUDE.md](../CLAUDE.md)를 참조하세요.
