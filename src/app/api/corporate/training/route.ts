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
    const contracts = await trainingService.getClientContracts(clientId);

    return NextResponse.json({ success: true, data: contracts });
  } catch (error: any) {
    const status = error.statusCode || 500;
    return NextResponse.json({ error: error.message || 'Failed to fetch training contracts' }, { status });
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
    const contract = await trainingService.createTrainingPackage(clientId, body);

    return NextResponse.json({ success: true, data: contract }, { status: 201 });
  } catch (error: any) {
    const status = error.statusCode || 500;
    return NextResponse.json({ error: error.message || 'Failed to create training package' }, { status });
  }
}
