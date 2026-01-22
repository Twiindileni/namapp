'use client'

export default function AnimatedBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden opacity-70">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-800 via-purple-700 to-pink-500 animate-gradient-flow-1" />
      <div className="absolute inset-0 bg-gradient-to-tl from-blue-700 via-indigo-600 to-purple-800 animate-gradient-flow-2" />
      <div className="absolute inset-0 bg-gradient-to-tr from-purple-500 via-pink-600 to-blue-500 animate-gradient-flow-3" />
    </div>
  )
} 