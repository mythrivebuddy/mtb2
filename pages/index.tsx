import { useState } from 'react';
import ErrorBoundary from '../components/ErrorBoundary';
import Hero from '../components/Hero';
import CategoryTags from '../components/CategoryTags';
import SpotlightCard from '../components/SpotlightCard';
import type { Category, Project } from '../types';

// Example data
const categories: Category[] = [
  { id: 'all', name: 'All' },
  { id: 'web', name: 'Web Development' },
  { id: 'mobile', name: 'Mobile Apps' },
  { id: 'design', name: 'Design' },
];

const exampleProject: Project = {
  id: '1',
  title: 'Example Project',
  description: 'This is an example project description.',
  image: '/project-image.jpg',
  tags: ['React', 'TypeScript'],
  author: {
    name: 'John Doe',
    avatar: '/avatar.jpg',
  },
  postedDate: 'Jan 1, 2024',
};

export default function Home() {
  const [selectedCategory, setSelectedCategory] = useState('all');

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);
    // Implement filtering logic here
  };

  const handleProjectClick = (projectId: string) => {
    // Implement project click logic here
  };

  return (
    <ErrorBoundary>
      <main className="min-h-screen bg-gray-50">
        <Hero
          title="Welcome to Our Platform"
          description="Discover amazing projects and connect with talented developers."
          imageUrl="/hero-image.jpg"
          onGetStarted={() => console.log('Get Started clicked')}
        />
        
        <CategoryTags
          categories={categories}
          onCategorySelect={handleCategorySelect}
        />
        
        <div className="py-8">
          <SpotlightCard
            project={exampleProject}
            onClick={handleProjectClick}
          />
        </div>
      </main>
    </ErrorBoundary>
  );
} 