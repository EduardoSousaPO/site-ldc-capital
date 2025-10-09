import { NextResponse } from 'next/server';
import { getMaterials } from '@/app/lib/materials';

export async function GET() {
  try {
    const materials = await getMaterials();
    return NextResponse.json(materials);
  } catch (error) {
    console.error('Error fetching materials:', error);
    return NextResponse.json([], { status: 200 }); // Return empty array instead of error
  }
}
