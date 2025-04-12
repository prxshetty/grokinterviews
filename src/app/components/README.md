# Components Directory Structure

This directory contains all the React components used in the application, organized by their functionality.

## Directory Structure

- **content/**: Components related to content display
  - `ContentDisplay.tsx`: Displays content in a formatted way
  - `MarkdownHeaderTree.tsx`: Renders a tree of markdown headers

- **layout/**: Components related to page layout
  - `Footer.tsx`: Footer component
  - `MainNavigation.tsx`: Main navigation component
  - `Navbar.tsx`: Navbar component
  - `ConditionalNavWrapper.tsx`: Wrapper for conditional navigation

- **marketing/**: Marketing-related components
  - `CompanyList.tsx`: Displays a list of companies
  - `ProjectsSection.tsx`: Displays projects section
  - `RotatingTopics.tsx`: Displays rotating topics

- **progress/**: Progress tracking components
  - `ActivityProgress.tsx`: Displays user activity progress
  - `ProgressChart.tsx`: Displays progress charts
  - `StatsSection.tsx`: Displays statistics

- **questions/**: Question-related components
  - `QuestionList.tsx`: Displays a list of questions
  - `QuestionWithAnswer.tsx`: Displays a question with its answer

- **topic/**: Topic-related components
  - `TopicCard.tsx`: Displays a topic card
  - `TopicCarousel.tsx`: Displays a carousel of topics
  - `TopicCarouselWrapper.tsx`: Wrapper for topic carousel
  - `TopicCategoryGrid.tsx`: Displays a grid of topic categories
  - `TopicNav.tsx`: Topic navigation component
  - `TopicNavWrapper.tsx`: Wrapper for topic navigation
  - `TopicTableView.tsx`: Displays topics in a table view
  - `TopicTreeNavigation.tsx`: Tree navigation for topics
  - `TopicTreeView.tsx`: Tree view for topics
  - `TopicDataProvider.tsx`: Provider for topic data

- **ui/**: Generic UI components
  - `ThemeToggle.tsx`: Toggle for theme switching
  - `ThemeScript.tsx`: Script for theme handling
  - `RotatingText.tsx`: Displays rotating text
  - `RandomHeadline.tsx`: Displays random headlines

## Usage

Import components using the main index file:

```tsx
import { Footer, TopicCard, StatsSection } from '@/app/components';
```

Or import from specific folders:

```tsx
import { Footer } from '@/app/components/layout';
import { TopicCard } from '@/app/components/topic';
import { StatsSection } from '@/app/components/progress';
```
