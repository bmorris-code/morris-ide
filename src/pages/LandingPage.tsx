import { Link } from 'react-router-dom';
import { Download, Shield, Bot, Zap, Code, Lock, Check } from 'lucide-react';
import { SignedIn, SignedOut } from '@clerk/clerk-react';

// Clerk publishable key (set in .env)
const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

export default function LandingPage() {
  const desktopDownloads = [
    {
      label: 'Windows',
      url: 'https://github.com/bmorris-code/morris-ide/releases/latest/download/MorrisIDE-1.0.0-Setup.exe',
      fileSize: '~82 MB'
    },
    {
      label: 'macOS',
      url: 'https://github.com/bmorris-code/morris-ide/releases/latest/download/MorrisIDE-1.0.0.dmg',
      fileSize: '~95 MB'
    },
    {
      label: 'Linux',
      url: 'https://github.com/bmorris-code/morris-ide/releases/latest/download/MorrisIDE-1.0.0.AppImage',
      fileSize: '~88 MB'
    },
  ];

  const plans = [
    {
      name: 'Free',
      desc: 'For individual developers',
      price: '$0',
      period: '/forever',
      features: ['Core IDE Features', 'Local AI (BYOK)', 'Basic Security Scanning', 'Community Support'],
      cta: 'Download Free'
    },
    {
      name: 'Pro',
      desc: 'For power users',
      price: '$14',
      period: '/month',
      features: ['Advanced AI (Groq)', 'Priority AI Responses', 'Advanced Security', 'Code Analysis & Insights', 'Early Feature Access'],
      cta: 'Start Pro Trial',
      popular: true
    },
    {
      name: 'Teams',
      desc: 'For teams & organizations',
      price: '$24',
      period: '/user/month',
      features: ['All Pro Features', 'Team Collaboration', 'Centralized Security', 'Private Code Index', 'Priority Support'],
      cta: 'Contact Sales'
    },
  ];

  return (
    <div className="min-h-screen bg-[#0d0d14] text-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-[#0d0d14]/90 backdrop-blur-sm z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center font-bold">M</div>
              <span className="text-lg font-semibold">MORRIS IDE</span>
            </div>
            <div className="hidden md:flex items-center gap-6 text-sm text-gray-400">
              <a href="#features" className="hover:text-white transition">Features</a>
              <a href="#pricing" className="hover:text-white transition">Pricing</a>
              <a href="#download" className="hover:text-white transition">Download</a>
              <a href="#" className="hover:text-white transition">Docs</a>
              <a href="#" className="hover:text-white transition">Blog</a>
              <a href="#" className="hover:text-white transition">Enterprise</a>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {clerkPubKey ? (
              <>
                <SignedOut>
                  <Link to="/login" className="text-sm text-gray-300 hover:text-white transition">Sign In</Link>
                  <Link to="/ide" className="px-4 py-2 bg-violet-600 hover:bg-violet-700 rounded-lg text-sm font-medium transition">
                    Get Started
                  </Link>
                </SignedOut>
                <SignedIn>
                  <Link to="/dashboard" className="px-4 py-2 bg-violet-600 hover:bg-violet-700 rounded-lg text-sm font-medium transition">
                    Dashboard
                  </Link>
                </SignedIn>
              </>
            ) : (
              <>
                <Link to="/login" className="text-sm text-gray-300 hover:text-white transition">Sign In</Link>
                <Link to="/ide" className="px-4 py-2 bg-violet-600 hover:bg-violet-700 rounded-lg text-sm font-medium transition">
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-28 pb-20 px-6 relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-violet-900/30 via-[#0d0d14] to-[#0d0d14]"></div>
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-violet-600/20 rounded-full blur-3xl"></div>

        <div className="relative max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          {/* Left side - Text */}
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-violet-900/40 border border-violet-700/50 rounded-full text-violet-300 text-sm mb-6">
              <Zap size={14} className="text-violet-400" /> Now with Groq AI Integration
            </div>
            <h1 className="text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              <span className="text-white">AI-Native</span><br />
              <span className="bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">Secure Development</span>
            </h1>
            <p className="text-lg text-gray-400 mb-8 max-w-lg">
              The local-first IDE with built-in AI assistance and real-time security scanning.
              Write better code, faster, without compromising privacy.
            </p>
            <div className="flex flex-wrap items-center gap-4 mb-8">
              <a href="#download" className="flex items-center gap-2 px-6 py-3 bg-violet-600 hover:bg-violet-700 rounded-lg font-medium transition">
                <Download size={18} /> Download for Free
              </a>
              <Link to="/signup" className="flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg font-medium transition">
                Create Account
              </Link>
            </div>
            <p className="text-sm text-gray-500 mb-4">Available for Windows, macOS, and Linux</p>
            <div className="flex items-center gap-4 text-2xl">
              <span title="Windows">🪟</span>
              <span title="macOS">🍎</span>
              <span title="Linux">🐧</span>
            </div>
          </div>

          {/* Right side - IDE Preview */}
          <div className="relative">
            <div className="bg-[#12121a] rounded-xl border border-gray-800 shadow-2xl overflow-hidden">
              {/* IDE Menu Bar */}
              <div className="flex items-center gap-2 px-4 py-2 bg-[#1a1a24] border-b border-gray-800">
                <div className="w-6 h-6 bg-violet-600 rounded flex items-center justify-center text-xs font-bold">M</div>
                <span className="text-sm font-medium text-gray-300">Morris IDE</span>
                <div className="flex items-center gap-4 ml-4 text-xs text-gray-500">
                  <span>File</span><span>Edit</span><span>View</span><span>Run</span><span>Terminal</span>
                </div>
              </div>
              {/* IDE Content Preview */}
              <div className="flex h-64">
                <div className="w-48 bg-[#0f0f17] border-r border-gray-800 p-3 text-xs">
                  <div className="text-gray-400 mb-2 font-medium">EXPLORER</div>
                  <div className="space-y-1 text-gray-500">
                    <div className="flex items-center gap-1"><span>📁</span> src</div>
                    <div className="flex items-center gap-1 pl-3"><span>📁</span> components</div>
                    <div className="flex items-center gap-1 pl-3"><span>📁</span> pages</div>
                    <div className="flex items-center gap-1 pl-3 text-violet-400"><span>📄</span> App.tsx</div>
                    <div className="flex items-center gap-1"><span>📄</span> package.json</div>
                  </div>
                </div>
                <div className="flex-1 bg-[#12121a] p-3 text-xs font-mono">
                  <div className="text-gray-600">1</div>
                  <div><span className="text-purple-400">import</span> <span className="text-gray-300">{'{ useState }'}</span> <span className="text-purple-400">from</span> <span className="text-green-400">'react'</span></div>
                  <div className="text-gray-600">2</div>
                  <div><span className="text-purple-400">export default function</span> <span className="text-yellow-400">App</span>() {'{'}</div>
                  <div className="text-gray-600">3</div>
                  <div className="pl-4"><span className="text-purple-400">return</span> {'<'}<span className="text-blue-400">Dashboard</span>{' />'}</div>
                </div>
                <div className="w-48 bg-[#0f0f17] border-l border-gray-800 p-3 text-xs">
                  <div className="text-violet-400 mb-2 font-medium">MORRIS AI</div>
                  <div className="text-gray-400 text-[10px]">Ask me anything about your code...</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Bar */}
      <section className="py-6 px-6 bg-[#0a0a10] border-y border-gray-800">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
            <div className="flex items-center gap-3">
              <Lock className="w-8 h-8 text-violet-400" />
              <div>
                <div className="text-sm font-medium">Local-First</div>
                <div className="text-xs text-gray-500">Your code stays on your machine. Total privacy.</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Bot className="w-8 h-8 text-violet-400" />
              <div>
                <div className="text-sm font-medium">AI-Powered</div>
                <div className="text-xs text-gray-500">Groq AI integration for lightning-fast assistance.</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8 text-violet-400" />
              <div>
                <div className="text-sm font-medium">Secure by Design</div>
                <div className="text-xs text-gray-500">Real-time vulnerability scanning and dependency analysis.</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Zap className="w-8 h-8 text-violet-400" />
              <div>
                <div className="text-sm font-medium">Incremental Intelligence</div>
                <div className="text-xs text-gray-500">Merkle-based indexing for blazing-fast code search.</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Code className="w-8 h-8 text-violet-400" />
              <div>
                <div className="text-sm font-medium">Cross-Platform</div>
                <div className="text-xs text-gray-500">Windows, macOS, and Linux. One IDE, everywhere.</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 px-6 bg-[#0d0d14]">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-2xl font-bold mb-6">Built for modern developers</h2>
            <div className="space-y-3">
              {[
                'AI Code Assistant',
                'Real-time Security Scanning',
                'Advanced Code Navigation',
                'Smart Refactoring',
                'Integrated Terminal',
                'Git & Collaboration',
                'Extensions Marketplace',
                'And much more...'
              ].map((feature, i) => (
                <div key={i} className="flex items-center gap-2 text-gray-300">
                  <Check size={16} className="text-violet-400" />
                  <span className="text-sm">{feature}</span>
                </div>
              ))}
            </div>
          </div>
          {/* IDE Screenshot */}
          <div className="bg-[#12121a] rounded-xl border border-gray-800 overflow-hidden">
            <div className="flex items-center gap-2 px-3 py-2 bg-[#1a1a24] border-b border-gray-800">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
              </div>
            </div>
            <div className="flex h-48">
              <div className="w-40 bg-[#0f0f17] border-r border-gray-800 p-2 text-xs text-gray-500">
                <div className="space-y-1">
                  <div>📁 src</div>
                  <div className="pl-2">📁 components</div>
                  <div className="pl-2 text-violet-400">📄 Dashboard.tsx</div>
                </div>
              </div>
              <div className="flex-1 p-2 text-xs font-mono text-gray-400">
                <div><span className="text-purple-400">function</span> <span className="text-yellow-400">Dashboard</span>() {'{'}</div>
                <div className="pl-2"><span className="text-purple-400">return</span> {'<div>...</div>'}</div>
                <div>{'}'}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-16 px-6 bg-[#0a0a10]">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-[1fr_2fr_1fr] gap-8 items-start">
          {/* Pricing Cards */}
          <div className="lg:col-start-2 grid md:grid-cols-3 gap-4">
            {plans.map((plan, i) => (
              <div key={i} className={`p-5 rounded-xl border relative ${plan.popular ? 'border-violet-500 bg-[#1a1a24]' : 'border-gray-800 bg-[#12121a]'}`}>
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-violet-600 rounded-full text-xs font-medium">
                    Most Popular
                  </div>
                )}
                <div className="text-sm text-gray-400 mb-1">{plan.name}</div>
                <div className="text-xs text-gray-500 mb-3">{plan.desc}</div>
                <div className="flex items-baseline gap-1 mb-4">
                  <span className="text-2xl font-bold">{plan.price}</span>
                  <span className="text-sm text-gray-500">{plan.period}</span>
                </div>
                <ul className="space-y-2 mb-5">
                  {plan.features.map((f, j) => (
                    <li key={j} className="flex items-center gap-2 text-xs text-gray-300">
                      <Check size={12} className="text-violet-400" /> {f}
                    </li>
                  ))}
                </ul>
                {plan.name === 'Free' ? (
                  <a
                    href="#download"
                    className={`block text-center w-full py-2.5 rounded-lg text-sm font-medium transition ${plan.popular ? 'bg-violet-600 hover:bg-violet-700' : 'bg-gray-800 hover:bg-gray-700'}`}
                  >
                    {plan.cta}
                  </a>
                ) : (
                  <Link
                    to="/signup"
                    className={`block text-center w-full py-2.5 rounded-lg text-sm font-medium transition ${plan.popular ? 'bg-violet-600 hover:bg-violet-700' : 'bg-gray-800 hover:bg-gray-700'}`}
                  >
                    {plan.cta}
                  </Link>
                )}
              </div>
            ))}
          </div>

          {/* Trust Section */}
          <div className="lg:col-start-3">
            <div className="text-sm text-gray-400 mb-4">Trusted by developers and teams</div>
            <div className="grid grid-cols-2 gap-3 text-sm text-gray-500">
              <span>Google</span><span>Microsoft</span>
              <span>Stripe</span><span>Shopify</span>
              <span>Intel</span><span>Samsung</span>
            </div>
            <div className="mt-6 p-4 bg-[#12121a] rounded-lg border border-gray-800">
              <p className="text-xs text-gray-400 italic mb-3">
                "Morris IDE has transformed the way our team writes and secures code. The AI assistance is incredible, and the privacy-first approach is exactly what enterprises need."
              </p>
              <p className="text-xs text-gray-500">— Dev Lead at FinSecure</p>
            </div>
          </div>
        </div>
      </section>

      {/* Download Section */}
      <section id="download" className="py-16 px-6 bg-[#0d0d14] border-t border-gray-800">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-[1fr_1fr] gap-8 items-start">
          <div>
            <h2 className="text-3xl font-bold mb-4">Get Morris IDE</h2>
            <p className="text-gray-400 mb-6 max-w-xl">
              Use the web preview for account and product flows. Use the desktop app for the full IDE experience: local folders, real terminal commands, Git, file watching, and test runs.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/ide" className="inline-flex items-center gap-2 px-5 py-3 bg-violet-600 hover:bg-violet-700 rounded-lg font-medium transition">
                <Code size={18} /> Open Web Preview
              </Link>
              <a href="#desktop-build" className="inline-flex items-center gap-2 px-5 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg font-medium transition">
                <Download size={18} /> Desktop Build
              </a>
            </div>
          </div>

          <div id="desktop-build" className="bg-[#12121a] border border-gray-800 rounded-xl p-5">
            <div className="text-sm font-semibold text-white mb-2">Desktop installers</div>
            <p className="text-xs text-gray-500 mb-4">
              Download the full desktop IDE experience with local file access, terminal, Git integration, and AI assistance.
            </p>
            <div className="space-y-3">
              {desktopDownloads.map((item) => (
                <a
                  key={item.label}
                  href={item.url}
                  className="block p-3 bg-gray-900 rounded-lg border border-gray-800 hover:border-violet-500/50 transition-colors group"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-200 group-hover:text-violet-400 transition-colors">{item.label}</span>
                      <span className="text-xs text-gray-500">{item.fileSize}</span>
                    </div>
                    <Download size={16} className="text-gray-500 group-hover:text-violet-400 transition-colors" />
                  </div>
                </a>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-4">
              💡 Tip: The desktop app provides the full IDE experience. The web preview is great for trying features.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 px-6 bg-[#0a0a10] border-t border-gray-800">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-6 gap-8 mb-8">
            {/* Logo */}
            <div className="md:col-span-1">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 bg-violet-600 rounded-lg flex items-center justify-center font-bold text-sm">M</div>
                <span className="font-semibold">Morris IDE</span>
              </div>
              <p className="text-xs text-gray-500">AI-Native. Secure. Local-First.</p>
            </div>
            {/* Links */}
            <div>
              <div className="text-sm font-medium mb-3">Product</div>
              <div className="space-y-2 text-xs text-gray-500">
                <a href="#" className="block hover:text-white transition">Features</a>
                <a href="#" className="block hover:text-white transition">Changelog</a>
                <a href="#" className="block hover:text-white transition">Roadmap</a>
              </div>
            </div>
            <div>
              <div className="text-sm font-medium mb-3">Resources</div>
              <div className="space-y-2 text-xs text-gray-500">
                <a href="#" className="block hover:text-white transition">Docs</a>
                <a href="#" className="block hover:text-white transition">Blog</a>
                <a href="#" className="block hover:text-white transition">Community</a>
              </div>
            </div>
            <div>
              <div className="text-sm font-medium mb-3">Company</div>
              <div className="space-y-2 text-xs text-gray-500">
                <a href="#" className="block hover:text-white transition">About</a>
                <a href="#" className="block hover:text-white transition">Careers</a>
                <a href="#" className="block hover:text-white transition">Contact</a>
              </div>
            </div>
            <div>
              <div className="text-sm font-medium mb-3">Legal</div>
              <div className="space-y-2 text-xs text-gray-500">
                <a href="#" className="block hover:text-white transition">Privacy</a>
                <a href="#" className="block hover:text-white transition">Terms</a>
                <a href="#" className="block hover:text-white transition">Security</a>
              </div>
            </div>
            {/* Newsletter */}
            <div>
              <div className="text-sm font-medium mb-3">Stay updated</div>
              <p className="text-xs text-gray-500 mb-3">Get the latest updates and releases.</p>
              <div className="flex gap-2">
                <input type="email" placeholder="Enter your email" className="flex-1 px-3 py-2 bg-[#12121a] border border-gray-800 rounded-lg text-xs focus:outline-none focus:border-violet-500" />
                <button className="px-3 py-2 bg-violet-600 hover:bg-violet-700 rounded-lg text-xs font-medium transition">Subscribe</button>
              </div>
            </div>
          </div>
          {/* Bottom */}
          <div className="flex flex-col md:flex-row items-center justify-between pt-6 border-t border-gray-800">
            <div className="flex items-center gap-4 text-gray-500">
              <a href="#" className="hover:text-white transition">𝕏</a>
              <a href="#" className="hover:text-white transition">▶</a>
              <a href="#" className="hover:text-white transition">💬</a>
              <a href="#" className="hover:text-white transition">in</a>
            </div>
            <p className="text-xs text-gray-500 mt-4 md:mt-0">© 2026 Morris IDE. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
