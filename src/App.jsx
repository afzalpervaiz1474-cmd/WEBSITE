import { useEffect, useMemo, useState } from 'react'
import './amazon.css'

const categories = ['All', 'Mobile', 'Tablet', 'Laptop', 'Bike']

const sectionLinks = [
  { label: 'Today’s Deals', href: '#shop' },
  { label: 'Categories', href: '#categories' },
  { label: 'Offers', href: '#offers' },
]

const STORAGE_USER_KEY = 'afzal-user'
const STORAGE_USERS_KEY = 'afzal-active-users'
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''

const categoryCards = [
  { title: 'Mobile Deals', icon: '📱', text: 'Premium phones with fast charging and brilliant displays.' },
  { title: 'Tablet Essentials', icon: '📲', text: 'Perfect for study, streaming, and creative work on the move.' },
  { title: 'Laptop Power', icon: '💻', text: 'Powerful machines for work, coding, and entertainment.' },
  { title: 'Bike Adventure', icon: '🚲', text: 'Reliable rides for city commuting and weekend escapes.' },
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
    if (!GOOGLE_CLIENT_ID || typeof window === 'undefined' || !window.google?.accounts?.id) {
      return
    }

    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: handleGoogleCredentialResponse,
      auto_select: false,
      ux_mode: 'popup',
    })
    setGoogleReady(true)
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
            <p>Premium electronics & rides</p>
          </div>
        </div>

        <div className="search-box">
          <span>🔍</span>
          <input placeholder="Search phones, laptops, bikes..." />
        </div>

        <div className="header-actions">
          <div className="header-pill">👤 {user?.name || 'Guest'}</div>
          <div className="header-pill">🛒 Cart · 3</div>
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
        <div className="main-column">
          <section className="hero-card">
            <div className="hero-main">
              <p className="eyebrow">Limited-time deals</p>
              <h2>Discover the best gadgets and bikes for every lifestyle.</h2>
              <p>Fast delivery, premium quality, and smart prices in one place.</p>
              <div className="hero-actions">
                <a className="btn btn-primary" href="#shop">Shop now</a>
                <a className="btn btn-secondary" href="#offers">View offers</a>
              </div>
            </div>
            <div className="hero-side">
              <div className="side-card">
                <h3>Top rated this week</h3>
                <p>Explore premium laptops, tablets, and smart phones with extra savings.</p>
              </div>
              <div className="side-card">
                <h3>Free shipping</h3>
                <p>Enjoy delivery and easy returns on all featured products.</p>
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
                  <img src={product.image} alt={product.name} />
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
                    <button type="button">Buy now</button>
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
            <p>Save up to 20% on premium gadgets and exciting bundles this weekend.</p>
          </section>
        </div>

        <aside className="right-rail">
          <div className="profile-card">
            <div className="avatar-wrap">
              {user?.photo ? <img src={user.photo} alt={user?.name || 'Guest'} /> : <span>{(user?.name || 'G').charAt(0).toUpperCase()}</span>}
            </div>
            <h3>{user?.name || 'Guest shopper'}</h3>
            <p>{user?.email || 'Browse the store without signing in'}</p>
            {user ? (
              <label className="upload-btn">
                <input type="file" accept="image/*" onChange={handlePhotoChange} />
                Upload photo
              </label>
            ) : (
              <p className="auth-hint">You can still explore products and deals instantly.</p>
            )}
          </div>

          <div className="users-card">
            <h3>Signed in users</h3>
            <p>People currently visiting the store.</p>
            <ul className="users-list">
              {activeUsers.map((activeUser) => (
                <li key={activeUser.email}>
                  <div className="mini-avatar">
                    {activeUser.photo ? <img src={activeUser.photo} alt={activeUser.name || 'User'} /> : <span>{(activeUser.name || 'U').charAt(0).toUpperCase()}</span>}
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
      </div>
    </div>
  )
}

export default App
