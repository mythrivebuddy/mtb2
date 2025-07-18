
import { NextRequest, NextResponse } from "next/server"

export const POST = async(request:NextRequest) => {
  try {
    const {userId} = await request.json();
      if (!userId) {
            return NextResponse.json({error:"User ID is required"}, {status:400});
        }
          await prisma?.user?.update({
            where:{id:userId},
            data:{isFirstTimeSurvey:false}
        });
        return NextResponse.json({success:true},{status:200});
  } catch (error:unknown) {
       return NextResponse.json({error:`Error marking user first survey ${error}` }, {status:500});
  }
}
