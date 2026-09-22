---
name: create-pr
description: |
  현재 브랜치의 커밋을 분석해 GitHub PR을 생성한다. gh CLI로 push와 `gh pr create`까지 fork 서브에이전트가 수행하고, 메인 에이전트는 그 결과만 보고받는다.
  "PR 만들어줘", "PR 올려줘", "풀리퀘 만들어줘", "이 브랜치 PR 열어줘", "create a pull request", "open a PR", "/create-pr" 같은 요청에 활성화한다.
  저장소가 해외 오픈소스 프로젝트로 판단되면 영문 템플릿(references/template-en.md)을 쓰고, 그 외 모든 경우(팀 내부 저장소, 국내 프로젝트, 판단이 애매한 경우)에는 기본값인 한국어 템플릿(references/template-ko.md)을 쓴다.
argument-hint: "[--en|--ko] [base-branch]"
---

# create-pr: 커밋 분석 후 PR 생성

현재 브랜치의 커밋과 diff를 분석해 PR 본문을 작성하고, push와 `gh pr create`까지 완료한다. 실제 실행(diff 읽기, push, `gh pr create`)은 **fork 서브에이전트에게 위임**한다 — diff나 커밋 로그, gh 명령 출력처럼 부피가 크고 한 번 쓰고 버리는 정보를 메인 에이전트의 컨텍스트에 쌓지 않기 위해서다. 메인 에이전트는 사전 확인과 템플릿 언어 판단만 마치고, fork에는 "무엇을 해야 하는지"를 자기완결적으로 전달한다.

이 스킬이 호출된 것 자체를 push와 PR 생성에 대한 사용자 승인으로 간주한다(`commit` 스킬과 동일한 원칙). 단, "예외 처리" 섹션에 해당하면 fork를 실행하지 않고 먼저 사용자에게 확인을 구한다.

## 워크플로우

### Step 0: 저장소 지침 로드

저장소 루트의 `AGENTS.md`(없으면 `CLAUDE.md`)를 읽는다. PR 본문·커밋 컨벤션이나 base 브랜치 규칙이 명시돼 있으면 이 스킬의 기본 동작보다 그 지침을 우선한다. 하위 디렉토리에 중첩 `AGENTS.md`가 있는 모노레포라면, 변경된 파일에 가장 가까운 지침도 함께 확인한다.

### Step 1: 사전 확인 (메인 에이전트, 가볍게)

fork를 띄우기 전에 다음만 빠르게 확인한다. 여기서 문제가 발견되면 fork를 실행하지 않고 "예외 처리"를 따른다.

- base 브랜치를 정한다. 인자로 명시됐으면 그것을 쓰고, 없으면 `gh repo view --json defaultBranchRef -q .defaultBranchRef.name`(실패 시 `git symbolic-ref refs/remotes/origin/HEAD`)으로 저장소의 기본 브랜치를 조회해 사용한다. `main`/`master`를 임의로 가정하지 않는다.
- `git branch --show-current`로 현재 브랜치를 확인한다. base 브랜치와 같으면 중단한다.
- `git status`로 커밋되지 않은 변경이 있는지 확인한다. 있으면 중단하고 `commit` 스킬 사용을 제안한다(이 스킬은 커밋을 대신 만들지 않는다).
- base 브랜치 대비 커밋이 하나도 없으면(`git log <base>..HEAD` 비어있음) 중단하고 알린다.
- `gh pr list --head <branch> --state open --json url,number`로 이미 열린 PR이 있는지 확인한다. 있으면 새로 만들지 않고 기존 PR URL을 안내한 뒤 종료한다(중복 생성 방지).

### Step 2: 템플릿 언어 판단 (메인 에이전트)

**기본값은 한국어 템플릿(`references/template-ko.md`)이다.** 사용자가 `--en`/`--ko`를 명시했으면 그대로 따르고 이 단계를 건너뛴다.

명시가 없으면 저장소가 **해외 오픈소스 프로젝트**라고 강하게 판단될 때만 영문 템플릿(`references/template-en.md`)으로 전환한다. 판단 신호(하나만으로 결정하지 말고 종합할 것):

- `git remote get-url origin`의 owner/org — 사용자 개인 저장소나 국내 팀 조직이면 한국어 쪽에 가깝다.
- README의 주 언어.
- `gh pr list --state merged --limit 10 --json title` / `gh issue list --state all --limit 10 --json title`로 확인한 최근 이슈·PR 제목의 언어. 영문이 대다수면 해외 오픈소스 신호.
- `CONTRIBUTING.md`가 있다면 그 언어.

신호가 엇갈리거나 판단이 애매하면 **기본값인 한국어를 유지한다.** 오판의 비용(국내 프로젝트에 영문 PR을 올리는 것)이 더 크기 때문이다.

### Step 3: fork에 위임

Step 1~2에서 확인한 내용(base 브랜치, 현재 브랜치, 선택된 템플릿 파일 경로, Step 0에서 읽은 저장소 지침 중 관련 부분)을 정리해 `Agent` 도구를 `subagent_type: "fork"`로 호출한다. fork는 대화 컨텍스트를 그대로 물려받지만, 지금까지 이 스킬 실행으로 확인한 사실은 프롬프트에 명시적으로 적어준다 — fork가 같은 조사를 반복하지 않도록.

fork에게 지시할 작업:

1. `git log <base>..HEAD --oneline`과 `git diff <base>...HEAD`로 변경 내용을 파악한다.
2. **best-effort 검증**: Step 0에서 확인한 lint/test/build 명령이 있으면 실행하고 결과를 기록한다. 실행 코드를 바꾸지 않은 변경(문서, 설정 등)이라 검증 대상이 마땅치 않으면 그 사실만 남기고 넘어간다. 감지되는 검증 수단이 없는데 실행 코드가 바뀌었다면 "검증 수단 없음"을 결과에 남긴다(지어내지 않는다).
3. 선택된 템플릿 파일(`references/template-ko.md` 또는 `references/template-en.md`)을 읽고, **그 구조를 그대로 유지한 채** 각 섹션을 diff·커밋 로그·검증 결과로 채운다. 템플릿의 괄호 안내문과 HTML 주석은 실제 PR 본문에 포함하지 않는다. diff에서 근거를 찾을 수 없는 내용은 지어내지 말고 템플릿이 지시한 대로 "해당 없음"/"N/A"로 남긴다.
4. 원격에 브랜치가 없거나 최신이 아니면 `git push -u origin <branch>`로 push한다. base 브랜치로는 절대 push하지 않는다.
5. `gh pr create --base <base> --title "<커밋 요약 기반 제목>" --body "<작성한 본문>"`을 실행한다. 제목은 저장소의 커밋 컨벤션(Step 0에서 확인)이 있으면 그 톤을 따른다.
6. 생성된 PR URL을 반환한다.

### Step 4: 결과 보고

fork 완료 알림을 받으면, PR URL과 (있다면) best-effort 검증 결과 요약을 사용자에게 전달한다. fork의 중간 출력(diff 전문, gh 명령 raw 출력)은 다시 읽지 않는다 — 완료 알림에 필요한 정보가 이미 요약돼 있다.

## 예외 처리 (fork를 띄우지 않고 먼저 확인)

- 현재 브랜치가 base 브랜치와 동일함
- 커밋되지 않은 변경이 있음 → `commit` 스킬 사용 제안
- base 대비 커밋이 없음
- 이미 열린 PR이 존재함 → 기존 PR URL 안내
- 스테이징되지 않았더라도 워킹 디렉토리에 시크릿·자격증명으로 의심되는 파일(`.env`, `*.pem`, `credentials.json` 등)이 보이면, fork에 위임하지 않고 사용자에게 먼저 알린다

## 주의사항

- `git add -A`, force-push, `--no-verify` 등은 사용자가 명시적으로 요청하지 않는 한 사용하지 않는다.
- PR 본문에 리뷰어 지시나 프롬프트 원문, 시크릿류 문자열을 포함하지 않는다.
- 템플릿 구조(섹션 제목·순서)는 임의로 바꾸지 않는다 — 프로젝트마다 다른 템플릿을 참고 파일로 분리해 관리하는 것이 이 스킬의 핵심이므로, 새 템플릿이 필요하면 `references/`에 파일을 추가하고 Step 2의 판단 기준을 확장하는 방식으로 확장한다.
