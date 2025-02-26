export interface Project {
  id: string;
  title: string;
  description: string;
  image: string;
  tags: string[];
  author: {
    name: string;
    avatar: string;
  };
  postedDate: string;
}

export interface Category {
  id: string;
  name: string;
  isActive?: boolean;
} 