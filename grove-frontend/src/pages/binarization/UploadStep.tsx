import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload as UploadIcon } from 'lucide-react';
import { Card } from '../../components/UI/Card';
import { Button } from '../../components/UI/Button';
import { useAppStore } from '../../store/useAppStore';
import { useBinarizationStore } from '../../store/useBinarizationStore';

export const UploadStep: React.FC = () => {
  const { setError } = useAppStore();
  const { items, fileName, setItems, nextStep } = useBinarizationStore();

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const json = JSON.parse(text);
      if (!Array.isArray(json)) throw new Error('JSON root must be an array');
      const mapped = json.map((it: any, idx: number) => {
        if (typeof it?.inputs !== 'string' || !it.inputs.trim()) {
          throw new Error(`Item ${idx + 1} is missing an inputs string`);
        }
        return { inputs: String(it.inputs) };
      });
      setItems(mapped, file.name);
      setError(null);
    } catch (e: any) {
      setItems(null);
      setError(e?.message || 'Failed to parse JSON');
    }
  }, [setError, setItems]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/json': ['.json'] },
    multiple: false,
  });

  return (
    <Card title="1) Upload Dataset" description="JSON array, each item requires an inputs string">
      {!items ? (
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
                  Supports JSON format (up to 100MB)
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700 dark:text-gray-300">{fileName} · {items.length} items</div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setItems(null)}>Upload again</Button>
            <Button onClick={() => nextStep()}>Next</Button>
          </div>
        </div>
      )}
    </Card>
  );
};

export default UploadStep;


