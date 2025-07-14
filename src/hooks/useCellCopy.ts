import { useState } from 'react';
import toast from 'react-hot-toast';
import { formatCellValue } from '../utils/csvUtils';

export const useCellCopy = () => {
  const [selectedRowKey, setSelectedRowKey] = useState<string | number | null>(null);

  const handleCellClick = (value: string, columnName: string, rowKey: string | number) => {
    if (!value) return;

    // 행 선택 상태 업데이트
    setSelectedRowKey(rowKey);

    // 포맷팅된 값을 복사
    const formattedValue = formatCellValue(value, columnName);

    navigator.clipboard
      .writeText(formattedValue)
      .then(() => {
        toast.success(
          `복사되었습니다: ${formattedValue.length > 20 ? `${formattedValue.substring(0, 20)}...` : formattedValue}`,
        );
      })
      .catch(() => {
        toast.error('복사에 실패했습니다.');
      });
  };

  const isRowSelected = (rowKey: string | number) => {
    return selectedRowKey === rowKey;
  };

  const clearSelection = () => {
    setSelectedRowKey(null);
  };

  return {
    handleCellClick,
    isRowSelected,
    clearSelection,
    selectedRowKey,
  };
};
