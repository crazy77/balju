import { useAtom } from 'jotai';
import type React from 'react';
import { useEffect, useRef, useState } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import {
  currentCSVDataAtom,
  headerNamesAtom,
  productNameMappingsAtom,
  visibleColumnsAtom,
} from '../stores/csvStore';
import { BUTTON_STYLES, INPUT_STYLES, LAYOUT_STYLES, TEXT_STYLES } from '../styles/common';
import { getUniqueProductNames } from '../utils/csvUtils';
import { db } from '../utils/database';
import { EmptyDataView, TabHeader } from './common';

export const SettingsTab: React.FC = () => {
  const [currentCSVData, _setCurrentCSVData] = useAtom(currentCSVDataAtom);
  const [productNameMappings, setProductNameMappings] = useAtom(productNameMappingsAtom);
  const [headerNames, setHeaderNames] = useAtom(headerNamesAtom);
  const [visibleColumns, setVisibleColumns] = useAtom(visibleColumnsAtom);

  const [tempMappings, setTempMappings] = useState<Record<string, string>>({});
  const [tempHeaders, setTempHeaders] = useState(headerNames);

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const headerDebounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 헤더명 변경사항을 tempHeaders에 반영
  useEffect(() => {
    setTempHeaders(headerNames);
  }, [headerNames]);

  if (!currentCSVData?.data || currentCSVData.data.length === 0) {
    return <EmptyDataView message="CSV 파일을 먼저 업로드해주세요." />;
  }

  const uniqueProductNames = getUniqueProductNames(currentCSVData.data, headerNames.productName);

  const handleMappingChange = (originalName: string, newName: string) => {
    setTempMappings((prev) => ({
      ...prev,
      [originalName]: newName,
    }));

    // 기존 디바운스 타이머 클리어
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // 1초 후 저장
    debounceTimerRef.current = setTimeout(async () => {
      try {
        // 현재 tempMappings 상태를 직접 참조하지 않고 함수형 업데이트 사용
        setTempMappings((currentTempMappings) => {
          // 최종 매핑 생성
          const finalMappings = { ...productNameMappings, ...currentTempMappings };
          setProductNameMappings(finalMappings);

          // localStorage에 저장
          localStorage.setItem('productNameMappings', JSON.stringify(finalMappings));

          // 현재 CSVData에도 반영
          if (currentCSVData && currentCSVData.data.length > 0) {
            db.csvData
              .where('id')
              .equals(currentCSVData.id || '')
              .first()
              .then((savedCSVData) => {
                if (savedCSVData) {
                  const updatedCSVData = {
                    ...savedCSVData,
                    productNameMappings: finalMappings,
                  };
                  db.csvData.put(updatedCSVData);
                }
              });
          }

          // 저장된 매핑만큼 토스트 메시지 표시
          const changedCount = Object.keys(currentTempMappings).filter(
            (key) => currentTempMappings[key].trim() !== '',
          ).length;
          if (changedCount > 0) {
            toast.success(`${changedCount}개 상품명 매핑이 저장되었습니다.`);
          }

          // tempMappings 초기화하지 않고 빈 객체 반환
          return {};
        });
      } catch (error) {
        toast.error('저장에 실패했습니다.');
        console.error('상품명 매핑 저장 오류:', error);
      }
    }, 1000);
  };

  const handleHeaderChange = (key: string, value: string) => {
    setTempHeaders((prev: typeof headerNames) => ({
      ...prev,
      [key]: value,
    }));

    // 기존 디바운스 타이머 클리어
    if (headerDebounceTimerRef.current) {
      clearTimeout(headerDebounceTimerRef.current);
    }

    // 1초 후 저장
    if (value !== headerNames[key as keyof typeof headerNames]) {
      headerDebounceTimerRef.current = setTimeout(() => {
        setHeaderNames(tempHeaders);
        toast.success('헤더명이 자동 저장되었습니다.');
      }, 1000);
    }
  };

  const handleColumnVisibilityChange = (columnName: string, isVisible: boolean) => {
    // 즉시 상태 업데이트
    const newVisibleColumns = {
      ...visibleColumns,
      [columnName]: isVisible,
    };

    setVisibleColumns(newVisibleColumns);

    toast.success(`컬럼 "${columnName}"이 ${isVisible ? '표시' : '숨김'} 설정되었습니다.`);
  };

  const resetHeaders = () => {
    const defaultHeaders = {
      productName: '주문상품명(옵션포함)',
      price: '판매가',
      address: '수령인 주소(전체)',
      category: '자체분류',
      quantity: '수량',
      recipient: '수령인',
      recipientPhone: '수령인 연락처',
    };
    setTempHeaders(defaultHeaders);
    setHeaderNames(defaultHeaders);

    toast.success('헤더명이 기본값으로 초기화되었습니다.');
  };

  const resetProductMappings = async () => {
    try {
      setProductNameMappings({});
      localStorage.removeItem('productNameMappings');

      // 현재 CSVData에서도 매핑 제거
      if (currentCSVData && currentCSVData.data.length > 0) {
        const savedCSVData = await db.csvData
          .where('id')
          .equals(currentCSVData.id || '')
          .first();

        if (savedCSVData) {
          const updatedCSVData = {
            ...savedCSVData,
            productNameMappings: {},
          };
          await db.csvData.put(updatedCSVData);
        }
      }
    } catch (error) {
      console.error('상품명 매핑 초기화 오류:', error);
    }

    toast.success('상품명 매핑이 모두 초기화되었습니다.');
  };

  // 실제 렌더링은 다음 부분에서 계속...
  return (
    <div className={LAYOUT_STYLES.container}>
      <TabHeader title="설정" />

      {/* 헤더명 관리 섹션 */}
      <div className={LAYOUT_STYLES.card}>
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className={TEXT_STYLES.subheading}>헤더명 관리</h3>
              <p className={`${TEXT_STYLES.description} mt-1`}>
                CSV 파일의 컬럼명이 다를 경우 여기서 매핑을 설정하세요. 변경사항은 1초 후 자동으로
                저장됩니다.
              </p>
            </div>
            <button type="button" onClick={resetHeaders} className={BUTTON_STYLES.gray}>
              기본값으로 초기화
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label htmlFor="category-input" className={TEXT_STYLES.label}>
                분류 컬럼{' '}
                <span className={`text-xs ${TEXT_STYLES.description}`}>(업체별 분류에 사용)</span>
              </label>
              <input
                id="category-input"
                type="text"
                value={tempHeaders.category}
                onChange={(e) => handleHeaderChange('category', e.target.value)}
                className={INPUT_STYLES.text}
                placeholder="예: 자체분류"
              />
            </div>
            <div>
              <label htmlFor="address-input" className={TEXT_STYLES.label}>
                주소 컬럼{' '}
                <span className={`text-xs ${TEXT_STYLES.description}`}>
                  (주문건을 하나로 묶는데 사용)
                </span>
              </label>
              <input
                id="address-input"
                type="text"
                value={tempHeaders.address}
                onChange={(e) => handleHeaderChange('address', e.target.value)}
                className={INPUT_STYLES.text}
                placeholder="예: 수령인 주소(전체)"
              />
            </div>
            <div>
              <label htmlFor="quantity-input" className={TEXT_STYLES.label}>
                수량 컬럼{' '}
                <span className={`text-xs ${TEXT_STYLES.description}`}>(수량 계산에 사용)</span>
              </label>
              <input
                id="quantity-input"
                type="text"
                value={tempHeaders.quantity}
                onChange={(e) => handleHeaderChange('quantity', e.target.value)}
                className={INPUT_STYLES.text}
                placeholder="예: 수량"
              />
            </div>
            <div>
              <label htmlFor="price-input" className={TEXT_STYLES.label}>
                가격 컬럼{' '}
                <span className={`text-xs ${TEXT_STYLES.description}`}>(가격 계산에 사용)</span>
              </label>
              <input
                id="price-input"
                type="text"
                value={tempHeaders.price}
                onChange={(e) => handleHeaderChange('price', e.target.value)}
                className={INPUT_STYLES.text}
                placeholder="예: 판매가"
              />
            </div>
            <div>
              <label htmlFor="productName-input" className={TEXT_STYLES.label}>
                상품명 컬럼{' '}
                <span className={`text-xs ${TEXT_STYLES.description}`}>(상품명 변경에 사용)</span>
              </label>
              <input
                id="productName-input"
                type="text"
                value={tempHeaders.productName}
                onChange={(e) => handleHeaderChange('productName', e.target.value)}
                className={INPUT_STYLES.text}
                placeholder="예: 주문상품명(옵션포함)"
              />
            </div>
            <div>
              <label htmlFor="recipient-input" className={TEXT_STYLES.label}>
                수령인 컬럼{' '}
                <span className={`text-xs ${TEXT_STYLES.description}`}>
                  (수령인별 그래프에 사용)
                </span>
              </label>
              <input
                id="recipient-input"
                type="text"
                value={tempHeaders.recipient}
                onChange={(e) => handleHeaderChange('recipient', e.target.value)}
                className={INPUT_STYLES.text}
                placeholder="예: 수령인"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 컬럼 표시 설정 섹션 */}
      <div className={LAYOUT_STYLES.card}>
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className={TEXT_STYLES.subheading}>컬럼 표시 설정</h3>
              <p className={`${TEXT_STYLES.description} mt-1`}>
                발주서와 분류 탭에서 보여질 컬럼을 선택하세요. 변경사항은 즉시 저장되며 프린트에도
                적용됩니다.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                const allVisible: Record<string, boolean> = {};
                const headers = Object.keys(currentCSVData.data[0]);
                headers.forEach((header) => {
                  allVisible[header] = true;
                });

                setVisibleColumns(allVisible);
                toast.success('모든 컬럼이 선택되었습니다.');
              }}
              className={BUTTON_STYLES.primary}
            >
              모두 선택
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {Object.keys(currentCSVData.data[0]).map((header) => (
              <label key={header} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={visibleColumns[header] !== undefined ? visibleColumns[header] : true}
                  onChange={(e) => handleColumnVisibilityChange(header, e.target.checked)}
                  className={INPUT_STYLES.checkbox}
                />
                <span
                  className={`text-sm ${TEXT_STYLES.description.replace('text-gray-600 dark:text-gray-400', 'text-gray-700 dark:text-gray-300')}`}
                >
                  {header}
                </span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* 상품명 매핑 섹션 */}
      <div className={LAYOUT_STYLES.card}>
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className={TEXT_STYLES.subheading}>상품명 매핑</h3>
              <p className={`${TEXT_STYLES.description} mt-1`}>
                상품명을 다른 이름으로 변경할 수 있습니다. 변경사항은 1초 후 자동으로 저장되며 모든
                탭에 실시간 반영됩니다.
              </p>
            </div>
            <button type="button" onClick={resetProductMappings} className={BUTTON_STYLES.gray}>
              모든 매핑 초기화
            </button>
          </div>

          <div className="space-y-3">
            {uniqueProductNames.map((productName) => {
              const currentMapping =
                productName in tempMappings
                  ? tempMappings[productName]
                  : productNameMappings[productName] || '';

              return (
                <div
                  key={productName}
                  className="flex items-center space-x-4 p-3 border border-gray-200 dark:border-gray-600 rounded-lg transition-colors"
                >
                  <div className="flex-1">
                    <div className={`text-xs ${TEXT_STYLES.description} mb-1`}>원래 상품명</div>
                    <div
                      className={`text-sm font-medium ${TEXT_STYLES.subheading.replace('text-md', 'text-sm')}`}
                    >
                      {productName}
                    </div>
                  </div>
                  <div className="text-gray-400 dark:text-gray-500 transition-colors">→</div>
                  <div className="flex-1">
                    <div className={`text-xs ${TEXT_STYLES.description} mb-1`}>변경될 상품명</div>
                    <input
                      type="text"
                      value={currentMapping}
                      onChange={(e) => handleMappingChange(productName, e.target.value)}
                      placeholder="변경할 상품명을 입력하세요"
                      className={`${INPUT_STYLES.text} placeholder:text-gray-400 dark:placeholder:text-gray-500`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <Toaster position="top-right" />
    </div>
  );
};
