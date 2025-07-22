'use client';

import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronDown } from 'lucide-react';

export default function Dashboard() {
  return (
    <AppLayout>
      <main className="max-w-5xl mx-auto py-12 px-4">
        <h1 className="text-2xl font-bold mb-4">Here’s what solopreneurs like you are doing</h1>

        {/* Dummy Data Badge */}
        <div className="inline-block mb-6 px-3 py-1 text-sm bg-yellow-100 text-yellow-800 rounded-full font-medium">
          Showing dummy data
        </div>

        {/* Filters */}
        <div className="flex gap-4 mb-8">
          <button className="px-3 py-1 bg-gray-100 rounded flex items-center">Niche <ChevronDown /></button>
          <button className="px-3 py-1 bg-gray-100 rounded flex items-center">Revenue Bracket<ChevronDown /></button>
          <button className="px-3 py-1 bg-gray-100 rounded flex items-center">Experience Level<ChevronDown /></button>
          <button className="px-3 py-1 bg-gray-100 rounded flex items-center">Location<ChevronDown /></button>
        </div>

        {/* Chart Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          <Card>
            <CardHeader>
              <CardTitle>Most popular newsletter send day</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end justify-between h-32 px-2">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, idx) => (
                  <div key={day} className="flex flex-col items-center">
                    <div
                      className="w-6 bg-gray-300 rounded"
                      style={{ height: [50, 70, 90, 110, 80, 60, 55][idx] + 'px' }}
                    />
                    <span className="mt-2 text-xs">{day}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>
                How solopreneurs earning ₹1L+/month allocate their time
              </CardTitle>
            </CardHeader>
            <CardContent>
              {[
                { category: 'Marketing', value: 80 },
                { category: 'Content Creation', value: 50 },
                { category: 'Sales', value: 35 },
                { category: 'Customer Support', value: 25 },
                { category: 'Admin', value: 40 }
              ].map((item) => (
                <div className="mb-2" key={item.category}>
                  <div className="flex justify-between text-xs">
                    <span>{item.category}</span>
                    <span>{item.value}%</span>
                  </div>
                  <div className="w-full bg-gray-200 h-2 rounded">
                    <div
                      className="bg-blue-400 h-2 rounded"
                      style={{ width: `${item.value}%` }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Key Insights Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardContent className="flex flex-col items-center justify-center p-0 h-48 bg-green-100">
              <div className="flex items-center w-full justify-between px-20">
                <div className="w-16 h-32 bg-green-400 rounded-lg" />
                <div className="w-24 h-4 bg-green-300 rounded my-10" />
                <div className="w-16 h-32 bg-green-400 rounded-lg" />
              </div>
            </CardContent>
            <div className="text-center py-4 text-sm text-gray-600">Top performing platforms</div>
          </Card>
          <Card>
            <CardContent className="flex items-center justify-center p-0 h-48 bg-orange-100">
              <div className="w-32 h-32 bg-orange-300 rounded-full" />
            </CardContent>
            <div className="text-center py-4 text-sm text-gray-600">Average pricing per offer</div>
          </Card>
        </div>
      </main>
    </AppLayout>
  );
}
