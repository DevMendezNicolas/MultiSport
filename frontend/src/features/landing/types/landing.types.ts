export interface NavItem {
  label: string;
  href: string;
}

export interface MetricItem {
  value: string;
  label: string;
}

export interface OperationFeature {
  id: string;
  number: string;
  title: string;
  description: string;
  iconName: 'calendar' | 'trophy' | 'users';
}

export interface WorkflowStep {
  stepNumber: string;
  stepBadge: string;
  title: string;
  highlightedTitle: string;
  kicker: string;
  description: string;
  checkpoints: string[];
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

export interface LeadFormData {
  fullName: string;
  complexName: string;
  phoneOrWhatsApp: string;
  courtsCount: number | '';
  notes?: string;
}
