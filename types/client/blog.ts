
export interface Blog {
  id: string;
  title: string;
  image?: string;
  excerpt: string;
  category: string;
  content: string;
  readTime: string;
  createdAt: string;
  updatedAt: string;
}

export interface BlogResponse {
  blogs: Blog[];
  totalCount: number;
  page: number;
  totalPages: number;
}


export interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  image: string;
  content: string;
  readTime: string;
  date: string;
}



export interface ClientBlogPageProps {
  blog: BlogPost;
}