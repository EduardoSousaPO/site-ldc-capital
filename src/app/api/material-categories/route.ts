import { NextResponse } from 'next/server';
import { getMaterialCategories } from '@/app/lib/materials';

export async function GET() {
  try {
    const categories = await getMaterialCategories();
    return NextResponse.json(categories);
  } catch (error) {
    console.error('Error fetching material categories:', error);
    return NextResponse.json([], { status: 200 }); // Return empty array instead of error
  }
}
