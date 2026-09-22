# AGENTS.md

Root governance file for AI coding agents working in this repository.

## Operational Commands

Package manager is pinned to `bun` (bun.lock present) — do not use npm/yarn/pnpm.

- `bun install` — install dependencies
- `bun run dev` — run API server + Vite dev server concurrently (required for the app to work; the API alone or Vite alone is not enough)
- `bun run server` — API server only, with `--watch` (server/index.ts)
- `bun run build` — `tsc -b && vite build`
- `bun run lint` — `eslint .`
- `bun run test` — `vitest run` (includes `src/**/*.test.{ts,tsx}` and `server/**/*.test.ts`, see vite.config.ts:20)
- `bun run test:watch` — `vitest` watch mode

## Golden Rules

### Immutable / Hard Constraints

- **AI-generated component code must be plain JavaScript, never TypeScript.** `server/index.ts:20` instructs the model: "Do NOT use TypeScript syntax — no type annotations, no interfaces, no generics". This is required because `src/components/LivePreview.tsx:14` renders code through `react-live`'s `noInline` mode, which evaluates the string directly — TS syntax breaks the eval. If you edit `SYSTEM_PROMPT` in `server/index.ts`, preserve this constraint.
- **AI-generated code must end with a `render(<Component />)` call.** `react-live` in `noInline` mode renders nothing without it. `server/generator.ts:12-24` (`ensureRenderCall`) auto-injects a render call if the model omits one, and `server/index.ts:16` also instructs the model to include it. Do not remove either safeguard without the other.
- **Never expose real API key values to the client.** `server/index.ts:147-157` (`GET /api/config`) returns only booleans (`envKeys.anthropic`, `envKeys.google`), never the key strings themselves. `.env` is excluded via `.gitignore:29`.

### Double Defense

- `server/generator.ts` applies `stripCodeFences` then `ensureRenderCall` together in `server/index.ts:188`. Both exist because the model's raw response can independently (a) include markdown code fences and (b) omit the `render()` call. Removing either function reopens a distinct failure mode covered by tests in `server/generator.test.ts`.

### Asymmetry

- Only the Google provider retries across multiple models: `server/index.ts:5` defines `GOOGLE_MODELS = ['gemini-3.1-flash-lite', 'gemini-3.5-flash']`, consumed via `withModelFallback` (`server/index.ts:134-136`, `server/fallback.ts`). The Anthropic path (`callAnthropic`, `server/index.ts:68-96`) calls a single fixed model with no fallback. When touching provider logic, preserve this asymmetry rather than "unifying" it unless you understand why Google needs fallback and Anthropic doesn't.

### Test Boundary

- `server/generator.ts` and `server/fallback.ts` are pure functions with no side effects (see the comment at `server/generator.ts:1-2`: "부수효과(Bun.serve 등)가 없어 단위 테스트가 가능하다") and both have `.test.ts` coverage. `server/index.ts` (the `Bun.serve` handler) and most of `src/components/*` (except `PromptInput.test.tsx`) have none. When adding new logic, extract it as a pure function alongside `generator.ts`/`fallback.ts` and add a test, rather than growing the untested `Bun.serve` handler or component bodies.

## Project Context

React 컴포넌트 생성기: 프롬프트를 입력하면 AI(Anthropic Claude 또는 Google Gemini)가 React 컴포넌트를 생성하고, `react-live`로 실시간 미리보기와 코드를 제공한다.

**Tech Stack**: React 19, TypeScript, Vite, Bun, react-live, Vitest, Anthropic Claude API, Google Gemini API.

## Standards & References

- 프로젝트 소개, 실행 방법, 기능 목록은 `README.md` 참고.
- 커밋 메시지 컨벤션은 `.claude/skills/commit/SKILL.md` 참고.
- **Maintenance Policy**: 코드 변경으로 이 문서의 규칙(특히 Golden Rules)이 실제 코드와 어긋나게 되면, 다음 작업에서 해당 항목의 업데이트를 제안할 것.

## Context Map

- **[AI 프로바이더/생성 로직 수정 (server/)](./server/AGENTS.md)** — SYSTEM_PROMPT, 프로바이더 추가/변경, 응답 정규화 로직 작업 시.
