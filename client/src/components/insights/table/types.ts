import { CustomerSuccessInsight } from '@/types/customerSuccess';

export interface GroupedInsight {
  id: string;
  type: string;
  severity: 'red' | 'yellow' | 'info';
  message: string;
  count: number;
  children: CustomerSuccessInsight[];
  hasChildren: boolean;
}

export interface InsightsTableProps {
  insights: CustomerSuccessInsight[];
  onInsightSelect: (insight: CustomerSuccessInsight) => void;
  selectedCustomer?: string | null;
  customers?: any[];
  onCustomerChange?: (customerId: string) => void;
  onInsightUpdate?: (insightId: string, updates: Partial<CustomerSuccessInsight>) => void;
}

export interface InsightTableRowProps {
  insight: CustomerSuccessInsight;
  index: number;
  onInsightSelect: (insight: CustomerSuccessInsight) => void;
  onStatusChange: (insightId: string, status: string) => void;
  onAssigneeChange: (insightId: string, assigneeId: string | null) => void;
  users: Array<{ _id: string; name: string; email: string }>;
  loading: boolean;
  updating: boolean;
  hasPermission: boolean;
}

export interface InsightGroupRowProps {
  group: GroupedInsight;
  expandedGroups: Set<string>;
  onToggleExpand: (groupId: string) => void;
  onInsightSelect: (insight: CustomerSuccessInsight) => void;
  onStatusChange: (insightId: string, status: string) => void;
  onAssigneeChange: (insightId: string, assigneeId: string | null) => void;
  users: Array<{ _id: string; name: string; email: string }>;
  loading: boolean;
  updatingInsights: Set<string>;
  hasPermission: boolean;
}

export interface InsightTableHeaderProps {
  // No props needed for now, but keeping for consistency
}

export interface InsightTableBodyProps {
  groupedInsights: GroupedInsight[];
  expandedGroups: Set<string>;
  onToggleExpand: (groupId: string) => void;
  onInsightSelect: (insight: CustomerSuccessInsight) => void;
  onStatusChange: (insightId: string, status: string) => void;
  onAssigneeChange: (insightId: string, assigneeId: string | null) => void;
  users: Array<{ _id: string; name: string; email: string }>;
  loading: boolean;
  updatingInsights: Set<string>;
  hasPermission: boolean;
}
