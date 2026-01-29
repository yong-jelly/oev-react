import { Assets } from '../assets';

export interface DriverStat {
  label: string;
  value: string;
  description?: string;
}

export interface DriverPersona {
  id: string;
  name: string;
  avatar: string;
  appearance: string;
  bio: string;
  stats: DriverStat[];
  archetype: string;
  age: string;
  outfit: string;
  palette: string;
  prop: string;
  mood: string;
  shot: string;
  baseCommissionRange: [number, number]; // [min, max]
}

export const NPC_DRIVERS: DriverPersona[] = [
  {
    id: 'jack-harlow',
    name: 'Jack Harlow',
    avatar: Assets.images.characters.jackHarlow,
    appearance: '햇볕에 탄 피부, 짧게 친 금발, 턱선이 각진 얼굴, 거친 손등(오일 자국), 한쪽 눈썹에 작은 흉터.',
    bio: '“화물차+개조밴” 전문 트럭커 출신. 야간 장거리 운행으로 도시 외곽 루트를 머릿속에 외운 타입, 말수는 적지만 약속은 지킨다.',
    archetype: '트럭커',
    age: '30대',
    outfit: '가죽 재킷',
    palette: '올리브 그린+크림+브라운',
    prop: '장갑',
    mood: '무뚝뚝한 자신감',
    shot: '전신 정면(모델시트 느낌)',
    baseCommissionRange: [20, 35], // 베테랑 트럭커, 안정적 수수료
    stats: [
      { label: '장비 최대 속도', value: '+18%', description: '최대 50% 초과 불가' },
      { label: '보상금 추가', value: '+12%', description: '최대 50% 초과 불가' },
      { label: '추격 회피(DEX 체크) 성공률', value: '+8%', description: '최대 50% 초과 불가' },
    ],
  },
  {
    id: 'victor-kane',
    name: 'Victor Kane',
    avatar: Assets.images.characters.victorKane,
    appearance: '검은 포마드 헤어, 콧대가 높고 매서운 눈, 목에 오래된 이어피스 자국, 탄탄한 체격.',
    bio: '전직 레이서(서킷) → 불법 ‘야간 테스트 드라이버’ 전향. 코너 진입 과감하지만, 차량을 “망가뜨리지 않는 선”을 끝까지 지킨다.',
    archetype: '전직 레이서',
    age: '20대 후반',
    outfit: '비행 재킷',
    palette: '네이비+오프화이트+레드(포인트)',
    prop: '헬멧',
    mood: '여유있는 미소',
    shot: '허리 위 샷',
    baseCommissionRange: [25, 45], // 고성능 레이서, 높은 수수료
    stats: [
      { label: '장비 최대 속도', value: '+14%', description: '최대 50% 초과 불가' },
      { label: '코너링 안정성', value: '+20%', description: '최대 50% 초과 불가' },
      { label: '수리/정비 비용', value: '-10%', description: '최대 50% 초과 불가' },
    ],
  },
  {
    id: 'maya-reed',
    name: 'Maya Reed',
    avatar: Assets.images.characters.mayaReed,
    appearance: '짙은 갈색 단발, 도톰한 입술과 단단한 턱, 팔에 얇은 흉터 몇 개(정비 작업 흔적), 기름때가 스민 손목밴드.',
    bio: '항공정비사 출신의 “정확도 집착형” 드라이버. 위험을 싫어하는 게 아니라, 위험을 수치로 환산해서 제거하는 타입.',
    archetype: '항공정비사',
    age: '30대',
    outfit: '정비 점프수트',
    palette: '차콜+스틸 블루+오프화이트',
    prop: '툴백',
    mood: '피곤하지만 강한 눈빛',
    shot: '전신 정면(모델시트 느낌)',
    baseCommissionRange: [22, 38], // 전문 정비사, 중간-높은 수수료
    stats: [
      { label: '엔진 과열/고장 확률', value: '-18%', description: '최대 50% 초과 불가' },
      { label: '정찰/점검 시간', value: '-12%', description: '최대 50% 초과 불가' },
      { label: '보상금 추가', value: '+10%', description: '최대 50% 초과 불가' },
    ],
  },
  {
    id: 'serena-holt',
    name: 'Serena Holt',
    avatar: Assets.images.characters.serenaHolt,
    appearance: '웨이브 긴 머리(묶어서 정리), 시원한 이마와 똑바른 눈매, 군더더기 없는 체형, 귀에 작은 금속 이어커프.',
    bio: '해운 선장 집안에서 자라 “항로/기상/규정”에 강함. 도심 운전도 항해처럼 운영해서 팀에게 안정감을 준다.',
    archetype: '해운 선장',
    age: '20대 후반',
    outfit: '해군 코트',
    palette: '딥 네이비+오프화이트+골드(소량)',
    prop: '지도',
    mood: '무뚝뚝한 자신감',
    shot: '허리 위 샷',
    baseCommissionRange: [18, 30], // 안정 지향, 합리적 수수료
    stats: [
      { label: '악천후/야간 시야 페널티', value: '-15%', description: '최대 50% 초과 불가' },
      { label: '운송(화물 손상) 페널티', value: '-20%', description: '최대 50% 초과 불가' },
      { label: '보상금 추가', value: '+8%', description: '최대 50% 초과 불가' },
    ],
  },
  {
    id: 'rowan-vale',
    name: 'Rowan Vale',
    avatar: Assets.images.characters.rowanVale,
    appearance: '중성적인 실루엣, 긴 앞머리로 한쪽 눈을 살짝 가림, 창백한 피부에 다크서클, 얇은 장갑을 늘 착용.',
    bio: '용병 파일럿(드론/경량 비행체) 출신. 말투는 조용하지만 상황 판단이 빠르고, “탈출 루트”를 먼저 그린 뒤 움직인다.',
    archetype: '용병 파일럿',
    age: '30대',
    outfit: '비행 재킷',
    palette: '슬레이트 그레이+오프화이트+시안(포인트)',
    prop: '고글',
    mood: '피곤하지만 강한 눈빛',
    shot: '전신 정면(모델시트 느낌)',
    baseCommissionRange: [28, 50], // 특수 요원, 매우 높은 수수료
    stats: [
      { label: '추격 회피(DEX 체크) 성공률', value: '+16%', description: '최대 50% 초과 불가' },
      { label: '장비 최대 속도', value: '+10%', description: '최대 50% 초과 불가' },
      { label: '은신/잠입 이동 페널티', value: '-12%', description: '최대 50% 초과 불가' },
    ],
  },
  {
    id: 'eli-park',
    name: 'Eli Park',
    avatar: Assets.images.characters.eliPark,
    appearance: '마른 체형, 헝클어진 흑발, 큰 눈(하지만 결의가 있음), 무릎에 보호대 자국, 운동화 끈을 늘 꽉 묶음.',
    bio: '배달/퀵 라이더로 시작해 “골목 지형”이 몸에 박힘. 어른들 앞에선 말이 짧고, 운전대 잡으면 성격이 바뀐다.',
    archetype: '전직 레이서',
    age: '10대 후반',
    outfit: '가죽 재킷',
    palette: '블랙+오프화이트+레드(포인트)',
    prop: '고글',
    mood: '무뚝뚝한 자신감',
    shot: '허리 위 샷',
    baseCommissionRange: [12, 25], // 10대 라이더, 낮은 진입 장벽
    stats: [
      { label: '도심/골목길 이동 속도', value: '+22%', description: '최대 50% 초과 불가' },
      { label: '검문/봉쇄 우회 확률', value: '+10%', description: '최대 50% 초과 불가' },
      { label: '보상금 추가', value: '+6%', description: '최대 50% 초과 불가' },
    ],
  },
  {
    id: 'nina-cole',
    name: 'Nina Cole',
    avatar: Assets.images.characters.ninaCole,
    appearance: '단정한 포니테일, 작은 코와 빠른 눈동자, 팔꿈치에 밴드, 재킷 소매가 살짝 큼(빌려 입은 느낌).',
    bio: '정비소에서 심부름하며 기술을 훔쳐 배운 ‘샾 키드’. 큰길보다 “차가 사라지는 틈”을 찾아낸다.',
    archetype: '터프한 정비사',
    age: '10대 후반',
    outfit: '정비 점프수트',
    palette: '인디고+그레이+오프화이트',
    prop: '툴백',
    mood: '여유있는 미소',
    shot: '전신 정면(모델시트 느낌)',
    baseCommissionRange: [10, 22], // 샾 키드, 가장 낮은 수수료
    stats: [
      { label: '정비/튜닝 효율', value: '+18%', description: '최대 50% 초과 불가' },
      { label: '소모품(타이어/패드 등) 효율', value: '+12%', description: '최대 50% 초과 불가' },
      { label: '장비 최대 속도', value: '+8%', description: '최대 50% 초과 불가' },
    ],
  },
  {
    id: 'jules-quinn',
    name: 'Jules Quinn',
    avatar: Assets.images.characters.julesQuinn,
    appearance: '짧은 커트+앞머리, 가늘고 긴 팔다리, 귀에 작은 링 피어싱, 손가락에 테이프(그립 보강).',
    bio: '폐공장/부두 근처에서 자란 로컬. ‘룰’보다 ‘리듬’으로 운전하며, 팀 내 분위기 메이커지만 결정적 순간엔 냉정해진다.',
    archetype: '전직 레이서',
    age: '10대 후반',
    outfit: '가죽 재킷',
    palette: '버건디+차콜+오프화이트',
    prop: '장갑',
    mood: '무뚝뚝한 자신감',
    shot: '허리 위 샷',
    baseCommissionRange: [15, 28], // 10대 레이서, 성장 가능성
    stats: [
      { label: '드리프트/급회전 컨트롤', value: '+20%', description: '최대 50% 초과 불가' },
      { label: '추격전 집중(실수/슬립 확률)', value: '-12%', description: '최대 50% 초과 불가' },
      { label: '보상금 추가', value: '+7%', description: '최대 50% 초과 불가' },
    ],
  },
  {
    id: 'unit-r-04',
    name: 'UNIT R-04 “Rook”',
    avatar: Assets.images.characters.unitR04,
    appearance: '사람 체형의 산업용 바디(각진 흉부 플레이트), 한쪽 눈은 카메라 렌즈, 노출된 케이블 일부, 페인트 마모/스크래치.',
    bio: '원래는 항만 견인 작업용 유닛. 업그레이드 후 “운반/호위” 고용 드라이버로 전환됐고, 감정 표현은 적지만 임무 로그는 꼼꼼하다.',
    archetype: '해운 선장',
    age: 'N/A',
    outfit: '정비 점프수트',
    palette: '건메탈+오프화이트+옐로(경고 스트라이프)',
    prop: '툴백',
    mood: '무뚝뚝한 자신감',
    shot: '전신 정면(모델시트 느낌)',
    baseCommissionRange: [5, 15], // 로봇, 매우 낮은 유지비/수수료
    stats: [
      { label: '화물 안정성', value: '+25%', description: '최대 50% 초과 불가' },
      { label: '충돌 피해 경감', value: '+15%', description: '최대 50% 초과 불가' },
      { label: '장비 최대 속도', value: '+6%', description: '최대 50% 초과 불가' },
    ],
  },
];
