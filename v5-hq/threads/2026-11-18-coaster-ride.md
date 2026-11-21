# 롤러코스터 주행 연출

- 요청: 주행에 360도 회전과 불꽃을 추가한다. 레버와 키퍼의 손 UI는 HQ 담당이므로 변경하지 않는다.
- 구현: 기존 30초 선로 주행 중 열차와 탑승 시점에 부드러운 360도 배럴 롤을 적용하고, 세 차례 불꽃이 펼쳐지도록 했다. 움직임 줄이기 설정에서는 고정 시점을 유지하고 불꽃 애니메이션을 숨긴다. 종료 후 불꽃도 숨긴다.
- 변경 파일: `neverland-v4/coaster.js`, `neverland-v4/verify-carnival-scene.cjs`. 기어·레버·키퍼 UI 코드는 변경하지 않았다.
- 검증: `node --check neverland-v4/coaster.js` 통과. `node neverland-v4/verify-carnival-scene.cjs`에서 실제 Three.js 장면 생성 및 롤러코스터 구간(뒤집힘, 불꽃 표시, 움직임 줄이기, 복귀 후 숨김 포함) 통과. 전체 스크립트는 이후 별도 마스코트 검증에서 Three.js TextureLoader의 `document is not defined` 오류로 종료되어 전체 통과는 아니다. 실제 브라우저 시각 검증은 아직 하지 않았다.
- 통합 상태: 공유 작업 폴더의 게임 파일에 반영됨. HQ에서 다른 작업과 함께 시각 확인 필요.
