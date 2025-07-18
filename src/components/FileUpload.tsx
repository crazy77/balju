import { useAtom } from 'jotai';
import { FileText, Upload } from 'lucide-react';
import type React from 'react';
import { useCallback, useState } from 'react';
import toast from 'react-hot-toast';
import { currentTabAtom, loadCSVDataAtom } from '../stores/csvStore';
import type { CSVData } from '../types';
import { parseCSV } from '../utils/csvUtils';
import { db } from '../utils/database';

export const FileUpload: React.FC<{ onFileUploaded: (csvData: CSVData) => void }> = ({
  onFileUploaded,
}) => {
  const [, setCurrentTab] = useAtom(currentTabAtom);
  const [, loadCSVData] = useAtom(loadCSVDataAtom);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = useCallback(
    async (file: File) => {
      setIsUploading(true);
      try {
        const data = await parseCSV(file);
        const csvData: CSVData = {
          id: Date.now().toString(),
          name: file.name,
          uploadDate: new Date(),
          data,
          productNameMappings: {},
          separateShippingSettings: {},
        };

        await db.csvData.add(csvData);
        onFileUploaded(csvData);
        loadCSVData(csvData);
        setCurrentTab('order');

        toast.success('CSV 파일이 성공적으로 업로드되었습니다.');
      } catch (error) {
        console.error('파일 업로드 중 오류가 발생했습니다:', error);
        toast.error('파일 업로드 중 오류가 발생했습니다.');
      } finally {
        setIsUploading(false);
      }
    },
    [loadCSVData, setCurrentTab, onFileUploaded],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        handleFileUpload(files[0]);
      }
    },
    [handleFileUpload],
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        handleFileUpload(files[0]);
      }
    },
    [handleFileUpload],
  );

  return (
    <div className="w-full">
      <button
        type="button"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`w-full border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          isDragging
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-400'
            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
        }`}
      >
        {isUploading ? (
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 dark:border-blue-400" />
            <p className="mt-3 text-sm text-gray-600 dark:text-gray-400 transition-colors">
              파일을 처리 중입니다...
            </p>
          </div>
        ) : (
          <>
            <Upload className="mx-auto h-8 w-8 text-gray-400 dark:text-gray-500 mb-3 transition-colors" />
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-2 transition-colors">
              CSV 파일을 여기에 드래그하거나 클릭하여 선택하세요
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 transition-colors">
              지원 형식: .csv
            </p>
            <label className="inline-flex items-center px-3 py-1 bg-blue-500 dark:bg-blue-600 text-white text-sm rounded hover:bg-blue-600 dark:hover:bg-blue-700 cursor-pointer transition-colors">
              <FileText className="h-3 w-3 mr-1" />
              파일 선택
              <input type="file" accept=".csv" onChange={handleFileSelect} className="hidden" />
            </label>
          </>
        )}
      </button>
    </div>
  );
};
