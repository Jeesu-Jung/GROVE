import React from 'react';
import { ProgressIndicator } from './ProgressIndicator';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAppStore } from '../../store/useAppStore';
import { useBinarizationStore } from '../../store/useBinarizationStore';
import { Moon, Sun } from 'lucide-react';
import iconUrl from '@/assets/icon.png';

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
  const currentPage = React.useMemo(() => {
    if (location.pathname.startsWith('/sampling')) return 4;
    if (location.pathname.startsWith('/domain-analysis')) return 3;
    if (location.pathname.startsWith('/statistics')) return 2;
    return 1;
  }, [location.pathname]);
  const [darkMode, setDarkMode] = React.useState(false);
  const selectedPath = isOptimization ? '/optimization' : isBinarization ? '/binarization' : '/';

  React.useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // 라우트 변경 시 전역 에러 토스트 제거
  React.useEffect(() => {
    setError(null);
  }, [location.pathname, setError]);

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      darkMode ? 'dark bg-gray-900' : 'bg-gradient-to-br from-blue-50 via-white to-purple-50'
    }`}>
      {/* Header */}
      <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img src={iconUrl} alt="WEAVE icon" className="w-[72px] h-[72px] object-contain" />
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              WEAVE
              </h1>
              <div className="mt-0.5">
                <select
                  aria-label="기능 선택"
                  className="text-sm text-gray-700 dark:text-gray-200 bg-transparent border border-gray-200 dark:border-gray-700 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  value={selectedPath}
                  onChange={(e) => {
                    if (!e.target.value.startsWith('/binarization')) {
                      resetBinarization();
                    }
                    navigate(e.target.value);
                  }}
                >
                  <option value="/" className="text-gray-900">
                    Instruction dataset analysis & sampling
                  </option>
                  <option value="/optimization" className="text-gray-900">
                    Optimization-driven Data Composition
                  </option>
                  <option value="/binarization" className="text-gray-900">
                    Automated Binarization Module
                  </option>
                </select>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              {darkMode ? (
                <Sun className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              ) : (
                <Moon className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              )}
            </button>
            <button
              onClick={() => { reset(); navigate('/'); }}
              className="px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              Reset
            </button>
          </div>
        </div>
      </header>

      {/* Progress Indicator */}
      {!isOptimization && !isBinarization && (
        <ProgressIndicator currentStep={currentPage} />
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 pb-12">
        {children}
      </main>
    </div>
  );
};