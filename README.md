# 네버랜드 v5 · 키퍼의 놀이공원

직접 놀이공원을 돌아다니며 키퍼와 다섯 기구의 이야기를 발견하는 3D 판타지 미스터리 게임입니다. `index.html`이 현재 통합본입니다.

## 다른 컴퓨터에서 실행하기

Git과 Node.js를 설치한 뒤 터미널에서 실행하세요. npm 설치나 API 키는 필요 없습니다.

```sh
git clone https://github.com/eun2212/neverland-v5.git
cd neverland-v5
node server.cjs
```

브라우저에서 http://127.0.0.1:8773/ 을 엽니다. 종료하려면 터미널에서 Ctrl+C를 누릅니다. Windows에서는 `START.cmd`도 사용할 수 있습니다. WebGL을 지원하는 데스크톱 브라우저를 권장합니다.

진행 저장과 엔딩 기록은 사용한 브라우저에 보관됩니다. GitHub로 코드를 옮겨도 다른 컴퓨터에 플레이 저장 데이터가 자동으로 옮겨지지는 않습니다.

## 현재 작업과 이어서 개발하기

- [최신 인수인계](HANDOFF.md)와 [v5 작업 기록](v5-hq/threads/README.md)을 먼저 확인하세요. Codex 대화 자체는 Git에 저장되지 않으며, 작업 기록 파일은 별도 보관본입니다.
- 게임 내 **장면 이동 · 제작**에서 이야기 분기, 기구별 탑승·조작·키퍼 개입·운행, 미니게임과 엔딩을 테스트할 수 있습니다. 제작 테스트는 일반 플레이의 수집 기록에 저장되지 않습니다.
- 기구 조작은 `coaster-lever.js`, `coaster-safetybar.js`, `ride-interactions.js`에 있습니다. 장면 이동 UI는 `game-tools.js`, 공원 외형과 간판은 `carnival-scene.js`에 있습니다.
- `play.html`과 `game.js`는 예전 독립 데모입니다. `prepare-full-story.cjs`는 현재 통합본을 덮어쓸 수 있으므로 실행하지 마세요.

## 검증

```sh
node verify-full-story.cjs
node verify-game-tools.cjs
node verify-scene-lab.cjs
node verify-ride-interactions.cjs
node verify-coaster-safetybar.cjs
node verify-coaster-entry.cjs
node verify-ride-signs.cjs
node verify-midway-signs.cjs
```

자동 검사는 게임 로직과 일부 모의 화면을 확인합니다. 그래픽과 3D 화면, 기기별 조작은 실제 브라우저에서도 확인해야 합니다. GitHub 푸시는 공개 플레이 사이트의 자동 배포를 의미하지 않습니다.
