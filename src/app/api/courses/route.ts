import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { courseService } from '@/lib/courses/course-service';
import prisma from '@/lib/utils/prisma';

// Get courses (with search/filter)
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    
    const params = {
      query: searchParams.get('query') || undefined,
      subject: searchParams.get('subject') || undefined,
      examBoard: searchParams.get('examBoard') || undefined,
      grade: searchParams.get('grade') || undefined,
      priceMin: searchParams.get('priceMin') ? parseInt(searchParams.get('priceMin')!) : undefined,
      priceMax: searchParams.get('priceMax') ? parseInt(searchParams.get('priceMax')!) : undefined,
      rating: searchParams.get('rating') ? parseFloat(searchParams.get('rating')!) : undefined,
      sortBy: searchParams.get('sortBy') as any || 'newest',
      sortOrder: searchParams.get('sortOrder') as any || 'desc',
      page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 12,
    };

    const result = await courseService.searchCourses(params);

    return NextResponse.json({
      success: true,
      data: result.courses,
      pagination: result.pagination,
    });

  } catch (error) {
    console.error('Get courses error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch courses' },
      { status: 500 }
    );
  }
}

// Create course (instructor only)
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'INSTRUCTOR') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the actual instructor ID from the Instructor table
    const instructor = await prisma.instructor.findFirst({
      where: { userId: session.user.id },
      select: { id: true },
    });

    if (!instructor) {
      return NextResponse.json(
        { error: 'Instructor profile not found. Please complete your profile setup.' },
        { status: 404 }
      );
    }

    const body = await req.json();
    
    // Use the actual instructor.id, not session.user.id
    const course = await courseService.createCourse(instructor.id, body);

    return NextResponse.json({
      success: true,
      data: course,
    }, { status: 201 });

  } catch (error: any) {
    console.error('Create course error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create course' },
      { status: 500 }
    );
  }
}