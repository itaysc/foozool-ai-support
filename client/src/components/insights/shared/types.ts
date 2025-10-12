import { CustomerSuccessInsight } from '@/types/customerSuccess';

export interface InsightComponentProps {
  insight: CustomerSuccessInsight | null;
  onInsightUpdate?: (insightId: string, updates: Partial<CustomerSuccessInsight>) => void;
}

export interface InsightHeaderProps extends InsightComponentProps {
  onClose: () => void;
}

export interface InsightMetaInfoProps extends InsightComponentProps {
  users: Array<{ _id: string; firstName: string; lastName: string; email: string; name: string }>;
  updating: boolean;
  setUpdating: (updating: boolean) => void;
}

export interface InsightCommentsProps extends InsightComponentProps {
  comments: any[];
  loadingComments: boolean;
  showAddComment: boolean;
  setShowAddComment: (show: boolean) => void;
  newComment: { title: string; description: string };
  setNewComment: (comment: { title: string; description: string }) => void;
  creatingComment: boolean;
  setCreatingComment: (creating: boolean) => void;
  users: Array<{ _id: string; firstName: string; lastName: string; email: string; name: string }>;
  onCommentCreated: () => void;
}
