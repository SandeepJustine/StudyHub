import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { TrainingService } from '@/lib/corporate/training-service';

const trainingService = new TrainingService();

export async function GET(req: Request, { params }: { params: Promise<{ packageId: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'CORPORATE_CLIENT') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { packageId } = await params;
    const clientId = await trainingService.getClientId(session.user.id);
    const pkg = await trainingService.getTrainingPackage(packageId, clientId);

    return NextResponse.json({ success: true, data: pkg });
  } catch (error: any) {
    const status = error.statusCode || 500;
    return NextResponse.json({ error: error.message || 'Failed to fetch training package' }, { status });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ packageId: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'CORPORATE_CLIENT') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { packageId } = await params;
    const body = await req.json();
    const clientId = await trainingService.getClientId(session.user.id);
    const pkg = await trainingService.updateTrainingPackage(packageId, clientId, body);

    return NextResponse.json({ success: true, data: pkg });
  } catch (error: any) {
    const status = error.statusCode || 500;
    return NextResponse.json({ error: error.message || 'Failed to update training package' }, { status });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ packageId: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'CORPORATE_CLIENT') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { packageId } = await params;
    const clientId = await trainingService.getClientId(session.user.id);
    await trainingService.deleteTrainingPackage(packageId, clientId);

    return NextResponse.json({ success: true, message: 'Training package deleted' });
  } catch (error: any) {
    const status = error.statusCode || 500;
    return NextResponse.json({ error: error.message || 'Failed to delete training package' }, { status });
  }
}
