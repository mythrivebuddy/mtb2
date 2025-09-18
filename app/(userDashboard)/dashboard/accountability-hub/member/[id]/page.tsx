"use client";
import { useSearchParams } from "next/navigation";

export default function MemberPage() {
  const searchParams = useSearchParams();

  const name = searchParams.get("name") ?? "Sophia Bennett";
  const goalDate = searchParams.get("goal") ?? "Jan 15, 2024";
  const midwayDate = searchParams.get("midway") ?? "Feb 15, 2024";
  const endDate = searchParams.get("end") ?? "Mar 15, 2024";
  const notes =
    searchParams.get("notes") ??
    "Sophia is doing great! She's been consistently hitting her targets and is a valuable contributor to the community. Keep up the excellent work, Sophia!";
  const avatar =
    searchParams.get("avatar") ??
    "https://via.placeholder.com/150";

  return (
    <section className="mx-4 sm:mx-4  py-4 sm:p-6">
      {/* Breadcrumb */}
      <p className="text-sm text-gray-500 mb-4">
        Accountability Hub /{" "}
        <span className="text-gray-700 font-medium">Member Progress</span>
      </p>

      {/* Header */}
      <div className="flex items-center gap-4">
        <img
          src={avatar}
          alt={name}
          className="h-20 w-20 rounded-full border object-cover"
        />
        <div>
          <h1 className="text-2xl font-bold">{name}</h1>
          <p className="text-blue-600">Consultant</p>
        </div>
      </div>

      {/* Timeline with vertical line */}
      <div className="mt-6">
        <div className="relative pl-6">
          {/* vertical line */}
          <div className="absolute left-2 top-2 bottom-2 w-0.5 bg-gray-300"></div>
            <div className="absolute left-0 top-1 w-4 h-4 rounded-full bg-gray-900"></div>

          {/* Goal */}
          <div className="relative mb-6">
            <h3 className="font-semibold">Goal</h3>
            <p className="text-gray-600">{goalDate}</p>
          </div>

          {/* Midway */}
           <div className="absolute left-0 top-[40%] w-4 h-4 rounded-full bg-gray-900"></div>
          <div className="relative mb-6">
           
            <h3 className="font-semibold">Midway Update</h3>
            <p className="text-gray-600">{midwayDate}</p>
          </div>

          {/* End Progress */}
            <div className="absolute left-0 top-[90%] w-4 h-4 rounded-full bg-gray-900"></div>
          <div className="relative">
            <h3 className="font-semibold">End Progress</h3>
            <p className="text-gray-600">{endDate}</p>
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className="mt-6">
        <h3 className="font-semibold">Notes</h3>
        <p className="text-gray-700 mt-1">{notes}</p>
      </div>

      {/* Comments */}
      <div className="mt-6">
        <h3 className="font-semibold mb-3">Comments</h3>
        <div className="space-y-4 text-gray-700">
          <div>
            <p className="font-medium">
              Ethan Carter{" "}
              <span className="text-sm text-gray-500">2 weeks ago</span>
            </p>
            <p>
              Great job,{name} Your progress is truly inspiring. Keep pushing
              forward!
            </p>
          </div>
          <div className="ml-4 border-l-2 pl-4 border-gray-200">
            <p className="font-medium">
              {name} <span className="text-sm text-gray-500">2 weeks ago</span>
            </p>
            <p>
              Thanks, Ethan! I appreciate the encouragement. It’s the community
              support that keeps me going.
            </p>
          </div>
          <div>
            <p className="font-medium">
              Olivia Harper{" "}
              <span className="text-sm text-gray-500">1 week ago</span>
            </p>
            <p>
             {name} your dedication is commendable. It’s been a pleasure
              seeing your growth. Keep shining!
            </p>
          </div>
        </div>
      </div>

      {/* Action button */}
      <button className="mt-6 px-4 py-2 rounded bg-gray-900 text-white hover:bg-gray-800">
        Send Nudge
      </button>
    </section>
  );
}
