import { NextRequest, NextResponse } from 'next/server';
import { vapiPhoneNumberService } from '@/services/VapiPhoneNumberService';

export async function GET() {
  try {
    const result = await vapiPhoneNumberService.getPhoneNumberConfig();
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      phoneNumber: result.phoneNumber
    });
  } catch (error) {
    console.error('Error getting phone number config:', error);
    return NextResponse.json(
      { error: 'Failed to get phone number configuration' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, customMessage, hook } = body;

    let result;

    switch (action) {
      case 'disable_incoming':
        result = await vapiPhoneNumberService.disableIncomingCalls(undefined, customMessage);
        break;
      
      case 'enable_incoming':
        result = await vapiPhoneNumberService.enableIncomingCalls();
        break;
      
      case 'set_custom_hook':
        if (!hook) {
          return NextResponse.json(
            { error: 'Hook configuration is required for custom hook action' },
            { status: 400 }
          );
        }
        result = await vapiPhoneNumberService.setCustomHook(hook);
        break;
      
      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: disable_incoming, enable_incoming, or set_custom_hook' },
          { status: 400 }
        );
    }

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      phoneNumber: result.phoneNumber,
      message: `Successfully ${action.replace('_', ' ')}`
    });
  } catch (error) {
    console.error('Error updating phone number hooks:', error);
    return NextResponse.json(
      { error: 'Failed to update phone number configuration' },
      { status: 500 }
    );
  }
}