# ByteGrid - 프로젝트 지침

## 프로젝트 개요

**ByteGrid**는 바이너리 데이터와 C 구조체의 메모리 레이아웃을 시각화하는 Obsidian 플러그인입니다.

- **공식 표기:** ByteGrid (PascalCase)
- **패키지명:** bytegrid (lowercase)

## 핵심 기능

마크다운 코드블록에서 구조체 정의를 입력하면 SVG로 시각화:
- 각 필드를 색상 블록으로 표현
- 바이트 단위 격자선으로 정확한 크기 표시
- 비트 단위 필드 시각화 지원
- 헥스 덤프와 필드 설명 포함
- 실제 바이너리 파일과 구조체 매핑
- 인터랙티브 툴팁 및 하이라이트
- 다양한 형식으로 내보내기 (SVG, PNG, C 코드, Markdown)

## 사용 예시

````markdown
```bytegrid
name: WAV Header
size: 44
layout: 16  # bytes per row

fields:
  - offset: 0-3
    name: ChunkID
    type: char[4]
    value: "RIFF"
    color: blue
  - offset: 4-7
    name: ChunkSize
    type: uint32_t
    color: cyan
    endianness: little
```
````

## 저장소 구조

```
bytegrid/
├── packages/
│   ├── core/                   # 핵심 렌더링 로직
│   │   └── src/
│   │       ├── types.ts        # 타입 정의
│   │       ├── errors.ts       # 커스텀 에러
│   │       ├── parser.ts       # YAML 파싱
│   │       ├── validator.ts    # 유효성 검증
│   │       ├── layoutEngine.ts # 레이아웃 계산
│   │       ├── svgRenderer.ts  # SVG 생성
│   │       ├── binaryParser.ts # 바이너리 파일 파싱
│   │       ├── templates.ts    # 구조체 템플릿
│   │       ├── comparison.ts   # 구조체 비교
│   │       ├── exporter.ts     # 다양한 형식 내보내기
│   │       ├── cache.ts        # 렌더링 캐시
│   │       └── index.ts        # 공개 API
│   │
│   └── obsidian-plugin/        # Obsidian 플러그인
│       └── src/
│           ├── main.ts         # 플러그인 엔트리
│           ├── processor.ts    # 코드블록 프로세서
│           ├── settings.ts     # 설정 UI
│           ├── commands.ts     # 플러그인 커맨드
│           └── modals.ts       # 모달 UI
│
├── docs/                       # 상세 설계 문서
│   ├── architecture.md         # 전체 아키텍처
│   ├── api-design.md          # 핵심 모듈 설계
│   ├── plugin-design.md       # 플러그인 설계
│   ├── syntax.md              # 입력 형식 & 색상
│   ├── testing.md             # 테스트 전략
│   ├── deployment.md          # 배포 전략
│   ├── roadmap.md             # 구현 로드맵
│   ├── limitations.md         # 알려진 제한사항
│   └── references.md          # 참고 자료 & FAQ
│
└── examples/                   # 예시 파일들
```

## 기술 스택

- **언어:** TypeScript
- **빌드:** esbuild (Obsidian 표준)
- **테스트:** Jest (TDD 기반)
- **패키지 관리:** npm
- **린팅:** ESLint
- **포맷팅:** Prettier
- **문서:** TypeDoc
- **CI/CD:** GitHub Actions

## 핵심 설계 원칙

### 1. offset이 SSOT (Single Source of Truth)
- Field 인터페이스에 `size` 필드 없음
- `offset: "0-3"` → 크기는 자동 계산 (4바이트)
- `offset: "4"` → 크기는 1바이트

### 2. 명시적 패딩 지원
- `type: "reserved"` 또는 `type: "padding"`으로 명시
- 자동으로 회색으로 표시

### 3. 동적 높이 계산
- SVG 렌더러는 내용에 따라 높이 자동 계산
- 매직 넘버 사용 금지, 상수 사용
- 헥스덤프, 범례 위치도 동적 계산

### 4. TDD (Test-Driven Development)
**중요:** 모든 모듈은 테스트를 먼저 작성한 후 구현합니다.

1. ✅ 테스트 작성 (Red)
2. ✅ 최소 구현 (Green)
3. ✅ 리팩토링 (Refactor)

## 입력 형식 명세

### 필수 필드
```yaml
name: string        # 구조체 이름
size: number        # 총 바이트 크기
fields: Field[]     # 필드 배열
```

### Field 형식
```yaml
- offset: "0-3"     # 필수: 오프셋 범위 (SSOT)
  name: ChunkID     # 필수: 필드명
  type: char[4]     # 필수: 타입
  value: "RIFF"     # 선택: 예시 값
  description: "RIFF magic number"  # 선택: 설명
  color: blue       # 선택: 색상
  endianness: little  # 선택: 엔디안 (기본: little)
  bitfields:        # 선택: 비트필드
    - name: Flag1
      bits: "0-3"
```

### 지원 타입
- `char`, `int8_t`, `uint8_t`
- `int16_t`, `uint16_t`, `short`
- `int32_t`, `uint32_t`, `int`
- `int64_t`, `uint64_t`, `long`
- `float`, `double`
- 배열: `char[4]`, `uint8_t[16]`
- 특수: `reserved`, `padding`

## 색상 시스템

### 기본 색상 (Default 스킴)
- `blue` - 식별자, 매직 넘버
- `cyan` - 크기/길이 필드
- `yellow` - 플래그, 옵션
- `green` - 카운트, 개수
- `orange` - 청크 헤더
- `purple` - 타임스탬프
- `mint` - 정렬/블록 정보
- `pink` - 실제 데이터, 페이로드
- `gray` - 패딩, 예약 영역

### 색상 스킴
- **Default:** 기본 파스텔 톤
- **Dark:** 채도 낮춤 (눈의 피로 감소)
- **Light:** 명도 높임 (밝은 배경 적합)

## 현재 구현 단계

### Phase 1: MVP ✅
- 프로젝트 구조 설정
- Core 패키지 기본 구현
- Obsidian 플러그인 기본

### Phase 2: 핵심 기능 🚧
- 여러 행 레이아웃 지원
- 격자선 렌더링
- 색상 시스템
- 비트필드 시각화

### Phase 3-5: 계획됨 📋
- 상세 로드맵은 `docs/roadmap.md` 참조

## 아키텍처 개요

### 데이터 흐름
```
YAML Input → Parser → Validator → LayoutEngine → SVGRenderer → Output
                                         ↓
                                    BinaryParser (optional)
```

### 핵심 모듈

#### 1. Parser (`parser.ts`)
- YAML 문자열을 `ByteGridConfig` 객체로 변환
- 기본값 설정 (`layout: 16` 등)
- 파싱 에러 처리

#### 2. Validator (`validator.ts`)
- 필드 겹침 검증
- 범위 검증 (총 크기 초과 여부)
- 타입 유효성 검증
- 필수 필드 검증

#### 3. LayoutEngine (`layoutEngine.ts`)
- 필드를 행/열 기반 레이아웃으로 변환
- 여러 행에 걸치는 필드 분할
- 패딩 블록 자동 추가

#### 4. SVGRenderer (`svgRenderer.ts`)
- `LayoutBlock[]`를 SVG 문자열로 변환
- 동적 높이 계산 (내용에 따라)
- 격자선, 헥스덤프, 범례 렌더링
- 인터랙티브 기능 (툴팁, 하이라이트)
- 접근성 (ARIA 속성)

#### 5. BinaryParser (`binaryParser.ts`)
- 실제 바이너리 파일 읽기
- 엔디안 처리
- 필드 값 자동 추출
- 헥스덤프 생성

#### 6. 보조 모듈
- **templates.ts:** WAV, ELF, TCP 등 사전 정의 템플릿
- **comparison.ts:** 구조체 비교 (side-by-side, overlay)
- **exporter.ts:** SVG, PNG, C 코드, Markdown 내보내기
- **cache.ts:** 렌더링 결과 캐싱 (성능 최적화)

## 성능 최적화

### 캐싱 전략
- 입력 YAML 해시 기반 캐시
- 5분 TTL (Time To Live)
- 자동 정리 (오래된 캐시 삭제)
- 향후: localStorage/IndexedDB 영구 저장 검토

### 성능 목표치
- **1000바이트 미만:** 100ms 이내 렌더링
- **10000바이트:** 500ms 이내 렌더링
- **캐시 히트율:** 70% 이상

### 대용량 처리 (Phase 4-5)
- 페이지네이션 (1000바이트 단위)
- 가상 스크롤링
- 지연 로딩

## 알려진 제한사항

### 1. YAML 파싱 에러의 라인 번호
- 현재: 필드 인덱스 기반 에러 메시지
- 향후: 라인 번호 표시 개선 검토

### 2. 캐시 퍼시스턴스
- 현재: 메모리 기반 (세션 종료 시 삭제)
- 향후: localStorage (Phase 4-5)
- 미래: IndexedDB 검토

### 3. 커스텀 타입 확장
- 현재: 사전 정의된 타입만 지원
- 향후: 타입 별칭 (type alias) 지원 (Phase 4-5)

### 4. 기타
- 비트 오더: MSB 우선 가정 (LSB/MSB 선택 옵션 향후 추가)
- 중첩 구조체: 현재 미지원
- 유니온 타입: 현재 미지원

## 개발 지침

### 코드 작성 시
1. **테스트 먼저 작성** (TDD)
2. 타입을 명확히 정의
3. 에러 처리 철저히
4. 주석은 "왜"를 설명
5. 매직 넘버 사용 금지, 상수 사용

### 커밋 메시지
- Conventional Commits 규칙 준수
- 예: `feat(parser): add bitfield parsing support`

### VSCode 설정
- Format on save 활성화
- ESLint auto fix 활성화
- TypeScript SDK 경로 설정

## 문서 구조

### 사용자 문서 (`docs/`)
- **getting-started.md:** 빠른 시작 가이드
- **syntax-reference.md:** YAML 문법 레퍼런스
- **type-reference.md:** 지원 타입 목록
- **examples/:** 실제 사용 예시 (WAV, ELF, TCP, PNG 등)
- **troubleshooting.md:** 문제 해결 가이드

### API 문서
- TypeDoc으로 자동 생성
- 모든 public API에 JSDoc 주석 필수

## 배포 전략

### 버전 관리
- **Semantic Versioning** (MAJOR.MINOR.PATCH)
- **CHANGELOG.md** 자동 생성
- 설정 마이그레이션 로직 포함

### CI/CD
- GitHub Actions (테스트, 린트, 빌드)
- npm 패키지 자동 발행
- Obsidian 커뮤니티 플러그인 등록

### 릴리스 프로세스
1. 테스트 통과 확인
2. CHANGELOG 업데이트
3. `manifest.json`, `versions.json` 업데이트
4. Git 태그 생성
5. GitHub 릴리스 생성
6. npm 발행
7. 커뮤니티 플러그인 저장소 PR

## 빠른 참조

### 필드 정의 필수 속성
```yaml
- offset: "0-3"     # 필수: SSOT
  name: FieldName   # 필수
  type: uint32_t    # 필수
```

### 템플릿 사용
- WAV_HEADER
- ELF_HEADER (64-bit)
- TCP_HEADER
- (향후 확장 가능)

### 비트필드 예시
```yaml
- offset: "12"
  name: Flags
  type: uint8_t
  bitfields:
    - name: CWR
      bits: "7"
    - name: ECE
      bits: "6"
    - name: URG
      bits: "5"
```

## 주요 문서

- **전체 아키텍처:** [docs/architecture.md](docs/architecture.md)
- **핵심 모듈 설계:** [docs/api-design.md](docs/api-design.md)
- **플러그인 설계:** [docs/plugin-design.md](docs/plugin-design.md)
- **입력 문법:** [docs/syntax.md](docs/syntax.md)
- **색상 시스템:** [docs/syntax.md](docs/syntax.md)
- **테스트 전략:** [docs/testing.md](docs/testing.md)
- **배포 전략:** [docs/deployment.md](docs/deployment.md)
- **구현 로드맵:** [docs/roadmap.md](docs/roadmap.md)
- **제한사항:** [docs/limitations.md](docs/limitations.md)
- **참고 자료:** [docs/references.md](docs/references.md)

---

**문서 버전:** 2.1
**최종 수정일:** 2025-10-08

**v2.1 변경사항:**
- 백업 파일에서 설계 내용만 추출하여 재구성
- 구현 코드 예시 제거 (docs/api-design.md로 분리)
- 핵심 설계 원칙과 아키텍처 개요만 유지
- 실제 구현은 필요할 때 참조하도록 구조 개선

**v1.1 변경사항:**
1. Field 인터페이스에서 `size` 제거 - `offset`이 SSOT (Single Source of Truth)
2. `reserved`, `padding` 타입 명시적 지원
3. SVG 렌더러 동적 높이 계산 구현
4. 매직 넘버 제거, 레이아웃 상수 사용
5. TDD 기반 개발 강조 (Phase 1부터 테스트 작성)
6. Section 12 추가: 알려진 제한사항 및 향후 개선사항
   - YAML 라인 번호 에러 메시지
   - 캐시 퍼시스턴스 전략
   - 커스텀 타입 확장성