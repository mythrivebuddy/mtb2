import { NextResponse } from 'next/server';
import { prisma } from "@/lib/prisma";


export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { question, answer } = body;

    if (!question || !answer) {
      return NextResponse.json(
        { message: 'Question and Answer are required.' },
        { status: 400 }
      );
    }

    const newFaq = await prisma.faq.create({
      data: { question, answer },
    });

    return NextResponse.json(newFaq, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { message: 'Failed to create FAQ', error },
      { status: 500 }
    );
  }
}


export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  const faqId = params.id;

  try {
    await prisma.faq.delete({
      where: { id: faqId },
    });

    return NextResponse.json({ message: 'FAQ deleted successfully' }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: 'FAQ not found or already deleted' }, { status: 404 });
  }
}



export async function GET(req: Request) {
    try {
      const faqs = await prisma.faq.findMany();
      return NextResponse.json(faqs, { status: 200 });
    } catch (error) {
      return NextResponse.json(
        { message: 'Failed to fetch FAQs', error },
        { status: 500 }
      );
    }
}


