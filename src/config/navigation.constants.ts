import { DOMAIN_OPTIONS } from './domain.constants';

export interface NavTopic {
  id: string;
  label: string;
  abbreviation: string;
}

export const MAIN_NAV_TOPICS: NavTopic[] = DOMAIN_OPTIONS.map(domain => ({
  id: domain.id,
  label: domain.label,
  abbreviation: domain.label.split(' ').map(word => word[0]).join('').toUpperCase()
})); 

export interface NavItem {
  id: string;
  label: string;
  href: string;
  authRequired?: boolean;
}

export const MAIN_NAV_ITEMS: NavItem[] = [
  {
    id: 'topics',
    label: 'Topics',
    href: '/topics',
    authRequired: false
  },
  {
    id: 'voice',
    label: 'Interviews',
    href: '/voice',
    authRequired: false
  },

  {
    id: 'about',
    label: 'About',
    href: '/about',
    authRequired: false
  }
]