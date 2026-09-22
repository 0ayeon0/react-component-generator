# server/AGENTS.md

## Module Context

Bun 기반 API 프록시 서버. 클라이언트의 프롬프트를 Anthropic/Google 프로바이더에 전달하고, AI 응답을 `react-live`가 실행 가능한 코드로 정규화해 반환한다. Vite 개발 서버가 `/api/*` 요청을 `http://localhost:3002`로 프록시한다 (`vite.config.ts:9-14`).

## Tech Stack & Constraints

- 외부 HTTP 프레임워크 없이 `Bun.serve` 네이티브 API만 사용한다 (`server/index.ts:138`). Express/Fastify 등을 추가하지 마라.
- 외부 fetch 대신 fetch 래퍼 라이브러리를 도입하지 마라 — `callAnthropic`/`callGoogleModel`는 전역 `fetch`를 직접 사용한다 (`server/index.ts:69,101`).

## Implementation Patterns

- **새 프로바이더 추가 시** 다음 지점을 함께 수정한다: `Provider` 타입 (`index.ts:57`) → `ENV_KEYS` 매핑 (`index.ts:59-62`) → `call*` 함수 작성 → `/api/generate` 핸들러의 `provider === 'google' ? ... : ...` 분기 (`index.ts:184-186`).
- **AI 응답은 항상 `stripCodeFences` → `ensureRenderCall` 순서로 정규화한 뒤 반환한다** (`index.ts:188`). 순서를 바꾸거나 하나를 생략하지 마라.
- 에러는 `err.message`에 상태 코드 문자열이 포함되는지로 분기한다 (`index.ts:194` `message.includes('503')`, `:201` `.includes('429')`). 새 프로바이더 에러도 이 문자열 매칭 관행을 따르거나, 최소한 기존 매칭을 깨지 않게 추가한다.

## Testing Strategy

- `bun run test` (vitest) 로 `server/**/*.test.ts` 실행.
- `generator.ts`, `fallback.ts`처럼 부수효과 없는 순수 함수만 단위 테스트 대상으로 삼는다. `index.ts`의 `Bun.serve` 핸들러 자체는 테스트하지 않는 기존 관행을 따른다 (통합 테스트가 필요하면 먼저 사용자와 상의).

## Local Golden Rules

- `SYSTEM_PROMPT` (`index.ts:7-49`)를 수정할 때 "no import statements", "no TypeScript syntax", "call render(...) at the end" 규칙을 반드시 유지한다. 어기면 `LivePreview.tsx`의 `noInline` eval이 즉시 깨진다.
- `resolveApiKey` (`index.ts:64-66`)는 클라이언트가 보낸 `apiKey`를 서버의 `ENV_KEYS`보다 우선한다. 이 우선순위를 뒤집지 마라 — 사용자가 UI에서 직접 입력한 키로 서버 환경변수를 덮어쓰는 것이 의도된 동작이다 (`src/App.tsx:124` "서버 키 사용 중 (직접 입력으로 덮어쓰기 가능)").
- `GOOGLE_MODELS` (`index.ts:5`) 배열 순서는 폴백 우선순위다. 순서를 바꾸면 `withModelFallback`의 시도 순서가 바뀐다 — 의도적인 변경이 아니면 유지한다.
