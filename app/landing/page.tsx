'use client';

import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Mazak Alarm Support</h1>
          <div className="flex gap-4 items-center">
            <Link 
              href="/" 
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Alarm Database
            </Link>
            <a 
              href="#pricing" 
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              Get Started
            </a>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 py-20 text-center">
        <h2 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
          CNC Machine Down?<br />Get Answers in Seconds
        </h2>
        <p className="text-xl md:text-2xl text-gray-800 mb-8 max-w-3xl mx-auto">
          24/7 AI phone support + searchable alarm database for Mazak CNC machines
        </p>
        <div className="flex flex-col md:flex-row gap-4 justify-center items-center mb-12">
          <a 
            href="tel:+13184089163"
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg font-bold text-lg transition-colors flex items-center gap-3"
          >
            <span className="text-2xl">📞</span>
            Call AI Support: +1 (318) 408-9163
          </a>
          <Link 
            href="/"
            className="bg-white hover:bg-gray-50 text-blue-600 border-2 border-blue-600 px-8 py-4 rounded-lg font-bold text-lg transition-colors"
          >
            Browse Alarm Database
          </Link>
        </div>
        <p className="text-gray-800">
          <strong>One hour of prevented downtime ($300-500)</strong> pays for 2-3 months of service
        </p>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-white p-8 rounded-lg shadow-sm">
            <div className="text-4xl mb-4">🤖</div>
            <h3 className="text-xl font-bold mb-3 text-gray-900">24/7 AI Phone Support</h3>
            <p className="text-gray-800">
              Call anytime, get instant troubleshooting guidance. AI understands your alarm codes and walks you through solutions.
            </p>
          </div>
          <div className="bg-white p-8 rounded-lg shadow-sm">
            <div className="text-4xl mb-4">📚</div>
            <h3 className="text-xl font-bold mb-3 text-gray-900">Searchable Database</h3>
            <p className="text-gray-800">
              181+ Mazak alarm codes with causes, solutions, and safety warnings. Color-coded by severity.
            </p>
          </div>
          <div className="bg-white p-8 rounded-lg shadow-sm">
            <div className="text-4xl mb-4">⚡</div>
            <h3 className="text-xl font-bold mb-3 text-gray-900">Instant Answers</h3>
            <p className="text-gray-800">
              No more flipping through manuals at 2 AM. Get the fix you need in under 60 seconds.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="max-w-7xl mx-auto px-4 py-16">
        <h2 className="text-4xl font-bold text-center mb-12 text-gray-900">Simple, Transparent Pricing</h2>
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Free Plan */}
          <div className="bg-white p-8 rounded-lg shadow-lg border-2 border-gray-200">
            <h3 className="text-2xl font-bold mb-2 text-gray-900">Free</h3>
            <p className="text-gray-800 mb-6">Try before you commit</p>
            <div className="text-4xl font-bold mb-6 text-gray-900">$0<span className="text-lg text-gray-800">/month</span></div>
            <ul className="space-y-3 mb-8">
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span className="text-gray-900">3 AI phone calls per month</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span className="text-gray-900">Access to 50 alarm codes</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span className="text-gray-900">Basic troubleshooting</span>
              </li>
              <li className="flex items-start">
                <span className="text-gray-400 mr-2">✗</span>
                <span className="text-gray-600">Full alarm database</span>
              </li>
            </ul>
            <a 
              href="tel:+13184089163"
              className="block w-full bg-gray-700 hover:bg-gray-800 text-white py-3 rounded-lg font-bold text-center transition-colors"
            >
              Start Free - Call Now
            </a>
          </div>

          {/* Pro Plan */}
          <div className="bg-blue-600 text-white p-8 rounded-lg shadow-xl border-2 border-blue-700 relative">
            <div className="absolute top-0 right-0 bg-yellow-400 text-blue-900 px-4 py-1 rounded-bl-lg rounded-tr-lg font-bold text-sm">
              MOST POPULAR
            </div>
            <h3 className="text-2xl font-bold mb-2">Pro</h3>
            <p className="text-blue-50 mb-6 font-medium">For serious operations</p>
            <div className="text-4xl font-bold mb-6">$199<span className="text-lg text-blue-50">/month</span></div>
            <ul className="space-y-3 mb-8">
              <li className="flex items-start">
                <span className="text-yellow-400 mr-2">✓</span>
                <span className="font-medium">Unlimited AI phone calls 24/7</span>
              </li>
              <li className="flex items-start">
                <span className="text-yellow-400 mr-2">✓</span>
                <span className="font-medium">Full alarm database (181+ codes)</span>
              </li>
              <li className="flex items-start">
                <span className="text-yellow-400 mr-2">✓</span>
                <span className="font-medium">Priority phone support</span>
              </li>
              <li className="flex items-start">
                <span className="text-yellow-400 mr-2">✓</span>
                <span className="font-medium">Advanced diagnostics</span>
              </li>
            </ul>
            <a 
              href="mailto:info@cowie.ai?subject=Pro%20Plan%20Signup"
              className="block w-full bg-white hover:bg-gray-100 text-blue-600 py-3 rounded-lg font-bold text-center transition-colors"
            >
              Get Pro Access
            </a>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">Questions About Pricing or Features?</h2>
          <div className="flex justify-center items-center mb-8">
            <a 
              href="mailto:info@cowie.ai"
              className="flex items-center gap-2 text-xl hover:text-blue-400 transition-colors"
            >
              <span>✉️</span>
              <span>info@cowie.ai</span>
            </a>
          </div>
          <p className="text-gray-300 font-medium">Response within 2 hours during business hours</p>
          <p className="text-gray-400 mt-4 text-sm">
            For alarm troubleshooting, call our AI support line: +1 (318) 408-9163
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-950 text-gray-400 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-sm">
            Independent third-party service • Not affiliated with Yamazaki Mazak Corporation
          </p>
          <p className="text-sm mt-2">
            © 2025 Mazak Alarm Support. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}