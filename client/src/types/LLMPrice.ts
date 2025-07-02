
export interface ILLMPrices {
    model: string;
    name: string;
    displayName: string;
    description: string;
    pricePerToken: number;
    isRecommended: boolean;
}