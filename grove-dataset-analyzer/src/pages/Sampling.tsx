import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { Download, Shuffle, Target, Copy } from 'lucide-react';
import { Card } from '../components/UI/Card';
import { Button } from '../components/UI/Button';
import { useAppStore } from '../store/useAppStore';
import { exportToCSV, exportToJSON } from '../utils/dataProcessing';
import { SamplingStrategy, SampledDataset, DatasetRow, InstructionAssignment } from '../types';
import AssignmentTree from '../components/Tree/AssignmentTree';

export const Sampling: React.FC = () => {
  const navigate = useNavigate();
  const {
    dataset,
    domainAnalysis,
    sampledDataset,
    setSampledDataset,
    setError,
  } = useAppStore();

  const [samplingStrategy, setSamplingStrategy] = useState<SamplingStrategy>({
    type: 'top3',
    samplesPerDomain: 100,
  });
  const [selectedDomains, setSelectedDomains] = useState<string[]>([]);
  const [previewData, setPreviewData] = useState<DatasetRow[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'list' | 'detail'>('list');
  const [modalDomain, setModalDomain] = useState<string | null>(null);
  const [modalItems, setModalItems] = useState<Array<{ assignment: InstructionAssignment; row: DatasetRow }>>([]);
  const [selectedItemIndex, setSelectedItemIndex] = useState<number | null>(null);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!dataset || !domainAnalysis) {
      navigate('/');
    }
  }, [dataset, domainAnalysis, navigate]);

  useEffect(() => {
    generateSample();
  }, [samplingStrategy, selectedDomains]);

  const generateSample = () => {
    if (!dataset || !domainAnalysis) return;

    let samplesToGenerate: { [domain: string]: number } = {};

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
    }

    // Generate sample using domain -> dataset row mapping from LLM assignments
    const sampleData: DatasetRow[] = [];
    const domainDistribution: { [domain: string]: number } = {};

    const assignments = domainAnalysis.assignments || [];
    const domainToRows: { [domain: string]: DatasetRow[] } = {};

    assignments.forEach(assign => {
      const row = dataset.data[assign.datasetIndex];
      if (!row) return;
      if (!domainToRows[assign.domainName]) domainToRows[assign.domainName] = [];
      domainToRows[assign.domainName].push(row);
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

    Object.entries(samplesToGenerate).forEach(([domainName, count]) => {
      const availableRows = domainToRows[domainName] || [];
      const pickedRows = pickRandom(availableRows, count);
      sampleData.push(...pickedRows);
      domainDistribution[domainName] = pickedRows.length;
    });

    const sampled: SampledDataset = {
      data: sampleData,
      strategy: samplingStrategy,
      domainDistribution,
      totalSamples: sampleData.length,
    };

    setSampledDataset(sampled);
    setPreviewData(sampleData.slice(0, 10));
  };

  const assignments = domainAnalysis?.assignments || [];
  const taskGroups: { [task: string]: { [domain: string]: InstructionAssignment[] } } = assignments.reduce((acc, a) => {
    const task = a.taskName || 'Unknown';
    if (!acc[task]) acc[task] = {};
    if (!acc[task][a.domainName]) acc[task][a.domainName] = [];
    acc[task][a.domainName].push(a);
    return acc;
  }, {} as { [task: string]: { [domain: string]: InstructionAssignment[] } });

  const toggleDomain = (domainName: string) => {
    setCollapsed(prev => ({ ...prev, [domainName]: !prev[domainName] }));
  };

  const openModal = (a: InstructionAssignment) => {
    if (!dataset || !domainAnalysis) return;
    const domainName = a.domainName;
    const items = (domainAnalysis.assignments || [])
      .filter(x => x.domainName === domainName)
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
    if (type === 'custom' && selectedDomains.length === 0) {
      setSelectedDomains(domainAnalysis?.domains.slice(0, 3).map(d => d.name) || []);
    }
  };

  const handleDomainToggle = (domainName: string) => {
    setSelectedDomains(prev =>
      prev.includes(domainName)
        ? prev.filter(d => d !== domainName)
        : [...prev, domainName]
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

      {/* Sampling Strategy Selection */}
      <Card title="Sampling Strategy" description="Choose how to sample your dataset">
        <div className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <div
              className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                samplingStrategy.type === 'top3'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
              }`}
              onClick={() => handleStrategyChange('top3')}
            >
              <div className="flex items-center space-x-3">
                <input
                  type="radio"
                  checked={samplingStrategy.type === 'top3'}
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
                samplingStrategy.type === 'custom'
                  ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
              }`}
              onClick={() => handleStrategyChange('custom')}
            >
              <div className="flex items-center space-x-3">
                <input
                  type="radio"
                  checked={samplingStrategy.type === 'custom'}
                  onChange={() => {}}
                  className="text-purple-600"
                />
                <Shuffle className="w-5 h-5 text-purple-600" />
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    Custom Selection
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Choose specific domains
                  </p>
                </div>
              </div>
            </div>

            <div
              className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                samplingStrategy.type === 'balanced'
                  ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
              }`}
              onClick={() => handleStrategyChange('balanced')}
            >
              <div className="flex items-center space-x-3">
                <input
                  type="radio"
                  checked={samplingStrategy.type === 'balanced'}
                  onChange={() => {}}
                  className="text-emerald-600"
                />
                <Target className="w-5 h-5 text-emerald-600" />
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    Balanced Sampling
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Equal samples from all domains
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

      {/* Task → Domain → Raw Tree */}
      {dataset && domainAnalysis && (
        <Card title="Task Tree" description="Root → Tasks → Domains → Raw data">
          <AssignmentTree
            assignments={assignments}
            dataset={dataset}
            onLeafClick={(a, row) => openModal(a)}
          />
        </Card>
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
      <div className="flex justify-between">
        <Button variant="outline" onClick={() => navigate('/domain-analysis')}>
          Back to Domain Analysis
        </Button>
        <Button onClick={() => navigate('/')}>
          Start New Analysis
        </Button>
      </div>
    </div>
  );
};