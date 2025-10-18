import React from 'react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/UI/Card';

export const DocsMixture: React.FC = () => {
  return (
    <div className="py-8">
      <div className="grid grid-cols-12 gap-6">
        <aside className="col-span-12 md:col-span-3">
          <nav className="sticky top-24 bg-white border border-gray-200 rounded-xl p-4">
            <div className="text-sm font-semibold text-gray-800">Guide</div>
            <ul className="mt-3 space-y-2 text-sm">
              <li><Link to="/docs/grove" className="block px-2 py-1 rounded hover:bg-gray-50 text-gray-700">WEAVE-GROVE</Link></li>
              <li><Link to="/docs/mixture" className="block px-2 py-1 rounded bg-gray-50 text-gray-800">WEAVE-TASK MIXTURE</Link></li>
              <li><Link to="/docs/zebra" className="block px-2 py-1 rounded hover:bg-gray-50 text-gray-700">WEAVE-ZEBRA</Link></li>
            </ul>
          </nav>
        </aside>

        <main className="col-span-12 md:col-span-7 space-y-10">
          <header>
            <h1 className="text-3xl font-bold text-gray-900">Task-Mixture — Optimized Design</h1>
            <p className="mt-1 text-gray-600">Explore optimal mixtures by selecting model, data size, and tasks.</p>
            <div className="mt-3">
              <Link to="/optimization" className="inline-flex items-center px-4 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700">
                Get started with Task Mixture
              </Link>
            </div>
          </header>

          <section id="overview" className="space-y-3">
            <h2 className="text-2xl font-semibold text-gray-900">Overview</h2>
            <Card>
              <p className="text-gray-700">Based on available combinations (e.g., model × data size × tasks), the UI progressively reveals valid choices and previews results in a table. Results can be exported as JSON.</p>
            </Card>
          </section>

          {/* Core concepts */}
          <section id="concepts" className="space-y-3">
            <h2 className="text-2xl font-semibold text-gray-900">Core concepts</h2>
            <Card>
              <div className="space-y-2 text-gray-700">
                <p>From unlabeled instruction corpora, we automatically extract representative tasks (e.g., Programming, Math problem solving, History QA, Grammar correction, Creative writing) and design mixtures under two views: <span className="font-medium">Target-task optimal</span> and <span className="font-medium">Balanced multi-task</span>, within a fixed budget.</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li><span className="font-medium">Data sizes</span>: 250 / 500 / 750 / 1000</li>
                  <li><span className="font-medium">Task combinations</span>: All 1–5 task mixtures (including the 5-task baseline)</li>
                  <li><span className="font-medium">Mixing ratios</span>: Uniform and skewed (e.g., 2:1:1)</li>
                  <li><span className="font-medium">Total mixtures</span>: 51 (including ratio variants)</li>
                </ul>
              </div>
            </Card>
          </section>

          {/* Pipeline */}
          <section id="pipeline" className="space-y-3">
            <h2 className="text-2xl font-semibold text-gray-900">Pipeline</h2>
            <Card>
              <div className="space-y-2 text-gray-700">
                <ul className="list-disc pl-5 space-y-1">
                  <li><span className="font-medium">1) Task discovery & allocation</span>: Retrieve candidates per task via embedding search from a few seed instructions</li>
                  <li><span className="font-medium">2) Mixture design & analysis</span>: Systematically generate 1–5 task combinations and ratios, then compare performance</li>
                  <li><span className="font-medium">3) Large-scale experimentation & interaction analysis</span>: Aggregate results across model families and quantify synergy/interference</li>
                </ul>
              </div>
            </Card>
          </section>

          {/* Phase 1: Combination Selection */}
          <section id="phase-1" className="space-y-3">
            <h2 className="text-2xl font-semibold text-gray-900">1. Combination Selection</h2>
            <Card>
              <div className="space-y-2 text-gray-700">
                <ul className="list-disc pl-5 space-y-1">
                  <li>Select dropdowns in order: <span className="font-medium">Model</span> → <span className="font-medium">Data size</span> → <span className="font-medium">Tasks</span>.</li>
                  <li>Choices are auto-filtered to valid combinations. Changing an upper selection resets lower fields.</li>
                  <li>Once complete, the <span className="font-medium">Search</span> button enables the next step.</li>
                  <li>Example space: models (mistral/llama/qwen) × data sizes (250/500/750/1000) × tasks (programming/math/history/grammar/creative writing/general).</li>
                </ul>
              </div>
            </Card>
          </section>

          {/* Phase 2: Task Mixture-based Sampling */}
          <section id="phase-2" className="space-y-3">
            <h2 className="text-2xl font-semibold text-gray-900">2. Task Mixture-based Sampling — Inspect Results</h2>
            <Card>
              <div className="space-y-2 text-gray-700">
                <ul className="list-disc pl-5 space-y-1">
                  <li>Toggle columns (inputs/input/output/instruction/constraint) for readability.</li>
                  <li>Adjust page size and paginate. If available, show total count from server meta (<span className="font-medium">totalCount</span>).</li>
                  <li>Top badges summarize recommended counts per task (e.g., Programming/Math/Grammar).</li>
                  <li>Use <span className="font-medium">Export JSON</span> to save results; collapse raw JSON when needed.</li>
                  <li>Use <span className="font-medium">Back to Selection</span> to refine the combination.</li>
                </ul>
              </div>
            </Card>
          </section>
          {/* Methodology */}
          <section id="method" className="space-y-3">
            <h2 className="text-2xl font-semibold text-gray-900">Methodology</h2>
            <Card>
              <div className="space-y-2 text-gray-700">
                <ul className="list-disc pl-5 space-y-1">
                  <li><span className="font-medium">Representative tasks</span>: Programming (P), Math (M), History QA (H), Grammar (G), Creative Writing (C)</li>
                  <li><span className="font-medium">Seed-based retrieval</span>: 3 seeds per task → embed with <code>text-embedding-3-small</code> → top 1,100 candidates → 1,000 train / 100 test</li>
                  <li><span className="font-medium">Mixture construction</span>: 31 sets of 1–5 task combos × uniform/skewed ratios → 51 mixtures total</li>
                  <li><span className="font-medium">Score aggregation</span>: Combine 3 diverse LLM judges via inverse-variance weighting into a single score</li>
                  <li><span className="font-medium">Target-task optimization</span>: Bootstrap (B=10,000) to compute <em>p_best</em> and <em>Δ</em>; report a unique winner if thresholds (e.g., 0.95, τ=0.03) hold, else report an ε-optimal set</li>
                  <li><span className="font-medium">Balanced multi-task</span>: Normalize per-task scores to define quality q(w) and stability 1−d∞; select non-dominated mixtures on the <span className="font-medium">Pareto frontier</span>; optionally scalarize with <code>Score_λ(w)=λ·q+(1−λ)(1−d∞)</code> (default λ=0.5)</li>
                </ul>
              </div>
            </Card>
          </section>

          {/* Results summary */}
          <section id="results" className="space-y-3">
            <h2 className="text-2xl font-semibold text-gray-900">Results</h2>
            <Card>
              <div className="space-y-2 text-gray-700">
                <ul className="list-disc pl-5 space-y-1">
                  <li><span className="font-medium">Reliability of task discovery</span>: Human ratings 0.7–1.0; majority-vote 0.90 indicates strong semantic alignment</li>
                  <li><span className="font-medium">Effect of data size</span>: 250–500 favors single/2-task; 750–1000 stabilizes 3–4 task mixtures</li>
                  <li><span className="font-medium">Target-task optimization</span>: P synergizes with M/G; C often interferes with P</li>
                  <li><span className="font-medium">Model-wise differences</span>: Llama (size-sensitive), Mistral (peaks at ~500), Qwen (robust across scales)</li>
                  <li><span className="font-medium">Practical takeaways</span>: Convergence ~750; decisions hinge on Δ threshold; when uncertain, report top-3 ε-optimal mixtures</li>
                </ul>
              </div>
            </Card>
          </section>

          {/* Practical guidelines */}
          <section id="guidelines" className="space-y-3">
            <h2 className="text-2xl font-semibold text-gray-900">Practical guidelines</h2>
            <Card>
              <div className="space-y-2 text-gray-700">
                <ul className="list-disc pl-5 space-y-1">
                  <li><span className="font-medium">By data size</span>: With &lt;500 examples, prefer 1–2 tasks; beyond 750, 3–4 balanced tasks</li>
                  <li><span className="font-medium">Domain interactions</span>: P–M synergize; P–C often interferes — mitigate with more data or ratio tuning</li>
                  <li><span className="font-medium">Anchor tasks</span>: H and G stabilize small-to-mid sizes (recommend 20–30%)</li>
                  <li><span className="font-medium">Model-aware design</span>: Llama favors smaller sizes, Mistral peaks near 500, Qwen is robust</li>
                  <li><span className="font-medium">Uncertainty reporting</span>: When no unique winner, present an ε-optimal candidate set</li>
                </ul>
              </div>
            </Card>
          </section>
        </main>

        <aside className="col-span-12 md:col-span-2">
          <div className="sticky top-24 bg-white border border-gray-200 rounded-xl p-3">
            <div className="text-xs font-semibold text-gray-600">On this page</div>
            <ul className="mt-2 space-y-1 text-xs">
              <li><a href="#overview" className="text-blue-600 hover:underline">Overview</a></li>
              <li><a href="#concepts" className="text-blue-600 hover:underline">Core concepts</a></li>
              <li><a href="#pipeline" className="text-blue-600 hover:underline">Pipeline</a></li>
              <li><a href="#phase-1" className="text-blue-600 hover:underline">1. Combination Selection</a></li>
              <li><a href="#phase-2" className="text-blue-600 hover:underline">2. Inspect Results</a></li>
              <li><a href="#method" className="text-blue-600 hover:underline">Methodology</a></li>
              <li><a href="#results" className="text-blue-600 hover:underline">Results</a></li>
              <li><a href="#guidelines" className="text-blue-600 hover:underline">Practical guidelines</a></li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default DocsMixture;


