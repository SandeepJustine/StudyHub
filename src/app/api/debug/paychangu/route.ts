// app/api/debug/paychangu/route.ts

import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { method = 'AIRTEL_MONEY', phone, amount = 100 } = body;

    const secretKey = process.env.PAYCHANGU_SECRET_KEY || '';
    const baseUrl = process.env.PAYCHANGU_BASE_URL || 'https://api.paychangu.com';

    // Get operator ref ID
    const operatorRefId = method === 'AIRTEL_MONEY' 
      ? '20be6c20-adeb-4b5b-a7ba-0769820df4fb'
      : '27494cb5-ba9e-437f-a114-4e7a7686bcca';

    const chargeId = `DEBUG-${Date.now()}`;
    const mobile = phone || '+265997011620';

    const payload = {
      mobile_money_operator_ref_id: operatorRefId,
      amount: amount.toString(),
      charge_id: chargeId,
      mobile: mobile,
      payment_method: 'mobile_money',
      currency: 'MWK',
      email: 'test@studyhub.mw',
      first_name: 'Test',
      last_name: 'User',
    };

    console.log('=== PayChangu Debug Request ===');
    console.log('URL:', `${baseUrl}/mobile-money/payments/initialize`);
    console.log('Headers:', {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${secretKey.substring(0, 10)}...`,
    });
    console.log('Payload:', JSON.stringify(payload, null, 2));

    const response = await fetch(`${baseUrl}/mobile-money/payments/initialize`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${secretKey}`,
      },
      body: JSON.stringify(payload),
    });

    const responseText = await response.text();
    
    console.log('=== PayChangu Debug Response ===');
    console.log('Status:', response.status, response.statusText);
    console.log('Headers:', Object.fromEntries(response.headers.entries()));
    console.log('Body:', responseText);

    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = responseText;
    }

    return NextResponse.json({
      request: {
        url: `${baseUrl}/mobile-money/payments/initialize`,
        payload,
        headers: {
          Authorization: `Bearer ${secretKey.substring(0, 10)}...`,
        },
      },
      response: {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        body: responseData,
      },
      success: response.ok,
    });

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack,
    }, { status: 500 });
  }
}