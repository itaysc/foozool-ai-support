import { eInvoiceCategory, eInvoiceStatus } from "@common/types/invoice";
import { eRegion } from "@common/types/region";
import { ePaymentTerms } from "@common/types/paymentTerms";
export const statusToLabel = (status: eInvoiceStatus) => {
  switch (status) {
    case eInvoiceStatus.PENDING:
      return 'Pending';
    case eInvoiceStatus.APPROVED:
      return 'Approved';
    case eInvoiceStatus.REJECTED:
      return 'Rejected';
    case eInvoiceStatus.DISPUTED:
      return 'Disputed';
    case eInvoiceStatus.RECONCILED:
      return 'Reconciled';
    case eInvoiceStatus.ARCHIVED:
      return 'Archived';
    case eInvoiceStatus.CANCELLED:
      return 'Cancelled';
    case eInvoiceStatus.DRAFT:
      return 'Draft';
    case eInvoiceStatus.REVIEWED:
      return 'Reviewed';
    case eInvoiceStatus.COMPLETED:
      return 'Completed';
    case eInvoiceStatus.FAILED:
      return 'Failed';
    case eInvoiceStatus.ON_HOLD:
      return 'On Hold';
    default:
      return status;
  }
}

export const regionToLabel = (region: eRegion) => {
  switch (region) {
    case eRegion.AFRICA:
      return 'Africa';
    case eRegion.ASIA:
      return 'Asia';
    case eRegion.EUROPE:
      return 'Europe';
    case eRegion.NORTH_AMERICA:
      return 'North America';
    case eRegion.SOUTH_AMERICA:
      return 'South America';
    case eRegion.CENTRAL_AMERICA:
      return 'Central America';
    case eRegion.MIDDLE_EAST:
      return 'Middle East';
    case eRegion.OCEANIA:
      return 'Oceania';
    case eRegion.ANTARCTICA:
      return 'Antarctica';
    case eRegion.CARIBBEAN:
      return 'Caribbean';
    case eRegion.CENTRAL_ASIA:
      return 'Central Asia';
    case eRegion.EAST_ASIA:
      return 'East Asia';
    case eRegion.SOUTHEAST_ASIA:
      return 'Southeast Asia';
    case eRegion.SOUTHERN_ASIA:
      return 'Southern Asia';
    case eRegion.WESTERN_ASIA:
      return 'Western Asia';
    case eRegion.EASTERN_EUROPE:
      return 'Eastern Europe';
    case eRegion.WESTERN_EUROPE:
      return 'Western Europe';
    case eRegion.NORTHERN_EUROPE:
      return 'Northern Europe';
    case eRegion.SOUTHERN_EUROPE:
      return 'Southern Europe';
    case eRegion.NORTHERN_AFRICA:
      return 'Northern Africa';
    case eRegion.SUB_SAHARAN_AFRICA:
      return 'Sub-Saharan Africa';
    case eRegion.AUSTRALIA:
      return 'Australia';
    case eRegion.PACIFIC_ISLANDS:
      return 'Pacific Islands';
    default:
      return region;
  }
  };

export const categoryToLabel = (category: eInvoiceCategory) => {
  switch (category) {
    case eInvoiceCategory.GOODS:
      return 'Goods';
    case eInvoiceCategory.SERVICES:
      return 'Services';
    case eInvoiceCategory.RENTAL:
      return 'Rental';
    case eInvoiceCategory.SUBSCRIPTION:
      return 'Subscription';
    case eInvoiceCategory.ADVERTISING:
      return 'Advertising';
    case eInvoiceCategory.TRAVEL:
      return 'Travel';
    case eInvoiceCategory.OTHER:
      return 'Other';
    case eInvoiceCategory.SHIPPING:
      return 'Shipping';
    case eInvoiceCategory.TAX:
      return 'Tax';
    case eInvoiceCategory.DISCOUNT:
      return 'Discount';
    case eInvoiceCategory.OTHER_CHARGE:
      return 'Other Charge';
    case eInvoiceCategory.OTHER_DEDUCTION:
      return 'Other Deduction';
    case eInvoiceCategory.OTHER_ADJUSTMENT:
      return 'Other Adjustment';
    case eInvoiceCategory.OTHER_TAX:
      return 'Other Tax';
    case eInvoiceCategory.OTHER_VAT:
      return 'Other VAT';
    case eInvoiceCategory.OTHER_GST:
      return 'Other GST';
    case eInvoiceCategory.OTHER_PST:
      return 'Other PST';
    case eInvoiceCategory.OTHER_HST:
      return 'Other HST';
    case eInvoiceCategory.OTHER_QST:
      return 'Other QST';
    default:
      return category;
  }
};
export const paymentTermToLabel = (term: ePaymentTerms) => {
  switch (term) {
    case ePaymentTerms.IMMEDIATE:
      return 'Immediate';
    case ePaymentTerms.NET_1:
      return 'Net 1';
    case ePaymentTerms.NET_3:
      return 'Net 3';
    case ePaymentTerms.NET_7:
      return 'Net 7';
    case ePaymentTerms.NET_14:
      return 'Net 14';
    case ePaymentTerms.NET_15:
      return 'Net 15';
    case ePaymentTerms.NET_30:
      return 'Net 30';
    case ePaymentTerms.NET_45:
      return 'Net 45';
    case ePaymentTerms.NET_60:
      return 'Net 60';
    case ePaymentTerms.NET_90:
      return 'Net 90';
    case ePaymentTerms.NET_120:
      return 'Net 120';
    case ePaymentTerms.NET_180:
      return 'Net 180';
    case ePaymentTerms.NET_360:
      return 'Net 360';
    case ePaymentTerms.NET_730:
      return 'Net 730';
    case ePaymentTerms.NET_1095:
      return 'Net 1095';
    case ePaymentTerms.NET_1460:
      return 'Net 1460';
    case ePaymentTerms.NET_1825:
      return 'Net 1825';
    case ePaymentTerms.NET_2190:
      return 'Net 2190';
    default:
      return term;
  }
};