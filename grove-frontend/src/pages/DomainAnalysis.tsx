//
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Bot, Key, Download, Zap, Maximize2, Minimize2 } from 'lucide-react';
import { Card } from '../components/UI/Card';
import AssignmentTree from '../components/Tree/AssignmentTree';
import { Button } from '../components/UI/Button';
import { useAppStore } from '../store/useAppStore';
import { LLMService } from '../utils/llmService';
import { exportToJSON, exportToCSV } from '../utils/dataProcessing';
import { LLMModel, DatasetRow, InstructionAssignment } from '../types';

const MODELS: { id: LLMModel; name: string; provider: string }[] = [
  { id: 'claude-sonnet-4-20250514', name: 'Claude 4 Sonnet', provider: 'Anthropic' },
  { id: 'claude-opus-4-20250514', name: 'Claude 4 Opus', provider: 'Anthropic' },
  { id: 'gpt-4', name: 'GPT-4', provider: 'OpenAI' },
  { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', provider: 'OpenAI' },
  { id: 'gpt-5', name: 'GPT-5', provider: 'OpenAI' },
  { id: 'gpt-5-mini', name: 'GPT-5 Mini', provider: 'OpenAI' },
  { id: 'gpt-5-nano', name: 'GPT-5 Nano', provider: 'OpenAI' },
];

export const DomainAnalysis: React.FC = () => {
  const navigate = useNavigate();
  const {
    dataset,
    domainAnalysis,
    setDomainAnalysis,
    llmApiKey,
    setLlmApiKey,
    selectedModel,
    setSelectedModel,
    isProcessing,
    setIsProcessing,
    setError,
  } = useAppStore();

  const [progress, setProgress] = useState(0);
  // Modal states for tree leaf click
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'list' | 'detail'>('list');
  const [modalDomain, setModalDomain] = useState<string | null>(null);
  const [modalItems, setModalItems] = useState<Array<{ assignment: InstructionAssignment; row: DatasetRow }>>([]);
  const [selectedItemIndex, setSelectedItemIndex] = useState<number | null>(null);
  // 전체화면 트리 모달
  const [isTreeFullOpen, setIsTreeFullOpen] = useState(false);
  // 축소 뷰 트리 export를 위한 컨테이너 ref
  const treeCardRef = React.useRef<HTMLDivElement | null>(null);

  // ESC 키로 전체화면 닫기
  React.useEffect(() => {
    if (!isTreeFullOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsTreeFullOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isTreeFullOpen]);

  React.useEffect(() => {
    if (!dataset) {
      navigate('/');
    }
  }, [dataset, navigate]);

  const handleExtractDomains = async () => {
    if (!dataset || !llmApiKey.trim()) {
      setError('Please provide an API key');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setProgress(0);

    try {
      const llmService = new LLMService(llmApiKey, selectedModel as LLMModel);

      const analysis = await llmService.extractDomains(
        dataset,
        (completed, total) => {
          const pct = Math.floor((completed / total) * 100);
          setProgress(pct);
        }
      );

      setDomainAnalysis(analysis);
    } catch (error) {
      const baseMsg = 'LLM API 호출에 실패했습니다. 잠시 후 다시 시도해 주세요.';
      const detail = error instanceof Error ? ` (${error.message})` : '';
      setError(baseMsg + detail);
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  // Open modal with items in same task/domain as clicked leaf
  const openModal = (a: InstructionAssignment) => {
    if (!dataset || !domainAnalysis) return;
    setIsTreeFullOpen(false);
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

  const selectedModelInfo = MODELS.find(m => m.id === selectedModel);
  const isClaudeModel = selectedModel.startsWith('claude');
  const apiKeyPlaceholder = isClaudeModel 
    ? 'Enter your Anthropic API key...' 
    : 'Enter your OpenAI API key...';

  const COLORS = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#6B7280', '#EC4899', '#14B8A6'];

  const pieChartData = domainAnalysis?.domains.map((domain, index) => ({
    name: domain.name,
    value: domain.count,
    percentage: domain.percentage,
    color: COLORS[index % COLORS.length],
  }));

  const barChartData = domainAnalysis?.domains.slice(0, 10).map(domain => ({
    name: domain.name.length > 15 ? domain.name.substring(0, 15) + '...' : domain.name,
    count: domain.count,
    percentage: domain.percentage,
  }));

  const handleExportAnalysis = (format: 'json' | 'csv') => {
    if (!domainAnalysis) return;

    const exportData = {
      summary: {
        totalProcessed: domainAnalysis.totalProcessed,
        processingTime: domainAnalysis.processingTime,
        modelUsed: domainAnalysis.modelUsed,
        domainCount: domainAnalysis.domains.length,
      },
      domains: domainAnalysis.domains,
    };

    if (format === 'json') {
      exportToJSON(exportData, 'domain-analysis.json');
    } else {
      // Flatten for CSV
      const flatData = domainAnalysis.domains.map(domain => ({
        domain_name: domain.name,
        count: domain.count,
        percentage: domain.percentage.toFixed(2),
        examples: domain.examples.join(' | '),
      }));
      exportToCSV(flatData, 'domain-analysis.csv');
    }
  };

  if (!dataset) return null;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Domain Analysis with LLM
        </h2>
        <p className="text-lg text-gray-600 dark:text-gray-300">
          Extract instruction domains using state-of-the-art language models
        </p>
      </div>

      {!domainAnalysis ? (
        <div className="space-y-6">
          {/* Model Selection */}
          <Card title="LLM Configuration" description="Choose your model and provide API access">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Select Model
                </label>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {MODELS.map((model) => (
                    <option key={model.id} value={model.id}>
                      {model.name} ({model.provider})
                    </option>
                  ))}
                </select>
                {selectedModelInfo && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Using {selectedModelInfo.name} from {selectedModelInfo.provider}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  API Key
                </label>
                <div className="relative">
                  <Key className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                  <input
                    type="password"
                    value={llmApiKey}
                    onChange={(e) => setLlmApiKey(e.target.value)}
                    placeholder={apiKeyPlaceholder}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Your API key is stored locally and never sent to our servers
                </p>
              </div>
            </div>
          </Card>

          {/* Processing Interface */}
          <Card>
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center">
                <Bot className="w-8 h-8 text-white" />
              </div>
              
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Ready to Extract Domains
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  This will analyze {dataset.data.length} instructions to identify semantic domains
                </p>
              </div>

              {isProcessing && (
                <div className="space-y-3">
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Processing... {progress}%
                  </p>
                </div>
              )}

              <Button
                onClick={handleExtractDomains}
                disabled={!llmApiKey.trim() || isProcessing}
                loading={isProcessing}
                size="lg"
                className="w-full max-w-xs"
              >
                <Zap className="w-5 h-5 mr-2" />
                Extract Domains
              </Button>
            </div>
          </Card>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Analysis Summary */}
          <Card>
            <div className="grid md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                  {domainAnalysis.domains.length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Domains Found
                </div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                  {domainAnalysis.totalProcessed}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Instructions Processed
                </div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                  {Math.round(domainAnalysis.processingTime / 1000)}s
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Processing Time
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                  {domainAnalysis.modelUsed}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Model Used
                </div>
              </div>
            </div>
          </Card>

          {/* Charts */}
          <div className="grid lg:grid-cols-2 gap-6">
            <Card title="Domain Distribution" description="Percentage breakdown of domains">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percentage }) => `${name}: ${percentage.toFixed(1)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieChartData?.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card title="Top 10 Domains" description="Most frequent domains by count">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#3B82F6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          {/* Domain Details */}
          <Card title="Domain Details" description="Detailed breakdown with examples">
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {domainAnalysis.domains.map((domain, index) => (
                <div
                  key={domain.name}
                  className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-gray-900 dark:text-white">
                      {domain.name}
                    </h4>
                    <div className="flex items-center space-x-4">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {domain.count} samples ({domain.percentage.toFixed(1)}%)
                      </span>
                      <div
                        className="w-4 h-4 rounded"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                    </div>
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <p className="font-medium mb-1">Examples:</p>
                    <ul className="list-disc list-inside space-y-1">
                      {domain.examples.map((example, idx) => (
                        <li key={idx} className="truncate">
                          {example}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Task → Domain → Raw Tree (placed below Domain Details) */}
          <Card title="Task Tree" description="Root → Tasks → Domains">
            <div className="flex justify-end items-center gap-2 mb-3">
              <Button variant="outline" size="sm" onClick={() => setIsTreeFullOpen(true)}>
                <Maximize2 className="w-4 h-4 mr-2" /> Fullscreen
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  // 카드 영역의 트리 SVG를 PNG로 내보내기
                  const container = treeCardRef.current;
                  if (!container) return;
                  const svgs = Array.from(container.querySelectorAll('svg')) as SVGSVGElement[];
                  if (!svgs.length) return;
                  let svg: SVGSVGElement | null = null; let maxArea = 0;
                  svgs.forEach((el) => { const r = el.getBoundingClientRect(); const a = r.width * r.height; if (a > maxArea) { maxArea = a; svg = el; } });
                  if (!svg) return;

                  const inlineSvgStyles = (source: SVGSVGElement) => {
                    const clone = source.cloneNode(true) as SVGSVGElement;
                    const srcNodes = source.querySelectorAll('*');
                    const dstNodes = clone.querySelectorAll('*');
                    srcNodes.forEach((node, idx) => {
                      const target = dstNodes[idx] as SVGElement | undefined; if (!target) return;
                      const cs = window.getComputedStyle(node as Element);
                      const tag = (target.tagName || '').toLowerCase();
                      if (cs.fill) target.setAttribute('fill', cs.fill);
                      if (cs.stroke) target.setAttribute('stroke', cs.stroke);
                      if (cs.strokeWidth) target.setAttribute('stroke-width', cs.strokeWidth);
                      if (cs.fontFamily) target.setAttribute('font-family', cs.fontFamily);
                      if (cs.fontSize) target.setAttribute('font-size', cs.fontSize);
                      if (tag === 'path') { target.setAttribute('fill', 'none'); if (!target.getAttribute('stroke')) target.setAttribute('stroke', '#9CA3AF'); if (!target.getAttribute('stroke-width')) target.setAttribute('stroke-width', '1.2'); target.setAttribute('stroke-linecap', 'round'); target.setAttribute('stroke-linejoin', 'round'); }
                    });
                    clone.removeAttribute('width'); clone.removeAttribute('height');
                    return clone;
                  };

                  const cloned = inlineSvgStyles(svg as SVGSVGElement);
                  const zoomGroup = (svg as SVGSVGElement).querySelector('.rd3t-g') as SVGGElement | null
                    || (svg as SVGSVGElement).querySelector('g[transform*="scale"], g[transform*="translate"]') as SVGGElement | null;
                  let scaleFactor = 1; if (zoomGroup) { const t = zoomGroup.getAttribute('transform') || ''; const m = t.match(/scale\(([^)]+)\)/); if (m && !isNaN(parseFloat(m[1]))) scaleFactor = parseFloat(m[1]); }
                  if (!Number.isFinite(scaleFactor) || scaleFactor <= 0) scaleFactor = 1;

                  // 전체 콘텐츠 bbox 계산
                  const clonedContentGroup = (cloned.querySelector('.rd3t-g') as SVGGElement | null)
                    || (cloned.querySelector('g[transform*="scale"], g[transform*="translate"]') as SVGGElement | null);
                  let bbox: { x: number; y: number; width: number; height: number } | null = null;
                  try {
                    const ns2 = 'http://www.w3.org/2000/svg';
                    const host = document.createElement('div'); host.style.position = 'fixed'; host.style.left = '-100000px'; host.style.top = '0'; host.style.width = '0'; host.style.height = '0'; document.body.appendChild(host);
                    const measureSvg = document.createElementNS(ns2, 'svg'); host.appendChild(measureSvg);
                    const measureGroup = (clonedContentGroup ? clonedContentGroup.cloneNode(true) : cloned.cloneNode(true)) as SVGGElement | SVGSVGElement;
                    measureSvg.appendChild(measureGroup);
                    const b = (measureGroup as any).getBBox?.();
                    if (b && isFinite(b.width) && isFinite(b.height)) bbox = { x: b.x, y: b.y, width: b.width, height: b.height };
                    document.body.removeChild(host);
                  } catch {}

                  const ns = 'http://www.w3.org/2000/svg';
                  const wrapSvg = document.createElementNS(ns, 'svg');
                  wrapSvg.setAttribute('xmlns', ns); wrapSvg.setAttribute('version', '1.1');
                  const rect = (svg as SVGSVGElement).getBoundingClientRect();
                  const baseW = Math.max(2, Math.ceil(bbox ? bbox.width : rect.width / scaleFactor));
                  const baseH = Math.max(2, Math.ceil(bbox ? bbox.height : rect.height / scaleFactor));
                  const padding = 24; const outW = baseW + padding * 2; const outH = baseH + padding * 2;
                  wrapSvg.setAttribute('viewBox', `0 0 ${outW} ${outH}`);
                  wrapSvg.setAttribute('width', String(outW)); wrapSvg.setAttribute('height', String(outH));
                  const bg = document.createElementNS(ns, 'rect'); bg.setAttribute('x', '0'); bg.setAttribute('y', '0'); bg.setAttribute('width', String(outW)); bg.setAttribute('height', String(outH)); bg.setAttribute('fill', '#ffffff'); wrapSvg.appendChild(bg);
                  const gTranslate = document.createElementNS(ns, 'g');
                  const gScale = document.createElementNS(ns, 'g');
                  const offsetX = padding - (bbox?.x ?? 0);
                  const offsetY = padding - (bbox?.y ?? 0);
                  gTranslate.setAttribute('transform', `translate(${offsetX}, ${offsetY})`);
                  gScale.setAttribute('transform', `scale(${1 / scaleFactor})`);
                  if (clonedContentGroup) {
                    Array.from(clonedContentGroup.childNodes).forEach((n) => gScale.appendChild(n.cloneNode(true)));
                  } else {
                    Array.from(cloned.childNodes).forEach((n) => gScale.appendChild(n.cloneNode(true)));
                  }
                  gTranslate.appendChild(gScale);
                  wrapSvg.appendChild(gTranslate);

                  const serializer = new XMLSerializer(); const sourceSvgString = serializer.serializeToString(wrapSvg);
                  const svgDataUrl = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(sourceSvgString);
                  const img = new Image(); img.crossOrigin = 'anonymous';
                  const scale = 3; const canvas = document.createElement('canvas'); canvas.width = Math.ceil(outW * scale); canvas.height = Math.ceil(outH * scale);
                  const ctx = canvas.getContext('2d'); if (!ctx) return; ctx.imageSmoothingQuality = 'high';
                  img.onload = () => { ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, canvas.width, canvas.height); ctx.save(); ctx.scale(scale, scale); ctx.drawImage(img, 0, 0); ctx.restore(); canvas.toBlob((blob) => { if (!blob) return; const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'task-tree.png'; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url); }, 'image/png'); };
                  img.src = svgDataUrl;
                }}
              >
                <Download className="w-4 h-4 mr-2" /> Export PNG
              </Button>
            </div>
            <div ref={treeCardRef}>
              <AssignmentTree
                assignments={domainAnalysis.assignments || []}
                dataset={dataset}
                onLeafClick={(a) => openModal(a)}
                showExportButton={false}
              />
            </div>
          </Card>

          {/* Task tree intentionally not shown on Domain Analysis page */}

          {/* Export Options */}
          <Card title="Export Analysis" description="Download your domain analysis results">
            <div className="flex flex-wrap gap-3">
              <Button
                variant="outline"
                onClick={() => handleExportAnalysis('json')}
              >
                <Download className="w-4 h-4 mr-2" />
                Export as JSON
              </Button>
              <Button
                variant="outline"
                onClick={() => handleExportAnalysis('csv')}
              >
                <Download className="w-4 h-4 mr-2" />
                Export as CSV
              </Button>
            </div>
          </Card>
          {/* Raw Data Modal for leaf click */}
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

          {/* Task Tree Fullscreen Modal */}
          {isTreeFullOpen && (
            <div className="fixed inset-0 z-50">
              <div className="absolute inset-0 bg-black/70" onClick={() => setIsTreeFullOpen(false)} />
              <div className="relative w-full h-full p-2">
                {/* 프레임 컨테이너 (라운드 + 두꺼운 다크 테두리) */}
                <div className="absolute inset-3">
                  <div className="relative w-full h-full bg-white dark:bg-gray-900 border-[3px] border-gray-700/80 rounded-2xl overflow-hidden">
                    {/* Minimize 버튼: Export와 같은 y, 오른쪽에서 좌측으로 간격 분리 */}
                    <div className="absolute top-3 right-[152px] z-[60]">
                      <Button variant="outline" size="sm" onClick={() => setIsTreeFullOpen(false)} className="shadow">
                        <Minimize2 className="w-4 h-4 mr-2" /> Minimize
                      </Button>
                    </div>
                    <AssignmentTree
                      assignments={domainAnalysis.assignments || []}
                      dataset={dataset}
                      onLeafClick={(a) => openModal(a)}
                      height={"100%"}
                      frameless
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={() => navigate('/statistics')}>
          Back to Statistics
        </Button>
        {domainAnalysis && (
          <Button onClick={() => navigate('/sampling')}>
            Next: Data Sampling
          </Button>
        )}
      </div>
    </div>
  );
};