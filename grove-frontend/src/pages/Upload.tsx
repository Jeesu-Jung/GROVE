import React, { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { Upload as UploadIcon, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { Card } from '../components/UI/Card';
import { Button } from '../components/UI/Button';
import { useAppStore } from '../store/useAppStore';
import { parseCSV, parseJSON } from '../utils/dataProcessing';
import { Dataset } from '../types';

export const Upload: React.FC = () => {
  const navigate = useNavigate();
  const { dataset, setDataset, setError } = useAppStore();
  const [isUploading, setIsUploading] = useState(false);
  const [selectedInputColumn, setSelectedInputColumn] = useState('');
  const [selectedOutputColumn, setSelectedOutputColumn] = useState('');

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setIsUploading(true);
    setError(null);

    try {
      let parsedDataset: Dataset;
      
      if (file.name.endsWith('.csv')) {
        parsedDataset = await parseCSV(file);
      } else if (file.name.endsWith('.json')) {
        parsedDataset = await parseJSON(file);
      } else {
        throw new Error('Unsupported file format. Please upload CSV or JSON files.');
      }

      setDataset(parsedDataset);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to parse file');
    } finally {
      setIsUploading(false);
    }
  }, [setDataset, setError]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/json': ['.json'],
    },
    multiple: false,
  });

  const handleNext = () => {
    if (!dataset || !selectedInputColumn || !selectedOutputColumn) {
      setError('Please select both input and output columns');
      return;
    }

    const updatedDataset = {
      ...dataset,
      inputColumn: selectedInputColumn,
      outputColumn: selectedOutputColumn,
    };

    setDataset(updatedDataset);
    navigate('/statistics');
  };

  const previewData = dataset?.data.slice(0, 10) || [];

  React.useEffect(() => {
    if (!dataset) return;

    // Input 기본값: 저장된 값 > 'inputs' 컬럼 존재 시 > 첫 번째 컬럼
    if (!selectedInputColumn) {
      if (dataset.inputColumn) {
        setSelectedInputColumn(dataset.inputColumn);
      } else {
        const inputsColumn = dataset.columns.find((c) => c.toLowerCase() === 'inputs');
        if (inputsColumn) {
          setSelectedInputColumn(inputsColumn);
        } else if (dataset.columns.length > 0) {
          setSelectedInputColumn(dataset.columns[0]);
        }
      }
    }

    // Output 기본값: 저장된 값 > 두 번째 컬럼(없으면 첫 번째)
    if (!selectedOutputColumn) {
      if (dataset.outputColumn) {
        setSelectedOutputColumn(dataset.outputColumn);
      } else if (dataset.columns.length > 1) {
        setSelectedOutputColumn(dataset.columns[1] || dataset.columns[0]);
      }
    }
  }, [dataset]);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Upload Your Dataset
        </h2>
        <p className="text-lg text-gray-600 dark:text-gray-300">
          Import CSV or JSON files containing instruction-response pairs
        </p>
      </div>

      {!dataset ? (
        <Card className="max-w-2xl mx-auto">
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-all duration-200 ${
              isDragActive
                ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800'
            }`}
          >
            <input {...getInputProps()} />
            <div className="space-y-4">
              <div className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <UploadIcon className="w-8 h-8 text-white" />
              </div>
              {isDragActive ? (
                <p className="text-lg font-medium text-blue-600 dark:text-blue-400">
                  Drop your file here...
                </p>
              ) : (
                <div>
                  <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    Drop your dataset file here, or click to browse
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Supports CSV and JSON formats (up to 100MB)
                  </p>
                </div>
              )}
              {isUploading && (
                <div className="inline-flex items-center space-x-2 text-blue-600 dark:text-blue-400">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <span>Processing file...</span>
                </div>
              )}
            </div>
          </div>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* File Info */}
          <Card>
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {dataset.fileName}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {dataset.data.length} rows, {dataset.columns.length} columns
                  {dataset.fileSize && ` (${(dataset.fileSize / 1024).toFixed(1)} KB)`}
                </p>
              </div>
            </div>
          </Card>

          {/* Column Configuration */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card title="Input Column" description="Select the column containing instructions">
              <select
                value={selectedInputColumn}
                onChange={(e) => setSelectedInputColumn(e.target.value)}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Choose input column...</option>
                {dataset.columns.map((column) => (
                  <option key={column} value={column}>
                    {column}
                  </option>
                ))}
              </select>
              {selectedInputColumn && (
                <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Sample:
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                    {String(dataset.data[0]?.[selectedInputColumn] || 'No data')}
                  </p>
                </div>
              )}
            </Card>

            <Card title="Output Column" description="Select the column containing responses">
              <select
                value={selectedOutputColumn}
                onChange={(e) => setSelectedOutputColumn(e.target.value)}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Choose output column...</option>
                {dataset.columns.map((column) => (
                  <option key={column} value={column}>
                    {column}
                  </option>
                ))}
              </select>
              {selectedOutputColumn && (
                <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Sample:
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                    {String(dataset.data[0]?.[selectedOutputColumn] || 'No data')}
                  </p>
                </div>
              )}
            </Card>
          </div>

          {/* Data Preview */}
          <Card title="Data Preview" description="First 10 rows of your dataset">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    {dataset.columns.map((column) => (
                      <th
                        key={column}
                        className={`text-left p-3 font-medium ${
                          column === selectedInputColumn
                            ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                            : column === selectedOutputColumn
                            ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300'
                            : 'text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        {column}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {previewData.map((row, index) => (
                    <tr key={index} className="border-b border-gray-100 dark:border-gray-800">
                      {dataset.columns.map((column) => (
                        <td
                          key={column}
                          className={`p-3 max-w-xs truncate ${
                            column === selectedInputColumn
                              ? 'bg-blue-50/50 dark:bg-blue-900/10'
                              : column === selectedOutputColumn
                              ? 'bg-purple-50/50 dark:bg-purple-900/10'
                              : ''
                          }`}
                        >
                          {String(row[column] || '')}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Navigation */}
          <div className="flex justify-between items-center">
            <Button variant="outline" onClick={() => setDataset(null)}>
              Upload Different File
            </Button>
            <Button
              onClick={handleNext}
              disabled={!selectedInputColumn || !selectedOutputColumn}
            >
              Next: Analyze Statistics
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};