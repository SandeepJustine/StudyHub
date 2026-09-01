import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { TrainingService } from '@/lib/corporate/training-service';

const trainingService = new TrainingService();

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'CORPORATE_CLIENT') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const clientId = await trainingService.getClientId(session.user.id);
    const { searchParams } = new URL(req.url);

    const result = await trainingService.listTrainingPackages(clientId, {
      status: searchParams.get('status') as any || undefined,
      category: searchParams.get('category') as any || undefined,
      page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 20,
    });

    return NextResponse.json({
      success: true,
      data: result.packages,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: Math.ceil(result.total / result.limit),
      },
    });
  } catch (error: any) {
    const status = error.statusCode || 500;
    return NextResponse.json({ error: error.message || 'Failed to fetch training packages' }, { status });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'CORPORATE_CLIENT') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const clientId = await trainingService.getClientId(session.user.id);
    const pkg = await trainingService.createTrainingPackage(clientId, body);

    return NextResponse.json({ success: true, data: pkg }, { status: 201 });
  } catch (error: any) {
    const status = error.statusCode || 500;
    return NextResponse.json({ error: error.message || 'Failed to create training package' }, { status });
  }
}
