import { useAtom } from 'jotai';
import { FileText, Upload } from 'lucide-react';
import type React from 'react';
import { useCallback, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { currentTabAtom, loadCSVDataAtom } from '../stores/csvStore';
import type { CSVData, CSVRow } from '../types';
import { getWorkbookSheetNames, parseCSV, parseXLSXBuffer } from '../utils/csvUtils';
import { db } from '../utils/database';

type PendingExcel = {
  buffer: ArrayBuffer;
  file: File;
  sheetNames: string[];
};

export const FileUpload: React.FC<{ onFileUploaded: (csvData: CSVData) => void }> = ({
  onFileUploaded,
}) => {
  const [, setCurrentTab] = useAtom(currentTabAtom);
  const [, loadCSVData] = useAtom(loadCSVDataAtom);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [pendingExcel, setPendingExcel] = useState<PendingExcel | null>(null);
  const [selectedSheet, setSelectedSheet] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetFileInput = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const finalizeUpload = useCallback(
    async (file: File, data: CSVRow[]) => {
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

      toast.success('파일이 성공적으로 업로드되었습니다.');
    },
    [loadCSVData, setCurrentTab, onFileUploaded],
  );

  const handleFileUpload = useCallback(
    async (file: File) => {
      setPendingExcel(null);
      setIsUploading(true);
      try {
        const lower = file.name.toLowerCase();
        if (lower.endsWith('.xlsx') || lower.endsWith('.xls')) {
          const buf = await file.arrayBuffer();
          const sheetNames = getWorkbookSheetNames(buf);
          if (sheetNames.length > 1) {
            setPendingExcel({ buffer: buf, file, sheetNames });
            setSelectedSheet(sheetNames[0] ?? '');
            return;
          }
          const data = parseXLSXBuffer(buf);
          await finalizeUpload(file, data);
        } else {
          const data = await parseCSV(file);
          await finalizeUpload(file, data);
        }
      } catch (error) {
        console.error('파일 업로드 중 오류가 발생했습니다:', error);
        toast.error('파일 업로드 중 오류가 발생했습니다.');
      } finally {
        setIsUploading(false);
      }
    },
    [finalizeUpload],
  );

  const handleConfirmSheet = useCallback(async () => {
    if (!pendingExcel || !selectedSheet) return;
    const { buffer, file } = pendingExcel;
    setPendingExcel(null);
    setIsUploading(true);
    try {
      const data = parseXLSXBuffer(buffer, selectedSheet);
      await finalizeUpload(file, data);
      resetFileInput();
    } catch (error) {
      console.error('파일 업로드 중 오류가 발생했습니다:', error);
      toast.error('파일 업로드 중 오류가 발생했습니다.');
    } finally {
      setIsUploading(false);
    }
  }, [pendingExcel, selectedSheet, finalizeUpload, resetFileInput]);

  const handleCancelSheet = useCallback(() => {
    setPendingExcel(null);
    resetFileInput();
  }, [resetFileInput]);

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
    <div className="w-full space-y-3">
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
        {isUploading && !pendingExcel ? (
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
              CSV 또는 Excel 파일을 여기에 드래그하거나 클릭하여 선택하세요
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 transition-colors">
              지원 형식: .csv, .xlsx, .xls
            </p>
            <ul className="text-xs text-left text-gray-500 dark:text-gray-400 mb-3 max-w-md mx-auto space-y-1 list-disc list-inside">
              <li>
                엑셀은 기본적으로 첫 번째 시트를 읽습니다. 시트가 여러 개면 목록에서 선택할 수
                있습니다.
              </li>
              <li>
                병합된 셀은 보통 왼쪽·위쪽 값만 읽히므로, 주문 데이터는 병합 없이 한 행에 두는 것이
                안전합니다.
              </li>
              <li>완전히 빈 행은 생략될 수 있습니다.</li>
            </ul>
            <label className="inline-flex items-center px-3 py-1 bg-blue-500 dark:bg-blue-600 text-white text-sm rounded hover:bg-blue-600 dark:hover:bg-blue-700 cursor-pointer transition-colors">
              <FileText className="h-3 w-3 mr-1" />
              파일 선택
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                onChange={handleFileSelect}
                className="hidden"
              />
            </label>
          </>
        )}
      </button>

      {pendingExcel && (
        <div className="rounded-lg border border-amber-200 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 p-4">
          <p className="text-sm font-medium text-amber-900 dark:text-amber-100 mb-2">
            시트가 여러 개입니다. 불러올 시트를 선택하세요.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedSheet}
              onChange={(e) => setSelectedSheet(e.target.value)}
              className="text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 min-w-[12rem]"
            >
              {pendingExcel.sheetNames.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={handleConfirmSheet}
              disabled={isUploading || !selectedSheet}
              className="text-xs px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {isUploading ? '처리 중…' : '이 시트로 불러오기'}
            </button>
            <button
              type="button"
              onClick={handleCancelSheet}
              disabled={isUploading}
              className="text-xs px-3 py-1 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-100 rounded hover:bg-gray-300 dark:hover:bg-gray-500"
            >
              취소
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
