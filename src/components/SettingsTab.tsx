import { useAtom } from "jotai";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import {
	currentCSVDataAtom,
	headerNamesAtom,
	productNameMappingsAtom,
	visibleColumnsAtom,
} from "../stores/csvStore";
import { getUniqueProductNames } from "../utils/csvUtils";
import { db } from "../utils/database";

export const SettingsTab: React.FC = () => {
	const [currentCSVData, setCurrentCSVData] = useAtom(currentCSVDataAtom);
	const [productNameMappings, setProductNameMappings] = useAtom(
		productNameMappingsAtom,
	);
	const [headerNames, setHeaderNames] = useAtom(headerNamesAtom);
	const [visibleColumns, setVisibleColumns] = useAtom(visibleColumnsAtom);
	const [tempMappings, setTempMappings] = useState<Record<string, string>>({});
	const [tempHeaders, setTempHeaders] = useState(headerNames);

	const debounceTimerRef = useRef<NodeJS.Timeout>();
	const headerDebounceTimerRef = useRef<NodeJS.Timeout>();

	// 상품명 관리에서는 원본 데이터에서 상품명을 가져와야 함 (매핑 적용 전)
	const uniqueProductNames = currentCSVData?.data
		? getUniqueProductNames(currentCSVData.data, headerNames.productName)
		: [];

	// CSV 데이터의 모든 헤더 목록 가져오기
	const allHeaders =
		currentCSVData?.data && currentCSVData.data.length > 0
			? Object.keys(currentCSVData.data[0])
			: [];

	// 디바운스를 적용한 자동 저장
	useEffect(() => {
		if (Object.keys(tempMappings).length > 0) {
			// 기존 타이머 클리어
			if (debounceTimerRef.current) {
				clearTimeout(debounceTimerRef.current);
			}

			// 새로운 타이머 설정 (1초 후 자동 저장)
			debounceTimerRef.current = setTimeout(async () => {
				try {
					const updatedMappings = { ...productNameMappings, ...tempMappings };
					setProductNameMappings(updatedMappings);

					if (currentCSVData) {
						const updatedCSVData = {
							...currentCSVData,
							productNameMappings: updatedMappings,
						};
						setCurrentCSVData(updatedCSVData);
						await db.csvData.put(updatedCSVData);
					}

					// 저장된 매핑만큼 토스트 메시지 표시
					const changedCount = Object.keys(tempMappings).filter(
						(key) => tempMappings[key].trim() !== "",
					).length;
					if (changedCount > 0) {
						toast.success(`상품명 ${changedCount}개가 자동 저장되었습니다.`);
					}

					setTempMappings({});
				} catch (error) {
					toast.error("저장에 실패했습니다.");
					console.error("상품명 매핑 저장 오류:", error);
				}
			}, 1000);
		}

		// 컴포넌트 언마운트 시 타이머 클리어
		return () => {
			if (debounceTimerRef.current) {
				clearTimeout(debounceTimerRef.current);
			}
		};
	}, [
		tempMappings,
		productNameMappings,
		currentCSVData,
		setProductNameMappings,
		setCurrentCSVData,
	]);

	// 헤더명 변경을 위한 디바운스 로직
	useEffect(() => {
		// 초기값과 다른 경우에만 자동 저장 실행
		const hasChanges = Object.keys(tempHeaders).some(
			(key) => tempHeaders[key] !== headerNames[key],
		);

		if (hasChanges) {
			// 기존 타이머 클리어
			if (headerDebounceTimerRef.current) {
				clearTimeout(headerDebounceTimerRef.current);
			}

			// 새로운 타이머 설정 (1초 후 자동 저장)
			headerDebounceTimerRef.current = setTimeout(() => {
				setHeaderNames(tempHeaders);
				toast.success("헤더명이 자동 저장되었습니다.");
			}, 1000);
		}

		// 컴포넌트 언마운트 시 타이머 클리어
		return () => {
			if (headerDebounceTimerRef.current) {
				clearTimeout(headerDebounceTimerRef.current);
			}
		};
	}, [tempHeaders, headerNames, setHeaderNames]);

	const handleMappingChange = (originalName: string, newName: string) => {
		setTempMappings((prev) => ({
			...prev,
			[originalName]: newName,
		}));
	};

	const handleHeaderChange = (key: string, value: string) => {
		setTempHeaders({
			...tempHeaders,
			[key]: value,
		});
	};

	const handleColumnVisibilityChange = (
		columnName: string,
		isVisible: boolean,
	) => {
		// 즉시 상태 업데이트
		const newVisibleColumns = {
			...visibleColumns,
			[columnName]: isVisible,
		};

		setVisibleColumns(newVisibleColumns);

		toast.success(
			`컬럼 "${columnName}"이 ${isVisible ? "표시" : "숨김"} 설정되었습니다.`,
		);
	};

	const resetHeaders = () => {
		const defaultHeaders = {
			productName: "주문상품명(옵션포함)",
			price: "판매가",
			address: "수령인 주소(전체)",
			category: "자체분류",
			quantity: "수량",
		};
		setTempHeaders(defaultHeaders);
		setHeaderNames(defaultHeaders);

		toast.success("헤더명이 기본값으로 초기화되었습니다.");
	};

	const resetProductMappings = async () => {
		setTempMappings({});
		setProductNameMappings({});

		if (currentCSVData) {
			const updatedCSVData = {
				...currentCSVData,
				productNameMappings: {},
			};
			setCurrentCSVData(updatedCSVData);
			await db.csvData.put(updatedCSVData);
		}

		toast.success("상품명 매핑이 모두 초기화되었습니다.");
	};

	if (!currentCSVData?.data || currentCSVData.data.length === 0) {
		return (
			<div className="p-4 bg-gray-100 dark:bg-gray-900 min-h-screen transition-colors">
				<div className="text-center text-gray-500 dark:text-gray-400 py-6 text-sm transition-colors">
					데이터가 없습니다.
				</div>
			</div>
		);
	}

	return (
		<div className="p-4 space-y-6 bg-gray-100 dark:bg-gray-900 min-h-screen transition-colors">
			<h2 className="text-lg font-bold text-gray-800 dark:text-white transition-colors">
				설정
			</h2>

			{/* 헤더명 관리 섹션 */}
			<div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900/50 p-4 transition-colors">
				<div className="flex items-center justify-between mb-4">
					<div>
						<h3 className="text-md font-semibold text-gray-800 dark:text-white transition-colors">
							헤더명 관리
						</h3>
						<p className="text-sm text-gray-600 dark:text-gray-400 mt-1 transition-colors">
							CSV 파일의 컬럼명이 다를 경우 여기서 매핑을 설정하세요. 변경사항은
							1초 후 자동으로 저장됩니다.
						</p>
					</div>
					<button
						type="button"
						onClick={resetHeaders}
						className="px-4 py-2 bg-gray-600 dark:bg-gray-700 text-white text-sm rounded hover:bg-gray-700 dark:hover:bg-gray-600 transition-colors"
					>
						기본값으로 초기화
					</button>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
					<div>
						<label
							htmlFor="category-input"
							className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors"
						>
							분류 컬럼{" "}
							<span className="text-xs text-gray-500 dark:text-gray-400 transition-colors">
								(업체별 분류에 사용)
							</span>
						</label>
						<input
							id="category-input"
							type="text"
							value={tempHeaders.category}
							onChange={(e) => handleHeaderChange("category", e.target.value)}
							className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors"
							placeholder="예: 자체분류"
						/>
					</div>
					<div>
						<label
							htmlFor="address-input"
							className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors"
						>
							주소 컬럼{" "}
							<span className="text-xs text-gray-500 dark:text-gray-400 transition-colors">
								(주문건을 하나로 묶는데 사용)
							</span>
						</label>
						<input
							id="address-input"
							type="text"
							value={tempHeaders.address}
							onChange={(e) => handleHeaderChange("address", e.target.value)}
							className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors"
							placeholder="예: 수령인 주소(전체)"
						/>
					</div>

					<div>
						<label
							htmlFor="quantity-input"
							className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors"
						>
							수량 컬럼{" "}
							<span className="text-xs text-gray-500 dark:text-gray-400 transition-colors">
								(수량 계산에 사용)
							</span>
						</label>
						<input
							id="quantity-input"
							type="text"
							value={tempHeaders.quantity}
							onChange={(e) => handleHeaderChange("quantity", e.target.value)}
							className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors"
							placeholder="예: 수량"
						/>
					</div>

					<div>
						<label
							htmlFor="price-input"
							className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors"
						>
							가격 컬럼{" "}
							<span className="text-xs text-gray-500 dark:text-gray-400 transition-colors">
								(가격 계산에 사용)
							</span>
						</label>
						<input
							id="price-input"
							type="text"
							value={tempHeaders.price}
							onChange={(e) => handleHeaderChange("price", e.target.value)}
							className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors"
							placeholder="예: 판매가"
						/>
					</div>
					<div>
						<label
							htmlFor="product-name-input"
							className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors"
						>
							상품명 컬럼{" "}
							<span className="text-xs text-gray-500 dark:text-gray-400 transition-colors">
								(상품명 변경에 사용)
							</span>
						</label>
						<input
							id="product-name-input"
							type="text"
							value={tempHeaders.productName}
							onChange={(e) =>
								handleHeaderChange("productName", e.target.value)
							}
							className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors"
							placeholder="예: 주문상품명(옵션포함)"
						/>
					</div>
				</div>
			</div>

			{/* 컬럼 표시 설정 섹션 */}
			<div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900/50 p-4 transition-colors">
				<div className="flex items-center justify-between mb-4">
					<div>
						<h3 className="text-md font-semibold text-gray-800 dark:text-white transition-colors">
							컬럼 표시 설정
						</h3>
						<p className="text-sm text-gray-600 dark:text-gray-400 mt-1 transition-colors">
							발주서와 분류 탭에서 보여질 컬럼을 선택하세요. 변경사항은 즉시
							저장되며 프린트에도 적용됩니다.
						</p>
					</div>
					<button
						type="button"
						onClick={() => {
							const allVisible: Record<string, boolean> = {};
							allHeaders.forEach((header) => {
								allVisible[header] = true;
							});

							setVisibleColumns(allVisible);
							toast.success("모든 컬럼이 선택되었습니다.");
						}}
						className="px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white text-sm rounded hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
					>
						모든 컬럼 선택
					</button>
				</div>

				<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
					{allHeaders.map((header) => (
						<label
							key={header}
							className="flex items-center space-x-2 p-2 border border-gray-200 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
						>
							<input
								type="checkbox"
								checked={
									visibleColumns[header] !== undefined
										? visibleColumns[header]
										: true
								}
								onChange={(e) =>
									handleColumnVisibilityChange(header, e.target.checked)
								}
								className="w-4 h-4 text-blue-600 dark:text-blue-400 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors"
							/>
							<span
								className="text-sm text-gray-700 dark:text-gray-300 truncate transition-colors"
								title={header}
							>
								{header}
							</span>
						</label>
					))}
				</div>
			</div>

			{/* 상품명 관리 섹션 */}
			<div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900/50 p-4 transition-colors">
				<div className="flex items-center justify-between mb-4">
					<div>
						<h3 className="text-md font-semibold text-gray-800 dark:text-white transition-colors">
							상품명 관리
						</h3>
						<p className="text-sm text-gray-600 dark:text-gray-400 mt-1 transition-colors">
							상품명을 다른 이름으로 변경할 수 있습니다. 변경사항은 1초 후
							자동으로 저장되며 모든 탭에 실시간 반영됩니다.
						</p>
					</div>
					<button
						type="button"
						onClick={resetProductMappings}
						className="px-4 py-2 bg-gray-600 dark:bg-gray-700 text-white text-sm rounded hover:bg-gray-700 dark:hover:bg-gray-600 transition-colors"
					>
						모든 매핑 초기화
					</button>
				</div>

				<div className="space-y-3 mb-4">
					{uniqueProductNames.map((productName) => {
						// 직접 value 계산 (함수 호출 없이)
						const currentMapping =
							productName in tempMappings
								? tempMappings[productName]
								: productNameMappings[productName] || "";

						return (
							<div key={productName} className="flex items-center space-x-3">
								<div className="flex-1">
									<div className="text-xs text-gray-500 dark:text-gray-400 mb-1 transition-colors">
										원본명
									</div>
									<div className="px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded text-sm text-gray-700 dark:text-gray-300 transition-colors">
										{productName}
									</div>
								</div>
								<div className="text-gray-400 dark:text-gray-500 transition-colors">
									→
								</div>
								<div className="flex-1">
									<div className="text-xs text-gray-500 dark:text-gray-400 mb-1 transition-colors">
										변경명
									</div>
									<input
										type="text"
										value={currentMapping}
										onChange={(e) =>
											handleMappingChange(productName, e.target.value)
										}
										placeholder="변경할 상품명을 입력하세요"
										className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors placeholder:text-gray-400 dark:placeholder:text-gray-500"
									/>
								</div>
							</div>
						);
					})}
				</div>
			</div>

			<Toaster position="top-right" />
		</div>
	);
};
