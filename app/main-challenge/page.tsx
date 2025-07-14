import { CheckCircle } from 'lucide-react'
import React from 'react'

const page = () => {
  return (
    <div>
         <div className="min-h-screen bg-gradient-to-br from-blue-100 to-indigo-200 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-5xl">
        <h1 className="text-5xl font-extrabold text-indigo-900 text-center mb-8 drop-shadow-lg">Coding challenge 2025</h1>
        <div className="bg-white p-6 rounded-2xl shadow-2xl space-y-6">
          <p className="text-center text-indigo-700">Embark on a 30-day hackers marathon</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="p-4 bg-indigo-50 rounded-xl shadow-md hover:shadow-lg transition-shadow">
              <h2 className="text-xl font-semibold text-indigo-800">Task 1</h2>
              <p className="text-indigo-600"> 5 dsa question - 20 JP</p>
              <CheckCircle className="w-6 h-6 text-green-500 mt-2" />
            </div>
            <div className="p-4 bg-indigo-50 rounded-xl shadow-md hover:shadow-lg transition-shadow">
              <h2 className="text-xl font-semibold text-indigo-800">Task 2</h2>
              <p className="text-indigo-600">5 Game Apps - 15 JP</p>
              <CheckCircle className="w-6 h-6 text-green-500 mt-2" />
            </div>
            <div className="p-4 bg-indigo-50 rounded-xl shadow-md hover:shadow-lg transition-shadow">
              <h2 className="text-xl font-semibold text-indigo-800">Task 3</h2>
              <p className="text-indigo-600">10 New api made - 10 JP</p>
              <CheckCircle className="w-6 h-6 text-green-500 mt-2" />
            </div>
          </div>
          <button className="bg-gradient-to-r from-green-500 to-teal-600 text-white p-3 rounded-xl hover:from-green-600 hover:to-teal-700 transition-all w-full mt-6">
            Start Challenge Today
          </button>
        </div>
      </div>
    </div>
    </div>
  )
}

export default page