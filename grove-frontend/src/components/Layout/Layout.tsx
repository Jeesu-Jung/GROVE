import React from 'react';
import { ProgressIndicator } from './ProgressIndicator';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAppStore } from '../../store/useAppStore';
import { useBinarizationStore } from '../../store/useBinarizationStore';
// icons removed: dark mode toggle deleted
import iconUrl from '@/assets/weave.png';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { reset, setError } = useAppStore();
  const { reset: resetBinarization } = useBinarizationStore();
  const location = useLocation();
  const navigate = useNavigate();
  const isOptimization = location.pathname.startsWith('/optimization');
  const isBinarization = location.pathname.startsWith('/binarization');
  const isUploadRoot = location.pathname === '/';
  const currentPage = React.useMemo(() => {
    if (location.pathname.startsWith('/sampling')) return 4;
    if (location.pathname.startsWith('/domain-analysis')) return 3;
    if (location.pathname.startsWith('/statistics')) return 2;
    return 1;
  }, [location.pathname]);
  // Dark mode is disabled; always use light theme
  const selectedPath = isOptimization ? '/optimization' : isBinarization ? '/binarization' : '/';

  // Removed dark mode toggling side effects

  // 라우트 변경 시 전역 에러 토스트 제거
  React.useEffect(() => {
    setError(null);
  }, [location.pathname, setError]);

  return (
    <div className={`min-h-screen transition-colors duration-300 bg-gradient-to-br from-blue-50 via-white to-purple-50`}>
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img src={iconUrl} alt="WEAVE icon" className="w-[72px] h-[72px] object-contain" />
            <div>
              <h1 className="text-xl font-bold text-gray-900">
              WEAVE
              </h1>
              <div className="mt-0.5">
                <select
                  aria-label="기능 선택"
                  className="text-sm text-gray-700 bg-transparent border border-gray-200 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  value={selectedPath}
                  onChange={(e) => {
                    if (!e.target.value.startsWith('/binarization')) {
                      resetBinarization();
                    }
                    navigate(e.target.value);
                  }}
                >
                  <option value="/" className="text-gray-900">
                    Dataset Visualization and Selection
                  </option>
                  <option value="/optimization" className="text-gray-900">
                    Optimized Task-Mixture Design
                  </option>
                  <option value="/binarization" className="text-gray-900">
                    Automatic Data Binarization
                  </option>
                </select>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { reset(); navigate('/'); }}
              className="px-3 py-2 rounded-lg bg-gray-100 text-sm text-gray-700 hover:bg-gray-200 transition-colors"
            >
              Reset
            </button>
          </div>
        </div>
      </header>

      {/* Progress Indicator (숨김: 업로드 루트에서는 페이지 내부에서 렌더링) */}
      {!isOptimization && !isBinarization && !isUploadRoot && (
        <ProgressIndicator currentStep={currentPage} />
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 pb-12">
        {children}
      </main>
    </div>
  );
};