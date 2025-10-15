import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { Download, Shuffle, Target, Copy, ArrowUp, ArrowDown, Activity, Info } from 'lucide-react';
import { Card } from '../components/UI/Card';
import { Button } from '../components/UI/Button';
import { useAppStore } from '../store/useAppStore';
import { exportToCSV, exportToJSON } from '../utils/dataProcessing';
import { SamplingStrategy, SampledDataset, DatasetRow, InstructionAssignment } from '../types';
// Task tree is not shown on Sampling page

export const Sampling: React.FC = () => {
  const navigate = useNavigate();
  const {
    dataset,
    domainAnalysis,
    sampledDataset,
    setSampledDataset,
    setError,
    setDataset,
  } = useAppStore();

  const [samplingStrategy, setSamplingStrategy] = useState<SamplingStrategy>({
    type: 'top3',
    samplesPerDomain: 100,
  });
  const [selectedDomains, setSelectedDomains] = useState<string[]>([]);
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [previewData, setPreviewData] = useState<DatasetRow[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'list' | 'detail'>('list');
  const [modalDomain, setModalDomain] = useState<string | null>(null);
  const [modalItems, setModalItems] = useState<Array<{ assignment: InstructionAssignment; row: DatasetRow }>>([]);
  const [selectedItemIndex, setSelectedItemIndex] = useState<number | null>(null);
  // UI-only states for Model-centric visual controls
  const [targetModel, setTargetModel] = useState<string>('llama-3.2-1b-instruct');
  const [modelDifficulty, setModelDifficulty] = useState<'lv' | 'hv' | 'mix' | null>(null);
  const [pValue, setPValue] = useState<number>(50);
  const [isScoring, setIsScoring] = useState<boolean>(false);
  const [scoreProgress, setScoreProgress] = useState<number>(0);
  const [hasScore, setHasScore] = useState<boolean>(false);

  // Scores must be calculated explicitly each session

  const controlsDisabled = isScoring || !hasScore;

  const calculateScores = async () => {
    try {
      if (!dataset) return;
      const inputKey = dataset.inputColumn || '';
      if (!inputKey) {
        setError('Input column is not specified.');
        return;
      }
      setIsScoring(true);
      setScoreProgress(0);

      const total = dataset.data.length;
      const updatedRows = dataset.data.map(row => ({ ...row }));
      let successCount = 0;

      for (let i = 0; i < total; i++) {
        const inputVal = String(updatedRows[i][inputKey] || '');
        try {
          const res = await fetch(`/v1/model-centric/${targetModel}/variability/extract`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ inputs: inputVal }),
          });
          if (!res.ok) throw new Error('Bad response');
          const json = await res.json();
          const score = json?.data?.dec_score;
          if (typeof score === 'number') {
            updatedRows[i]['dec_score'] = score;
            successCount += 1;
          } else {
            updatedRows[i]['dec_score'] = 0;
          }
        } catch (err) {
          updatedRows[i]['dec_score'] = 0;
        }
        setScoreProgress(Math.round(((i + 1) / total) * 100));
      }

      const updatedColumns = Array.isArray(dataset.columns)
        ? (dataset.columns.includes('dec_score') ? dataset.columns : [...dataset.columns, 'dec_score'])
        : ['dec_score'];

      setDataset({ ...dataset, data: updatedRows, columns: updatedColumns });
      if (successCount > 0) {
        setHasScore(true);
      } else {
        setHasScore(false);
        alert('점수 계산에 실패했습니다. 서버 상태를 확인해 주세요.');
      }
    } catch (e) {
      setError('Failed to calculate scores');
    } finally {
      setIsScoring(false);
    }
  };

  useEffect(() => {
    if (!dataset || !domainAnalysis) {
      navigate('/');
    }
  }, [dataset, domainAnalysis, navigate]);

  useEffect(() => {
    generateSample();
  }, [samplingStrategy, selectedDomains, selectedTasks, modelDifficulty, pValue, hasScore]);

  const taskList = React.useMemo(() => {
    if (!domainAnalysis) return [] as { name: string; count: number }[];
    const counts = new Map<string, number>();
    (domainAnalysis.assignments || []).forEach(a => {
      const t = (a.taskName || 'Unknown').trim() || 'Unknown';
      counts.set(t, (counts.get(t) || 0) + 1);
    });
    return Array.from(counts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [domainAnalysis]);

  const generateSample = () => {
    if (!dataset || !domainAnalysis) return;

    // if model-centric selected and scores are ready
    if (['lv', 'hv', 'mix'].includes(samplingStrategy.type) || (modelDifficulty && hasScore)) {
      const rows = dataset.data.slice();
      const withScore = rows.filter(r => typeof r['dec_score'] === 'number');
      if (withScore.length === 0) return;

      const sortedAsc = withScore.slice().sort((a, b) => (a['dec_score'] as number) - (b['dec_score'] as number));
      const sortedDesc = withScore.slice().sort((a, b) => (b['dec_score'] as number) - (a['dec_score'] as number));

      const takeCount = Math.max(1, Math.floor((pValue / 100) * withScore.length));
      let selected: DatasetRow[] = [];

      if (modelDifficulty === 'lv') {
        selected = sortedAsc.slice(0, takeCount);
      } else if (modelDifficulty === 'hv') {
        selected = sortedDesc.slice(0, takeCount);
      } else if (modelDifficulty === 'mix') {
        const half = Math.floor(takeCount / 2);
        const ascPart = sortedAsc.slice(0, half);
        const descPart = sortedDesc.slice(0, takeCount - half);
        const seen = new Set<number>();
        // dedupe by reference index if available; fallback to object identity
        selected = [];
        const pushUnique = (arr: DatasetRow[]) => {
          for (const r of arr) {
            // Cannot rely on dataset index field; use JSON signature
            const sig = JSON.stringify(r);
            if (!seen.has(sig.length)) {
              seen.add(sig.length);
              selected.push(r);
            }
          }
        };
        pushUnique(ascPart);
        pushUnique(descPart);
      }

      const domainDistribution: { [domain: string]: number } = {};
      // If we have assignments, compute domain distribution from them; otherwise leave empty counts
      const assignments = domainAnalysis.assignments || [];
      selected.forEach(row => {
        const idx = dataset.data.indexOf(row);
        const assignment = assignments.find(a => a.datasetIndex === idx);
        const dn = assignment?.domainName || 'unknown';
        domainDistribution[dn] = (domainDistribution[dn] || 0) + 1;
      });

      const sampled: SampledDataset = {
        data: selected,
        strategy: { ...samplingStrategy, type: (modelDifficulty as 'lv' | 'hv' | 'mix'), pPercent: pValue },
        domainDistribution,
        totalSamples: selected.length,
      };
      setSampledDataset(sampled);
      setPreviewData(selected.slice(0, 10));
      return;
    }

    let samplesToGenerate: { [domain: string]: number } = {};
    let tasksToGenerate: { [task: string]: number } = {};

    switch (samplingStrategy.type) {
      case 'top3':
        const top3Domains = domainAnalysis.domains.slice(0, 3);
        top3Domains.forEach(domain => {
          samplesToGenerate[domain.name] = samplingStrategy.samplesPerDomain || 100;
        });
        break;

      case 'custom':
        selectedDomains.forEach(domainName => {
          samplesToGenerate[domainName] = samplingStrategy.samplesPerDomain || 100;
        });
        break;

      case 'balanced':
        const totalSamples = samplingStrategy.totalSamples || 1000;
        const samplesPerDomain = Math.floor(totalSamples / domainAnalysis.domains.length);
        domainAnalysis.domains.forEach(domain => {
          samplesToGenerate[domain.name] = samplesPerDomain;
        });
        break;

      case 'tasks_top3': {
        const top3Tasks = taskList.slice(0, 3);
        top3Tasks.forEach(t => {
          tasksToGenerate[t.name] = samplingStrategy.samplesPerDomain || 100;
        });
        break;
      }

      case 'tasks_custom': {
        selectedTasks.forEach(taskName => {
          tasksToGenerate[taskName] = samplingStrategy.samplesPerDomain || 100;
        });
        break;
      }

      case 'tasks_balanced': {
        const total = samplingStrategy.totalSamples || 1000;
        const uniqueTasks = Math.max(1, taskList.length);
        const perTask = Math.floor(total / uniqueTasks);
        taskList.forEach(t => {
          tasksToGenerate[t.name] = perTask;
        });
        break;
      }
    }

    // Generate sample using domain -> dataset row mapping from LLM assignments
    const sampleData: DatasetRow[] = [];
    const domainDistribution: { [domain: string]: number } = {};

    const assignments = domainAnalysis.assignments || [];
    const domainToRows: { [domain: string]: DatasetRow[] } = {};
    const taskToRows: { [task: string]: DatasetRow[] } = {};

    assignments.forEach(assign => {
      const row = dataset.data[assign.datasetIndex];
      if (!row) return;
      if (!domainToRows[assign.domainName]) domainToRows[assign.domainName] = [];
      domainToRows[assign.domainName].push(row);
      const t = (assign.taskName || 'Unknown').trim() || 'Unknown';
      if (!taskToRows[t]) taskToRows[t] = [];
      taskToRows[t].push(row);
    });

    const pickRandom = <T,>(arr: T[], k: number): T[] => {
      const pool = arr.slice();
      const picked: T[] = [];
      const take = Math.min(k, pool.length);
      for (let i = 0; i < take; i++) {
        const idx = Math.floor(Math.random() * pool.length);
        picked.push(pool.splice(idx, 1)[0]);
      }
      return picked;
    };

    if (samplingStrategy.type.startsWith('tasks_')) {
      Object.entries(tasksToGenerate).forEach(([taskName, count]) => {
        const availableRows = taskToRows[taskName] || [];
        const pickedRows = pickRandom(availableRows, count);
        sampleData.push(...pickedRows);
        // compute domain distribution for picked rows
        pickedRows.forEach(r => {
          const idx = dataset.data.indexOf(r);
          const a = assignments.find(x => x.datasetIndex === idx);
          const dn = a?.domainName || 'unknown';
          domainDistribution[dn] = (domainDistribution[dn] || 0) + 1;
        });
      });
    } else {
      Object.entries(samplesToGenerate).forEach(([domainName, count]) => {
        const availableRows = domainToRows[domainName] || [];
        const pickedRows = pickRandom(availableRows, count);
        sampleData.push(...pickedRows);
        domainDistribution[domainName] = pickedRows.length;
      });
    }

    const sampled: SampledDataset = {
      data: sampleData,
      strategy: samplingStrategy,
      domainDistribution,
      totalSamples: sampleData.length,
    };

    setSampledDataset(sampled);
    setPreviewData(sampleData.slice(0, 10));
  };

  const openModal = (a: InstructionAssignment) => {
    if (!dataset || !domainAnalysis) return;
    const domainName = a.domainName;
    const taskName = a.taskName || 'Unknown';
    const items = (domainAnalysis.assignments || [])
      .filter(x => x.domainName === domainName && (x.taskName || 'Unknown') === taskName)
      .map(x => ({ assignment: x, row: dataset.data[x.datasetIndex] }))
      .filter(x => !!x.row);
    setModalDomain(domainName);
    setModalItems(items as Array<{ assignment: InstructionAssignment; row: DatasetRow }>);
    setSelectedItemIndex(null);
    setModalMode('list');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setModalDomain(null);
    setModalItems([]);
    setSelectedItemIndex(null);
    setModalMode('list');
  };

  const handleStrategyChange = (type: SamplingStrategy['type']) => {
    setSamplingStrategy(prev => ({ ...prev, type }));
    // When data-centric is selected, clear model-centric selection
    if (type === 'top3' || type === 'custom' || type === 'balanced' || type === 'tasks_top3' || type === 'tasks_custom' || type === 'tasks_balanced') {
      setModelDifficulty(null);
    }
    if (type === 'custom' && selectedDomains.length === 0) {
      setSelectedDomains(domainAnalysis?.domains.slice(0, 3).map(d => d.name) || []);
    }
    if (type === 'tasks_custom' && selectedTasks.length === 0) {
      setSelectedTasks(taskList.slice(0, 3).map(t => t.name));
    }
  };

  const handleDomainToggle = (domainName: string) => {
    setSelectedDomains(prev =>
      prev.includes(domainName)
        ? prev.filter(d => d !== domainName)
        : [...prev, domainName]
    );
  };

  const handleTaskToggle = (taskName: string) => {
    setSelectedTasks(prev =>
      prev.includes(taskName)
        ? prev.filter(t => t !== taskName)
        : [...prev, taskName]
    );
  };

  const handleExport = (format: 'csv' | 'json') => {
    if (!sampledDataset) return;

    if (format === 'csv') {
      exportToCSV(sampledDataset.data, 'sampled-dataset.csv');
    } else {
      exportToJSON({
        metadata: {
          strategy: sampledDataset.strategy,
          totalSamples: sampledDataset.totalSamples,
          domainDistribution: sampledDataset.domainDistribution,
          generatedAt: new Date().toISOString(),
        },
        data: sampledDataset.data,
      }, 'sampled-dataset.json');
    }
  };

  const copyToClipboard = () => {
    if (!sampledDataset) return;

    const text = sampledDataset.data
      .map(row => `Input: ${row[dataset?.inputColumn || '']} | Output: ${row[dataset?.outputColumn || '']}`)
      .join('\n\n');

    navigator.clipboard.writeText(text).then(() => {
      // You could add a toast notification here
      console.log('Copied to clipboard');
    });
  };

  if (!dataset || !domainAnalysis) return null;

  const COLORS = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#6B7280', '#EC4899', '#14B8A6'];

  const pieChartData = sampledDataset ? Object.entries(sampledDataset.domainDistribution).map(([name, value], index) => ({
    name,
    value,
    color: COLORS[index % COLORS.length],
  })) : [];

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Data Sampling
        </h2>
        <p className="text-lg text-gray-600 dark:text-gray-300">
          Select and export your final dataset with customizable sampling strategies
        </p>
      </div>

      {/* Task Tree removed on Sampling page */}

      {/* Data-centric Sampling Selection */}
      <Card title="Data-centric Sampling" description="Choose how to sample your dataset">
        <div className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <div
              className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                samplingStrategy.type === 'top3' && !modelDifficulty
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
              }`}
              onClick={() => handleStrategyChange('top3')}
            >
              <div className="flex items-center space-x-3">
                <input
                  type="radio"
                  checked={samplingStrategy.type === 'top3' && !modelDifficulty}
                  onChange={() => {}}
                  className="text-blue-600"
                />
                <Target className="w-5 h-5 text-blue-600" />
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    Top-3 Domains
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Sample from most frequent domains
                  </p>
                </div>
              </div>
            </div>

            <div
              className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                samplingStrategy.type === 'custom' && !modelDifficulty
                  ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
              }`}
              onClick={() => handleStrategyChange('custom')}
            >
              <div className="flex items-center space-x-3">
                <input
                  type="radio"
                  checked={samplingStrategy.type === 'custom' && !modelDifficulty}
                  onChange={() => {}}
                  className="text-purple-600"
                />
                <Shuffle className="w-5 h-5 text-purple-600" />
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    Custom Selection (Domains)
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Choose specific domains
                  </p>
                </div>
              </div>
            </div>

            <div
              className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                samplingStrategy.type === 'balanced' && !modelDifficulty
                  ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
              }`}
              onClick={() => handleStrategyChange('balanced')}
            >
              <div className="flex items-center space-x-3">
                <input
                  type="radio"
                  checked={samplingStrategy.type === 'balanced' && !modelDifficulty}
                  onChange={() => {}}
                  className="text-emerald-600"
                />
                <Target className="w-5 h-5 text-emerald-600" />
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    Balanced Sampling (Domains)
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Equal samples from all domains
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Task-centric Sampling Selection */}
          <div className="grid md:grid-cols-3 gap-4">
            <div
              className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                samplingStrategy.type === 'tasks_top3' && !modelDifficulty
                  ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
              }`}
              onClick={() => handleStrategyChange('tasks_top3')}
            >
              <div className="flex items-center space-x-3">
                <input
                  type="radio"
                  checked={samplingStrategy.type === 'tasks_top3' && !modelDifficulty}
                  onChange={() => {}}
                  className="text-indigo-600"
                />
                <Target className="w-5 h-5 text-indigo-600" />
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    Top-3 Tasks
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Sample from most frequent tasks
                  </p>
                </div>
              </div>
            </div>

            <div
              className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                samplingStrategy.type === 'tasks_custom' && !modelDifficulty
                  ? 'border-lime-500 bg-lime-50 dark:bg-lime-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
              }`}
              onClick={() => handleStrategyChange('tasks_custom')}
            >
              <div className="flex items-center space-x-3">
                <input
                  type="radio"
                  checked={samplingStrategy.type === 'tasks_custom' && !modelDifficulty}
                  onChange={() => {}}
                  className="text-lime-600"
                />
                <Shuffle className="w-5 h-5 text-lime-600" />
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    Custom Selection (Tasks)
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Choose specific tasks
                  </p>
                </div>
              </div>
            </div>

            <div
              className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                samplingStrategy.type === 'tasks_balanced' && !modelDifficulty
                  ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
              }`}
              onClick={() => handleStrategyChange('tasks_balanced')}
            >
              <div className="flex items-center space-x-3">
                <input
                  type="radio"
                  checked={samplingStrategy.type === 'tasks_balanced' && !modelDifficulty}
                  onChange={() => {}}
                  className="text-yellow-600"
                />
                <Target className="w-5 h-5 text-yellow-600" />
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    Balanced Sampling (Tasks)
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Equal samples from all tasks
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Strategy-specific controls */}
          <div className="mt-6">
            {samplingStrategy.type === 'top3' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Samples per domain: {samplingStrategy.samplesPerDomain}
                </label>
                <input
                  type="range"
                  min="10"
                  max="1000"
                  step="10"
                  value={samplingStrategy.samplesPerDomain || 100}
                  onChange={(e) =>
                    setSamplingStrategy(prev => ({
                      ...prev,
                      samplesPerDomain: parseInt(e.target.value),
                    }))
                  }
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-gray-500 mt-1">
                  <span>10</span>
                  <span>1000</span>
                </div>
              </div>
            )}

            {samplingStrategy.type === 'custom' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Select domains to include:
                  </label>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                    {domainAnalysis.domains.map((domain) => (
                      <label
                        key={domain.name}
                        className="flex items-center space-x-2 p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedDomains.includes(domain.name)}
                          onChange={() => handleDomainToggle(domain.name)}
                          className="text-purple-600"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300 truncate">
                          {domain.name} ({domain.count})
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Samples per domain: {samplingStrategy.samplesPerDomain}
                  </label>
                  <input
                    type="range"
                    min="10"
                    max="1000"
                    step="10"
                    value={samplingStrategy.samplesPerDomain || 100}
                    onChange={(e) =>
                      setSamplingStrategy(prev => ({
                        ...prev,
                        samplesPerDomain: parseInt(e.target.value),
                      }))
                    }
                    className="w-full"
                  />
                </div>
              </div>
            )}

            {samplingStrategy.type === 'balanced' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Total samples: {samplingStrategy.totalSamples}
                </label>
                <input
                  type="range"
                  min="100"
                  max="10000"
                  step="100"
                  value={samplingStrategy.totalSamples || 1000}
                  onChange={(e) =>
                    setSamplingStrategy(prev => ({
                      ...prev,
                      totalSamples: parseInt(e.target.value),
                    }))
                  }
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-gray-500 mt-1">
                  <span>100</span>
                  <span>10,000</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                  ~{Math.floor((samplingStrategy.totalSamples || 1000) / domainAnalysis.domains.length)} samples per domain
                </p>
              </div>
            )}

            {samplingStrategy.type === 'tasks_top3' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Samples per task: {samplingStrategy.samplesPerDomain}
                </label>
                <input
                  type="range"
                  min="10"
                  max="1000"
                  step="10"
                  value={samplingStrategy.samplesPerDomain || 100}
                  onChange={(e) =>
                    setSamplingStrategy(prev => ({
                      ...prev,
                      samplesPerDomain: parseInt(e.target.value),
                    }))
                  }
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-gray-500 mt-1">
                  <span>10</span>
                  <span>1000</span>
                </div>
              </div>
            )}

            {samplingStrategy.type === 'tasks_custom' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Select tasks to include:
                  </label>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                    {taskList.map((t) => (
                      <label
                        key={t.name}
                        className="flex items-center space-x-2 p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedTasks.includes(t.name)}
                          onChange={() => handleTaskToggle(t.name)}
                          className="text-purple-600"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300 truncate">
                          {t.name} ({t.count})
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Samples per task: {samplingStrategy.samplesPerDomain}
                  </label>
                  <input
                    type="range"
                    min="10"
                    max="1000"
                    step="10"
                    value={samplingStrategy.samplesPerDomain || 100}
                    onChange={(e) =>
                      setSamplingStrategy(prev => ({
                        ...prev,
                        samplesPerDomain: parseInt(e.target.value),
                      }))
                    }
                    className="w-full"
                  />
                </div>
              </div>
            )}

            {samplingStrategy.type === 'tasks_balanced' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Total samples: {samplingStrategy.totalSamples}
                </label>
                <input
                  type="range"
                  min="100"
                  max="10000"
                  step="100"
                  value={samplingStrategy.totalSamples || 1000}
                  onChange={(e) =>
                    setSamplingStrategy(prev => ({
                      ...prev,
                      totalSamples: parseInt(e.target.value),
                    }))
                  }
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-gray-500 mt-1">
                  <span>100</span>
                  <span>10,000</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                  ~{Math.floor((samplingStrategy.totalSamples || 1000) / Math.max(1, taskList.length))} samples per task
                </p>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Data-centric + Model-centric Sampling (visual only) */}
      <Card title="Data-centric + Model-centric Sampling" description="Choose how to sample your dataset" className="relative z-[100]">
        <div className="space-y-4">
          {/* Target Model selector (visual only) */}
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Target Model:</span>
            <select
              value={targetModel}
              onChange={(e) => setTargetModel(e.target.value)}
              className="flex-1 max-w-md px-3 py-2 text-sm rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
            >
              <option value="llama-3.2-1b-instruct">llama-3.2-1b-instruct</option>
            </select>
            <Button onClick={calculateScores} loading={isScoring} disabled={isScoring} className="whitespace-nowrap">
              <Activity className="w-4 h-4 mr-2" />
              Caculating Score
            </Button>
            {isScoring || hasScore ? (
              <span className="text-sm text-gray-600 dark:text-gray-400 min-w-[48px] text-right">{scoreProgress}%</span>
            ) : null}
            {/* Variability Score tooltip */}
            <div className="relative group ml-1 z-[999]">
              <Info className="w-5 h-5 text-gray-500 hover:text-gray-700" />
              <div className="absolute top-full right-0 mt-2 w-[340px] sm:w-[420px] p-3 rounded-lg shadow-xl border border-gray-200 bg-white text-gray-700 text-[16px] leading-relaxed opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none group-hover:pointer-events-auto z-[9999] transform translate-x-[12px]">
                {/* arrow */}
                <span className="absolute -top-2 right-[16px] w-3 h-3 bg-white border-l border-t border-gray-200 rotate-45"></span>
                <p className="mb-2">
                  <strong>Variability Score</strong> quantifies how diversely an instruction elicits internal representations across layers of a language model. It is computed as the <strong>average Jensen–Shannon divergence</strong> between activation distributions of different layers, capturing the semantic spread or representation variability of a prompt.
                </p>
                <p>
                  A higher score indicates richer, more informative instructions that engage broader model capacities.
                </p>
              </div>
            </div>
          </div>

          {/* Difficulty options with radio (single-select) */}
          <div className="grid md:grid-cols-3 gap-4">
            <button
              className={`p-4 border-2 rounded-lg transition-all text-left ${
                modelDifficulty === 'lv'
                  ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
              } ${controlsDisabled ? 'opacity-60 cursor-not-allowed' : ''}`}
              onClick={() => {
                if (controlsDisabled) return;
                setModelDifficulty('lv');
                // Clear data-centric selection
                setSamplingStrategy(prev => ({ ...prev, type: prev.type as SamplingStrategy['type'] }));
                if (samplingStrategy.type === 'top3' || samplingStrategy.type === 'custom' || samplingStrategy.type === 'balanced') {
                  setSamplingStrategy(prev => ({ ...prev, type: 'top3' }));
                }
                // Force to neutralize data-centric radio visual by switching to a neutral value
                setSamplingStrategy(prev => ({ ...prev, type: 'balanced' }));
              }}
              disabled={controlsDisabled}
            >
              <div className="flex items-center space-x-3">
                <input type="radio" readOnly checked={modelDifficulty === 'lv'} className="text-amber-600" />
                <ArrowUp className="w-5 h-5 text-amber-600" />
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">LV (ascending)</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">easy data</div>
                </div>
              </div>
            </button>

            <button
              className={`p-4 border-2 rounded-lg transition-all text-left ${
                modelDifficulty === 'hv'
                  ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
              } ${controlsDisabled ? 'opacity-60 cursor-not-allowed' : ''}`}
              onClick={() => {
                if (controlsDisabled) return;
                setModelDifficulty('hv');
                setSamplingStrategy(prev => ({ ...prev, type: 'balanced' }));
              }}
              disabled={controlsDisabled}
            >
              <div className="flex items-center space-x-3">
                <input type="radio" readOnly checked={modelDifficulty === 'hv'} className="text-teal-600" />
                <ArrowDown className="w-5 h-5 text-teal-600" />
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">HV (descending)</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">hard data</div>
                </div>
              </div>
            </button>

            <button
              className={`p-4 border-2 rounded-lg transition-all text-left ${
                modelDifficulty === 'mix'
                  ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
              } ${controlsDisabled ? 'opacity-60 cursor-not-allowed' : ''}`}
              onClick={() => {
                if (controlsDisabled) return;
                setModelDifficulty('mix');
                setSamplingStrategy(prev => ({ ...prev, type: 'balanced' }));
              }}
              disabled={controlsDisabled}
            >
              <div className="flex items-center space-x-3">
                <input type="radio" readOnly checked={modelDifficulty === 'mix'} className="text-cyan-600" />
                <Shuffle className="w-5 h-5 text-cyan-600" />
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">Mix (recommended)</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">balanced data</div>
                </div>
              </div>
            </button>
          </div>

          {/* p% slider (visual only) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              p%: {pValue}%
            </label>
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={pValue}
              onChange={(e) => setPValue(parseInt(e.target.value))}
              className={`w-full ${controlsDisabled ? 'opacity-60 cursor-not-allowed' : ''}`}
              disabled={controlsDisabled}
            />
            <div className="flex justify-between text-sm text-gray-500 mt-1">
              <span>0</span>
              <span>100</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Sample Preview */}
      {sampledDataset && (
        <div className="grid lg:grid-cols-2 gap-6">
          <Card title="Sample Distribution" description="Domain breakdown of your sample">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {sampledDataset.totalSamples}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Total Samples
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {Object.keys(sampledDataset.domainDistribution).length}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Domains Included
                  </div>
                </div>
              </div>

              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </Card>

          <Card title="Sample Preview" description="First 10 rows of your sample">
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {previewData.map((row, index) => (
                <div
                  key={index}
                  className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg"
                >
                  <div className="text-sm">
                    <div className="font-medium text-gray-900 dark:text-white mb-1">
                      Input:
                    </div>
                    <div className="text-gray-600 dark:text-gray-400 mb-2 truncate">
                      {String(row[dataset.inputColumn || ''])}
                    </div>
                    <div className="font-medium text-gray-900 dark:text-white mb-1">
                      Output:
                    </div>
                    <div className="text-gray-600 dark:text-gray-400 truncate">
                      {String(row[dataset.outputColumn || ''])}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      

      {/* Raw Data Modal (Domain list -> Row detail) */}
      {isModalOpen && modalDomain && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={closeModal} />
          <div className="relative bg-white dark:bg-gray-900 rounded-xl shadow-xl max-w-2xl w-full mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{modalMode === 'list' ? `Domain: ${modalDomain}` : 'Raw Data Detail'}</h3>
              <div className="space-x-2">
                {modalMode === 'detail' && (
                  <button onClick={() => setModalMode('list')} className="px-3 py-1 rounded border border-gray-300 dark:border-gray-700 text-sm mr-2">Back</button>
                )}
                <button onClick={closeModal} className="px-3 py-1 rounded border border-gray-300 dark:border-gray-700 text-sm">Close</button>
              </div>
            </div>
            {modalMode === 'list' ? (
              <div className="max-h-96 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg divide-y divide-gray-100 dark:divide-gray-800">
                {modalItems.map((item, idx) => {
                  const input = String(item.row[dataset.inputColumn || ''] || '');
                  const output = String(item.row[dataset.outputColumn || ''] || '');
                  return (
                    <button
                      key={item.assignment.id}
                      onClick={() => { setSelectedItemIndex(idx); setModalMode('detail'); }}
                      className="w-full text-left p-3 hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      <div className="text-sm text-gray-900 dark:text-gray-100 font-medium mb-1">
                        idx: {item.assignment.datasetIndex} • task: {item.assignment.taskName || 'Unknown'}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 truncate">input: {input}</div>
                      {output && <div className="text-xs text-gray-500 dark:text-gray-400 truncate">output: {output}</div>}
                    </button>
                  );
                })}
              </div>
            ) : (
              selectedItemIndex !== null && (
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                    <div>Task: <span className="font-medium text-gray-900 dark:text-white">{modalItems[selectedItemIndex].assignment.taskName || 'Unknown'}</span></div>
                    <div>Domain: <span className="font-medium text-gray-900 dark:text-white">{modalItems[selectedItemIndex].assignment.domainName}</span></div>
                    <div>Dataset Index: <span className="font-medium text-gray-900 dark:text-white">{modalItems[selectedItemIndex].assignment.datasetIndex}</span></div>
                  </div>
                  <div className="max-h-96 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                    <table className="w-full text-sm">
                      <tbody>
                        {Object.entries(modalItems[selectedItemIndex].row).map(([key, value]) => (
                          <tr key={key} className="border-b border-gray-100 dark:border-gray-800">
                            <td className="py-2 pr-4 text-gray-500 dark:text-gray-400 align-top whitespace-nowrap">{key}</td>
                            <td className="py-2 text-gray-900 dark:text-gray-100 break-words">{String(value)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      )}

      {/* Export Options */}
      {sampledDataset && (
        <Card title="Export Sample" description="Download or copy your sampled dataset">
          <div className="flex flex-wrap gap-3">
            <Button onClick={() => handleExport('csv')}>
              <Download className="w-4 h-4 mr-2" />
              Export as CSV
            </Button>
            <Button onClick={() => handleExport('json')} variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export as JSON
            </Button>
            <Button onClick={copyToClipboard} variant="outline">
              <Copy className="w-4 h-4 mr-2" />
              Copy to Clipboard
            </Button>
          </div>

          <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
            <h4 className="font-medium mb-2">Sample Summary:</h4>
            <ul className="space-y-1">
              <li>Strategy: {samplingStrategy.type}</li>
              <li>Total samples: {sampledDataset.totalSamples}</li>
              <li>Domains: {Object.keys(sampledDataset.domainDistribution).join(', ')}</li>
            </ul>
          </div>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex justify-start">
        <Button variant="outline" onClick={() => navigate('/domain-analysis')}>
          Back to Domain Analysis
        </Button>
      </div>
    </div>
  );
};