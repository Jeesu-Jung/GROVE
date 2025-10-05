import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout/Layout';
import { Upload } from './pages/Upload';
import { Statistics } from './pages/Statistics';
import { DomainAnalysis } from './pages/DomainAnalysis';
import { Sampling } from './pages/Sampling';
import { useAppStore } from './store/useAppStore';

function App() {
  const { error, setError } = useAppStore();

  return (
    <Router>
      <Layout>
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <p className="text-red-700 dark:text-red-300 font-medium">
                  {error}
                </p>
              </div>
              <button
                onClick={() => setError(null)}
                className="text-red-500 hover:text-red-700 dark:hover:text-red-300"
              >
                ×
              </button>
            </div>
          </div>
        )}

        <Routes>
          <Route path="/" element={<Upload />} />
          <Route path="/statistics" element={<Statistics />} />
          <Route path="/domain-analysis" element={<DomainAnalysis />} />
          <Route path="/sampling" element={<Sampling />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;