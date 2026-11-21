# 캡틴 훅 첫 레버 이동 독립 검증 — 2026-11-18

레버 작업 스레드 완료 후 현재 파일 기준 재검증. 게임 구현 파일은 수정하지 않음.

- `node verify-full-story.cjs`: 551개 통과. 실제 첫 입장, 승선, 장면 이동과 재시작 흐름을 모형에서 검증. 다만 이 테스트는 레버 모듈을 불러오지 않아 숨겨진 기존 range/launch를 직접 실행하므로 새 레버와 실제 첫 탑승의 결합 검증은 아니다.
- `node verify-keeper-story.cjs`: 716개 통과. 같은 레버 모듈 미탑재 한계가 있음.
- `node verify-coaster-lever.cjs`: 실제 레버 모듈의 오른쪽 출발, 초기 왼쪽/역방향 강제 출발, 취소, reduced motion, 정리 통과. 실제 스토리 경로와의 결합은 별도 확인 필요.
- `node verify-game-tools.cjs`: 604개 통과.
- `node threads/verify-coaster-integration.cjs`: 기어 3개 뒤 즉시 출발, 레버 미표시, 중도 종료/부분 체결 종료 후 재입장 초기화 통과. DOM 모형 기준.
- `node verify-carnival-scene.cjs`: 롤러코스터 관련 실제 Three.js 차량 이동·한 바퀴·움직임 줄이기 검사는 통과했으나 이후 mascot-scene.js의 TextureLoader에서 `ReferenceError: document is not defined`로 전체 스크립트 종료 코드 1. 테스트용 Three.js VM에서 document 미정의이며 게임 브라우저 오류로 단정할 수 없음.
- 연결 코드 정적 확인: story-3d의 첫 승선 → keeperFirstBoarding3d → openFirstLever3d → 원래 tutorial → 실제 모듈 mount. onStart는 현재 launch.onclick을 조회하므로 keeper-story의 출발 대화 후 실 탑승으로 이어짐. close/modal은 레버를 destroy한다. 브라우저에서 실제 좌/우 출발, 대화 후 이동, 취소/재시작 재확인은 아직 독립 수행하지 못함. 특히 기존 전체 검증은 실제 레버 경로를 건너뛰므로 자동 통합 검증 보강 권장.

## 8766 미리보기 초기화 오류 재현
새 앱 내 브라우저 탭 `http://127.0.0.1:8766/`에서 재현. 첫 로드 콘솔에 `world.js:6 Error: WebGL unavailable`, `carnival-scene.js:4 Error creating WebGL context`가 발생했고 GPU 메시지는 `GL_VENDOR = Disabled`, `GL_RENDERER = Disabled`, `BindToCurrentSequence failed`를 보고했다. 이어 `story-3d.js:170`에서 undefined의 `connect` 접근 오류가 발생한다. 장면 이동 클릭은 `game-tools.js:18`의 undefined `state`, 게임 시작은 `story-3d.js:43 sync3d`의 undefined `state` 오류를 내며 요청한 증상이 재현됐다. 8766 서버 자체는 페이지를 정상 제공한다. 원인은 이 브라우저 세션의 WebGL 생성 실패로 초기화가 중단된 데 있으며, 왜 이 환경에서 실패했는지는 추가 조사 필요하다. 새 레버 자체의 결함이라고 볼 근거는 없다. WebGL이 동작하는 브라우저에서 재검증하고, 실패 시 사용자에게 오류를 알리도록 초기화 방어를 검토할 것.

## 시작 직후 멈춤 수정 — 2026-11-18
- 원인: 앱 내 브라우저에서 WebGL 컨텍스트 생성 실패 후 world.js가 중단되어 world3d가 만들어지지 않았고, 시작 버튼이 sync3d에서 undefined 상태를 읽어 다음 대사가 나오지 않았다. 이 환경의 GPU 비활성화 근본 이유는 미확인.
- 변경: world.js에서 WebGL 실패 시 게임 상태·조작 로직을 계속 실행하고 플레이어 위치, 방향, 놀이기구/좌석·출구를 그리는 간단 지도 모드로 대체. carnival-scene.js는 WebGL이 없으면 3D 초기화를 건너뜀. carnival-scene.css에 지도 캔버스 배치 추가. 정상 WebGL 경로와 저장 데이터 코드는 유지.
- 실제 8766 앱 내 브라우저에서 시작 → 첫 대사 → 다음 대사, 제작용 장면 이동 → 캡틴 훅 안내 → 새 레버 End → 출발 대사 → 탑승 진행률 2%를 확인. 이때 콘솔 오류 없음. 실제 걷기로 첫 탑승까지 이동하거나 좌측 강제 출발을 브라우저에서 재검증하지는 않음.
- 자동 검증: verify-full-story.cjs 551개, verify-keeper-story.cjs 716개, verify-coaster-lever.cjs 통과.
- 한계: 대체 화면은 3D가 아닌 간단 지도이며, 3D 전용 장면/롤러코스터 효과와 롤러코스터 도착 처리는 carnival-scene update에 의존해 폴백에서 완전하지 않다. 전체 게임의 동등한 대체 플레이를 보장하지 않으며 WebGL 자체 복구는 별도 필요. 포괄적 폴백을 확정하기 전 관련 장면 검증 필요.

## 지도 폴백 제거 확인 — 2026-11-18
요청을 받고 확인했을 때 world.js의 지도 폴백과 carnival-scene.js의 WebGL 우회, carnival-scene.css의 폴백 스타일은 이미 제거되어 있었다. 추가 게임 파일 수정 없이 현재 WebGL 렌더링 경로와 폴백 식별자 부재를 확인했다. verify-full-story.cjs 551개, verify-keeper-story.cjs 716개 통과(DOM/WebGL 모형). WebGL이 불가능한 앱 내 브라우저에서 이전에 재현된 초기화 문제는 폴백 제거로 다시 발생할 수 있으며 실제 3D 브라우저 검증은 이번에 하지 않았다. 캡틴 훅·롤러코스터 파일은 건드리지 않았다.

## WebGL 실패 재조사 — 2026-11-18
사용자 탭과 저장 자료는 건드리지 않고 별도 새 8766 탭을 열어 확인했다. 기존 미리보기 탭 1개가 이 작업 스레드의 앱 내 브라우저에 존재했으며 새 탭의 첫 WebGL 요청(world.js)부터 실패했다. carnival-scene.js의 WebGL 요청도 GL_VENDOR/GL_RENDERER Disabled 및 BindToCurrentSequence failed로 실패했다. 검사용 탭만 닫았다. world.js는 숨겨진 world-world 캔버스에 별도 WebGL을 생성하고 carnival-scene.js는 보이는 실제 3D용 컨텍스트를 생성한다. 중복 컨텍스트는 개선 후보이나 최초 컨텍스트가 이미 실패하므로 이번 로그만으로 중복이나 탭 누적이 근본 원인이라고 단정할 수 없다. 브라우저 GPU 프로세스/호스트 수준 원인은 확인되지 않았고, 3D 화면을 보장하지 못하는 지도 폴백을 재적용하거나 다른 게임 코드를 변경하지 않았다. 실 3D 게임 시작과 첫 대사는 미검증. 자동화에서 확인 가능한 호스트 GPU 진단·복구 수단 또는 WebGL이 작동하는 독립 브라우저가 필요하다.
