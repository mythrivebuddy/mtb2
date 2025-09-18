import Link from "next/link";
import AccountabilityHeader from "@/components/accountability-hub/AccountabilityHeader";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";


const members = [
  {
    id: 1,
    name: "Anna",
    avatar: "https://i.pravatar.cc/40?img=1",
    goal: "Launch new product",
    midway: "Completed 50%",
    end: "200 pre-orders",
    notes: "Met all milestones",
  },
  {
    id: 2,
    name: "Michael",
    avatar: "https://i.pravatar.cc/40?img=4",
    goal: "Launch new product",
    midway: "Completed 50%",
    end: "200 pre-orders",
    notes: "Met all milestones",
  },
  {
    id: 3,
    name: "John",
    avatar: "https://i.pravatar.cc/40?img=6",
    goal: "Launch new product",
    midway: "Completed 50%",
    end: "200 pre-orders",
    notes: "Met all milestones",
  },
  {
    id: 4,
    name: "Mick",
    avatar: "https://i.pravatar.cc/40?img=8",
    goal: "Launch new product",
    midway: "Completed 50%",
    end: "200 pre-orders",
    notes: "Met all milestones",
  },
];

export default function AccountabilityHubPage() {
  return (
    <section className="mx-auto w-full sm:w-2/3">
       
      <AccountabilityHeader />

      <div className="w-full max-w-8xl mx-auto border rounded-md mt-6">
        <Table className="w-full bg-white rounded-lg">
          <TableHeader>
            <TableRow>
              <TableHead className="w-[15%] px-2">Member</TableHead>
              <TableHead className="w-[12%] text-center">Goal</TableHead>
              <TableHead className="w-[15%] text-center">Midway update</TableHead>
              <TableHead className="w-[14%] text-center">End Result</TableHead>
              <TableHead className="w-[10%] text-center">Notes</TableHead>
              <TableHead className="text-center w-[15%]">Comments</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {members.map((m) => (
              <TableRow key={m.id}>
                <TableCell className="px-2 align-middle">
                  <Link
                    href={{
                      pathname: `/dashboard/accountability-hub/member/${m.id}`,
                      query: {
                        name: m.name,
                        goal: m.goal,
                        midway: m.midway,
                        end: m.end,
                        notes: m.notes,
                        avatar: m.avatar,
                      },
                    }}
                  >
                    <div className="flex items-center gap-2 cursor-pointer">
                      <img
                        src={m.avatar}
                        alt={m.name}
                        className="h-8 w-8 rounded-full"
                      />
                      {m.name}
                    </div>
                  </Link>
                </TableCell>
                <TableCell className="align-middle text-center">{m.goal}</TableCell>
                <TableCell className="align-middle text-blue-600 text-center">
                  {m.midway}
                </TableCell>
                <TableCell className="align-middle text-center">{m.end}</TableCell>
                <TableCell className="align-middle text-center">{m.notes}</TableCell>
                <TableCell className="align-middle text-center text-blue-600 cursor-pointer">
                  Comment
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </section>
  );
}
