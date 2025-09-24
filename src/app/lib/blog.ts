import { prisma } from '@/lib/prisma';

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  summary?: string;
  category: string;
  cover?: string;
  published: boolean;
  readingTime?: string;
  date: string;
  updatedAt: string;
  author: {
    name: string | null;
    email: string;
  };
}

export async function getBlogPosts(): Promise<BlogPost[]> {
  try {
    const posts = await prisma.blogPost.findMany({
      where: {
        published: true
      },
      include: {
        author: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        publishedAt: 'desc'
      }
    });

    return posts.map(post => ({
      id: post.id,
      title: post.title,
      slug: post.slug,
      content: post.content,
      summary: post.summary || '',
      category: post.category,
      cover: post.cover || '',
      published: post.published,
      readingTime: post.readingTime || '5 min',
      date: post.publishedAt?.toISOString() || post.createdAt.toISOString(),
      updatedAt: post.updatedAt.toISOString(),
      author: post.author
    }));
  } catch (error) {
    console.error('Error fetching blog posts:', error);
    return [];
  }
}

export async function getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  try {
    const post = await prisma.blogPost.findUnique({
      where: {
        slug: slug,
        published: true
      },
      include: {
        author: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });

    if (!post) return null;

    return {
      id: post.id,
      title: post.title,
      slug: post.slug,
      content: post.content,
      summary: post.summary || '',
      category: post.category,
      cover: post.cover || '',
      published: post.published,
      readingTime: post.readingTime || '5 min',
      date: post.publishedAt?.toISOString() || post.createdAt.toISOString(),
      updatedAt: post.updatedAt.toISOString(),
      author: post.author
    };
  } catch (error) {
    console.error('Error fetching blog post:', error);
    return null;
  }
}

export async function getBlogCategories(): Promise<string[]> {
  try {
    const categories = await prisma.blogPost.findMany({
      where: {
        published: true
      },
      select: {
        category: true
      },
      distinct: ['category']
    });

    return categories.map(cat => cat.category);
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
}

