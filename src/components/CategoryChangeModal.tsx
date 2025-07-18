import { useAtom } from 'jotai';
import { Search, X } from 'lucide-react';
import type React from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { cn } from '@/utils/cn';
import { headerNamesAtom, processedCSVDataAtom } from '../stores/csvStore';
import { BUTTON_STYLES, INPUT_STYLES, TEXT_STYLES } from '../styles/common';

interface CategoryChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  rowData: any;
  rowIndex: number;
  onCategoryChange: (newCategory: string) => void;
}

export const CategoryChangeModal: React.FC<CategoryChangeModalProps> = ({
  isOpen,
  onClose,
  rowData,
  rowIndex,
  onCategoryChange,
}) => {
  const [processedData] = useAtom(processedCSVDataAtom);
  const [headerNames] = useAtom(headerNamesAtom);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);

  // 현재 카테고리 값 가져오기
  const currentCategory = rowData?.[headerNames.category] || '';

  // 기존 카테고리 목록 추출
  const existingCategories = useMemo(() => {
    if (!processedData) return [];
    const categories = new Set<string>();
    processedData.forEach((row) => {
      const category = row[headerNames.category];
      if (category && category.trim()) {
        categories.add(category.trim());
      }
    });
    return Array.from(categories).sort((a, b) => a.localeCompare(b, 'ko'));
  }, [processedData, headerNames.category]);

  // 검색 필터링된 카테고리 목록
  const filteredCategories = useMemo(() => {
    if (!searchTerm) return existingCategories;
    return existingCategories.filter((category) =>
      category.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [existingCategories, searchTerm]);

  const handleSave = useCallback(
    async (categoryToSave?: string) => {
      const newCategory = categoryToSave || searchTerm.trim();
      if (!newCategory) {
        toast.error('카테고리를 입력해주세요.');
        return;
      }

      try {
        await onCategoryChange(newCategory);
        toast.success('카테고리가 변경되었습니다.');
        onClose();
      } catch (error) {
        console.error('카테고리 변경 오류:', error);
        toast.error('카테고리 변경에 실패했습니다.');
      }
    },
    [searchTerm, onCategoryChange, onClose],
  );

  // 모달이 열릴 때 입력란 비우기 및 포커스 설정
  useEffect(() => {
    if (isOpen) {
      setSearchTerm(''); // 입력란 비우기
      setSelectedIndex(-1); // 선택 인덱스 초기화

      // 포커스 설정을 약간 지연시켜 모달이 완전히 렌더링된 후 실행
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 100);
    }
  }, [isOpen]);

  // 키보드 이벤트 처리
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < filteredCategories.length) {
          // 목록에서 선택된 항목이 있으면 바로 저장
          handleSave(filteredCategories[selectedIndex]);
        } else if (searchTerm.trim()) {
          // 입력된 텍스트가 있으면 저장
          handleSave();
        }
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev < filteredCategories.length - 1 ? prev + 1 : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : filteredCategories.length - 1));
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, filteredCategories, searchTerm, onClose, handleSave]);

  // 검색 결과가 있으면 첫 번째 항목을 자동 선택
  useEffect(() => {
    if (filteredCategories.length > 0) {
      setSelectedIndex(0);
    } else {
      setSelectedIndex(-1);
    }
  }, [filteredCategories]);

  const handleCategorySelect = (category: string) => {
    // 클릭으로 선택 시 바로 저장
    handleSave(category);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-600">
          <h3 className={TEXT_STYLES.subheading}>카테고리 변경</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4">
          <div className="mb-4">
            <label htmlFor="category-search" className={`${TEXT_STYLES.label} mb-2 block`}>
              새 카테고리
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                id="category-search"
                ref={inputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={currentCategory || '카테고리 검색 또는 입력'}
                className={`${INPUT_STYLES.text} pl-10`}
              />
            </div>
          </div>

          {filteredCategories.length > 0 && (
            <div className="mb-4">
              <div className={`text-sm ${TEXT_STYLES.description} mb-2`}>
                기존 카테고리 목록 (↑↓ 키로 이동, Enter로 선택)
              </div>
              <div className="max-h-96 overflow-y-auto border border-gray-200 dark:border-gray-600 rounded-md">
                {filteredCategories.map((category, index) => (
                  <button
                    key={category}
                    onClick={() => handleCategorySelect(category)}
                    className={cn(
                      'w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors dark:text-white',
                      selectedIndex === index &&
                        'bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-100 font-medium',
                    )}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-3">
            <button onClick={onClose} className={BUTTON_STYLES.secondary}>
              취소
            </button>
            <button
              onClick={() => handleSave()}
              className={BUTTON_STYLES.primary}
              disabled={!searchTerm.trim()}
            >
              저장
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
