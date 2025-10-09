import { NextResponse } from 'next/server';
import { getBlogCategories } from '@/app/lib/blog';

export async function GET() {
  try {
    const categories = await getBlogCategories();
    return NextResponse.json(categories);
  } catch (error) {
    console.error('Error fetching blog categories:', error);
    return NextResponse.json([], { status: 200 }); // Return empty array instead of error
  }
}
