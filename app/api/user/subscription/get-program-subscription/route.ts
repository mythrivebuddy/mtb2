// /api/user/subscription/get-program-subscription
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import {prisma} from "@/lib/prisma"
import { PaymentStatus } from "@prisma/client";

export const GET = async() => {
  try {
    const session = await getServerSession(authOptions);
    if(!session?.user){
        return NextResponse.json({error:"Unauthorized"},{status:401})
    }
    const programSubscription = await prisma.oneTimeProgramPurchase.findFirst({
        where:{userId:session.user.id,status:PaymentStatus.PAID},
    });
    
    return NextResponse.json({programSubscription})
  } catch (error) {
    console.log(error);
    return NextResponse.json({error:"Internal Server Error"},{status:500})
    
  }
}
