import { NextRequest, NextResponse } from 'next/server';
import { generateChatResponse } from '@/lib/gemini-client';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Input validation schema
const ChatRequestSchema = z.object({
  customer_id: z.number().int().positive(),
  message: z.string().min(1).max(1000),
  session_id: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const startTime = Date.now();

  try {
    // Parse and validate request
    const body = await req.json();
    const validation = ChatRequestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request',
          details: validation.error.errors,
        },
        { status: 400 }
      );
    }

    const { customer_id, message, session_id } = validation.data;

    // Fetch customer with repair history
    const customer = await prisma.customer.findUnique({
      where: { id: customer_id },
      include: {
        repairOrders: {
          include: {
            deviceModel: {
              include: {
                brand: true,
              },
            },
            repairOrderItems: {
              include: {
                repairType: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 10,
        },
      },
    });

    if (!customer) {
      return NextResponse.json(
        {
          success: false,
          error: 'Customer not found',
        },
        { status: 404 }
      );
    }

    // Build context for AI
    const activeRepairs = customer.repairOrders.filter(
      order => !['completed', 'delivered', 'cancelled'].includes(order.status)
    );

    const repairHistory = customer.repairOrders.map(order => ({
      deviceType: `${order.deviceModel.brand.name} ${order.deviceModel.name}`,
      deviceModel: order.deviceModel.name,
      repairType: order.repairOrderItems.map(item => item.repairType.name).join(', '),
      status: order.status,
      totalCost: order.totalPrice,
      createdAt: order.createdAt,
    }));

    const customerContext = {
      name: `${customer.firstName} ${customer.lastName}`,
      repairHistory,
      activeRepairs: activeRepairs.map(order => ({
        deviceType: `${order.deviceModel.brand.name} ${order.deviceModel.name}`,
        deviceModel: order.deviceModel.name,
        repairType: order.repairOrderItems.map(item => item.repairType.name).join(', '),
        status: order.status,
        orderNumber: order.orderNumber,
        estimatedCompletion: order.estimatedCompletion,
        createdAt: order.createdAt,
      })),
    };

    // Generate AI response
    const aiResponse = await generateChatResponse(customerContext, message);

    const responseTime = Date.now() - startTime;

    if (!aiResponse.success) {
      console.error('AI Chat failed:', aiResponse.error);

      return NextResponse.json(
        {
          success: false,
          error: aiResponse.error || 'Failed to generate response',
        },
        { status: 500 }
      );
    }

    // Save chat history (TODO: uncomment when migrations run)
    /*
    await prisma.chatHistory.createMany({
      data: [
        {
          customerId: customer_id,
          sessionId: session_id,
          role: 'user',
          message,
          metadata: {
            timestamp: new Date().toISOString(),
          },
        },
        {
          customerId: customer_id,
          sessionId: session_id,
          role: 'assistant',
          message: aiResponse.data!,
          metadata: {
            model: aiResponse.metadata?.model,
            responseTime,
            timestamp: new Date().toISOString(),
          },
        },
      ],
    });
    */

    // Log analytics
    console.log('AI Chat Analytics:', {
      endpoint: '/api/ai/chat',
      model: aiResponse.metadata?.model,
      responseTime,
      success: true,
      customerId: customer_id,
      messageLength: message.length,
      responseLength: aiResponse.data!.length,
    });

    return NextResponse.json({
      success: true,
      reply: aiResponse.data,
      customer_name: customerContext.name,
      active_repairs_count: activeRepairs.length,
      metadata: {
        ...aiResponse.metadata,
        responseTime,
        timestamp: new Date().toISOString(),
      },
    });

  } catch (error: any) {
    console.error('AI Chat API Error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'An unexpected error occurred',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// Get chat history
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const customer_id = searchParams.get('customer_id');
    const session_id = searchParams.get('session_id');

    if (!customer_id) {
      return NextResponse.json(
        { error: 'customer_id required' },
        { status: 400 }
      );
    }

    // TODO: Uncomment when migrations run
    /*
    const chatHistory = await prisma.chatHistory.findMany({
      where: {
        customerId: parseInt(customer_id),
        ...(session_id && { sessionId: session_id }),
      },
      orderBy: {
        createdAt: 'asc',
      },
      take: 100,
    });

    return NextResponse.json({
      success: true,
      chat_history: chatHistory,
    });
    */

    return NextResponse.json({
      success: true,
      chat_history: [],
      message: 'Chat history will be available after database migration',
    });

  } catch (error: any) {
    console.error('Get Chat History Error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch chat history',
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
