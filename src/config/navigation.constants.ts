export interface NavTopic {
  id: string;
  label: string;
  abbreviation: string;
}

export const MAIN_NAV_TOPICS: NavTopic[] = [
  { id: 'ml', label: 'Machine Learning', abbreviation: 'ML' },
  { id: 'ai', label: 'Artificial Intelligence', abbreviation: 'AI' },
  { id: 'webdev', label: 'Web Development', abbreviation: 'Web Development' },
  { id: 'sdesign', label: 'System Design', abbreviation: 'System Design' },
  { id: 'dsa', label: 'Data Structures & Algorithms', abbreviation: 'DSA' },
]; 