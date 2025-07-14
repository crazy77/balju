import { useAtom } from 'jotai';
import { Clock, FileText, Trash2 } from 'lucide-react';
import type React from 'react';
import { useEffect, useState } from 'react';
import { csvListAtom, currentCSVDataAtom, currentTabAtom } from '../stores/csvStore';
import type { CSVData } from '../types';
import { db } from '../utils/database';
import { FileUpload } from './FileUpload';

export const HomeTab: React.FC = () => {
  const [csvList, setCsvList] = useAtom(csvListAtom);
  const [, setCurrentCSVData] = useAtom(currentCSVDataAtom);
  const [, setCurrentTab] = useAtom(currentTabAtom);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadCSVList();
  }, []);

  const loadCSVList = async () => {
    try {
      const data = await db.csvData.orderBy('uploadDate').reverse().toArray();
      setCsvList(data);
    } catch (error) {
      console.error('데이터 로드 중 오류가 발생했습니다:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectCSV = (csvData: CSVData) => {
    setCurrentCSVData(csvData);
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
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

  return (
    <div className="p-4 bg-gray-100 dark:bg-gray-900 min-h-screen transition-colors">
      <div className="mb-6">
        <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-3 transition-colors">CSV 파일 업로드</h2>
        <FileUpload onFileUploaded={handleFileUploaded} />
      </div>

      {csvList.length > 0 && (
        <div>
          <h3 className="text-base font-semibold text-gray-800 dark:text-white mb-3 transition-colors">
            저장된 데이터
          </h3>
          <div className="grid gap-3">
            {csvList.map((csvData) => (
              <div
                key={csvData.id}
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 hover:shadow-md dark:hover:bg-gray-750 transition-all cursor-pointer"
                onClick={() => handleSelectCSV(csvData)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <FileText className="h-4 w-4 text-blue-500 dark:text-blue-400 mr-2" />
                    <div>
                      <h4 className="text-sm font-medium text-gray-800 dark:text-white transition-colors">
                        {csvData.name}
                      </h4>
                      <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mt-1 transition-colors">
                        <Clock className="h-3 w-3 mr-1" />
                        {csvData.uploadDate.toLocaleDateString()} {csvData.uploadDate.toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-500 dark:text-gray-400 transition-colors">
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
