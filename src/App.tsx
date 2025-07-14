import { useAtom } from 'jotai';
import { Monitor, Moon, Smartphone, Sun } from 'lucide-react';
import { useEffect } from 'react';
import { CategoryTab } from './components/CategoryTab';
import { HomeTab } from './components/HomeTab';
import { OrderTab } from './components/OrderTab';
import { SettingsTab } from './components/SettingsTab';
import { SummaryTab } from './components/SummaryTab';
import { TabNavigation } from './components/TabNavigation';
import {
  currentCSVDataAtom,
  currentTabAtom,
  darkModeAtom,
  horizontalScrollModeAtom,
  productNameMappingsAtom,
} from './stores/csvStore';

function App() {
  const [currentTab] = useAtom(currentTabAtom);
  const [currentCSVData] = useAtom(currentCSVDataAtom);
  const [, setProductNameMappings] = useAtom(productNameMappingsAtom);
  const [horizontalScrollMode, setHorizontalScrollMode] = useAtom(horizontalScrollModeAtom);
  const [darkMode, setDarkMode] = useAtom(darkModeAtom);

  useEffect(() => {
    if (currentCSVData) {
      setProductNameMappings(currentCSVData.productNameMappings || {});
    }
  }, [currentCSVData, setProductNameMappings]);

  // 초기 다크모드 설정 적용
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const renderContent = () => {
    switch (currentTab) {
      case 'home':
        return <HomeTab />;
      case 'order':
        return <OrderTab />;
      case 'category':
        return <CategoryTab />;
      case 'summary':
        return <SummaryTab />;
      case 'settings':
        return <SettingsTab />;
      default:
        return <HomeTab />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 overflow-x-auto scrollbar-visible transition-colors">
      {/* 고정 헤더 */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700 sticky top-0 z-10 transition-colors">
        <div className={horizontalScrollMode ? 'px-4' : 'max-w-7xl mx-auto px-4'}>
          <div className="flex items-center justify-between h-14">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white transition-colors">
              굳뉴스몰 발주 관리 시스템
              {currentCSVData && (
                <span className="ml-3 text-sm font-normal text-gray-500 dark:text-gray-400">
                  • {currentCSVData.name}
                </span>
              )}
            </h1>

            <div className="flex items-center space-x-2">
              {/* 다크모드 토글 버튼 */}
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="flex items-center px-3 py-1 text-xs bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded transition-colors"
                title={darkMode ? '라이트 모드로 전환' : '다크 모드로 전환'}
              >
                {darkMode ? (
                  <>
                    <Sun className="h-3 w-3 mr-1" />
                    라이트
                  </>
                ) : (
                  <>
                    <Moon className="h-3 w-3 mr-1" />
                    다크
                  </>
                )}
              </button>

              {/* 좌우 스크롤 토글 버튼 */}
              <button
                onClick={() => setHorizontalScrollMode(!horizontalScrollMode)}
                className="flex items-center px-3 py-1 text-xs bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded transition-colors"
                title={horizontalScrollMode ? '고정 너비 모드' : '전체 너비 모드'}
              >
                {horizontalScrollMode ? (
                  <>
                    <Smartphone className="h-3 w-3 mr-1" />
                    고정 너비
                  </>
                ) : (
                  <>
                    <Monitor className="h-3 w-3 mr-1" />
                    전체 너비
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* 고정 탭 네비게이션 */}
      <div className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 sticky top-14 z-10 transition-colors">
        <div className={horizontalScrollMode ? 'px-4 ' : 'max-w-7xl mx-auto px-4'}>
          <TabNavigation />
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <main className={horizontalScrollMode ? '' : 'max-w-7xl mx-auto'}>{renderContent()}</main>
    </div>
  );
}

export default App;
