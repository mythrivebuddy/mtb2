"use client";
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { PlusCircle } from "lucide-react";

export default function AccountabilityHeader() {
  return (
    <div className="space-y-4 pt-6 mx-auto">
      <div className="flex w-full place-items-start">
        <div className="relative -left-[21%]">

  <button className="flex items-start gap-2 text-indigo-600 hover:text-indigo-800 transition">
                  <PlusCircle size={28} />
                  <span className="font-semibold hidden sm:inline">Create</span>
                </button>
        </div>
      
        
      <div className="relative flex-1 -left-20  text-start ">
        <h1 className="text-2xl font-bold">Accountability Hub</h1>
        <p className="text-muted-foreground">
          Track and motivate your solopreneur community&apos;s monthly goals.
        </p>
      </div>
      </div>
      <div className="">
        <div className="relative w-full">
        <Input
          type="text"
          placeholder="Search members"
          className="max-w-7xl"
        />
        </div>  
        
      </div>
      <div className="flex justify-end">

         <Button className="ml-2 bg-blue-600 hover:bg-blue-700">Add Member</Button>
      </div>
    </div>
  )
}
