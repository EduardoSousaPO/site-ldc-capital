import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { cache } from 'react';

export interface BlogPost {
  slug: string;
  title: string;
  date: string;
  category: string;
  summary: string;
  cover?: string;
  author: string;
  readingTime: string;
  content: string;
}

export interface Material {
  slug: string;
  title: string;
  description: string;
  category: string;
  type: string;
  pages?: number;
  cover?: string;
  downloadUrl: string;
  content: string;
}

const postsDirectory = path.join(process.cwd(), 'content/blog');
const materialsDirectory = path.join(process.cwd(), 'content/materiais');

export const getBlogPosts = cache((): BlogPost[] => {
  if (!fs.existsSync(postsDirectory)) {
    return [];
  }

  const fileNames = fs.readdirSync(postsDirectory);
  const allPostsData = fileNames
    .filter((name) => name.endsWith('.mdx'))
    .map((fileName) => {
      const slug = fileName.replace(/\.mdx$/, '');
      const fullPath = path.join(postsDirectory, fileName);
      const fileContents = fs.readFileSync(fullPath, 'utf8');
      const { data, content } = matter(fileContents);

      return {
        slug,
        content,
        ...data,
      } as BlogPost;
    });

  return allPostsData.sort((a, b) => (a.date < b.date ? 1 : -1));
});

export const getBlogPostBySlug = cache((slug: string): BlogPost | null => {
  try {
    const fullPath = path.join(postsDirectory, `${slug}.mdx`);
    const fileContents = fs.readFileSync(fullPath, 'utf8');
    const { data, content } = matter(fileContents);

    return {
      slug,
      content,
      ...data,
    } as BlogPost;
  } catch {
    return null;
  }
});

export const getMaterials = cache((): Material[] => {
  if (!fs.existsSync(materialsDirectory)) {
    return [];
  }

  const fileNames = fs.readdirSync(materialsDirectory);
  const allMaterialsData = fileNames
    .filter((name) => name.endsWith('.mdx'))
    .map((fileName) => {
      const slug = fileName.replace(/\.mdx$/, '');
      const fullPath = path.join(materialsDirectory, fileName);
      const fileContents = fs.readFileSync(fullPath, 'utf8');
      const { data, content } = matter(fileContents);

      return {
        slug,
        content,
        ...data,
      } as Material;
    });

  return allMaterialsData;
});

export const getMaterialBySlug = cache((slug: string): Material | null => {
  try {
    const fullPath = path.join(materialsDirectory, `${slug}.mdx`);
    const fileContents = fs.readFileSync(fullPath, 'utf8');
    const { data, content } = matter(fileContents);

    return {
      slug,
      content,
      ...data,
    } as Material;
  } catch {
    return null;
  }
});

export const getBlogCategories = cache((): string[] => {
  const posts = getBlogPosts();
  const categories = [...new Set(posts.map((post) => post.category))];
  return categories.sort();
});

export const getMaterialCategories = cache((): string[] => {
  const materials = getMaterials();
  const categories = [...new Set(materials.map((material) => material.category))];
  return categories.sort();
});

export const getPostsByCategory = cache((category: string): BlogPost[] => {
  const posts = getBlogPosts();
  return posts.filter((post) => post.category === category);
});

export const getRelatedPosts = cache((currentSlug: string, category: string, limit: number = 3): BlogPost[] => {
  const posts = getBlogPosts();
  return posts
    .filter((post) => post.slug !== currentSlug && post.category === category)
    .slice(0, limit);
});
