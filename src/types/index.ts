export interface Post {
  id: number;
  slug: string;
  title: string;
  summary: string;
  content: string; // Markdown
  cover_image: string | null;
  category: string;
  tags: string[];
  embedding?: number[] | string;
  published: boolean;
  created_at: string;
  updated_at: string;
}

export interface SearchHit {
  chunk_id: number;
  post_id: number;
  slug: string;
  title: string;
  heading: string | null;
  content: string;
  score: number;
}

export interface CareerExperience {
  company: string;
  role: string;
  period: string;
  description: string[];
  skills: string[];
}

export interface Project {
  title: string;
  description: string;
  technologies: string[];
  githubUrl?: string;
  demoUrl?: string;
  year: string;
}
