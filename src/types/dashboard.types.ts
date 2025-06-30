export interface DomainStat {
  domain: string;
  domainName: string;
  totalQuestions: number;
  completedQuestions: number;
  completionPercentage: number;
}

export interface ActivityItem {
  id: string;
  activityType: string;
  topicId: string;
  topicName: string;
  categoryId: string;
  categoryName: string;
  questionId: number;
  questionText: string;
  createdAt: string;
  displayText: string;
  timeAgo: string;
  completionPercentage: number;
  color: string;
}
