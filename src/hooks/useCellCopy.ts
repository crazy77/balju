import toast from 'react-hot-toast';
import { formatCellValue } from '../utils/csvUtils';

export const useCellCopy = () => {
  const handleCellClick = (value: string, columnName: string) => {
    if (!value) return;

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

  return { handleCellClick };
};
