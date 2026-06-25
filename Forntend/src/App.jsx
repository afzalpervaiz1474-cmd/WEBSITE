import { useEffect, useMemo, useState } from 'react'
import './amazon.css'
import { loadGoogleScript } from './googleAuth.js'
import placeholderImage from './assets/hero.png'

const categories = ['All', 'Mobile', 'Tablet', 'Laptop', 'Bike', 'Watch', 'Sports', 'Power', 'Audio', 'Toys', 'Perfume']


const sectionLinks = [
  { label: 'Home', href: '#' },
  { label: 'Today’s Deals', href: '#shop' },
  { label: 'Categories', href: '#categories' },
  { label: 'Offers', href: '#offers' },
]

const STORAGE_USER_KEY = 'afzal-user'
const STORAGE_USERS_KEY = 'afzal-active-users'
const STORAGE_CART_KEY = 'afzal-cart'
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''

const categoryCards = [
  { title: 'Smartphones', icon: '📱', text: 'Latest phones with premium cameras and long battery life.' },
  { title: 'Tablets', icon: '📲', text: 'Portable displays for work, study, and entertainment.' },
  { title: 'Laptops', icon: '💻', text: 'Performance notebooks for productivity and gaming.' },
  { title: 'Watches', icon: '⌚', text: 'Stylish smartwatches for health tracking and daily wear.' },
  { title: 'Powerbanks', icon: '🔋', text: 'Fast charging power banks for on-the-go power.' },
  { title: 'Headphones', icon: '🎧', text: 'Immersive audio gear for music and calls.' },
  { title: 'Sports Gear', icon: '🏏', text: 'Equipment for football, cricket, and active play.' },
  { title: 'Toys & Gifts', icon: '🚗', text: 'Fun toy cars and gift ideas for children.' },
  { title: 'Perfumes', icon: '🌸', text: 'Refreshing fragrances for every occasion.' },
]

const products = [
  { id: 1, name: 'Nova X10 Pro', category: 'Mobile', price: 699, badge: 'Hot deal', image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=900&q=80', description: 'Flagship phone with a vivid display and pro-grade camera.', specs: ['128GB storage', '5G ready', '90Hz display'] },
  { id: 2, name: 'Aero Tab 11', category: 'Tablet', price: 449, badge: 'Best seller', image: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=900&q=80', description: 'Ultra-light tablet designed for work, study, and streaming.', specs: ['11-inch display', 'Stylus support', 'All-day battery'] },
  { id: 3, name: 'Studio Pro 14', category: 'Laptop', price: 1299, badge: 'Premium', image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=900&q=80', description: 'High-performance laptop for creators and professionals.', specs: ['32GB RAM', '1TB SSD', '4K display'] },
  { id: 4, name: 'CityRide 2.0', category: 'Bike', price: 399, badge: 'New arrival', image: 'https://images.unsplash.com/photo-1507035895480-2b3156c31fc8?auto=format&fit=crop&w=900&q=80', description: 'Smooth commuter bike with comfort and dependable performance.', specs: ['Aluminum frame', '7-speed gear', 'Front suspension'] },
  { id: 5, name: 'Spark Lite 8', category: 'Mobile', price: 299, badge: 'Value pick', image: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=900&q=80', description: 'Affordable smartphone with long battery life and fast charging.', specs: ['64GB storage', 'Triple camera', 'Fast charge'] },
  { id: 6, name: 'Canvas 12 Pro', category: 'Tablet', price: 589, badge: 'Premium', image: 'https://images.unsplash.com/photo-1629131726692-1accd0c53ce0?auto=format&fit=crop&w=900&q=80', description: 'Large-screen tablet for multitasking and immersive media.', specs: ['12.4-inch screen', '128GB SSD', 'Keyboard support'] },
  { id: 7, name: 'OrbitBook Air', category: 'Laptop', price: 899, badge: 'Limited stock', image: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=900&q=80', description: 'Slim and portable laptop with everyday power and stylish finish.', specs: ['16GB RAM', '512GB SSD', '13-hour battery'] },
  { id: 8, name: 'TrailBlazer X', category: 'Bike', price: 549, badge: 'Adventure', image: 'https://images.unsplash.com/photo-1507035895480-2b3156c31fc8?auto=format&fit=crop&w=900&q=80', description: 'Built for rough roads and weekend rides with strong suspension.', specs: ['Carbon fork', '18-speed', 'Disc brakes'] },

  { id: 9, name: 'ChronoWave Smartwatch', category: 'Watch', price: 179, badge: 'Hot deal', image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=900&q=80', description: 'Track fitness, heart rate, and notifications in style.', specs: ['AMOLED display', 'GPS tracking', '7-day battery'] },
  { id: 10, name: 'RoyalTime Classic', category: 'Watch', price: 129, badge: 'Best seller', image: 'https://images.unsplash.com/photo-1524594150405-4f2b52b2dbe5?auto=format&fit=crop&w=900&q=80', description: 'Minimal analog look with daily comfort and durability.', specs: ['Stainless steel', 'Water resistant', 'Quick-release band'] },
  { id: 11, name: 'Astra Sport Watch', category: 'Watch', price: 99, badge: 'New arrival', image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=900&q=80', description: 'Lightweight sports watch with session tracking.', specs: ['Activity modes', 'Auto sleep tracking', 'Scratch resistant glass'] },

  { id: 12, name: 'GripPro Cricket Bat', category: 'Sports', price: 69, badge: 'Value pick', image: 'https://images.unsplash.com/photo-1617949758522-7f0c3b3c8c5b?auto=format&fit=crop&w=900&q=80', description: 'Balanced bat for power shots and controlled timing.', specs: ['High-density handle', 'Smooth hitting face', 'Lightweight design'] },
  { id: 13, name: 'TurfBound Football', category: 'Sports', price: 39, badge: 'Hot deal', image: 'https://images.unsplash.com/photo-1526406915894-7bbd5f1d7c66?auto=format&fit=crop&w=900&q=80', description: 'All-weather football with responsive grip for passes.', specs: ['Machine stitched', 'Grip texture', 'Durable panels'] },
  { id: 14, name: 'DefenseMaster Cricket Ball', category: 'Sports', price: 24, badge: 'Best seller', image: 'https://images.unsplash.com/photo-1521412644187-c49fa049e84d?auto=format&fit=crop&w=900&q=80', description: 'Practice-ready balls for better control and spin.', specs: ['Training size', 'Consistent bounce', 'Tear resistant'] },
  { id: 15, name: 'StadiumKick Mini Football', category: 'Sports', price: 19, badge: 'New arrival', image: 'https://images.unsplash.com/photo-1518091043644-c1d4457512c6?auto=format&fit=crop&w=900&q=80', description: 'Small size, big fun—great for quick matches.', specs: ['Kids friendly', 'Weather resistant', 'Soft-touch coating'] },

  { id: 16, name: 'TurboPower 20000mAh Powerbank', category: 'Power', price: 49, badge: 'Best seller', image: 'https://images.unsplash.com/photo-1621881018302-050a9b5c0b1b?auto=format&fit=crop&w=900&q=80', description: 'Fast charge your devices anywhere with huge capacity.', specs: ['22.5W fast charge', 'Dual USB ports', 'LED charge display'] },
  { id: 17, name: 'PulseCharge 10000mAh', category: 'Power', price: 29, badge: 'Value pick', image: 'https://images.unsplash.com/photo-1593043967923-0b49d4c7b3f6?auto=format&fit=crop&w=900&q=80', description: 'Pocket power with stable output for everyday use.', specs: ['18W quick charge', 'Compact size', 'Smart protection'] },
  { id: 18, name: 'VoltDock 3-in-1 Wireless Charger', category: 'Power', price: 79, badge: 'Hot deal', image: 'https://images.unsplash.com/photo-1585386959984-a4155223d9b4?auto=format&fit=crop&w=900&q=80', description: 'Wireless charging for phone, earbuds and smartwatch.', specs: ['Qi certified', 'Overheat protection', 'Non-slip base'] },

  { id: 19, name: 'BassPulse Wireless Headphones', category: 'Audio', price: 59, badge: 'Hot deal', image: 'https://images.unsplash.com/photo-1518441314024-0e8b4d4cf6d4?auto=format&fit=crop&w=900&q=80', description: 'Deep bass sound with comfortable fit for long sessions.', specs: ['Bluetooth 5.3', '40mm drivers', '30-hour battery'] },
  { id: 20, name: 'ClearNote Wired Headphones', category: 'Audio', price: 25, badge: 'Value pick', image: 'https://images.unsplash.com/photo-1524678606370-a47ad25cb82a?auto=format&fit=crop&w=900&q=80', description: 'Crisp vocals and balanced sound with tangle-free cable.', specs: ['3.5mm jack', 'Noise isolation', 'Durable braided cable'] },
  { id: 21, name: 'Aurora ANC Headphones', category: 'Audio', price: 119, badge: 'Best seller', image: 'https://images.unsplash.com/photo-1519659528534-3319efb9b6cf?auto=format&fit=crop&w=900&q=80', description: 'Active noise canceling for focus anywhere.', specs: ['ANC mode', 'Transparency mode', 'Fast charging'] },
  { id: 22, name: 'MiniBeats Earbuds', category: 'Audio', price: 39, badge: 'New arrival', image: 'https://images.unsplash.com/photo-1524678606370-a47ad25cb82a?auto=format&fit=crop&w=900&q=80', description: 'Pocket earbuds with punchy sound and clear calls.', specs: ['Stereo sound', 'Mic for calls', 'Charging case'] },

  { id: 23, name: 'RacerToy Die-Cast Cars (Set of 6)', category: 'Toys', price: 22, badge: 'Hot deal', image: 'https://images.unsplash.com/photo-1600185365926-3a42ad0f4a3c?auto=format&fit=crop&w=900&q=80', description: 'Collectible toy cars with smooth rolling wheels.', specs: ['Set of 6', 'Durable wheels', 'Collector friendly'] },
  { id: 24, name: 'CloudPlay Remote Car', category: 'Toys', price: 49, badge: 'Best seller', image: 'https://images.unsplash.com/photo-1621936609883-7f0f4a3bfe0f?auto=format&fit=crop&w=900&q=80', description: 'Control and race with responsive steering.', specs: ['Rechargeable battery', 'Easy controls', 'All-surface wheels'] },
  { id: 25, name: 'TrackBuilder Toy Set', category: 'Toys', price: 35, badge: 'Value pick', image: 'https://images.unsplash.com/photo-1593750357619-49f4a6f5c1b5?auto=format&fit=crop&w=900&q=80', description: 'Build your own tracks and create endless routes.', specs: ['Modular pieces', 'Snap connectors', 'Smooth track system'] },

  { id: 26, name: 'Velvet Bloom Perfume 50ml', category: 'Perfume', price: 59, badge: 'Hot deal', image: 'https://images.unsplash.com/photo-1583744933101-8a7d2a6f0df8?auto=format&fit=crop&w=900&q=80', description: 'Floral notes with a soft long-lasting finish.', specs: ['50ml bottle', 'Day-to-night scent', 'Skin friendly formula'] },
  { id: 27, name: 'Night Horizon Perfume 100ml', category: 'Perfume', price: 99, badge: 'Best seller', image: 'https://images.unsplash.com/photo-1560347876-5d6fe2a6d2aa?auto=format&fit=crop&w=900&q=80', description: 'Deep musky fragrance for bold evenings.', specs: ['100ml', 'Long wear', 'Signature blend'] },
  { id: 28, name: 'Citrus Mist Eau De Cologne', category: 'Perfume', price: 29, badge: 'Value pick', image: 'https://images.unsplash.com/photo-1612874746297-7d0c4d0b7b3a?auto=format&fit=crop&w=900&q=80', description: 'Refreshing citrus splash with clean and bright aroma.', specs: ['Fresh scent', 'Lightweight', 'Great for daily use'] },
  { id: 29, name: 'Rose Enigma Perfume Roll-On', category: 'Perfume', price: 19, badge: 'New arrival', image: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=900&q=80', description: 'Convenient roll-on perfume with romantic rose tones.', specs: ['Roll-on', 'Travel friendly', 'Soft projection'] },

  { id: 30, name: 'CyberSound Soundbar (Compact)', category: 'Audio', price: 139, badge: 'Premium', image: 'https://images.unsplash.com/photo-1580894908361-9e3f4e0b9b1b?auto=format&fit=crop&w=900&q=80', description: 'Bigger room sound with a clean modern design.', specs: ['Bluetooth streaming', 'Rich bass', 'Low-latency mode'] },
]


function App() {
  const [activeCategory, setActiveCategory] = useState('All')
  const [user, setUser] = useState(null)
  const [activeUsers, setActiveUsers] = useState([])
  const [authError, setAuthError] = useState('')
  const [authSuccess, setAuthSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [profilePhoto, setProfilePhoto] = useState('')
  const [authMode, setAuthMode] = useState('signin')
  const [theme, setTheme] = useState(() => {
    if (typeof window === 'undefined') return 'light'
    return localStorage.getItem('afzal-theme') || 'light'
  })
  const [authBusy, setAuthBusy] = useState(false)
  const [googleReady, setGoogleReady] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '', otp: '' })
  const [cartItems, setCartItems] = useState(() => {
    if (typeof window === 'undefined') return []
    return JSON.parse(localStorage.getItem(STORAGE_CART_KEY) || '[]')
  })

  const cartCount = cartItems.reduce((total, item) => total + (item.quantity || 1), 0)

  const isInCart = (productId) => cartItems.some((item) => item.id === productId)

  const addToCart = (product) => {
    setCartItems((current) => {
      const existing = current.find((item) => item.id === product.id)
      if (existing) {
        return current.map((item) => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item)
      }
      return [...current, { ...product, quantity: 1 }]
    })
  }

  const filteredProducts = useMemo(() => {
    if (activeCategory === 'All') return products
    return products.filter((product) => product.category === activeCategory)
  }, [activeCategory])

  const isSecureContext = typeof window !== 'undefined' && (window.isSecureContext || window.location.protocol === 'https:')

  const persistSession = (userData) => {
    localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(userData))
    setUser(userData)
    setProfilePhoto(userData.photo || '')
  }

  const clearSession = () => {
    localStorage.removeItem(STORAGE_USER_KEY)
    setUser(null)
    setProfilePhoto('')
  }

  const sanitizeTextInput = (value) => value.replace(/<[^>]*>/g, '').replace(/[\u0000-\u001f\u007f]/g, '')

  const sanitizePasswordInput = (value) => value.replace(/[\u0000-\u001f\u007f]/g, '')

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

  const fallbackImage = placeholderImage
  const handleImageError = (event) => {
    if (event?.currentTarget) {
      event.currentTarget.onerror = null
      event.currentTarget.src = fallbackImage
    }
  }

  const handleGoogleCredentialResponse = async (response) => {
    if (!response?.credential) {
      setAuthError('Google sign-in was cancelled.')
      return
    }

    setAuthError('')
    setAuthSuccess('')
    setAuthBusy(true)

    try {
      const googleResponse = await fetch(`${API_URL}/api/auth/google`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: response.credential }),
      })

      const data = await googleResponse.json().catch(() => ({ message: 'Google sign-in failed.' }))
      if (!googleResponse.ok) {
        throw new Error(data.message || 'Google sign-in failed.')
      }

      const activeList = JSON.parse(localStorage.getItem(STORAGE_USERS_KEY) || '[]')
      const updatedUsers = [data.user, ...activeList.filter((entry) => entry.email !== data.user.email)].slice(0, 8)
      localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(updatedUsers))
      setActiveUsers(updatedUsers)
      persistSession(data.user)
      setAuthSuccess('Signed in with Google successfully.')
      setFormData({ name: '', email: '', password: '', confirmPassword: '', otp: '' })
    } catch (error) {
      setAuthError(error.message || 'Google sign-in failed. Please try again.')
    } finally {
      setAuthBusy(false)
    }
  }

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || typeof window === 'undefined') {
      return
    }

    let isMounted = true

    loadGoogleScript()
      .then(() => {
        if (!isMounted || !window.google?.accounts?.id) return

        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleGoogleCredentialResponse,
          auto_select: false,
          ux_mode: 'popup',
        })
        setGoogleReady(true)
      })
      .catch(() => {
        if (isMounted) {
          setAuthError('Google sign-in failed to load. Please check your network or client ID.')
        }
      })

    return () => {
      isMounted = false
    }
  }, [GOOGLE_CLIENT_ID])

  useEffect(() => {
    const savedUsers = JSON.parse(localStorage.getItem(STORAGE_USERS_KEY) || '[]')
    const storedUser = JSON.parse(localStorage.getItem(STORAGE_USER_KEY) || 'null')

    if (storedUser) {
      persistSession(storedUser)
    }

    setActiveUsers(savedUsers)
  }, [])

  useEffect(() => {
    localStorage.setItem(STORAGE_CART_KEY, JSON.stringify(cartItems))
  }, [cartItems])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    document.body.setAttribute('data-theme', theme)
    localStorage.setItem('afzal-theme', theme)
  }, [theme])

  const handleAuthSubmit = async (event) => {
    event.preventDefault()
    setAuthError('')
    setAuthSuccess('')
    setAuthBusy(true)

    const name = sanitizeTextInput(formData.name).trim()
    const email = sanitizeTextInput(formData.email).trim().toLowerCase()
    const password = sanitizePasswordInput(formData.password)
    const confirmPassword = sanitizePasswordInput(formData.confirmPassword)

    if (!email || !password || (authMode === 'signup' && !name)) {
      setAuthError('Please enter a valid email and password.')
      setAuthBusy(false)
      return
    }

    if (!validateEmail(email)) {
      setAuthError('Please provide a valid email address.')
      setAuthBusy(false)
      return
    }

    if (authMode === 'signup' && password !== confirmPassword) {
      setAuthError('Passwords do not match.')
      setAuthBusy(false)
      return
    }

    try {
      const endpoint = authMode === 'signup' ? '/api/auth/register' : '/api/auth/login'
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      })

      const data = await response.json().catch(() => ({ message: 'Authentication request failed.' }))
      if (!response.ok) {
        throw new Error(data.message || 'Authentication failed.')
      }

      const activeList = JSON.parse(localStorage.getItem(STORAGE_USERS_KEY) || '[]')
      const updatedUsers = [data.user, ...activeList.filter((entry) => entry.email !== data.user.email)].slice(0, 8)
      localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(updatedUsers))
      setActiveUsers(updatedUsers)
      persistSession(data.user)
      setAuthSuccess(authMode === 'signup' ? 'Account created successfully. You are now signed in.' : 'Signed in successfully.')
      setFormData({ name: '', email: '', password: '', confirmPassword: '', otp: '' })
    } catch (error) {
      setAuthError(error.message || 'Authentication failed. Please try again.')
    } finally {
      setAuthBusy(false)
    }
  }

  const handlePhotoChange = (event) => {
    const file = event.target.files?.[0]
    if (!file || !user) return

    const reader = new FileReader()
    reader.onload = () => {
      const photoData = reader.result
      const updatedUser = { ...user, photo: photoData }
      const updatedUsers = [updatedUser, ...activeUsers.filter((entry) => entry.email !== updatedUser.email)].slice(0, 8)

      localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(updatedUser))
      localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(updatedUsers))
      setProfilePhoto(photoData)
      setUser(updatedUser)
      setActiveUsers(updatedUsers)
    }
    reader.readAsDataURL(file)
  }

  const handleLogout = async () => {
    try {
      await fetch(`${API_URL}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      })
    } catch {
      // ignore logout errors and clear the session locally
    }

    if (user) {
      const remainingUsers = activeUsers.filter((entry) => entry.email !== user.email)
      localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(remainingUsers))
      setActiveUsers(remainingUsers)
    }

    clearSession()
    setAuthError('')
    setAuthSuccess('')
    setFormData({ name: '', email: '', password: '', confirmPassword: '', otp: '' })
  }

  const toggleTheme = () => {
    setTheme((currentTheme) => (currentTheme === 'light' ? 'dark' : 'light'))
  }

  if (!user) {
    return (
      <div className="auth-shell">
        <div className="auth-card">
          <div className="auth-pill-row">
            <span className="auth-pill">🔒 Secure sign-in</span>
            <span className="auth-pill">{isSecureContext ? 'HTTPS protected' : 'Use HTTPS in production'}</span>
            <button type="button" className="theme-toggle" onClick={toggleTheme}>
              {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
            </button>
          </div>

          <p className="eyebrow">{authMode === 'signin' ? 'Welcome back' : 'Create your account'}</p>
          <h1>{authMode === 'signin' ? 'Sign in to AFZAL Market' : 'Join AFZAL Market'}</h1>
          <p className="hero-text">
            {authMode === 'signin'
              ? 'Access your dashboard with email and password authentication protected by a trusted backend.'
              : 'Create an account with secure server-side validation and protected sessions.'}
          </p>

          <div className="auth-toggle">
            <button type="button" className={authMode === 'signin' ? 'active' : ''} onClick={() => { setAuthMode('signin'); setAuthError(''); setAuthSuccess(''); setFormData({ ...formData, name: '', password: '', confirmPassword: '', otp: '' }) }}>
              Sign in
            </button>
            <button type="button" className={authMode === 'signup' ? 'active' : ''} onClick={() => { setAuthMode('signup'); setAuthError(''); setAuthSuccess(''); setFormData({ ...formData, name: '', password: '', confirmPassword: '', otp: '' }) }}>
              Sign up
            </button>
          </div>

          <div className="provider-stack">
            <div className="google-signin-wrap">
              {GOOGLE_CLIENT_ID ? (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    if (window.google?.accounts?.id) {
                      window.google.accounts.id.prompt()
                    }
                  }}
                  disabled={!googleReady || authBusy}
                >
                  {authBusy ? 'Please wait...' : 'Continue with Google'}
                </button>
              ) : (
                <button type="button" className="btn btn-secondary" disabled>
                  Google sign-in requires a client ID
                </button>
              )}
            </div>
            <div className="provider-divider"><span>or continue with email</span></div>
          </div>

          <form className="auth-form" onSubmit={handleAuthSubmit}>
            {authMode === 'signup' ? <input type="text" placeholder="Full name" value={formData.name} onChange={(event) => setFormData({ ...formData, name: sanitizeTextInput(event.target.value) })} required /> : null}
            <input type="email" placeholder="Email address" value={formData.email} onChange={(event) => setFormData({ ...formData, email: sanitizeTextInput(event.target.value).trim().toLowerCase() })} autoComplete="email" required />
            <div className="password-input-wrap">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                value={formData.password}
                onChange={(event) => setFormData({ ...formData, password: sanitizePasswordInput(event.target.value) })}
                autoComplete={authMode === 'signin' ? 'current-password' : 'new-password'}
                required
              />
              <button type="button" className="password-toggle" onClick={() => setShowPassword((value) => !value)}>
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            {authMode === 'signup' ? <input type="password" placeholder="Confirm password" value={formData.confirmPassword} onChange={(event) => setFormData({ ...formData, confirmPassword: sanitizePasswordInput(event.target.value) })} autoComplete="new-password" required /> : null}
            <button type="submit" className="btn btn-primary auth-button" disabled={authBusy}>
              {authBusy ? 'Please wait...' : authMode === 'signin' ? 'Secure sign in' : 'Create account'}
            </button>
          </form>

          <p className="auth-hint">Use a real email address and password for secure sign-in, or connect your Google account for trusted authentication.</p>
          {authError ? <p className="auth-error">{authError}</p> : null}
          {authSuccess ? <p className="auth-success">{authSuccess}</p> : null}
        </div>
      </div>
    )
  }

  return (
    <div className="amazon-shell">
      <header className="amazon-header">
        <div className="brand-block">
          <div className="brand-badge">AZ</div>
          <div className="brand-text">
            <h1>AFZAL Market</h1>
            <p>Premium electronics, toys, and everyday essentials</p>
          </div>
        </div>

        <div className="search-box">
          <span>🔍</span>
          <input placeholder="Search watches, powerbanks, toys, perfumes..." />
        </div>

        <div className="header-actions">
          <button type="button" className="theme-toggle" onClick={toggleTheme}>
            {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
          </button>
          <div className="header-pill">👤 {user?.name || 'Guest'}</div>
          <div className="header-pill">🛒 Cart · {cartCount}</div>
          {user ? (
            <div className="header-pill">
              <button type="button" onClick={handleLogout}>Sign out</button>
            </div>
          ) : null}
        </div>
      </header>

      <nav className="secondary-nav">
        {sectionLinks.map((link) => (
          <a key={link.label} href={link.href}>{link.label}</a>
        ))}
      </nav>

      <div className="page-grid">
        <aside className="left-rail">
          <div className="profile-card">
            <div className="avatar-wrap">
              {user?.photo ? <img src={user.photo} alt={user?.name || 'Guest'} onError={handleImageError} /> : <span>{(user?.name || 'G').charAt(0).toUpperCase()}</span>}
            </div>
            <h3>{user?.name || 'Guest shopper'}</h3>
            <p>{user?.email || 'Browse the store without signing in'}</p>
            <div className="sidebar-details">
              <p><strong>Profile status</strong></p>
              <p>{user ? 'Signed in and ready to shop' : 'Not signed in yet'}</p>
            </div>
            {user ? (
              <label className="upload-btn">
                <input type="file" accept="image/*" onChange={handlePhotoChange} />
                Upload photo
              </label>
            ) : (
              <p className="auth-hint">Sign in to save favorites and see your personal details here.</p>
            )}
          </div>

          <div className="users-card">
            <h3>Active visitors</h3>
            <p>People currently browsing the store.</p>
            <ul className="users-list">
              {activeUsers.map((activeUser) => (
                <li key={activeUser.email}>
                  <div className="mini-avatar">
                    {activeUser.photo ? <img src={activeUser.photo} alt={activeUser.name || 'User'} onError={handleImageError} /> : <span>{(activeUser.name || 'U').charAt(0).toUpperCase()}</span>}
                  </div>
                  <div>
                    <strong>{activeUser.name || 'User'}</strong>
                    <p>{activeUser.email}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        <div className="main-column">
          <section className="hero-card">
            <div className="hero-main">
              <p className="eyebrow">Limited-time deals</p>
              <h2>Discover the best gadgets, toys, sports gear, and perfumes.</h2>
              <p>Fast delivery, premium quality, and smart prices in a modern shopping experience.</p>
              <div className="hero-actions">
                <a className="btn btn-primary" href="#shop">Shop now</a>
                <a className="btn btn-secondary" href="#offers">View offers</a>
              </div>
            </div>
            <div className="hero-side">
              <div className="side-card">
                <h3>Top rated this week</h3>
                <p>Explore premium electronics, sports gear, and gift-worthy bestsellers.</p>
              </div>
              <div className="side-card">
                <h3>Free shipping</h3>
                <p>Enjoy fast delivery and easy returns across all categories.</p>
              </div>
            </div>
          </section>

          <section className="info-strip">
            <div className="info-card">
              <span>⚡</span>
              <strong>Fast delivery</strong>
            </div>
            <div className="info-card">
              <span>🛡️</span>
              <strong>Secure checkout</strong>
            </div>
            <div className="info-card">
              <span>🔄</span>
              <strong>Easy returns</strong>
            </div>
            <div className="info-card">
              <span>⭐</span>
              <strong>Top rated</strong>
            </div>
          </section>

          <section id="categories" className="section-card">
            <div className="section-title">
              <h3>Shop by category</h3>
              <a href="#shop">See more</a>
            </div>
            <div className="category-grid">
              {categoryCards.map((item) => (
                <article className="category-card" key={item.title}>
                  <div className="emoji">{item.icon}</div>
                  <h4>{item.title}</h4>
                  <p>{item.text}</p>
                </article>
              ))}
            </div>
          </section>

          <section id="shop" className="section-card">
            <div className="section-title">
              <h3>Featured products</h3>
              <a href="#offers">Explore deals</a>
            </div>
            <div className="filter-group" role="tablist" aria-label="Filter products by category">
              {categories.map((category) => (
                <button key={category} type="button" className={category === activeCategory ? 'filter-btn active' : 'filter-btn'} onClick={() => setActiveCategory(category)}>{category}</button>
              ))}
            </div>
            <div className="product-grid">
              {filteredProducts.map((product) => (
                <article className="product-card" key={product.id}>
                  <img src={product.image} alt={product.name} onError={handleImageError} />
                  <div className="product-body">
                    <div className="product-topline">
                      <span className="pill">{product.badge}</span>
                      <span className="price">${product.price}</span>
                    </div>
                    <h4>{product.name}</h4>
                    <p>{product.description}</p>
                    <ul>
                      {product.specs.map((spec) => <li key={spec}>{spec}</li>)}
                    </ul>
                    <button type="button" className="add-to-cart-btn" onClick={() => addToCart(product)}>
                      🛒 {isInCart(product.id) ? 'Add again' : 'Add to cart'}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section id="offers" className="section-card">
            <div className="section-title">
              <h3>Weekend offers</h3>
              <a href="#shop">View all</a>
            </div>
            <p>Save up to 20% on premium gadgets, toys, beauty items, and sports gear this weekend.</p>
          </section>
        </div>
      </div>
    </div>
  )
}

export default App
