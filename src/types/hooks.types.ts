// Hook-related type definitions
export interface Resource {
  id: number;
  question_id: number | null;
  type: string | null;
  title: string | null;
  url: string | null;
  description: string | null;
  created_at: string;
  relevance_score?: number | null;
  previewUrl?: string | null;
  duration?: string | null;
  videoId?: string | null;
}

export interface UserPreferences {
  use_youtube_sources?: boolean;
  use_pdf_sources?: boolean;
  use_paper_sources?: boolean;
  use_website_sources?: boolean;
  use_book_sources?: boolean;
  use_image_sources?: boolean;
}

// Question Answer Hook Types
export interface UseQuestionAnswerProps {
  questionId: number;
  domain?: string | null;
  predefinedAnswer?: string | null;
}

export interface UseQuestionAnswerReturn {
  generatedAnswer: string | null;
  isGenerating: boolean;
  error: string | null;
  isRetrying: boolean;
  generateAnswer: () => Promise<void>;
  retryGeneration: () => Promise<void>;
}

// Question Progress Hook Types
export interface UseQuestionProgressProps {
  questionId: number;
  scrollContainerRef: React.RefObject<HTMLDivElement>;
  onMarkCompleted?: (questionId: number) => void;
}

export interface UseQuestionProgressReturn {
  scrollProgress: number;
  isCompleted: boolean;
  markAsCompleted: () => void;
}

// Question Bookmark Hook Types
export interface UseQuestionBookmarkProps {
  questionId: number;
  initialIsBookmarked: boolean;
  onBookmarkStatusChange?: (questionId: number, newStatus: boolean) => void;
  topicId?: number;
  categoryId?: number;
}

export interface UseQuestionBookmarkReturn {
  isBookmarked: boolean;
  handleBookmarkChange: (newStatus: boolean) => void;
}

// Question View Hook Types
export interface UseQuestionViewProps {
  questionId: number;
}

export interface UseQuestionViewReturn {
  hasViewed: boolean;
  markAsViewed: () => void;
}

// Resources Hook Types
export interface UseResourcesProps {
  questionId: number | null;
  domain?: string | null;
  topicId?: number | null;
  categoryId?: number | null;
  subcategoryId?: number | null;
}

export interface UseResourcesReturn {
  resources: Resource[];
  loading: boolean;
  error: string | null;
  totalCount: number;
  refetch: () => void;
}

// Auth Hook Types
export interface UseAuthReturn {
  isLoggedIn: boolean;
  loading: boolean;
  user: any | null;
}

// User Preferences Hook Types
export interface UseUserPreferencesProps {
  isLoggedIn: boolean;
  userId?: string | null;
}

export interface UseUserPreferencesReturn {
  preferences: UserPreferences;
  loading: boolean;
  error: string | null;
  updatePreferences: (newPrefs: Partial<UserPreferences>) => Promise<void>;
}

// Resource Tabs Hook Types
export interface ResourceTab {
  type: string;
  title: string;
  Icon: React.ElementType | null;
  count: number;
  resources: Resource[];
}

export interface UseResourceTabsProps {
  resources: Resource[];
  preferences: UserPreferences;
}

export interface UseResourceTabsReturn {
  tabs: ResourceTab[];
  activeTab: ResourceTab | null;
  activeTabType: string | null;
  setActiveTabType: (type: string | null) => void;
  featuredResource: Resource | null;
}
