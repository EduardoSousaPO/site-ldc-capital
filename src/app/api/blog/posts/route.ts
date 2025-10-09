import { NextResponse } from 'next/server';
import { getBlogPosts } from '@/app/lib/blog';

export async function GET() {
  try {
    const posts = await getBlogPosts();
    return NextResponse.json(posts);
  } catch (error) {
    console.error('Error fetching blog posts:', error);
    return NextResponse.json([], { status: 200 }); // Return empty array instead of error
  }
}
