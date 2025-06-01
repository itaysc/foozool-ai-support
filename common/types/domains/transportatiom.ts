// same as transportation.schema fields
export interface ITransportationDetails {
    domain: string;
    luggagePolicy: string;
    cancellationPolicy: string;
    departureTime: Date;
    arrivalTime: Date;
    paxAmount: number;
    supplierName: string;
    operatorName: string;
    numOfLegs: number;
    isCoupunUsed: boolean;
    paymentStatus: string;
    pickupAddress: string;
    dropoffAddress: string;
    pickupLatitude: number;
    pickupLongitude: number;
    dropoffLatitude: number;
    dropoffLongitude: number;
    pickupTime: Date;
    dropoffTime: Date;
    pickupTimezone: string;
    dropoffTimezone: string;
    pickupNotes: string;
    dropoffNotes: string;
    pickupContactName: string;
    dropoffContactName: string;
    pickupContactPhone: string;
    dropoffContactPhone: string;
    isPrivateTransfer: boolean;
}

export const supportedTransportationFields = [
    'luggagePolicy',
    'cancellationPolicy',
    'departureTime',
    'arrivalTime',
    'paxAmount',
    'supplierName',
    'operatorName',
    'numOfLegs',
    'isCoupunUsed',
    'paymentStatus',
    'pickupAddress',
    'dropoffAddress',
    'pickupLatitude',
    'pickupLongitude',
    'dropoffLatitude',
    'dropoffLongitude',
    'pickupTime',
    'dropoffTime',
    'pickupTimezone',
    'dropoffTimezone',
    'pickupNotes',
    'dropoffNotes',
    'pickupContactName',
    'dropoffContactName',
    'pickupContactPhone',
    'dropoffContactPhone',
    'isPrivateTransfer',
]