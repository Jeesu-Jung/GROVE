import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/UI/Button';
import { Card } from '@/components/UI/Card';

export const DocsGrove: React.FC = () => {
  return (
    <div className="py-8">
      <div className="grid grid-cols-12 gap-6">
        {/* Left sidebar */}
        <aside className="col-span-12 md:col-span-3">
          <nav className="sticky top-24 bg-white border border-gray-200 rounded-xl p-4">
            <div className="text-sm font-semibold text-gray-800">Guide</div>
            <ul className="mt-3 space-y-2 text-sm">
              <li><Link to="/docs/grove" className="block px-2 py-1 rounded bg-gray-50 text-gray-800">WEAVE-GROVE</Link></li>
              <li><Link to="/docs/mixture" className="block px-2 py-1 rounded hover:bg-gray-50 text-gray-700">WEAVE-TASK MIXTURE</Link></li>
              <li><Link to="/docs/zebra" className="block px-2 py-1 rounded hover:bg-gray-50 text-gray-700">WEAVE-ZEBRA</Link></li>
            </ul>
          </nav>
        </aside>

        {/* Main content */}
        <main className="col-span-12 md:col-span-7 space-y-10">
          <header>
            <h1 className="text-3xl font-bold text-gray-900">GROVE — Dataset Visualization & Selection</h1>
            <p className="mt-1 text-gray-600">OAK Tree, variability-based subset selection, export</p>
            <div className="mt-3 flex gap-2">
              <Link to="/" className="inline-flex items-center px-4 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700">
                Get started with GROVE
              </Link>
              <a
                href="/examples/instruction_alpaca_example.json"
                download
                className="inline-flex items-center px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-900 text-sm"
              >
                Download example input file
              </a>
            </div>
          </header>

          <section id="overview" className="space-y-3">
            <h2 className="text-2xl font-semibold text-gray-900">Overview</h2>
            <Card>
              <div className="space-y-2 text-gray-700">
                <p>GROVE couples an interpretable Group–Verb–Document structure (OAK Tree) with layer-wise variability (Jensen–Shannon divergence, JSD) to support selection that maintains <span className="font-medium">balanced group coverage</span> while prioritizing <span className="font-medium">model-difficult, informative examples</span>. Every selection produces a versioned artifact (indices/metadata) for reproducibility.</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>OAK Tree: Extract the action block (B) from each document (D), take the first verb (V), and group semantically similar verbs into action groups (G).</li>
                  <li>Variability Score: Quantify difficulty via JSD between the model’s first- and last-layer representation distributions.</li>
                  <li>Group-wise sampling: Within each G, select top p% (G-HV), bottom p% (G-LV), or a balanced blend (G-MIX) to avoid over/under-representation.</li>
                </ul>
              </div>
            </Card>
          </section>

          {/* Core concepts */}
          <section id="concepts" className="space-y-3">
            <h2 className="text-2xl font-semibold text-gray-900">Core Concepts — OAK & Variability</h2>
            <Card>
              <div className="space-y-2 text-gray-700">
                <p>GROVE integrates a data-centric view (OAK) with a model-centric signal (Variability).</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li><span className="font-medium">OAK Tree</span>: A three-level hierarchy G (action group) → V (verb) → D (document), automatically constructed from instructions.</li>
                  <li><span className="font-medium">Variability Score</span>: Measures how much the model’s internal representation changes (JSD between first ↔ last layer probabilities) as a proxy for difficulty.</li>
                  <li><span className="font-medium">Group-wise selection</span>: Sample within each G—top p% (HV), bottom p% (LV), or MIX—to retain task coverage while prioritizing informative data.</li>
                </ul>
              </div>
            </Card>
          </section>

          {/* Phase 1: Upload */}
          <section id="phase-upload" className="space-y-3">
            <h2 className="text-2xl font-semibold text-gray-900">1. Upload — Data upload and column mapping</h2>
            <Card>
              <div className="space-y-2 text-gray-700">
                <p>Upload CSV/JSON and specify input/output columns. A 10-row preview helps you verify the mapping.</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>CSV: header auto-detected; JSON: root array or a <code>data</code> field are supported.</li>
                  <li>After parsing, the <code>dataset</code> is stored in global state.</li>
                  <li>Proceed once column selection is complete.</li>
                </ul>
                
              </div>
            </Card>
          </section>

          {/* Phase 2: Structure-based Statistics */}
          <section id="phase-structure" className="space-y-3">
            <h2 className="text-2xl font-semibold text-gray-900">2. Structure-based Statistics — Length, duplicates, token distribution</h2>
            <Card>
              <div className="space-y-2 text-gray-700">
                <p>Inspect structural characteristics: input/output length distributions, top tokens, and summary statistics.</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Length histograms (input/output)</li>
                  <li>Top token frequency bar charts</li>
                  <li>Min/Max/Mean/Median/Std summaries</li>
                </ul>
                
              </div>
            </Card>
          </section>

          {/* Phase 3: Content-based Statistics (Domain Analysis) */}
          <section id="phase-content" className="space-y-3">
            <h2 className="text-2xl font-semibold text-gray-900">3. Content-based Statistics — LLM-powered domain/task analysis</h2>
            <Card>
              <div className="space-y-2 text-gray-700">
                <p>Use an LLM to infer domain and task per sample. Configure your model and API key to proceed.</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Progress is shown during inference; results are saved to <code>assignments</code>.</li>
                  <li>View domain distributions (pie) and top domains (bar).</li>
                  <li>Tree visualization, example modal, and export to JSON/CSV.</li>
                </ul>
                
              </div>
            </Card>
          </section>

          {/* Phase 4: Selection (Sampling) */}
          <section id="phase-selection" className="space-y-3">
            <h2 className="text-2xl font-semibold text-gray-900">4. Selection — Build the final subset with sampling strategies</h2>
            <Card>
              <div className="space-y-2 text-gray-700">
                <p>Compose subsets using data-/task-/model-centric strategies and export as CSV/JSON.</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li><span className="font-medium">Data-centric</span>: Top-3 / Custom / Balanced (domain-based).</li>
                  <li><span className="font-medium">Task-centric</span>: Top-3 / Custom / Balanced (task-based).</li>
                  <li><span className="font-medium">Model-centric (variability)</span>: LV / HV / MIX with p% slider, distribution preview.</li>
                  <li><span className="font-medium">G-HV / G-LV / G-MIX</span>: Often robust for ≥7B models; MIX balances coverage and difficulty.</li>
                </ul>
              </div>
            </Card>
          </section>

          {/* Practical guidelines */}
          <section id="guidelines" className="space-y-3">
            <h2 className="text-2xl font-semibold text-gray-900">Practical guidelines — What to choose when?</h2>
            <Card>
              <div className="space-y-2 text-gray-700">
                <ul className="list-disc pl-5 space-y-1">
                  <li><span className="font-medium">Small datasets (≤ 100K)</span>: Prefer high-variability (HV) to increase information density.</li>
                  <li><span className="font-medium">Larger datasets / ≥7B models</span>: Maintain group balance and use G-MIX (1:1 HV:LV).</li>
                  <li><span className="font-medium">Faster gains</span>: Rather than training only on Top-k biggest groups, pick HV from every group to preserve coverage.</li>
                  <li><span className="font-medium">When changing models</span>: Recompute Variability (it is model-specific) and resample for safety.</li>
                </ul>
              </div>
            </Card>
          </section>

          
        </main>

        {/* Right TOC */}
        <aside className="col-span-12 md:col-span-2">
          <div className="sticky top-24 bg-white border border-gray-200 rounded-xl p-3">
            <div className="text-xs font-semibold text-gray-600">On this page</div>
            <ul className="mt-2 space-y-1 text-xs">
              <li><a href="#overview" className="text-blue-600 hover:underline">Overview</a></li>
              <li><a href="#phase-upload" className="text-blue-600 hover:underline">Upload</a></li>
              <li><a href="#phase-structure" className="text-blue-600 hover:underline">Structure Stats</a></li>
              <li><a href="#phase-content" className="text-blue-600 hover:underline">Content Stats</a></li>
              <li><a href="#phase-selection" className="text-blue-600 hover:underline">Selection</a></li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default DocsGrove;


