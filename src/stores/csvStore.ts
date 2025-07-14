import { atom } from 'jotai';
import type { CSVData, HeaderNames } from '../types';

export const csvListAtom = atom<CSVData[]>([]);
export const currentCSVDataAtom = atom<CSVData | null>(null);
export const currentTabAtom = atom<'home' | 'order' | 'category' | 'summary' | 'settings'>('home');
export const horizontalScrollModeAtom = atom<boolean>(false);

export const productNameMappingsAtom = atom<Record<string, string>>({});

// 기본 헤더명 설정
const defaultHeaderNames: HeaderNames = {
  productName: '주문상품명(옵션포함)',
  price: '판매가',
  address: '수령인 주소(전체)',
  category: '자체분류',
  quantity: '수량',
  recipient: '수령인',
};

// localStorage에서 헤더명 불러오기
const getStoredHeaderNames = (): HeaderNames => {
  try {
    const stored = localStorage.getItem('headerNames');
    return stored ? { ...defaultHeaderNames, ...JSON.parse(stored) } : defaultHeaderNames;
  } catch (error) {
    console.error('헤더명 불러오기 오류:', error);
    return defaultHeaderNames;
  }
};

// localStorage에서 컬럼 표시 설정 불러오기
const getStoredVisibleColumns = () => {
  try {
    const stored = localStorage.getItem('visibleColumns');
    return stored ? JSON.parse(stored) : {};
  } catch (error) {
    console.error('컬럼 표시 설정 불러오기 오류:', error);
    return {};
  }
};

// localStorage에서 다크모드 설정 불러오기
const getStoredDarkMode = () => {
  try {
    const stored = localStorage.getItem('darkMode');
    return stored ? JSON.parse(stored) : false;
  } catch (error) {
    console.error('다크모드 설정 불러오기 오류:', error);
    return false;
  }
};

// 헤더명 관리 atom - localStorage와 연동
export const headerNamesAtom = atom(getStoredHeaderNames(), (_get, set, newValue: HeaderNames) => {
  set(headerNamesAtom, newValue);
  try {
    localStorage.setItem('headerNames', JSON.stringify(newValue));
  } catch (error) {
    console.error('헤더명 저장 오류:', error);
  }
});

// 컬럼 표시/숨김 관리 atom - localStorage와 연동
export const visibleColumnsAtom = atom(
  getStoredVisibleColumns(),
  (_get, set, newValue: Record<string, boolean>) => {
    set(visibleColumnsAtom, newValue);
    try {
      localStorage.setItem('visibleColumns', JSON.stringify(newValue));
    } catch (error) {
      console.error('컬럼 표시 설정 저장 오류:', error);
    }
  },
);

// 다크모드 관리 atom - localStorage와 연동
export const darkModeAtom = atom(getStoredDarkMode(), (_get, set, newValue: boolean) => {
  set(darkModeAtom, newValue);
  try {
    localStorage.setItem('darkMode', JSON.stringify(newValue));
    // HTML 요소에 dark 클래스 추가/제거
    if (newValue) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  } catch (error) {
    console.error('다크모드 설정 저장 오류:', error);
  }
});

// processedCSVDataAtom - 상품명 매핑이 적용된 데이터
export const processedCSVDataAtom = atom((get) => {
  const currentData = get(currentCSVDataAtom);
  const mappings = get(productNameMappingsAtom);
  const headerNames = get(headerNamesAtom);

  if (!currentData?.data) return null;

  return currentData.data.map((row) => {
    const originalName = row[headerNames.productName];
    const mappedName =
      originalName && mappings[originalName] ? mappings[originalName] : originalName;

    return {
      ...row,
      [headerNames.productName]: mappedName,
    };
  });
});
