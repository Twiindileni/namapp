'use client'

import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-8 text-center">
          About Us
        </h1>
        <div className="prose max-w-none">
          <p>Welcome to NamApp, your premier destination for discovering amazing applications developed by talented Namibian students and developers!</p>
          <p>Our mission is to foster innovation within Namibia's tech community by providing a platform where local talent can showcase their creativity and technical skills. We believe in empowering developers to reach a wider audience and giving users access to high-quality, locally-developed software.</p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">Our Vision</h2>
          <p>To become the leading app store in Namibia, recognized for its diverse collection of applications and its commitment to nurturing local developer talent. We envision a future where Namibian innovation thrives and contributes significantly to the global tech landscape.</p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">What We Offer</h2>
          <ul>
            <li><strong>For Users:</strong> A curated selection of mobile applications across various categories, ensuring a seamless and engaging experience. Discover apps that cater to your daily needs, entertainment, education, and more.</li>
            <li><strong>For Developers:</strong> A robust platform to upload, manage, and promote your applications. Gain visibility, connect with users, and contribute to the growth of Namibia's tech ecosystem.</li>
          </ul>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">Our Commitment</h2>
          <p>We are committed to maintaining a high standard of quality for all apps featured on NamApp. Our team diligently reviews submissions to ensure they meet our guidelines for functionality, security, and user experience. We also prioritize user privacy and data security, ensuring a safe environment for everyone.</p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">Join Our Community</h2>
          <p>Whether you're a developer looking to share your creations or a user searching for the next great app, NamApp is the place for you. Join our growing community and be a part of Namibia's digital revolution.</p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">Contact Us</h2>
          <p>We value your feedback and are always here to help. If you have any questions, suggestions, or encounter any issues, please don't hesitate to reach out to us:</p>
          <ul>
            <li>Email: cleothomas8@gmail.com</li>
            <li>Phone: +264 81 785 4573</li>
          </ul>
        </div>
      </main>
      <Footer />
    </div>
  )
} 