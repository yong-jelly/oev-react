import { useNavigate } from 'react-router';
import { useEffect } from 'react';

import { ArrowLeft, Zap, FastForward, Info, Users } from 'lucide-react';

export const HelpPage = () => {
  const navigate = useNavigate();

  // 페이지 진입 시 스크롤을 최상단으로 이동
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-white pb-12">
      <header className="sticky top-0 z-50 flex items-center gap-3 bg-white px-4 py-4 border-b border-surface-100">
        <button 
          onClick={() => navigate(-1)} 
          className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-surface-50 transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-surface-700" />
        </button>
        <h1 className="text-xl font-medium text-surface-900 tracking-tight">도움말 및 가이드</h1>
      </header>

      <div className="mx-auto max-w-2xl p-4 space-y-10">
        {/* 1. 경제 시스템 (핵심) */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 px-1">
            <h2 className="text-xl font-medium text-surface-900 tracking-tight">트럭커 경제 시스템</h2>
          </div>
          
          <div className="space-y-6">
            {/* 드라이버 고용 및 예치금 */}
            <div className="rounded-3xl bg-white p-6 border border-surface-100 space-y-4">
              <h3 className="text-sm font-medium text-surface-900 flex items-center gap-2">
                <Users className="h-4 w-4 text-primary-500" />
                드라이버 고용 및 예치금(Deposit)
              </h3>
              <p className="text-xs text-surface-600 leading-relaxed">
                다중 장비 운용을 위해서는 드라이버 고용이 필수적입니다. 고용 시 시스템 안정성을 위해 예치금이 발생합니다.
              </p>
              
              <div className="rounded-2xl bg-surface-900 p-4 font-mono">
                <h4 className="text-[9px] font-medium text-primary-400 uppercase mb-2 tracking-widest text-center">Deposit Formula</h4>
                <p className="text-sm text-white font-medium text-center">
                  (Max_Commission + Firing_Penalty) × 1.1
                </p>
              </div>

              <div className="grid gap-3">
                <div className="rounded-2xl bg-surface-50 p-4 border border-surface-100">
                  <h4 className="text-[10px] font-medium text-surface-400 uppercase mb-2">수수료 및 계약</h4>
                  <ul className="space-y-2 text-[11px] text-surface-700">
                    <li className="flex justify-between items-start gap-4">
                      <span className="font-medium text-surface-900">수수료 지불:</span>
                      <span className="text-right">운행 완료 시 총 보상의 일정 비율(%)을 지급</span>
                    </li>
                    <li className="flex justify-between items-start gap-4">
                      <span className="font-medium text-surface-900">고정 계약:</span>
                      <span className="text-right">계약 시 확정된 비율은 해고 전까지 유지</span>
                    </li>
                    <li className="flex justify-between items-start gap-4 border-t border-surface-100 pt-2">
                      <span className="font-medium text-surface-900">NPC 드라이버:</span>
                      <span className="text-right">랜덤 수수료 (15% ~ 40%)</span>
                    </li>
                    <li className="flex justify-between items-start gap-4">
                      <span className="font-medium text-primary-600">유저 드라이버:</span>
                      <span className="text-right">생성자 설정 비율 (기본 30%)</span>
                    </li>
                  </ul>
                </div>

                <div className="rounded-2xl border border-accent-rose/20 bg-accent-rose/5 p-4">
                  <h4 className="text-[10px] font-medium text-accent-rose uppercase mb-2">해고 및 환불 규정</h4>
                  <ul className="space-y-2 text-[11px] text-surface-700">
                    <li className="flex justify-between">
                      <span>최소 의무 기간</span>
                      <span className="font-medium text-accent-rose">10회 운행</span>
                    </li>
                    <li className="flex justify-between">
                      <span>조기 해고 시</span>
                      <span className="font-medium text-accent-rose">예치금 위약금 차감</span>
                    </li>
                    <li className="flex justify-between border-t border-accent-rose/10 pt-2">
                      <span>정상 해고 시 환불</span>
                      <span className="font-medium text-accent-emerald">5% 수수료 제외 전액</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 2. 거래 내역 (Transaction History) */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 px-1">
            <h2 className="text-xl font-medium text-surface-900 tracking-tight">거래 내역 (Transaction History)</h2>
          </div>
          
          <div className="rounded-3xl bg-white p-6 border border-surface-100 space-y-6">
            {/* 내용은 추후 추가 예정 */}
          </div>
        </section>

        {/* 3. 주문 생성 및 계약 시스템 (핵심 알고리즘) */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 px-1">
            <h2 className="text-xl font-medium text-surface-900 tracking-tight">주문 생성 및 계약 알고리즘</h2>
          </div>
          
          <div className="rounded-3xl bg-white p-6 border border-surface-100 space-y-6">
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-surface-900">1. 오퍼 생성 프로세스 (Generation)</h3>
              <p className="text-xs text-surface-600 leading-relaxed">
                시스템은 유저의 <span className="font-medium text-primary-600">평판 지수</span>와 <span className="font-medium text-primary-600">현재 위치</span>를 기반으로 15~30분마다 새로운 오퍼를 생성합니다.
              </p>
            </div>

            <div className="grid gap-4">
              <div className="rounded-2xl bg-surface-50 p-4 border border-surface-100">
                <h4 className="text-[10px] font-medium text-surface-400 uppercase mb-3">보상 산출 공식 (Reward Calculation)</h4>
                <div className="bg-surface-900 rounded-xl p-3 font-mono text-[10px] text-primary-400 mb-3">
                  Reward = Base_Rate × Distance × Difficulty_Weight
                </div>
                <ul className="space-y-2 text-[10px] text-surface-600">
                  <li>• <strong className="text-surface-900">Base_Rate:</strong> 화물 카테고리별 기본 단가</li>
                  <li>• <strong className="text-surface-900">Difficulty_Weight:</strong> 긴급도, 파손 위험, 단속 위험도에 따른 가중치 (1.0 ~ 2.5x)</li>
                </ul>
              </div>

              <div className="rounded-2xl border border-primary-100 bg-primary-50/30 p-4">
                <h4 className="text-[10px] font-medium text-primary-600 uppercase mb-3">제한 시간 및 ETA 설계</h4>
                <p className="text-[11px] text-surface-700 leading-relaxed mb-2">
                  운행 제한 시간은 시스템이 계산한 최적 경로의 <span className="font-medium">예상 소요 시간(ETA)의 1.25배</span>로 설정됩니다.
                </p>
                <div className="flex justify-between items-center text-[10px] bg-white/50 p-2 rounded-lg">
                  <span className="text-surface-500">여유 버퍼(Buffer)</span>
                  <span className="font-medium text-primary-600">25% 고정</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-medium text-surface-900">2. 경제 주체 연동 알고리즘 (Economic Linkage)</h3>
              <p className="text-xs text-surface-600 leading-relaxed">
                주문 수락부터 정산까지, 모든 데이터는 실시간으로 상호작용하며 유저의 경제 상태를 변화시킵니다.
              </p>
              <div className="mt-4 space-y-3">
                <div className="flex items-start gap-3 p-3 rounded-2xl bg-surface-50">
                  <div className="h-5 w-5 rounded-full bg-primary-100 flex items-center justify-center text-[10px] font-medium text-primary-600 shrink-0">1</div>
                  <p className="text-[11px] text-surface-700"><span className="font-medium text-surface-900">계약 체결:</span> 슬롯 점유 및 드라이버 배정. 고용된 드라이버가 있을 경우 예치금에서 수수료 선적립 프로세스 가동.</p>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-2xl bg-surface-50">
                  <div className="h-5 w-5 rounded-full bg-primary-100 flex items-center justify-center text-[10px] font-medium text-primary-600 shrink-0">2</div>
                  <p className="text-[11px] text-surface-700"><span className="font-medium text-surface-900">실시간 변동:</span> 과속 시 단속 확률 증가(최대 4배) 및 연료 소모 가속(최대 3배). 이는 최종 정산 금액의 패널티로 직결됩니다.</p>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-2xl bg-surface-50">
                  <div className="h-5 w-5 rounded-full bg-primary-100 flex items-center justify-center text-[10px] font-medium text-primary-600 shrink-0">3</div>
                  <p className="text-[11px] text-surface-700"><span className="font-medium text-surface-900">최종 정산:</span> 보상금에서 드라이버 수수료(계약된 %)를 차감한 후 유저 자산에 반영. 동시에 평판 지수 업데이트.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 4. 평판 및 오퍼 해금 시스템 */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 px-1">
            <h2 className="text-xl font-medium text-surface-900 tracking-tight">평판 및 오퍼 해금</h2>
          </div>
          
          <div className="rounded-3xl bg-white p-6 border border-surface-100 space-y-6">
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-surface-900">1. 평판 지수(Reputation)의 역할</h3>
              <p className="text-xs text-surface-600 leading-relaxed">
                평판은 트럭커 세계에서의 신뢰도를 나타내는 핵심 지표입니다. 단순히 돈을 버는 것을 넘어, 고부가가치 화물을 취급하기 위한 필수 요건입니다.
              </p>
            </div>

            <div className="grid gap-4">
              <div className="rounded-2xl bg-surface-50 p-4 border border-surface-100">
                <h4 className="text-[10px] font-medium text-surface-400 uppercase mb-3">평판 변동 알고리즘</h4>
                <div className="space-y-2 text-[11px]">
                  <div className="flex justify-between items-center">
                    <span className="text-surface-700">정시 도착</span>
                    <span className="font-medium text-accent-emerald">+10 ~ +50</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-surface-700">지각 도착</span>
                    <span className="font-medium text-accent-amber">+2 ~ +5</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-surface-700">단속 적발</span>
                    <span className="font-medium text-accent-rose">-20 ~ -100</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-surface-700">운행 포기</span>
                    <span className="font-medium text-accent-rose">-50</span>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-primary-100 bg-primary-50/30 p-4">
                <h4 className="text-[10px] font-medium text-primary-600 uppercase mb-3">해금 마일스톤</h4>
                <div className="space-y-3 text-[11px]">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-surface-900">평판 0+</span>
                    <span className="text-surface-500">기본 배달 (자전거)</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-surface-900">평판 100+</span>
                    <span className="text-surface-500">소형 밴 오퍼</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-surface-900">평판 500+</span>
                    <span className="text-surface-500">대형 트럭 계약</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-surface-900">평판 2,000+</span>
                    <span className="text-primary-600 font-medium">항공/해운 특수 오퍼</span>
                  </div>
                </div>
              </div>
            </div>
            <p className="text-[10px] text-surface-400 text-center font-medium">
              * 평판이 높을수록 오퍼 갱신 속도와 희귀 화물 등장 확률이 상승합니다.
            </p>
          </div>
        </section>

        {/* 5. 과속 및 단속 시스템 */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 px-1">
            <h2 className="text-xl font-medium text-surface-900 tracking-tight">과속 및 단속 시스템</h2>
          </div>
          
          <div className="rounded-3xl bg-white p-6 border border-surface-100 space-y-4">
            <p className="text-xs text-surface-600 leading-relaxed">
              <span className="font-medium text-accent-rose uppercase">Boost</span> 모드 활성화 시 속도는 빨라지지만 단속 위험도가 급증합니다.
            </p>

            <div className="grid gap-3">
              <div className="rounded-2xl bg-surface-50 p-4 border border-surface-100">
                <h4 className="text-[10px] font-medium text-surface-400 uppercase mb-2">단속 확률 시뮬레이션</h4>
                <div className="flex items-end justify-between">
                  <span className="text-xs font-medium text-surface-700">정속 주행 시</span>
                  <span className="text-base font-medium text-primary-600">5% ~ 15%</span>
                </div>
                <div className="mt-2 flex items-end justify-between">
                  <span className="text-xs font-medium text-surface-700">과속 주행 시</span>
                  <span className="text-base font-medium text-accent-rose">25% ~ 45%</span>
                </div>
              </div>

              <div className="rounded-2xl border border-accent-amber/20 bg-accent-amber/5 p-4">
                <h4 className="text-[10px] font-medium text-accent-amber uppercase mb-2">단속 대응 매뉴얼</h4>
                <ul className="space-y-3 text-[11px] text-surface-700">
                  <li className="leading-tight flex flex-col gap-1">
                    <div><strong className="text-surface-900">서류 제시:</strong> 필수 서류 보유 시 무사 통과</div>
                    <div className="text-[10px] text-surface-500 pl-3 border-l-2 border-accent-emerald/30">
                      • <span className="text-accent-emerald font-medium">Penalty:</span> ETA +300s (5분 지연) / 벌금 $0
                    </div>
                  </li>
                  <li className="leading-tight flex flex-col gap-1">
                    <div><strong className="text-surface-900">우회:</strong> 단속 회피 (이동 거리 증가)</div>
                    <div className="text-[10px] text-surface-500 pl-3 border-l-2 border-accent-amber/30">
                      • <span className="text-accent-amber font-medium">Penalty:</span> ETA +720s (12분 지연) / 벌금 $0
                    </div>
                  </li>
                  <li className="leading-tight flex flex-col gap-1">
                    <div><strong className="text-surface-900">돌파:</strong> 초고속 회피 시도</div>
                    <div className="text-[10px] text-surface-500 pl-3 border-l-2 border-accent-rose/30">
                      • <span className="text-accent-emerald font-medium">Success (40%):</span> ETA +0s / 벌금 $0
                    </div>
                    <div className="text-[10px] text-surface-500 pl-3 border-l-2 border-accent-rose/30">
                      • <span className="text-accent-rose font-medium">Failure (60%):</span> 벌금 -$1,200 / 평판 하락
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* 6. 서버사이드 이벤트 시스템 */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 px-1">
            <h2 className="text-xl font-medium text-surface-900 tracking-tight">서버사이드 이벤트 시스템</h2>
          </div>
          
          <div className="rounded-3xl bg-white p-6 border border-surface-100 space-y-4">
            <p className="text-xs text-surface-600 leading-relaxed">
              운행 중 발생하는 모든 이벤트는 서버에서 <span className="font-medium text-purple-600">1분 주기</span>로 자동 체크됩니다. 앱을 켜두지 않아도 결과는 동일하게 처리됩니다.
            </p>

            <div className="grid gap-3">
              <div className="rounded-2xl bg-surface-50 p-4 border border-surface-100">
                <h4 className="text-[10px] font-medium text-surface-400 uppercase mb-2">자동 대응 알고리즘</h4>
                <ul className="space-y-2 text-[11px] text-surface-700">
                  <li className="flex items-start gap-2">
                    <span className="font-medium text-surface-900 shrink-0">1순위:</span>
                    <span>서류 보유 시 <span className="text-accent-emerald font-medium">서류 제시</span> (가장 안전)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-medium text-surface-900 shrink-0">2순위:</span>
                    <span>서류 미보유 시 <span className="text-accent-amber font-medium">우회</span> 또는 <span className="text-accent-rose font-medium">돌파</span> 시도 (확률적 결정)</span>
                  </li>
                </ul>
              </div>

              <div className="rounded-2xl border border-purple-100 bg-purple-50/30 p-4">
                <h4 className="text-[10px] font-medium text-purple-600 uppercase mb-2">시스템 설정값 (System Config)</h4>
                <div className="space-y-1 text-[10px] font-mono text-surface-600">
                  <div className="flex justify-between">
                    <span>enforcement_base_prob</span>
                    <span className="font-medium">5% (Normal)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>evasion_success_rate</span>
                    <span className="font-medium">40%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 7. 장비 상세 제원 */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 px-1">
            <h2 className="text-xl font-medium text-surface-900 tracking-tight">장비 상세 가이드</h2>
          </div>
          
          <div className="space-y-6">
            {/* 티어별 스펙 테이블 */}
            <div className="rounded-3xl bg-white p-6 border border-surface-100">
              <div className="overflow-x-auto -mx-2">
                <table className="w-full text-left text-[11px] border-collapse">
                  <thead>
                    <tr className="border-b border-surface-100">
                      <th className="py-2 px-2 font-medium text-surface-400 uppercase tracking-tighter">수단</th>
                      <th className="py-2 px-2 font-medium text-surface-400 uppercase tracking-tighter text-right">최대중량</th>
                      <th className="py-2 px-2 font-medium text-surface-400 uppercase tracking-tighter text-right">최고속도</th>
                      <th className="py-2 px-2 font-medium text-surface-400 uppercase tracking-tighter text-right">구매가</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-50">
                    <tr>
                      <td className="py-3 px-2 font-medium text-surface-900">자전거 (T1)</td>
                      <td className="py-3 px-2 text-right tabular-nums">10kg</td>
                      <td className="py-3 px-2 text-right tabular-nums text-primary-600">20km/h</td>
                      <td className="py-3 px-2 text-right font-medium text-surface-400">기본</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-2 font-medium text-surface-900">소형 밴 (T2)</td>
                      <td className="py-3 px-2 text-right tabular-nums">500kg</td>
                      <td className="py-3 px-2 text-right tabular-nums text-primary-600">80km/h</td>
                      <td className="py-3 px-2 text-right font-medium text-primary-600">${(5000).toLocaleString()}</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-2 font-medium text-surface-900">대형 트럭 (T3)</td>
                      <td className="py-3 px-2 text-right tabular-nums">5,000kg</td>
                      <td className="py-3 px-2 text-right tabular-nums text-primary-600">100km/h</td>
                      <td className="py-3 px-2 text-right font-medium text-primary-600">${(25000).toLocaleString()}</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-2 font-medium text-accent-blue flex items-center gap-1">
                        <FastForward className="h-3 w-3" /> 화물기 (T5)
                      </td>
                      <td className="py-3 px-2 text-right tabular-nums">100,000kg</td>
                      <td className="py-3 px-2 text-right tabular-nums text-primary-600">800km/h</td>
                      <td className="py-3 px-2 text-right font-medium text-primary-600">${(500000).toLocaleString()}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* 연료 시스템 */}
            <div className="rounded-3xl bg-white p-6 border border-surface-100 space-y-4">
              <h3 className="text-sm font-medium text-surface-900 flex items-center gap-2">
                <Zap className="h-4 w-4 text-accent-amber" />
                속도 및 연료 매커니즘
              </h3>
              <div className="grid gap-3">
                <div className="rounded-2xl bg-surface-50 p-4 border border-surface-100">
                  <h4 className="text-[10px] font-medium text-surface-400 uppercase mb-2">속도 유지 및 가속 (Speed & Boost)</h4>
                  <ul className="space-y-2 text-[11px] text-surface-700">
                    <li className="flex justify-between items-start gap-4">
                      <span className="font-medium text-surface-900 shrink-0">적정 속도:</span>
                      <span className="text-right">보유 장비의 기본 속도로 자동 유지됩니다. (자전거: 15km/h, 밴: 60km/h 등)</span>
                    </li>
                    <li className="flex justify-between items-start gap-4">
                      <span className="font-medium text-primary-600 shrink-0">가속(Boost):</span>
                      <span className="text-right">가속 모드 활성화 시 기본 속도의 <span className="font-medium">1.5배</span>까지 속도가 상승합니다.</span>
                    </li>
                  </ul>
                </div>
                <div className="rounded-2xl bg-surface-50 p-4 border border-surface-100">
                  <h4 className="text-[10px] font-medium text-surface-400 uppercase mb-2">연료 보충 방법</h4>
                  <p className="text-[11px] text-surface-700 leading-relaxed">
                    운행 화면의 <span className="font-medium text-accent-amber underline">Refill</span> 버튼을 클릭하여 수동 보충하거나, 자동화 아이템을 통해 관리할 수 있습니다.
                  </p>
                </div>
                <div className="rounded-2xl border border-accent-rose/20 bg-accent-rose/5 p-4">
                  <h4 className="text-[10px] font-medium text-accent-rose uppercase mb-2">고갈 페널티</h4>
                  <p className="text-[11px] text-surface-700 leading-relaxed">
                    연료가 0이 되면 속도가 <span className="font-medium text-accent-rose">80% 감속</span>됩니다.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 하단 팁 */}
        <div className="rounded-3xl bg-surface-900 p-8 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Info className="h-24 w-24" />
          </div>
          <div className="relative z-10">
            <h3 className="flex items-center gap-2 text-lg font-medium uppercase tracking-tighter">
              <Info className="h-5 w-5 text-primary-400" />
              Trucker's Pro Tip
            </h3>
            <p className="mt-4 text-sm text-surface-300 leading-relaxed font-medium">
              초반에는 정속 주행으로 평판을 쌓으세요. 평판이 높아야 더 좋은 장비와 오퍼를 얻을 수 있습니다. 
              자금이 모이면 드라이버를 고용해 수익을 자동화하는 것이 제국 건설의 핵심입니다.
            </p>
            <button 
              onClick={() => navigate('/garage')}
              className="mt-6 w-full py-4 rounded-2xl bg-primary-600 text-white font-medium text-sm hover:bg-primary-700 transition-all active:scale-95 shadow-lg"
            >
              지금 창고(Garage)로 이동하기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
