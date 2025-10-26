export interface GeneratedActionItem {
  title: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  priority: 'P0' | 'P1' | 'P2' | 'P3' | 'P4' | 'P5'; // P0 is highest priority
}
