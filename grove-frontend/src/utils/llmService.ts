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
    const response = await this.callLLMAPI(prompt);
    const parsed = this.parseSingleLLMResponse(response, instruction);
    return { domains: [parsed.domain], viaLLM: true, taskName: parsed.taskName };
  }

  // removed old batch prompt in favor of single-instruction prompt

  private buildPromptForSingle(instruction: string): string {
    return `You are a helpful assistant that labels text data.\n\n` +
      `Given the following text: "${instruction}", classify it into a Topic and a Task.\n\n` +
      `Available Topics: Computer Science, Information & General Works, Philosophy & Psychology, Religion, Social Sciences, Language, Science, Technology, Arts & Recreation, Literature, History & Geography, and Other.\n\n` +
      `Available Tasks: Linguistic Analysis, Information Retrieval, Information Extraction, Text Classification, Question Answering, Transformative Generation, Translation, Summarization, Creative Generation, Dialogue, and Other.\n\n` +
      `Respond ONLY with a raw JSON object. Do not use markdown, code blocks, or backticks. Output the JSON directly with double quotes and no trailing commas:\n` +
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
    const response = await fetch('/v1/messages', {
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
    const response = await fetch('/v1/responses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        input: prompt,
        max_output_tokens: 4000,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const messageOutput = data.output.find((o: any) => o.type === 'message');
    return messageOutput.content[0].text;
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