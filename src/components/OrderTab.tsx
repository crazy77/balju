import { useAtom, useSetAtom } from 'jotai';
import { Edit, Printer } from 'lucide-react';
import type React from 'react';
import { useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { useCellCopy, usePrint } from '../hooks';
import {
  currentCSVDataAtom,
  headerNamesAtom,
  processedCSVDataAtom,
  separateShippingAtom,
  visibleColumnsAtom,
} from '../stores/csvStore';
import { BUTTON_STYLES, LAYOUT_STYLES, TABLE_STYLES } from '../styles/common';
import { addSimpleSerialNumbers, formatCellValue, parseQuantity } from '../utils/csvUtils';
import { db } from '../utils/database';
import { CategoryChangeModal } from './CategoryChangeModal';
import { EmptyDataView, TabHeader } from './common';

export const OrderTab: React.FC = () => {
  const [processedData] = useAtom(processedCSVDataAtom);
  const [visibleColumns] = useAtom(visibleColumnsAtom);
  const [headerNames] = useAtom(headerNamesAtom);
  const [separateShipping] = useAtom(separateShippingAtom);
  const [currentCSVData] = useAtom(currentCSVDataAtom);
  const setCurrentCSVData = useSetAtom(currentCSVDataAtom);
  const { handleCellClick, isRowSelected } = useCellCopy();
  const { handlePrint } = usePrint();

  // 카테고리 변경 모달 상태
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRowData, setSelectedRowData] = useState<any>(null);
  const [selectedRowIndex, setSelectedRowIndex] = useState<number>(-1);

  if (!processedData || processedData.length === 0) {
    return <EmptyDataView />;
  }

  const dataWithSerialNumbers = addSimpleSerialNumbers(processedData);
  const allDataHeaders = Object.keys(processedData[0]);

  // 선택된 컬럼만 필터링 (기본값은 모든 컬럼 표시)
  const visibleDataHeaders = allDataHeaders.filter((header) =>
    visibleColumns[header] !== undefined ? visibleColumns[header] : true,
  );

  const headers = ['No.', '분류 변경', ...visibleDataHeaders];

  // 수량이 2개 이상인지 확인하는 함수
  const isQuantityTwoOrMore = (row: any) => {
    const quantity = row[headerNames.quantity];
    if (!quantity) return false;
    const numQuantity = parseQuantity(quantity);
    return numQuantity >= 2;
  };

  // 카테고리 변경 버튼 클릭 핸들러
  const handleCategoryChangeClick = (rowData: any, rowIndex: number) => {
    setSelectedRowData(rowData);
    setSelectedRowIndex(rowIndex);
    setIsModalOpen(true);
  };

  // 카테고리 변경 핸들러
  const handleCategoryChange = async (newCategory: string) => {
    if (!currentCSVData || selectedRowIndex === -1) return;

    try {
      // 현재 데이터 복사
      const updatedData = [...currentCSVData.data];

      // 해당 행의 카테고리 변경
      updatedData[selectedRowIndex] = {
        ...updatedData[selectedRowIndex],
        [headerNames.category]: newCategory,
      };

      // 업데이트된 CSV 데이터 생성
      const updatedCSVData = {
        ...currentCSVData,
        data: updatedData,
      };

      // 인덱스드디비 업데이트
      await db.csvData.put(updatedCSVData);

      // atom 상태 즉시 업데이트 (새로고침 없이 반영)
      setCurrentCSVData(updatedCSVData);
    } catch (error) {
      console.error('카테고리 변경 저장 오류:', error);
      throw error;
    }
  };

  const onPrint = () => {
    handlePrint({
      title: '발주서',
      headers: headers.filter((h) => h !== '카테고리 변경'), // 프린트 시 버튼 컬럼 제외
      data: dataWithSerialNumbers,
      headerNames,
      separateShipping,
    });
  };

  return (
    <div className={LAYOUT_STYLES.container}>
      <TabHeader title="발주서" subTitle={`${dataWithSerialNumbers.length}건`}>
        <button onClick={onPrint} className={BUTTON_STYLES.primary} title="프린트">
          <Printer className="h-3 w-3 mr-1" />
          프린트
        </button>
      </TabHeader>

      <div className={LAYOUT_STYLES.card}>
        <div className={TABLE_STYLES.container}>
          <table className={TABLE_STYLES.table}>
            <thead>
              <tr className={TABLE_STYLES.headerRow}>
                {headers.map((header) => (
                  <th key={header} className={TABLE_STYLES.headerCell}>
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {dataWithSerialNumbers.map((row, index) => {
                const isHighQuantity = isQuantityTwoOrMore(row);
                const isSelected = isRowSelected(index);

                // 수량이 2개 이상인 경우 다른 배경색 적용
                let rowClassName = TABLE_STYLES.bodyRow;
                if (isSelected) {
                  rowClassName +=
                    ' bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-600';
                } else if (isHighQuantity) {
                  rowClassName +=
                    ' bg-red-100 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700';
                }

                return (
                  <tr key={index} className={rowClassName}>
                    {headers.map((header) => {
                      if (header === '분류 변경') {
                        return (
                          <td key={header} className={TABLE_STYLES.bodyCell}>
                            <button
                              onClick={() => handleCategoryChangeClick(row, index)}
                              className="inline-flex items-center px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                              title="분류 변경"
                            >
                              <Edit className="h-3 w-3 mr-1" />
                              변경
                            </button>
                          </td>
                        );
                      }

                      let cellClassName = TABLE_STYLES.bodyCell;
                      if (isSelected) {
                        cellClassName += ' bg-blue-50 dark:bg-blue-900/20';
                      } else if (isHighQuantity) {
                        cellClassName += ' bg-red-200 dark:bg-red-800/10';
                      }
                      cellClassName +=
                        ' cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors';

                      return (
                        <td
                          key={header}
                          className={cellClassName}
                          onClick={() => handleCellClick(row[header] || '', header, index)}
                        >
                          {formatCellValue(row[header] || '', header)}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 카테고리 변경 모달 */}
      <CategoryChangeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        rowData={selectedRowData}
        rowIndex={selectedRowIndex}
        onCategoryChange={handleCategoryChange}
      />

      <Toaster position="top-right" />
    </div>
  );
};
