
export interface IProduct {
  productName: string;
  serialNumber: string;
  purchaseDate: string;
  price: number;
  currency: string;
  refundPolicy: {
    unit: string;
    value: number;
  };
  warrantyPeriod: {
    unit: string;
    value: number;
  };
  storeLocation: string;
  customerName: string;
  customerEmail: string;
  metadata: Record<string, string>;
}