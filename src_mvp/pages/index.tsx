import Link from 'next/link'
import Head from 'next/head'

export default function Home() {
  return (
    <>
      <Head>
        <title>Gatherly MVP - AI-Powered Meeting Scheduler</title>
        <meta name="description" content="AI-powered meeting scheduler" />
      </Head>
      
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center">
            <h1 className="text-5xl font-bold text-gray-900 mb-6">
              Welcome to Gatherly
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              AI-powered meeting scheduler that makes coordinating with others effortless
            </p>
            
            <div className="space-x-4">
              <Link 
                href="/onboarding"
                className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Get Started
              </Link>
              <Link 
                href="/chat"
                className="inline-block bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold border-2 border-blue-600 hover:bg-blue-50 transition-colors"
              >
                Try Chat
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
