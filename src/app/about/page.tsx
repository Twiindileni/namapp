'use client'

import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'

export default function AboutPage() {
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
              About Us
            </span>
          </h1>
          <div className="space-y-6 text-lg text-gray-700 leading-relaxed">
            <p>
              Welcome to NamApp, your premier destination for discovering amazing applications developed by talented Namibian students and developers! Our platform is dedicated to fostering innovation and showcasing the incredible potential within Namibia's tech community.
            </p>
            <p>
              We believe in empowering local talent by providing a dynamic space where creators can proudly present their work to a wider audience. Simultaneously, we offer users an unparalleled opportunity to explore and download high-quality, relevant applications that cater to a diverse range of needs—from productivity tools to engaging entertainment.
            </p>
          </div>
          
          <h2 className="text-3xl font-semibold text-gray-900 mt-10 mb-4 border-b pb-2">
            <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Our Vision
            </span>
          </h2>
          <p className="text-lg text-gray-700 leading-relaxed">
            Our vision is to evolve into the leading app store in Namibia, celebrated not just for its extensive and diverse collection of applications, but also for its unwavering commitment to nurturing and elevating local developer talent. We are passionate about cultivating a future where Namibian innovation not only thrives domestically but also makes a significant, impactful contribution to the global technological landscape.
          </p>
          
          <h2 className="text-3xl font-semibold text-gray-900 mt-10 mb-4 border-b pb-2">
            <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              What We Offer
            </span>
          </h2>
          <ul className="list-disc list-inside space-y-3 text-lg text-gray-700 leading-relaxed">
            <li>
              <strong>For Users:</strong> Immerse yourself in a carefully curated selection of mobile applications spanning various categories. We guarantee a seamless and engaging experience as you discover apps designed to enhance your daily life, provide entertainment, support education, and much more.
            </li>
            <li>
              <strong>For Developers:</strong> Access a robust and intuitive platform engineered for uploading, managing, and effectively promoting your applications. Gain unparalleled visibility, connect directly with your target users, and play a pivotal role in accelerating the growth and vibrancy of Namibia's burgeoning tech ecosystem.
            </li>
          </ul>
          
          <h2 className="text-3xl font-semibold text-gray-900 mt-10 mb-4 border-b pb-2">
            <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Our Commitment
            </span>
          </h2>
          <p className="text-lg text-gray-700 leading-relaxed">
            We are steadfast in our commitment to upholding the highest standards of quality for every application showcased on NamApp. Our dedicated team meticulously reviews each submission, ensuring stringent adherence to our guidelines covering functionality, security, and exceptional user experience. Furthermore, we prioritize the utmost user privacy and data security, cultivating a truly safe and trustworthy environment for all members of our community.
          </p>
          
          <h2 className="text-3xl font-semibold text-gray-900 mt-10 mb-4 border-b pb-2">
            <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Join Our Community
            </span>
          </h2>
          <p className="text-lg text-gray-700 leading-relaxed">
            Whether your passion lies in crafting innovative applications or seeking the next indispensable tool, NamApp is your ultimate destination. Become an integral part of our rapidly expanding community and actively contribute to propelling Namibia's digital revolution forward.
          </p>
          
          <h2 className="text-3xl font-semibold text-gray-900 mt-10 mb-4 border-b pb-2">
            <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Contact Us
            </span>
          </h2>
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