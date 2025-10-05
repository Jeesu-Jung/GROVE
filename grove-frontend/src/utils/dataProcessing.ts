import Papa from 'papaparse';
import { Dataset, DatasetRow, TextStatistics, StatsSummary } from '../types';

export const parseCSV = (file: File): Promise<Dataset> => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        if (result.errors.length > 0) {
          reject(new Error(`CSV parsing error: ${result.errors[0].message}`));
          return;
        }

        const data = result.data as DatasetRow[];
        const columns = result.meta.fields || [];

        resolve({
          data,
          columns,
          fileName: file.name,
          fileSize: file.size,
        });
      },
      error: (error) => {
        reject(new Error(`Failed to parse CSV: ${error.message}`));
      },
    });
  });
};

export const parseJSON = (file: File): Promise<Dataset> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const jsonData = JSON.parse(text);
        
        let data: DatasetRow[];
        if (Array.isArray(jsonData)) {
          data = jsonData;
        } else if (jsonData.data && Array.isArray(jsonData.data)) {
          data = jsonData.data;
        } else {
          throw new Error('JSON must contain an array or have a "data" property with an array');
        }

        const columns = data.length > 0 ? Object.keys(data[0]) : [];

        resolve({
          data,
          columns,
          fileName: file.name,
          fileSize: file.size,
        });
      } catch (error) {
        reject(new Error(`Failed to parse JSON: ${error instanceof Error ? error.message : 'Unknown error'}`));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
};

export const calculateTextStatistics = (dataset: Dataset): TextStatistics => {
  if (!dataset.inputColumn || !dataset.outputColumn) {
    throw new Error('Input and output columns must be specified');
  }

  const inputTexts = dataset.data.map(row => String(row[dataset.inputColumn!] || ''));
  const outputTexts = dataset.data.map(row => String(row[dataset.outputColumn!] || ''));

  const inputLengths = inputTexts.map(text => text.length);
  const outputLengths = outputTexts.map(text => text.length);

  const uniqueInputs = new Set(inputTexts).size;
  const uniqueOutputs = new Set(outputTexts).size;

  // Calculate word frequencies (basic stopword removal)
  const stopwords = new Set<string>([
    'the','and','to','of','a','in','that','is','for','on','with','as','are','it','this','be','by','or','an','from','at','was','if','but','not','you','your','we','i'
  ]);
  const allWords: string[] = [];
  [...inputTexts, ...outputTexts].forEach(text => {
    const words = text
      .toLowerCase()
      .replace(/`{3}[\s\S]*?`{3}/g, ' ') // strip code blocks
      .match(/\b[a-z][a-z0-9'-]*\b/g) || [];
    words.forEach(w => { if (!stopwords.has(w)) allWords.push(w); });
  });

  const wordCounts = allWords.reduce((acc, word) => {
    acc[word] = (acc[word] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topWords = Object.entries(wordCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 20)
    .map(([word, count]) => ({ word, count }));

  return {
    totalSamples: dataset.data.length,
    avgInputLength: average(inputLengths),
    avgOutputLength: average(outputLengths),
    uniqueInputs,
    uniqueOutputs,
    inputLengthDistribution: createDistribution(inputLengths),
    outputLengthDistribution: createDistribution(outputLengths),
    topWords,
    lengthStats: {
      input: calculateStatsSummary(inputLengths),
      output: calculateStatsSummary(outputLengths),
    },
  };
};

const average = (numbers: number[]): number => {
  if (numbers.length === 0) return 0;
  return numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
};

const calculateStatsSummary = (numbers: number[]): StatsSummary => {
  if (numbers.length === 0) {
    return { min: 0, max: 0, mean: 0, median: 0, stdDev: 0 };
  }
  const sorted = [...numbers].sort((a, b) => a - b);
  const mean = average(numbers);
  const mid = Math.floor(sorted.length / 2);
  const median = sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
  const variance = numbers.reduce((sum, num) => sum + Math.pow(num - mean, 2), 0) / numbers.length;
  const stdDev = Math.sqrt(variance);

  return {
    min: Math.min(...numbers),
    max: Math.max(...numbers),
    mean,
    median,
    stdDev,
  };
};

const createDistribution = (numbers: number[], bins: number = 20): number[] => {
  if (numbers.length === 0) return new Array(bins).fill(0);

  const min = Math.min(...numbers);
  const max = Math.max(...numbers);
  const distribution = new Array(bins).fill(0);

  if (max === min) {
    distribution[0] = numbers.length;
    return distribution;
  }

  const binSize = (max - min) / bins;
  numbers.forEach(num => {
    const relative = (num - min) / binSize;
    const binIndex = Math.max(0, Math.min(Math.floor(relative), bins - 1));
    distribution[binIndex]++;
  });

  return distribution;
};

export const exportToCSV = (data: DatasetRow[], filename: string = 'dataset.csv'): void => {
  const csv = Papa.unparse(data);
  downloadData(csv, filename, 'text/csv');
};

export const exportToJSON = (data: any, filename: string = 'data.json'): void => {
  const json = JSON.stringify(data, null, 2);
  downloadData(json, filename, 'application/json');
};

const downloadData = (data: string, filename: string, mimeType: string): void => {
  const blob = new Blob([data], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};