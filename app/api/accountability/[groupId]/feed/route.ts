export async function GET(
  _req: Request,
  { params }: { params: { groupId: string } }
) {
  const { groupId } = params;
  // For now return mocked items. Replace with DB query later.
  const items = [
    { id: `${groupId}-1`, icon: "result", title: "Sarah completed her goal: Launch new website", time: "2 hours ago" },
    { id: `${groupId}-2`, icon: "goal", title: "Michael set a new goal: Increase social media engagement by 20%", time: "Yesterday" },
    { id: `${groupId}-3`, icon: "cycle", title: "Group cycle started", time: "3 days ago" },
  ];
  return Response.json({ items });
}


