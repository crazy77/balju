export interface CSVData {
  id: string;
  name: string;
  uploadDate: Date;
  data: Record<string, string>[];
  productNameMappings: Record<string, string>;
}

export interface CSVRow {
  [key: string]: string;
}

export interface HeaderNames {
  productName: string;
  price: string;
  address: string;
  category: string;
  quantity: string;
  recipient: string;
  recipientPhone: string;
}

export interface ProductNameMapping {
  originalName: string;
  mappedName: string;
}

export interface CategorySummary {
  category: string;
  totalQuantity: number;
  totalPrice: number;
  items: ProductSummary[];
}

export interface ProductSummary {
  productName: string;
  quantity: number;
  price: number;
}
