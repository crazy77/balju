import { useAtom } from 'jotai';
import { useMemo } from 'react';
import toast from 'react-hot-toast';
import { headerNamesAtom } from '../stores/csvStore';
import type { CSVRow, HeaderNames } from '../types';

interface GroupedCopyData {
  [address: string]: {
    items: {
      productName: string;
      quantity: string;
    }[];
    recipient: string;
    recipientPhone: string;
    address: string;
  };
}

export const useCategoryCopy = () => {
  const [headerNames] = useAtom(headerNamesAtom);

  const formatCopyData = useMemo(() => {
    return (data: CSVRow[], headerNames: HeaderNames): string => {
      // 직접배송이 아닌 데이터만 필터링
      const nonDirectShippingData = data.filter((row) => row[headerNames.category] !== '직접배송');

      if (nonDirectShippingData.length === 0) {
        return '';
      }

      // 주소별로 그룹화
      const groupedData: GroupedCopyData = {};

      nonDirectShippingData.forEach((row) => {
        const address = row[headerNames.address] || '주소 없음';

        if (!groupedData[address]) {
          groupedData[address] = {
            items: [],
            recipient: row[headerNames.recipient] || '',
            recipientPhone: row[headerNames.recipientPhone] || '',
            address,
          };
        }

        groupedData[address].items.push({
          productName: row[headerNames.productName] || '',
          quantity: row[headerNames.quantity] || '',
        });
      });

      // 복사 텍스트 생성
      const copyText: string[] = [];
      const addresses = Object.keys(groupedData);

      addresses.forEach((address, index) => {
        const group = groupedData[address];

        // 주소가 다를 때는 한줄 띄우기 (첫 번째 주소는 제외)
        if (index > 0) {
          copyText.push('');
        }

        // 같은 주소 그룹에서는 먼저 모든 상품명과 수량을 기록
        group.items.forEach((item) => {
          copyText.push(`${item.productName} (${item.quantity}개)`);
        });

        // 마지막에 수령인 정보를 한 번만 표시
        copyText.push(group.recipient);
        copyText.push(group.recipientPhone);
        copyText.push(group.address);
      });

      return copyText.join('\n');
    };
  }, []);

  const handleCategoryCopy = async (categoryData: CSVRow[]) => {
    try {
      const copyText = formatCopyData(categoryData, headerNames);

      if (!copyText) {
        toast.error('복사할 직접배송이 아닌 데이터가 없습니다.');
        return;
      }

      await navigator.clipboard.writeText(copyText);
      toast.success('클립보드에 복사되었습니다.');
    } catch (error) {
      console.error('복사 오류:', error);
      toast.error('복사에 실패했습니다.');
    }
  };

  return { handleCategoryCopy };
};
