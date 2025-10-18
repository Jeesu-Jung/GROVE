import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/UI/Button';
import { Card } from '@/components/UI/Card';

export const DocsZebra: React.FC = () => {
  return (
    <div className="py-8">
      <div className="grid grid-cols-12 gap-6">
        <aside className="col-span-12 md:col-span-3">
          <nav className="sticky top-24 bg-white border border-gray-200 rounded-xl p-4">
            <div className="text-sm font-semibold text-gray-800">Guide</div>
            <ul className="mt-3 space-y-2 text-sm">
              <li><Link to="/docs/grove" className="block px-2 py-1 rounded hover:bg-gray-50 text-gray-700">WEAVE-GROVE</Link></li>
              <li><Link to="/docs/mixture" className="block px-2 py-1 rounded hover:bg-gray-50 text-gray-700">WEAVE-TASK MIXTURE</Link></li>
              <li><Link to="/docs/zebra" className="block px-2 py-1 rounded bg-gray-50 text-gray-800">WEAVE-ZEBRA</Link></li>
            </ul>
          </nav>
        </aside>

        <main className="col-span-12 md:col-span-7 space-y-10">
          <header>
            <h1 className="text-3xl font-bold text-gray-900">ZEBRA — Automatic Data Binarization</h1>
            <p className="mt-1 text-gray-600">Build preference pairs from behavior profiles (SUP/SIM) at zero annotation cost</p>
            <div className="mt-3 flex gap-2">
              <Link to="/binarization" className="inline-flex items-center px-4 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700">
                Get started with ZEBRA
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
              <p className="text-gray-700">ZEBRA constructs preference pairs by leveraging model behavior derived from public benchmarks, eliminating per-instance labels. It supports popular families (e.g., GPT, Gemini, LLaMA) and accounts for behavioral similarity among models of comparable scale and architecture.</p>
            </Card>
          </section>

          {/* Core concepts */}
          <section id="concepts" className="space-y-3">
            <h2 className="text-2xl font-semibold text-gray-900">Core Concept — Model Behavior Knowledge (MBK)</h2>
            <Card>
              <div className="space-y-2 text-gray-700">
                <p>Instead of instance-level labels, ZEBRA uses <span className="font-medium">Model Behavior Knowledge (MBK)</span>. We vectorize each model’s benchmark performance into a behavior profile and decide preferences based on these profiles.</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li><span className="font-medium">MB-SUP (Superiority)</span>: the aggregate capability across benchmarks. Responses from the higher MB-SUP model serve as the preferred anchor.</li>
                  <li><span className="font-medium">MB-SIM (Similarity)</span>: similarity (e.g., cosine) between behavior vectors. Higher similarity yields harder, more informative pairs.</li>
                  <li><span className="font-medium">Key benefits</span>: (1) near $0 label cost, (2) interpretability via behavior profiles, (3) scalability without re-labeling when adding models/benchmarks.</li>
                </ul>
              </div>
            </Card>
          </section>

          {/* Strategies */}
          <section id="strategies" className="space-y-3">
            <h2 className="text-2xl font-semibold text-gray-900">Strategies — SUP / SIM / SUP+SIM</h2>
            <Card>
              <div className="space-y-2 text-gray-700">
                <ul className="list-disc pl-5 space-y-1">
                  <li><span className="font-medium">SUP (Superiority-first)</span>: assign the higher MB-SUP model’s response as <code>chosen</code> and the lower as <code>rejected</code>. Best for clear quality gaps.</li>
                  <li><span className="font-medium">SIM (Similarity-first)</span>: first pick behaviorally similar model pairs, then choose the higher MB-SUP response as <code>chosen</code>. Produces hard, nuanced pairs.</li>
                  <li><span className="font-medium">SUP+SIM (Hybrid)</span>: consider both criteria to balance quality contrast and similarity.</li>
                </ul>
              </div>
            </Card>
          </section>

          {/* Phase 1: Upload */}
          <section id="phase-1" className="space-y-3">
            <h2 className="text-2xl font-semibold text-gray-900">1. Upload — Provide input data</h2>
            <Card>
              <div className="space-y-2 text-gray-700">
                <p>Upload a JSON array. Each item must include an <code>inputs</code> field.</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Example: <code>[{'{'} "inputs": "..." {'}'}]</code></li>
                  <li>On validation failure, the UI shows the failing index and resets the upload.</li>
                  <li>On success, the item count and filename are displayed; proceed to Next.</li>
                </ul>
              </div>
            </Card>
          </section>

          {/* Phase 2: Model Pair Selection */}
          <section id="phase-2" className="space-y-3">
            <h2 className="text-2xl font-semibold text-gray-900">2. Model Pair Selection — Ability-based recommendations and custom</h2>
            <Card>
              <div className="space-y-2 text-gray-700">
                <p>Select target capabilities (Instruction Following / Knowledge / Reasoning), then use the recommended pairs (SUP/SIM/SUP+SIM) or configure a custom pair.</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Best Models: proposes Superiority/Similarity/Hybrid candidates based on your chosen abilities.</li>
                  <li>Custom + Similarity: pick a first model to auto-suggest similar second models.</li>
                  <li>Your selection appears as first/second at the bottom; proceed to Next.</li>
                </ul>
              </div>
            </Card>
          </section>

          {/* Phase 3: Run */}
          <section id="phase-3" className="space-y-3">
            <h2 className="text-2xl font-semibold text-gray-900">3. Run — Enter API key and execute</h2>
            <Card>
              <div className="space-y-2 text-gray-700">
                <p>Calls an OpenRouter-compatible Chat Completions endpoint for each model. The progress bar updates in real time.</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>API keys are stored in local storage only.</li>
                  <li>Model names (e.g., GPT-4, LLaMA family) are mapped internally to API model IDs.</li>
                  <li>For each <code>inputs</code>, generates candidate outputs for <code>chosen</code> (first) and <code>rejected</code> (second).</li>
                </ul>
              </div>
            </Card>
          </section>

          {/* Phase 4: Review */}
          <section id="phase-4" className="space-y-3">
            <h2 className="text-2xl font-semibold text-gray-900">4. Review — Inspect and export</h2>
            <Card>
              <div className="space-y-2 text-gray-700">
                <p>Browse inputs / chosen / rejected with pagination and export as JSON.</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Export format: <code>{`{ inputs, chosen, rejected, chosen_model, rejected_model }`}</code></li>
                  <li>Ready for alignment pipelines such as Direct Preference Optimization (DPO).</li>
                </ul>
              </div>
            </Card>
          </section>

          {/* Modes (summary) */}
          <section id="modes" className="space-y-3">
            <h2 className="text-2xl font-semibold text-gray-900">Supported modes</h2>
            <Card>
              <ul className="list-disc pl-5 space-y-1 text-gray-700">
                <li>SUP (Superiority), SIM (Similarity), SUP+SIM</li>
                <li>User-defined custom pairing</li>
              </ul>
            </Card>
          </section>

          {/* Advanced pipeline */}
          <section id="pipeline" className="space-y-3">
            <h2 className="text-2xl font-semibold text-gray-900">Pipeline — Zero-annotation binarization</h2>
            <Card>
              <div className="space-y-2 text-gray-700">
                <ul className="list-disc pl-5 space-y-1">
                  <li><span className="font-medium">1) Model behavior evaluation</span>: build per-model ability vectors from public benchmarks (derive MB-SUP/MB-SIM).</li>
                  <li><span className="font-medium">2) Pair selection</span>: choose model pairs by SUP/SIM/Hybrid. Default SIM threshold is 0.1 (cosine) to filter out dissimilar models.</li>
                  <li><span className="font-medium">3) Response mapping</span>: for each uploaded <code>inputs</code>, retrieve both models’ responses.</li>
                  <li><span className="font-medium">4) Preference assignment</span>: assign <code>chosen</code> / <code>rejected</code> by the selected strategy and create preference pairs.</li>
                </ul>
                <p className="text-gray-700">All steps can be saved and re-run locally. The exported JSON can be used directly in DPO/SFT alignment pipelines.</p>
              </div>
            </Card>
          </section>

          {/* Output schema */}
          <section id="schema" className="space-y-3">
            <h2 className="text-2xl font-semibold text-gray-900">Output schema</h2>
            <Card>
              <div className="space-y-2 text-gray-700">
                <p>The exported JSON includes the following fields:</p>
                <pre className="bg-gray-50 text-gray-800 text-xs p-3 rounded overflow-x-auto">{`[
  {
    "inputs": string,
    "chosen": string,
    "rejected": string,
    "chosen_model": string,
    "rejected_model": string,
    "strategy": "SUP" | "SIM" | "SUP+SIM"
  }
]`}</pre>
                <ul className="list-disc pl-5 space-y-1">
                  <li><span className="font-medium">inputs</span>: instruction or prompt text</li>
                  <li><span className="font-medium">chosen/rejected</span>: preferred/non-preferred among two model responses</li>
                  <li><span className="font-medium">chosen_model/rejected_model</span>: identifiers of the models used</li>
                  <li><span className="font-medium">strategy</span>: strategy used to generate the pair</li>
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
                  <li><span className="font-medium">Strategy choice</span>: small models tend to work best with SUP; larger models often benefit from SIM for nuanced comparisons.</li>
                  <li><span className="font-medium">Ability anchors</span>: use strong language models for knowledge/fluency targets; use strong reasoning models when precision and reasoning are priorities.</li>
                  <li><span className="font-medium">Similarity threshold</span>: for SIM, exclude pairs with cosine similarity below 0.1.</li>
                  <li><span className="font-medium">Quality boosting</span>: mixing hard SIM pairs with clear-gap SUP pairs yields robust alignment signals.</li>
                  <li><span className="font-medium">Privacy</span>: API keys remain in local storage only; exports never include keys.</li>
                </ul>
              </div>
            </Card>
          </section>

          {/* Cost & efficiency */}
          <section id="cost" className="space-y-3">
            <h2 className="text-2xl font-semibold text-gray-900">Cost & efficiency</h2>
            <Card>
              <div className="space-y-2 text-gray-700">
                <ul className="list-disc pl-5 space-y-1">
                  <li><span className="font-medium">Labeling cost</span>: human labels ≈ $0.67/pair, GPT-4 labels ≈ $0.063/pair, ZEBRA ≈ <span className="font-medium">$0</span> (no pairwise labels).</li>
                  <li><span className="font-medium">Scalability</span>: when adding models/benchmarks, no re-annotation is needed—update behavior profiles and reuse.</li>
                  <li><span className="font-medium">Quality</span>: across benchmarks, ZEBRA matches instance-labeled baselines within ≤ 0.02 on average, sometimes exceeding them.</li>
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
              <li><a href="#concepts" className="text-blue-600 hover:underline">Core concept</a></li>
              <li><a href="#strategies" className="text-blue-600 hover:underline">Strategies</a></li>
              <li><a href="#phase-1" className="text-blue-600 hover:underline">1. Upload</a></li>
              <li><a href="#phase-2" className="text-blue-600 hover:underline">2. Model pair</a></li>
              <li><a href="#phase-3" className="text-blue-600 hover:underline">3. Run</a></li>
              <li><a href="#phase-4" className="text-blue-600 hover:underline">4. Review</a></li>
              <li><a href="#modes" className="text-blue-600 hover:underline">Supported modes</a></li>
              <li><a href="#pipeline" className="text-blue-600 hover:underline">Pipeline</a></li>
              <li><a href="#schema" className="text-blue-600 hover:underline">Output schema</a></li>
              <li><a href="#guidelines" className="text-blue-600 hover:underline">Practical guidelines</a></li>
              <li><a href="#cost" className="text-blue-600 hover:underline">Cost & efficiency</a></li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default DocsZebra;


