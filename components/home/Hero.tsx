'use client'

import { motion } from 'framer-motion'

export default function Hero() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6 max-w-2xl"
    >
      <div className="space-y-2">
        <h1 className="text-[56px] font-bold text-[#1E2875] leading-tight">
          Solopreneurship
        </h1>
        <h1 className="text-[56px] font-bold text-[#7B90FF] leading-tight">
          Made Amazing
        </h1>
      </div>
      
      <p className="text-[18px] text-[#636363] leading-relaxed max-w-xl">
        Join the world's only platform / ecosystem that aims to provide growth, joy, sense of belonging.
      </p>

      <div className="pt-4">
        <div className="flex flex-wrap gap-3 mb-3 justify-center sm:justify-start">
          <CategoryTag>Trainer</CategoryTag>
          <CategoryTag>Coach</CategoryTag>
          <CategoryTag>Healer</CategoryTag>
          <CategoryTag>Consultant</CategoryTag>
        </div>
        <div className="flex flex-wrap gap-3 justify-center sm:justify-start">
          <CategoryTag>Designer</CategoryTag>
          <CategoryTag>Developer</CategoryTag>
          <CategoryTag>Astrologer</CategoryTag>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 mt-8 shadow-sm">
        <div className="space-y-4">
          <input
            type="text"
            placeholder="Username"
            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-[#7B90FF]"
          />
          <input
            type="password"
            placeholder="Password"
            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-[#7B90FF]"
          />
          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center space-x-2 text-gray-600">
              <input type="checkbox" className="rounded border-gray-300" />
              <span>Remember Me</span>
            </label>
            <a href="#" className="text-[#7B90FF] hover:underline">
              Forgot password
            </a>
          </div>
          <button className="w-full bg-[#1E2875] text-white py-3 rounded-lg font-medium hover:bg-[#1E2875]/90 transition-colors">
            SignIn
          </button>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">or</span>
            </div>
          </div>
          <button className="w-full border border-gray-200 py-3 rounded-lg flex items-center justify-center space-x-2 hover:bg-gray-50 transition-colors">
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            <span className="text-gray-700">SignIn with Google</span>
          </button>
        </div>
      </div>
    </motion.div>
  )
}

function CategoryTag({ children }: { children: React.ReactNode }) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      className="px-6 py-2.5 rounded-full bg-white text-[#1E2875] text-[15px] font-medium shadow-sm hover:shadow-md transition-all"
    >
      {children}
    </motion.button>
  )
} 