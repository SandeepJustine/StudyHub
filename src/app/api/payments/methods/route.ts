import { NextResponse } from 'next/server';
import { PayChanguAdapter } from '@/lib/payments/adapters/paychangu.adapter';

const paychangu = new PayChanguAdapter();

export async function GET() {
  try {
    const operators = await paychangu.getMobileMoneyOperators();

    if (!operators.data || operators.data.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          operators: [],
          hardcodedOperators: [
            {
              name: 'TNM Mpamba',
              ref_id: '27494cb5-ba9e-437f-a114-4e7a7686bcca',
              short_code: 'tnm',
              providerMethod: 'TNM_MPAMBA',
              supports_withdrawals: true,
              country: 'Malawi',
              currency: 'MWK',
            },
            {
              name: 'Airtel Money',
              ref_id: '20be6c20-adeb-4b5b-a7ba-0769820df4fb',
              short_code: 'airtel',
              providerMethod: 'AIRTEL_MONEY',
              supports_withdrawals: true,
              country: 'Malawi',
              currency: 'MWK',
            },
          ],
        },
      });
    }

    const mappedOperators = paychangu.mapOperatorsToProviders(operators.data);

    return NextResponse.json({
      success: true,
      data: {
        operators: mappedOperators,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: true,
        data: {
          operators: [],
          hardcodedOperators: [
            {
              name: 'TNM Mpamba',
              ref_id: '27494cb5-ba9e-437f-a114-4e7a7686bcca',
              short_code: 'tnm',
              providerMethod: 'TNM_MPAMBA',
              supports_withdrawals: true,
              country: 'Malawi',
              currency: 'MWK',
            },
            {
              name: 'Airtel Money',
              ref_id: '20be6c20-adeb-4b5b-a7ba-0769820df4fb',
              short_code: 'airtel',
              providerMethod: 'AIRTEL_MONEY',
              supports_withdrawals: true,
              country: 'Malawi',
              currency: 'MWK',
            },
          ],
        },
      },
      { status: 200 }
    );
  }
}