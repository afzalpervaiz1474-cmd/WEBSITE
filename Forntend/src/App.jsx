import { useEffect, useMemo, useState } from 'react'
import './amazon.css'
import { loadGoogleScript } from './googleAuth.js'

const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''

const products = [
  { id: 1, name: 'Nova X10 Pro', price: 699, image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=900&q=80', description: 'Flagship phone with vivid display and pro camera.' },
  { id: 2, name: 'Aero Tab 11', price: 449, image: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=900&q=80', description: 'Ultra-light tablet for work and streaming.' },
  { id: 3, name: 'Studio Pro 14', price: 1299, image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=900&q=80', description: 'High-performance laptop for creators.' },
  { id: 4, name: 'CityRide 2.0', price: 399, image: 'https://images.unsplash.com/photo-1507035895480-2b3156c31fc8?auto=format&fit=crop&w=900&q=80', description: 'Comfortable commuter bike with smooth ride.' },
  { id: 5, name: 'Spark Lite 8', price: 299, image: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=900&q=80', description: 'Affordable smartphone with fast charging.' },
  { id: 6, name: 'ChronoWave Watch', price: 179, image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=900&q=80', description: 'Smartwatch with fitness tracking and style.' },
  { id: 7, name: 'BassPulse Headphones', price: 59, image: 'https://images.unsplash.com/photo-1518441314024-0e8b4d4cf6d4?auto=format&fit=crop&w=900&q=80', description: 'Immersive sound with deep bass and comfort.' },
  { id: 8, name: 'TurboPower Bank', price: 49, image: 'https://images.unsplash.com/photo-1621881018302-050a9b5c0b1b?auto=format&fit=crop&w=900&q=80', description: 'Fast charging power bank for daily use.' },
]

function App() {
  const [authMode, setAuthMode] = useState('signup')
  const [formData, setFormData] = useState({ name: '', email: '', password: '' })
  const [authError, setAuthError] = useState('')
  const [authSuccess, setAuthSuccess] = useState('')
  const [authBusy, setAuthBusy] = useState(false)
  const [googleReady, setGoogleReady] = useState(false)
  const [user, setUser] = useState(null)
  const [cartItems, setCartItems] = useState(() => {
    if (typeof window === 'undefined') return []
    try {
      return JSON.parse(localStorage.getItem('afzal-cart') || '[]')
    } catch {
      return []
    }
  })
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [orderData, setOrderData] = useState({ name: '', email: '', phone: '', address: '', quantity: 1 })
  const [orderState, setOrderState] = useState({ type: '', message: '' })

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('afzal-cart', JSON.stringify(cartItems))
    }
  }, [cartItems])

  const resetMessages = () => {
    setAuthError('')
    setAuthSuccess('')
  }

  const handleInputChange = (field, value) => {
    setFormData((current) => ({ ...current, [field]: value }))
  }

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

  const validatePassword = (password) => {
    const checks = [
      { test: password.length >= 8, message: 'at least 8 characters' },
      { test: /[A-Z]/.test(password), message: 'one uppercase letter' },
      { test: /[a-z]/.test(password), message: 'one lowercase letter' },
      { test: /\d/.test(password), message: 'one number' },
      { test: /[^A-Za-z0-9]/.test(password), message: 'one special character' },
    ]

    const failed = checks.filter((item) => !item.test).map((item) => item.message)
    return {
      valid: failed.length === 0,
      message: failed.join(', '),
    }
  }

  const handleAuthSubmit = async (event) => {
    event.preventDefault()
    resetMessages()
    setAuthBusy(true)

    const name = formData.name.trim()
    const email = formData.email.trim().toLowerCase()
    const password = formData.password

    if (!email || !password || (authMode === 'signup' && !name)) {
      setAuthError('Please complete all fields.')
      setAuthBusy(false)
      return
    }

    if (!validateEmail(email)) {
      setAuthError('Please enter a valid email address.')
      setAuthBusy(false)
      return
    }

    if (authMode === 'signup') {
      const passwordCheck = validatePassword(password)
      if (!passwordCheck.valid) {
        setAuthError(`Strong password required: ${passwordCheck.message}.`)
        setAuthBusy(false)
        return
      }
    }

    try {
      const endpoint = authMode === 'signup' ? '/api/auth/register' : '/api/auth/login'
      const requestUrl = `${API_URL}${endpoint}`
      const response = await fetch(requestUrl, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      })

      const data = await response.json().catch(() => ({ message: 'Unable to parse server response.' }))

      if (!response.ok) {
        throw new Error(data.message || 'Authentication failed.')
      }

      setUser(data.user)
      setFormData({ name: '', email: '', password: '' })
      setAuthSuccess(authMode === 'signup' ? 'Account created successfully.' : 'Signed in successfully.')
    } catch (error) {
      setAuthError(error.message || 'Authentication failed. Please try again.')
    } finally {
      setAuthBusy(false)
    }
  }

  const handleGoogleCredentialResponse = async (response) => {
    resetMessages()
    if (!response?.credential) {
      setAuthError('Google sign-in was cancelled.')
      return
    }

    setAuthBusy(true)

    try {
      const googleResponse = await fetch(`${API_URL}/api/auth/google`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: response.credential }),
      })

      const data = await googleResponse.json().catch(() => ({ message: 'Unable to parse server response.' }))
      if (!googleResponse.ok) {
        throw new Error(data.message || 'Google sign-in failed.')
      }

      setUser(data.user)
      setAuthSuccess('Signed in successfully with Google.')
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

    let mounted = true
    loadGoogleScript()
      .then(() => {
        if (!mounted || !window.google?.accounts?.id) return
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleGoogleCredentialResponse,
        })
        setGoogleReady(true)
      })
      .catch(() => {
        if (mounted) {
          setAuthError('Google sign-in failed to load.')
        }
      })

    return () => {
      mounted = false
    }
  }, [])

  const handleLogout = async () => {
    try {
      await fetch(`${API_URL}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      })
    } catch {
      // ignore network issues
    }

    setUser(null)
    setSelectedProduct(null)
    setOrderState({ type: '', message: '' })
    resetMessages()
  }

  const addToCart = (product) => {
    setCartItems((current) => {
      const existing = current.find((item) => item.id === product.id)
      if (existing) {
        return current.map((item) => (item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item))
      }
      return [...current, { ...product, quantity: 1 }]
    })
  }

  const removeFromCart = (productId) => {
    setCartItems((current) => current.filter((item) => item.id !== productId))
  }

  const openOrderModal = (product) => {
    if (!user) {
      setAuthError('Please sign in first to place an order.')
      return
    }

    setSelectedProduct(product)
    setOrderState({ type: '', message: '' })
    setOrderData({
      name: user.name || '',
      email: user.email || '',
      phone: '',
      address: '',
      quantity: 1,
    })
  }

  const closeOrderModal = () => {
    setSelectedProduct(null)
    setOrderState({ type: '', message: '' })
  }

  const handleOrderSubmit = (event) => {
    event.preventDefault()

    if (!selectedProduct) return

    if (!orderData.name.trim() || !orderData.email.trim() || !orderData.phone.trim() || !orderData.address.trim()) {
      setOrderState({ type: 'error', message: 'Please complete all delivery details.' })
      return
    }

    if (orderData.phone.length < 10) {
      setOrderState({ type: 'error', message: 'Please enter a valid phone number.' })
      return
    }

    setOrderState({
      type: 'success',
      message: `Order placed successfully for ${selectedProduct.name}. We will contact you shortly.`,
    })
  }

  const totalItems = useMemo(() => cartItems.reduce((sum, item) => sum + item.quantity, 0), [cartItems])
  const totalPrice = useMemo(() => cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0), [cartItems])

  if (!user) {
    return (
      <div style={styles.authPage}>
        <div style={styles.authCard}>
          <p style={styles.eyebrow}>Secure access • AFZAL Store</p>
          <h1 style={styles.authTitle}>Create account first</h1>
          <p style={styles.authSubtitle}>Sign up securely, then sign in to browse products, place orders, and enjoy a protected checkout.</p>

          <div style={styles.authToggleRow}>
            <button type="button" style={authMode === 'signin' ? styles.activeAuthButton : styles.authButton} onClick={() => { setAuthMode('signin'); resetMessages() }}>Sign in</button>
            <button type="button" style={authMode === 'signup' ? styles.activeAuthButton : styles.authButton} onClick={() => { setAuthMode('signup'); resetMessages() }}>Sign up</button>
          </div>

          <form onSubmit={handleAuthSubmit} style={styles.form}>
            {authMode === 'signup' && (
              <input style={styles.input} type="text" placeholder="Full name" value={formData.name} onChange={(event) => handleInputChange('name', event.target.value)} required />
            )}
            <input style={styles.input} type="email" placeholder="Email address" value={formData.email} onChange={(event) => handleInputChange('email', event.target.value)} required />
            <input style={styles.input} type="password" placeholder="Password" value={formData.password} onChange={(event) => handleInputChange('password', event.target.value)} required />
            {authMode === 'signup' ? <p style={styles.helperText}>Password must contain at least 8 characters, uppercase, lowercase, number, and a symbol.</p> : null}
            <button type="submit" style={styles.primaryButton} disabled={authBusy}>{authBusy ? 'Please wait...' : authMode === 'signin' ? 'Sign in' : 'Create secure account'}</button>
          </form>

          {GOOGLE_CLIENT_ID ? (
            <button type="button" style={styles.secondaryButton} disabled={!googleReady || authBusy} onClick={() => window.google?.accounts?.id?.prompt()}>
              Continue with Google
            </button>
          ) : null}

          {authError ? <p style={styles.errorText}>{authError}</p> : null}
          {authSuccess ? <p style={styles.successText}>{authSuccess}</p> : null}
        </div>
      </div>
    )
  }

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div>
          <p style={styles.eyebrow}>Premium shopping • Fast delivery</p>
          <h1 style={styles.title}>AFZAL Store</h1>
          <p style={styles.subtitle}>Electronics, gadgets, accessories and everyday essentials.</p>
        </div>
        <div style={styles.headerInfo}>
          <div style={styles.badge}>Cart · {totalItems}</div>
          <div style={styles.userPill}>Hi, {user.name || user.email}</div>
        </div>
      </header>

      <div style={styles.layout}>
        <main style={styles.main}>
          <section style={styles.heroCard}>
            <div>
              <p style={styles.eyebrow}>Fresh picks</p>
              <h2 style={styles.heroTitle}>Shop the best deals at AFZAL Store</h2>
              <p style={styles.heroText}>Browse products, place an order instantly, and enjoy a secure checkout experience.</p>
            </div>
          </section>

          <div style={styles.grid}>
            {products.map((product) => (
              <article key={product.id} style={styles.card}>
                <img src={product.image} alt={product.name} style={styles.image} />
                <div style={styles.cardBody}>
                  <h3 style={styles.productName}>{product.name}</h3>
                  <p style={styles.productDesc}>{product.description}</p>
                  <div style={styles.cardFooter}>
                    <strong style={styles.price}>₹{product.price}</strong>
                    <button type="button" style={styles.addButton} onClick={() => openOrderModal(product)}>
                      Order now
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </main>

        <aside style={styles.sidebar}>
          <div style={styles.panel}>
            <h3 style={styles.panelTitle}>Account</h3>
            <p style={styles.panelText}>Signed in as {user.email}</p>
            <button type="button" style={styles.secondaryButton} onClick={handleLogout}>Sign out</button>
            {authError ? <p style={styles.errorText}>{authError}</p> : null}
            {authSuccess ? <p style={styles.successText}>{authSuccess}</p> : null}
          </div>

          <div style={styles.panel}>
            <h3 style={styles.panelTitle}>Your cart</h3>
            {cartItems.length === 0 ? (
              <p style={styles.panelText}>Your cart is empty. Add a product to begin.</p>
            ) : (
              <div>
                {cartItems.map((item) => (
                  <div key={item.id} style={styles.cartRow}>
                    <div>
                      <strong>{item.name}</strong>
                      <p style={styles.cartMeta}>Qty {item.quantity} • ₹{item.price * item.quantity}</p>
                    </div>
                    <button type="button" style={styles.smallButton} onClick={() => removeFromCart(item.id)}>Remove</button>
                  </div>
                ))}
              </div>
            )}
            <div style={styles.totalBox}>
              <span>Total items: {totalItems}</span>
              <strong>₹{totalPrice}</strong>
            </div>
          </div>
        </aside>
      </div>

      {selectedProduct ? (
        <div style={styles.modalOverlay}>
          <div style={styles.modalCard}>
            <div style={styles.modalHeader}>
              <div>
                <p style={styles.eyebrow}>Order now</p>
                <h3 style={styles.modalTitle}>{selectedProduct.name}</h3>
              </div>
              <button type="button" style={styles.closeButton} onClick={closeOrderModal}>×</button>
            </div>

            {orderState.type === 'success' ? (
              <div>
                <p style={styles.successText}>{orderState.message}</p>
                <button type="button" style={styles.primaryButton} onClick={closeOrderModal}>Continue shopping</button>
              </div>
            ) : (
              <form onSubmit={handleOrderSubmit} style={styles.orderForm}>
                <p style={styles.panelText}>Please enter your delivery details to confirm your order.</p>
                <input style={styles.input} type="text" placeholder="Your name" value={orderData.name} onChange={(event) => setOrderData((current) => ({ ...current, name: event.target.value }))} required />
                <input style={styles.input} type="email" placeholder="Email address" value={orderData.email} onChange={(event) => setOrderData((current) => ({ ...current, email: event.target.value }))} required />
                <input style={styles.input} type="tel" placeholder="Phone number" value={orderData.phone} onChange={(event) => setOrderData((current) => ({ ...current, phone: event.target.value }))} required />
                <textarea style={styles.textarea} placeholder="Delivery address" value={orderData.address} onChange={(event) => setOrderData((current) => ({ ...current, address: event.target.value }))} required />
                <label style={styles.quantityLabel}>
                  Quantity
                  <input style={styles.input} type="number" min="1" max="10" value={orderData.quantity} onChange={(event) => setOrderData((current) => ({ ...current, quantity: Number(event.target.value) }))} />
                </label>
                <button type="submit" style={styles.primaryButton}>Place order</button>
                {orderState.type === 'error' ? <p style={styles.errorText}>{orderState.message}</p> : null}
              </form>
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}

const styles = {
  authPage: { minHeight: '100vh', background: 'linear-gradient(135deg, #111827 0%, #2563eb 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' },
  authCard: { width: '100%', maxWidth: '480px', background: 'white', borderRadius: '24px', padding: '28px', boxShadow: '0 16px 40px rgba(0,0,0,0.2)' },
  authTitle: { margin: '4px 0 8px', fontSize: '30px' },
  authSubtitle: { margin: '0 0 16px', color: '#6b7280', lineHeight: 1.5 },
  page: { minHeight: '100vh', background: '#f5f7fb', color: '#111827', fontFamily: 'Inter, Arial, sans-serif', padding: '24px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', background: 'linear-gradient(135deg, #111827 0%, #1f2937 100%)', color: 'white', padding: '24px 28px', borderRadius: '20px', marginBottom: '20px' },
  eyebrow: { margin: 0, textTransform: 'uppercase', letterSpacing: '0.2em', fontSize: '12px', opacity: 0.9 },
  title: { margin: '4px 0', fontSize: '32px' },
  subtitle: { margin: 0, opacity: 0.9 },
  headerInfo: { display: 'flex', gap: '10px', flexWrap: 'wrap' },
  badge: { background: '#f59e0b', color: '#111827', padding: '10px 14px', borderRadius: '999px', fontWeight: 700 },
  userPill: { background: 'rgba(255,255,255,0.16)', padding: '10px 14px', borderRadius: '999px' },
  layout: { display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' },
  main: { display: 'flex', flexDirection: 'column', gap: '16px' },
  heroCard: { background: 'white', borderRadius: '18px', padding: '24px', boxShadow: '0 8px 24px rgba(0,0,0,0.05)' },
  heroTitle: { margin: '6px 0', fontSize: '28px' },
  heroText: { margin: 0, color: '#6b7280' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '16px' },
  card: { background: 'white', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 8px 24px rgba(0,0,0,0.05)' },
  image: { width: '100%', height: '180px', objectFit: 'cover' },
  cardBody: { padding: '14px' },
  productName: { margin: '0 0 6px', fontSize: '18px' },
  productDesc: { margin: '0 0 12px', color: '#6b7280', fontSize: '14px' },
  cardFooter: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' },
  price: { fontSize: '18px', color: '#111827' },
  addButton: { border: 'none', background: '#2563eb', color: 'white', padding: '10px 12px', borderRadius: '10px', cursor: 'pointer', fontWeight: 600 },
  sidebar: { display: 'flex', flexDirection: 'column', gap: '16px' },
  panel: { background: 'white', borderRadius: '16px', padding: '16px', boxShadow: '0 8px 24px rgba(0,0,0,0.05)' },
  panelTitle: { marginTop: 0, marginBottom: '10px' },
  panelText: { margin: 0, color: '#6b7280', lineHeight: 1.5 },
  form: { display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '8px' },
  input: { padding: '10px 12px', borderRadius: '10px', border: '1px solid #d1d5db' },
  textarea: { padding: '10px 12px', borderRadius: '10px', border: '1px solid #d1d5db', minHeight: '90px', resize: 'vertical' },
  primaryButton: { border: 'none', background: '#2563eb', color: 'white', padding: '10px 12px', borderRadius: '10px', cursor: 'pointer', fontWeight: 600 },
  secondaryButton: { border: '1px solid #d1d5db', background: 'white', color: '#111827', padding: '10px 12px', borderRadius: '10px', cursor: 'pointer', fontWeight: 600, marginTop: '8px' },
  authToggleRow: { display: 'flex', gap: '8px', marginBottom: '8px' },
  authButton: { flex: 1, border: '1px solid #d1d5db', background: 'white', color: '#111827', padding: '8px 10px', borderRadius: '10px', cursor: 'pointer' },
  activeAuthButton: { flex: 1, border: 'none', background: '#111827', color: 'white', padding: '8px 10px', borderRadius: '10px', cursor: 'pointer' },
  helperText: { margin: 0, color: '#6b7280', fontSize: '13px', lineHeight: 1.4 },
  errorText: { marginTop: '10px', color: '#dc2626' },
  successText: { marginTop: '10px', color: '#15803d' },
  cartRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', marginBottom: '10px' },
  cartMeta: { margin: '2px 0 0', color: '#6b7280', fontSize: '13px' },
  smallButton: { border: '1px solid #fca5a5', background: '#fff1f2', color: '#b91c1c', padding: '6px 8px', borderRadius: '8px', cursor: 'pointer' },
  totalBox: { marginTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #e5e7eb', paddingTop: '12px' },
  modalOverlay: { position: 'fixed', inset: 0, background: 'rgba(17,24,39,0.64)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' },
  modalCard: { width: '100%', maxWidth: '480px', background: 'white', borderRadius: '20px', padding: '20px', boxShadow: '0 16px 40px rgba(0,0,0,0.25)' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' },
  modalTitle: { margin: '4px 0 0' },
  closeButton: { border: 'none', background: 'transparent', fontSize: '24px', cursor: 'pointer' },
  orderForm: { display: 'flex', flexDirection: 'column', gap: '10px' },
  quantityLabel: { display: 'flex', flexDirection: 'column', gap: '6px', color: '#374151', fontWeight: 600 },
}

export default App
