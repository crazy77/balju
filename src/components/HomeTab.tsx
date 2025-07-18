import { useAtom } from 'jotai';
import { Clock, FileText, Trash2 } from 'lucide-react';
import type React from 'react';
import { useCallback, useEffect, useState } from 'react';
import { cn } from '@/utils/cn';
import {
  csvListAtom,
  currentCSVDataAtom,
  currentTabAtom,
  loadCSVDataAtom,
} from '../stores/csvStore';
import { LAYOUT_STYLES, TEXT_STYLES } from '../styles/common';
import type { CSVData } from '../types';
import { db } from '../utils/database';
import { LoadingSpinner } from './common';
import { FileUpload } from './FileUpload';

export const HomeTab: React.FC = () => {
  const [csvList, setCsvList] = useAtom(csvListAtom);
  const [currentCSVData] = useAtom(currentCSVDataAtom);
  const [, setCurrentTab] = useAtom(currentTabAtom);
  const [, loadCSVData] = useAtom(loadCSVDataAtom);
  const [isLoading, setIsLoading] = useState(true);

  const loadCSVList = useCallback(async () => {
    try {
      const data = await db.csvData.orderBy('uploadDate').reverse().toArray();
      setCsvList(data);
    } catch (error) {
      console.error('데이터 로드 중 오류가 발생했습니다:', error);
    } finally {
      setIsLoading(false);
    }
  }, [setCsvList]);

  useEffect(() => {
    loadCSVList();
  }, [loadCSVList]);

  const handleSelectCSV = (csvData: CSVData) => {
    loadCSVData(csvData);
    setCurrentTab('order');
  };

  const handleDeleteCSV = async (id: string, event: React.MouseEvent) => {
    event.stopPropagation();

    if (confirm('정말로 이 데이터를 삭제하시겠습니까?')) {
      try {
        await db.csvData.delete(id);
        setCsvList(csvList.filter((item) => item.id !== id));
      } catch (error) {
        console.error('데이터 삭제 중 오류가 발생했습니다:', error);
        alert('데이터 삭제 중 오류가 발생했습니다.');
      }
    }
  };

  const handleFileUploaded = (csvData: CSVData) => {
    setCsvList([csvData, ...csvList]);
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className={LAYOUT_STYLES.container}>
      <div className="mb-6">
        <h2 className={`${TEXT_STYLES.heading} mb-3`}>CSV 파일 업로드</h2>
        <FileUpload onFileUploaded={handleFileUploaded} />
      </div>

      {csvList.length > 0 && (
        <div>
          <h3 className={`${TEXT_STYLES.subheading} mb-3`}>저장된 데이터</h3>
          <div className="grid gap-3">
            {csvList.map((csvData) => (
              <div
                key={csvData.id}
                className={cn(
                  LAYOUT_STYLES.card,
                  'p-3 hover:shadow-md dark:hover:bg-gray-750 transition-all cursor-pointer border border-gray-200 dark:border-gray-700',
                  csvData.id === currentCSVData?.id && 'bg-blue-200 dark:bg-blue-500/50',
                )}
                onClick={() => handleSelectCSV(csvData)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <FileText className="h-4 w-4 text-blue-500 dark:text-blue-400 mr-2" />
                    <div>
                      <h4
                        className={`text-sm text-left font-medium ${TEXT_STYLES.heading.replace('text-lg', 'text-sm')}`}
                      >
                        {csvData.name}
                      </h4>
                      <div className={`flex items-center text-xs ${TEXT_STYLES.description} mt-1`}>
                        <Clock className="h-3 w-3 mr-1" />
                        {csvData.uploadDate.toLocaleDateString()}{' '}
                        {csvData.uploadDate.toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`text-xs ${TEXT_STYLES.description}`}>
                      {csvData.data.length}개 항목
                    </span>
                    <button
                      onClick={(e) => handleDeleteCSV(csvData.id, e)}
                      className="p-1 text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                      title="삭제"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
