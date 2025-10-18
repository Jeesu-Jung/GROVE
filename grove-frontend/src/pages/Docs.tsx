import React from 'react';
import { Card } from '@/components/UI/Card';

export const Docs: React.FC = () => {
  return (
    <div className="py-8">
      <div className="grid grid-cols-12 gap-6">
        {/* Left sidebar: 메인 3가지 기능 링크 */}
        <aside className="col-span-12 md:col-span-3">
          <nav className="sticky top-24 bg-white border border-gray-200 rounded-xl p-4">
            <div className="text-sm font-semibold text-gray-800">기능 안내</div>
            <ul className="mt-3 space-y-2 text-sm">
              <li><a href="/docs/grove" className="block px-2 py-1 rounded hover:bg-gray-50 text-gray-700">WEAVE-GROVE (Dataset Visualization & Selection)</a></li>
              <li><a href="/docs/mixture" className="block px-2 py-1 rounded hover:bg-gray-50 text-gray-700">WEAVE-TASK MIXTURE (Optimized Task-Mixture Design)</a></li>
              <li><a href="/docs/zebra" className="block px-2 py-1 rounded hover:bg-gray-50 text-gray-700">WEAVE-ZEBRA (Automatic Data Binarization)</a></li>
            </ul>
          </nav>
        </aside>

        {/* Main content */}
        <main className="col-span-12 md:col-span-7 space-y-10">
          <header>
            <h1 className="text-3xl font-bold text-gray-900">WEAVE 문서</h1>
            <p className="mt-1 text-gray-600">세 가지 핵심 기능 요약과 사용 흐름</p>
          </header>

          {/* GROVE (요약) */}
          <section id="grove" className="space-y-3">
            <h2 className="text-2xl font-semibold text-gray-900">GROVE — 시각화된 선택</h2>
            <Card>
              <div className="space-y-3 text-gray-700">
                <p>
                  데이터셋을 시각화하여 그룹(G), 동사(V), 문서(D) 구조(OAK Tree)와 계층별 변동성(JSD 기반)을 탐색하고, 고변동(HV)·저변동(LV)·혼합(MIX) 기준으로 서브셋을 구성합니다.
                </p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>업로드 → 통계 산출 → 도메인/작업 자동 분석 → 샘플링</li>
                  <li>슬라이더·히스토그램·바이올린 플롯로 변동성 분포 탐색</li>
                  <li>선택 결과는 버전 아티팩트(인덱스/메타데이터)로 내보내기</li>
                </ul>
              </div>
            </Card>
          </section>

          {/* Task-Mixture (요약) */}
          <section id="mixture" className="space-y-3">
            <h2 className="text-2xl font-semibold text-gray-900">Task-Mixture — 혼합 최적 설계</h2>
            <Card>
              <div className="space-y-3 text-gray-700">
                <p>
                  최대 5개 작업을 조합하여 비용-성능 트레이드오프를 즉시 확인하고, 목표 모델/작업에 맞는 혼합 비율을 설계합니다.
                </p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>프로젝션된 성능–비용 플롯, 혼합 비율 제어</li>
                  <li>Milvus 기반 임베딩 검색으로 빠른 시맨틱 탐색 지원</li>
                  <li>결과/레시피를 재현 가능 형식으로 저장·내보내기</li>
                </ul>
              </div>
            </Card>
          </section>

          {/* ZEBRA (요약) */}
          <section id="zebra" className="space-y-3">
            <h2 className="text-2xl font-semibold text-gray-900">ZEBRA — 자동 이분화</h2>
            <Card>
              <div className="space-y-3 text-gray-700">
                <p>
                  모델 행동 프로파일(SUP/SIM)을 활용해 선호쌍을 자동으로 생성하여 정렬(Alignment) 데이터셋을 제로 주석 비용으로 구축합니다.
                </p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>SUP, SIM, SUP+SIM 및 사용자 지정 모드 지원</li>
                  <li>지원 모델: GPT-4/3.5, Gemini-2.5-flash, Llama-3.1/3.3/4 등</li>
                  <li>생성·검증·저장까지 일관된 파이프라인 제공</li>
                </ul>
              </div>
            </Card>
          </section>
        </main>

        {/* Right TOC */}
        <aside className="col-span-12 md:col-span-2">
          <div className="sticky top-24 bg-white border border-gray-200 rounded-xl p-3">
            <div className="text-xs font-semibold text-gray-600">이 페이지에서</div>
            <ul className="mt-2 space-y-1 text-xs">
              <li><a href="#grove" className="text-blue-600 hover:underline">GROVE</a></li>
              <li><a href="#mixture" className="text-blue-600 hover:underline">Task-Mixture</a></li>
              <li><a href="#zebra" className="text-blue-600 hover:underline">ZEBRA</a></li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default Docs;


