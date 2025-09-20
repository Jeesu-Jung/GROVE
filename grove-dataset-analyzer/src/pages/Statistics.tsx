import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { FileText, BarChart3, TrendingUp, Hash } from 'lucide-react';
import { Card } from '../components/UI/Card';
import { Button } from '../components/UI/Button';
import { useAppStore } from '../store/useAppStore';
import { calculateTextStatistics } from '../utils/dataProcessing';

export const Statistics: React.FC = () => {
  const navigate = useNavigate();
  const { dataset, statistics, setStatistics, setError } = useAppStore();
  const [isCalculating, setIsCalculating] = useState(false);

  useEffect(() => {
    if (!dataset) {
      navigate('/');
      return;
    }

    if (!statistics) {
      calculateStats();
    }
  }, [dataset, statistics]);

  const calculateStats = async () => {
    if (!dataset) return;

    setIsCalculating(true);
    setError(null);

    try {
      const stats = calculateTextStatistics(dataset);
      setStatistics(stats);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to calculate statistics');
    } finally {
      setIsCalculating(false);
    }
  };

  if (!dataset || !statistics) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">
            {isCalculating ? 'Calculating statistics...' : 'Loading...'}
          </p>
        </div>
      </div>
    );
  }

  // Prepare chart data
  const lengthDistributionData = statistics.inputLengthDistribution.map((count, index) => ({
    range: `${index * 50}-${(index + 1) * 50}`,
    input: count,
    output: statistics.outputLengthDistribution[index] || 0,
  }));

  const topWordsData = statistics.topWords
    .map(w => ({ word: w.word, count: Number(w.count) || 0 }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const topWordsHeight = Math.max(320, topWordsData.length * 30 + 60);
  const maxTopWordCount = topWordsData.reduce((m, d) => Math.max(m, d.count), 0);
  const xDomainMax = Math.ceil(maxTopWordCount * 1.08);

  const COLORS = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#6B7280'];

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Dataset Statistics
        </h2>
        <p className="text-lg text-gray-600 dark:text-gray-300">
          Comprehensive analysis of your instruction dataset
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Samples
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {statistics.totalSamples.toLocaleString()}
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <BarChart3 className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Avg Input Length
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {Math.round(statistics.avgInputLength)}
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
              <TrendingUp className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Avg Output Length
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {Math.round(statistics.avgOutputLength)}
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
              <Hash className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Unique Inputs
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {statistics.uniqueInputs.toLocaleString()}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Length Distribution */}
        <Card title="Text Length Distribution" description="Character count distribution">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={lengthDistributionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="range" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="input" fill="#3B82F6" name="Input" />
                <Bar dataKey="output" fill="#8B5CF6" name="Output" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Top Words */}
        <Card title="Most Frequent Words" description="Top 10 words across all text">
          <div style={{ height: topWordsHeight }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topWordsData} layout="vertical" margin={{ left: 8, right: 80, top: 8, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  type="number"
                  dataKey="count"
                  domain={[0, xDomainMax]}
                  allowDecimals={false}
                  tickFormatter={(v) => v.toLocaleString()}
                />
                <YAxis dataKey="word" type="category" width={140} interval={0} />
                <Tooltip formatter={(value: number) => value.toLocaleString()} />
                <Bar
                  dataKey="count"
                  fill="#10B981"
                  barSize={18}
                  label={{ position: 'right', offset: 8, fill: '#374151', formatter: (v: number) => v.toLocaleString() }}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Statistical Summary */}
      <Card title="Statistical Summary" description="Detailed statistics for text lengths">
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Input Column Statistics
            </h4>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Minimum:</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {statistics.lengthStats.input.min}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Maximum:</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {statistics.lengthStats.input.max}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Mean:</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {Math.round(statistics.lengthStats.input.mean)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Median:</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {Math.round(statistics.lengthStats.input.median)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Std Dev:</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {Math.round(statistics.lengthStats.input.stdDev)}
                </span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Output Column Statistics
            </h4>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Minimum:</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {statistics.lengthStats.output.min}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Maximum:</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {statistics.lengthStats.output.max}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Mean:</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {Math.round(statistics.lengthStats.output.mean)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Median:</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {Math.round(statistics.lengthStats.output.median)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Std Dev:</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {Math.round(statistics.lengthStats.output.stdDev)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={() => navigate('/') }>
          Back to Upload
        </Button>
        <Button onClick={() => navigate('/domain-analysis')}>
          Next: Domain Analysis
        </Button>
      </div>
    </div>
  );
};