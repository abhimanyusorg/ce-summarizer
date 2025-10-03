import type { Thread, Message, Summary } from '@/lib/db/schema';

export interface ThreadWithMessages extends Thread {
  messages: Message[];
  summary?: Summary | null;
}

export interface ApiResponse<T> {
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
    timestamp: string;
  };
}

export interface ThreadsResponse {
  threads: Thread[];
  total: number;
  hasMore: boolean;
}

export interface AnalyticsOverview {
  totalThreads: number;
  summarizedThreads: number;
  approvedSummaries: number;
  pendingApproval: number;
  avgProcessingTime: number;
  avgEditRate: number;
  sentimentBreakdown: Record<string, number>;
}
