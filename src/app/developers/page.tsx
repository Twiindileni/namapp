'use client'

import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import Link from 'next/link'

export default function DevelopersPage() {
  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      <div className="animated-background">
        <div className="floating-shapes">
          <div className="shape"></div>
          <div className="shape"></div>
          <div className="shape"></div>
        </div>
      </div>
      <Navbar />
      <main className="flex-grow relative z-10 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto glass-effect rounded-lg p-8 sm:p-10 lg:p-12 shadow-xl">
          <h1 className="text-4xl font-bold text-gray-900 mb-6 text-center leading-tight">
            <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Developers
            </span>
          </h1>
          <div className="space-y-6 text-lg text-gray-700 leading-relaxed">
            <p>
              Welcome, talented developers! NamApp is dedicated to empowering you to showcase your incredible applications to a wider Namibian audience.
            </p>
            <p>
              Our platform provides the tools and visibility you need to get your apps discovered. We are passionate about fostering a thriving local tech ecosystem and helping your creations reach their full potential.
            </p>
          </div>
          
          <h2 className="text-3xl font-semibold text-gray-900 mt-10 mb-4 border-b pb-2">
            <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Why Publish on NamApp?
            </span>
          </h2>
          <ul className="list-disc list-inside space-y-3 text-lg text-gray-700 leading-relaxed">
            <li>
              <strong>Reach a Local Audience:</strong> Connect directly with users in Namibia who are looking for innovative local solutions.
            </li>
            <li>
              <strong>Easy Publishing:</strong> Our streamlined process makes it simple to upload and manage your applications.
            </li>
            <li>
              <strong>Community Support:</strong> Be part of a growing community of Namibian developers.
            </li>
            <li>
              <strong>Visibility:</strong> Get your app featured and gain exposure through our curated sections.
            </li>
          </ul>
          
          <h2 className="text-3xl font-semibold text-gray-900 mt-10 mb-4 border-b pb-2">
            <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              How to Get Started
            </span>
          </h2>
          <ol className="list-decimal list-inside space-y-3 text-lg text-gray-700 leading-relaxed">
            <li><strong>Register Your Developer Account:</strong> <Link href="/register" className="text-indigo-600 hover:underline">Sign up here</Link> to create your developer profile.</li>
            <li><strong>Prepare Your App:</strong> Ensure your APK file and screenshots are ready.</li>
            <li><strong>Upload Your App:</strong> Use our developer dashboard to submit your application for review.</li>
            <li><strong>Get Approved:</strong> Our team will review your app to ensure it meets our quality standards.</li>
            <li><strong>Go Live:</strong> Once approved, your app will be visible to users on NamApp!</li>
          </ol>
          
          <h2 className="text-3xl font-semibold text-gray-900 mt-10 mb-4 border-b pb-2">
            <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Developer Resources
            </span>
          </h2>
          <p className="text-lg text-gray-700 leading-relaxed">
            We're continuously working to provide more resources for our developers, including documentation, best practices, and support forums. Stay tuned for updates!
          </p>
          
          <h2 className="text-3xl font-semibold text-gray-900 mt-10 mb-4 border-b pb-2">
            <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Contact Developer Support
            </span>
          </h2>
          <p className="text-lg text-gray-700 leading-relaxed">
            If you have any questions or need assistance, our dedicated developer support team is here to help.
          </p>
          <ul className="list-disc list-inside space-y-2 text-lg text-gray-700 leading-relaxed">
            <li>Email: <a href="mailto:cleothomas8@gmail.com" className="text-indigo-600 hover:underline">cleothomas8@gmail.com</a></li>
            <li>Phone: <a href="tel:+264817854573" className="text-indigo-600 hover:underline">+264 81 785 4573</a></li>
          </ul>
        </div>
      </main>
      <Footer />
    </div>
  )
} 