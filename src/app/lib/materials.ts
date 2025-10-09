import { prisma } from '@/lib/prisma';

export interface Material {
  id: string;
  title: string;
  slug: string;
  description?: string;
  content?: string;
  category: string;
  type: string;
  cover?: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: string;
  pages?: number;
  published: boolean;
  featured: boolean;
  downloadCount: number;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  author: {
    name: string | null;
    email: string;
  };
}

export async function getMaterials(): Promise<Material[]> {
  try {
    const materials = await prisma.material.findMany({
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
      orderBy: [
        { featured: 'desc' }, // Featured materials first
        { publishedAt: 'desc' }
      ]
    });

    return materials.map(material => ({
      id: material.id,
      title: material.title,
      slug: material.slug,
      description: material.description || '',
      content: material.content || '',
      category: material.category,
      type: material.type,
      cover: material.cover || '',
      fileUrl: material.fileUrl || '',
      fileName: material.fileName || '',
      fileSize: material.fileSize || '',
      pages: material.pages || undefined,
      published: material.published,
      featured: material.featured,
      downloadCount: material.downloadCount,
      createdAt: material.createdAt.toISOString(),
      updatedAt: material.updatedAt.toISOString(),
      publishedAt: material.publishedAt?.toISOString(),
      author: material.author
    }));
  } catch (error) {
    console.error('Error fetching materials:', error);
    return [];
  }
}

export async function getFeaturedMaterials(): Promise<Material[]> {
  try {
    const materials = await prisma.material.findMany({
      where: {
        published: true,
        featured: true
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
      },
      take: 3
    });

    return materials.map(material => ({
      id: material.id,
      title: material.title,
      slug: material.slug,
      description: material.description || '',
      content: material.content || '',
      category: material.category,
      type: material.type,
      cover: material.cover || '',
      fileUrl: material.fileUrl || '',
      fileName: material.fileName || '',
      fileSize: material.fileSize || '',
      pages: material.pages || undefined,
      published: material.published,
      featured: material.featured,
      downloadCount: material.downloadCount,
      createdAt: material.createdAt.toISOString(),
      updatedAt: material.updatedAt.toISOString(),
      publishedAt: material.publishedAt?.toISOString(),
      author: material.author
    }));
  } catch (error) {
    console.error('Error fetching featured materials:', error);
    return [];
  }
}

export async function getMaterialBySlug(slug: string): Promise<Material | null> {
  try {
    const material = await prisma.material.findUnique({
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

    if (!material) return null;

    // Increment download count
    await prisma.material.update({
      where: { id: material.id },
      data: { downloadCount: { increment: 1 } }
    });

    return {
      id: material.id,
      title: material.title,
      slug: material.slug,
      description: material.description || '',
      content: material.content || '',
      category: material.category,
      type: material.type,
      cover: material.cover || '',
      fileUrl: material.fileUrl || '',
      fileName: material.fileName || '',
      fileSize: material.fileSize || '',
      pages: material.pages || undefined,
      published: material.published,
      featured: material.featured,
      downloadCount: material.downloadCount + 1,
      createdAt: material.createdAt.toISOString(),
      updatedAt: material.updatedAt.toISOString(),
      publishedAt: material.publishedAt?.toISOString(),
      author: material.author
    };
  } catch (error) {
    console.error('Error fetching material by slug:', error);
    return null;
  }
}

export async function getMaterialCategories(): Promise<string[]> {
  try {
    const categories = await prisma.material.findMany({
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
    console.error('Error fetching material categories:', error);
    return [];
  }
}












