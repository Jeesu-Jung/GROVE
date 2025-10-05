import { LLMModel, Domain, DomainAnalysis, Dataset, InstructionAssignment } from '../types';

// legacy interface removed

interface SingleLLMResponse {
  topic: string; // mapped to domain
  task: string;
  verb_object_pairs?: Array<{ verb: string; object: string }>;
}

export class LLMService {
  private apiKey: string;
  private model: LLMModel;

  constructor(apiKey: string, model: LLMModel) {
    this.apiKey = apiKey;
    this.model = model;
  }

  async extractDomains(
    dataset: Dataset,
    onProgress?: (completed: number, total: number) => void
  ): Promise<DomainAnalysis> {
    if (!dataset.inputColumn) {
      throw new Error('Input column must be specified');
    }

    const startTime = Date.now();
    const instructions = dataset.data.map(row => String(row[dataset.inputColumn!]));

    const total = instructions.length;
    let completedViaLLM = 0;
    const allDomains: Domain[] = [];
    const assignments: InstructionAssignment[] = [];

    for (let i = 0; i < instructions.length; i++) {
      const instruction = instructions[i];
      const singleResult = await this.processSingle(instruction);
      console.log(singleResult);
      this.mergeDomains(allDomains, singleResult.domains);
      const top = singleResult.domains[0];
      if (top) {
        assignments.push({
          id: assignments.length + 1,
          datasetIndex: i,
          instruction,
          domainName: top.name,
          verbObjectPairs: top.verbObjectPairs,
          viaLLM: singleResult.viaLLM,
          taskName: singleResult.taskName,
        });
      }
      if (singleResult.viaLLM) {
        completedViaLLM += 1;
        if (onProgress) onProgress(completedViaLLM, total);
      }
    }

    // Calculate percentages
    const totalCount = allDomains.reduce((sum, domain) => sum + domain.count, 0);
    allDomains.forEach(domain => {
      domain.percentage = (domain.count / totalCount) * 100;
    });

    // Sort by count descending
    allDomains.sort((a, b) => b.count - a.count);

    const processingTime = Date.now() - startTime;

    return {
      domains: allDomains,
      totalProcessed: instructions.length,
      processingTime,
      modelUsed: this.model,
      assignments,
    };
  }

  private async processSingle(instruction: string): Promise<{ domains: Domain[]; viaLLM: boolean; taskName?: string }> {
    const prompt = this.buildPromptForSingle(instruction);
    console.log(prompt);
    try {
      const response = await this.callLLMAPI(prompt);
      const parsed = this.parseSingleLLMResponse(response, instruction);
      return { domains: [parsed.domain], viaLLM: true, taskName: parsed.taskName };
    } catch {
      const fallback = this.fallbackCategorizationSingle(instruction);
      return { domains: [fallback.domain], viaLLM: false, taskName: fallback.taskName };
    }
  }

  // removed old batch prompt in favor of single-instruction prompt

  private buildPromptForSingle(instruction: string): string {
    return `You are a helpful assistant that labels text data.\n\n` +
      `Given the following text: "${instruction}", classify it into a Topic and a Task.\n\n` +
      `Available Topics: Computer Science, Information & General Works, Philosophy & Psychology, Religion, Social Sciences, Language, Science, Technology, Arts & Recreation, Literature, History & Geography.\n\n` +
      `Available Tasks: Linguistic Analysis, Text Classification, Information Extraction, Creative Generation, Transformative Generation, Information Retrieval, Question Answering, Translation.\n\n` +
      `Respond ONLY with strict valid JSON (no prose) using this schema with double quotes and no trailing commas:\n` +
      `{\n` +
      `  "topic": "<One of the Topics>",\n` +
      `  "task": "<One of the Tasks>",\n` +
      `  "verb_object_pairs": [{ "verb": "action", "object": "target" }]\n` +
      `}`;
  }

  private async callLLMAPI(prompt: string): Promise<string> {
    if (this.model.startsWith('claude')) {
      return this.callClaudeAPI(prompt);
    } else {
      return this.callOpenAIAPI(prompt);
    }
  }

  private async callClaudeAPI(prompt: string): Promise<string> {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: 4000,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`Claude API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.content[0].text;
  }

  private async callOpenAIAPI(prompt: string): Promise<string> {
    const isGpt5 = this.model.startsWith('gpt-5');
    const payload: any = {
      model: this.model,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 1,
    };
    if (isGpt5) {
      payload.max_completion_tokens = 4000;
    } else {
      payload.max_tokens = 4000;
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }

  // legacy batch parser removed in favor of single-response parser

  private parseSingleLLMResponse(response: string, instruction: string): { domain: Domain; taskName: string } {
    const parsed: SingleLLMResponse = JSON.parse(response);
    const topic = parsed.topic?.trim() || 'Other';
    const verbPairs = Array.isArray(parsed.verb_object_pairs) ? parsed.verb_object_pairs : [];
    return {
      domain: {
        name: topic,
        count: 1,
        percentage: 0,
        examples: [instruction],
        verbObjectPairs: verbPairs,
      },
      taskName: parsed.task?.trim() || 'Unknown',
    };
  }

  private fallbackCategorization(instructions: string[]): Domain[] {
    const domains: Record<string, Domain> = {};
    
    // Simple keyword-based categorization
    const patterns = {
      'Text Generation': ['write', 'generate', 'create', 'compose', 'draft'],
      'Code Programming': ['code', 'program', 'function', 'algorithm', 'debug'],
      'Data Analysis': ['analyze', 'calculate', 'compute', 'data', 'statistics'],
      'Question Answering': ['what', 'how', 'why', 'when', 'where', 'explain'],
      'Translation': ['translate', 'convert', 'language'],
      'Summarization': ['summarize', 'summary', 'brief', 'overview'],
      'Creative Writing': ['story', 'poem', 'creative', 'fiction', 'narrative'],
      'Math Problem Solving': ['solve', 'equation', 'math', 'calculate', 'formula'],
    };

    instructions.forEach(instruction => {
      const lowerInst = instruction.toLowerCase();
      let categorized = false;

      for (const [domainName, keywords] of Object.entries(patterns)) {
        if (keywords.some(keyword => lowerInst.includes(keyword))) {
          if (!domains[domainName]) {
            domains[domainName] = {
              name: domainName,
              count: 0,
              percentage: 0,
              examples: [],
              verbObjectPairs: [],
            };
          }
          domains[domainName].count++;
          if (domains[domainName].examples.length < 3) {
            domains[domainName].examples.push(instruction);
          }
          categorized = true;
          break;
        }
      }

      if (!categorized) {
        if (!domains['Other']) {
          domains['Other'] = {
            name: 'Other',
            count: 0,
            percentage: 0,
            examples: [],
            verbObjectPairs: [],
          };
        }
        domains['Other'].count++;
        if (domains['Other'].examples.length < 3) {
          domains['Other'].examples.push(instruction);
        }
      }
    });

    return Object.values(domains);
  }

  private fallbackCategorizationSingle(instruction: string): { domain: Domain; taskName: string } {
    const domains = this.fallbackCategorization([instruction]);
    const domain = domains[0] || {
      name: 'Other',
      count: 1,
      percentage: 0,
      examples: [instruction],
      verbObjectPairs: [],
    };

    const lower = instruction.toLowerCase();
    let task: string = 'Information Extraction';
    if (/(summarize|summary|paraphrase|rewrite|translate)/.test(lower)) task = 'Transformative Generation';
    if (/(write|generate|compose|story|poem)/.test(lower)) task = 'Creative Generation';
    if (/(classify|label|category|categorize)/.test(lower)) task = 'Text Classification';
    if (/(who|what|when|where|why|how|\?|answer)/.test(lower)) task = 'Question Answering';
    if (/(retrieve|search|find)/.test(lower)) task = 'Information Retrieval';
    if (/(analyz|extract|entity|noun|verb|pos|dependency)/.test(lower)) task = 'Linguistic Analysis';
    if (/(translate)/.test(lower)) task = 'Translation';

    return { domain, taskName: task };
  }

  private mergeDomains(existing: Domain[], newDomains: Domain[]): void {
    newDomains.forEach(newDomain => {
      const existingDomain = existing.find(d => d.name === newDomain.name);
      if (existingDomain) {
        existingDomain.count += newDomain.count;
        existingDomain.examples = [...existingDomain.examples, ...newDomain.examples].slice(0, 3);
        existingDomain.verbObjectPairs = [...existingDomain.verbObjectPairs, ...newDomain.verbObjectPairs];
      } else {
        existing.push(newDomain);
      }
    });
  }
}