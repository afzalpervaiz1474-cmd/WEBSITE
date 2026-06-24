import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
dotenv.config()

const app = express()
const port = process.env.PORT || 5000
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const usersFilePath = path.join(__dirname, 'data', 'users.json')
const revokedTokens = new Set()

const ensureUsersFile = () => {
  if (!fs.existsSync(usersFilePath)) {
    fs.mkdirSync(path.dirname(usersFilePath), { recursive: true })
    fs.writeFileSync(usersFilePath, '[]', 'utf8')
  }
}

const loadUsers = () => {
  ensureUsersFile()
  try {
    return JSON.parse(fs.readFileSync(usersFilePath, 'utf8'))
  } catch {
    return []
  }
}

const saveUsers = (data) => {
  ensureUsersFile()
  fs.writeFileSync(usersFilePath, JSON.stringify(data, null, 2), 'utf8')
}

let users = loadUsers()

app.use(cors({ origin: 'http://localhost:5173', credentials: true }))
app.use(express.json())

const createPasswordHash = (password, salt) => crypto.scryptSync(password, salt, 64).toString('hex')

const createToken = (user) => jwt.sign(
  { id: user.id, email: user.email, name: user.name, photo: user.photo || '' },
  process.env.JWT_SECRET || 'supersecret',
  { expiresIn: '7d' },
)

const verifyPassword = (password, user) => {
  if (!user?.passwordHash || !user?.salt) return false
  return createPasswordHash(password, user.salt) === user.passwordHash
}

const setAuthCookie = (res, token) => {
  const isProduction = process.env.NODE_ENV === 'production'
  res.setHeader('Set-Cookie', `auth_token=${token}; HttpOnly; Path=/; Max-Age=${60 * 60 * 24 * 7}; SameSite=Lax${isProduction ? '; Secure' : ''}`)
}

const clearAuthCookie = (res) => {
  const isProduction = process.env.NODE_ENV === 'production'
  res.setHeader('Set-Cookie', `auth_token=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax${isProduction ? '; Secure' : ''}`)
}

const getTokenFromRequest = (req) => {
  const authHeader = req.headers.authorization
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.split(' ')[1]
  }

  const cookieHeader = req.headers.cookie || ''
  const match = cookieHeader.match(/(?:^|; )auth_token=([^;]+)/)
  return match ? decodeURIComponent(match[1]) : null
}

const getUserFromToken = (token) => {
  if (!token) return null
  if (revokedTokens.has(token)) return null

  try {
    return jwt.verify(token, process.env.JWT_SECRET || 'supersecret')
  } catch {
    return null
  }
}

app.get('/api/health', (req, res) => {
  res.json({ ok: true, message: 'Backend is running' })
})

app.post('/api/auth/register', (req, res) => {
  const { email, password, name } = req.body
  const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : ''
  const normalizedPassword = typeof password === 'string' ? password.replace(/[\u0000-\u001f\u007f]/g, '') : ''
  const normalizedName = typeof name === 'string' ? name.trim() : ''

  if (!normalizedEmail || !normalizedPassword) {
    return res.status(400).json({ message: 'Email and password are required' })
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    return res.status(400).json({ message: 'Please provide a valid email address' })
  }

  const existingUser = users.find((user) => user.email === normalizedEmail)
  if (existingUser) {
    return res.status(409).json({ message: 'This email is already registered' })
  }

  const salt = crypto.randomBytes(16).toString('hex')
  const newUser = {
    id: Date.now().toString(),
    email: normalizedEmail,
    name: normalizedName || normalizedEmail.split('@')[0],
    passwordHash: createPasswordHash(normalizedPassword, salt),
    salt,
    provider: 'local',
  }

  users.push(newUser)
  saveUsers(users)

  const token = createToken(newUser)
  setAuthCookie(res, token)

  return res.json({ user: { id: newUser.id, email: newUser.email, name: newUser.name }, token })
})

app.post('/api/auth/google', async (req, res) => {
  const { credential } = req.body
  const normalizedCredential = typeof credential === 'string' ? credential.trim() : ''

  if (!normalizedCredential) {
    return res.status(400).json({ message: 'Google credential is required' })
  }

  try {
    const googleResponse = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(normalizedCredential)}`)
    const googlePayload = await googleResponse.json().catch(() => ({}))

    if (!googleResponse.ok || !googlePayload.email || googlePayload.email_verified !== true && googlePayload.email_verified !== 'true') {
      return res.status(401).json({ message: 'Google authentication failed. Please try again.' })
    }

    const normalizedEmail = googlePayload.email.toLowerCase()
    let user = users.find((entry) => entry.email === normalizedEmail)

    if (!user) {
      user = {
        id: Date.now().toString(),
        email: normalizedEmail,
        name: googlePayload.name || normalizedEmail.split('@')[0],
        provider: 'google',
        photo: googlePayload.picture || '',
      }
      users.push(user)
      saveUsers(users)
    }

    const token = createToken(user)
    setAuthCookie(res, token)
    return res.json({ user: { id: user.id, email: user.email, name: user.name, photo: user.photo || '' }, token })
  } catch {
    return res.status(500).json({ message: 'Google authentication failed. Please try again.' })
  }
})

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body
  const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : ''
  const normalizedPassword = typeof password === 'string' ? password.replace(/[\u0000-\u001f\u007f]/g, '') : ''

  if (!normalizedEmail || !normalizedPassword) {
    return res.status(400).json({ message: 'Email and password are required' })
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    return res.status(400).json({ message: 'Please provide a valid email address' })
  }

  const user = users.find((entry) => entry.email === normalizedEmail)
  if (!user || user.provider !== 'local' || !verifyPassword(normalizedPassword, user)) {
    return res.status(401).json({ message: 'Incorrect email or password. Please try again.' })
  }

  const token = createToken(user)
  setAuthCookie(res, token)
  return res.json({ user: { id: user.id, email: user.email, name: user.name }, token })
})

app.post('/api/auth/logout', (req, res) => {
  const token = getTokenFromRequest(req)
  if (token) {
    revokedTokens.add(token)
  }
  clearAuthCookie(res)
  res.json({ ok: true, message: 'Signed out' })
})

app.get('/api/me', (req, res) => {
  const token = getTokenFromRequest(req)
  const decoded = getUserFromToken(token)

  if (!decoded) {
    return res.status(401).json({ message: 'No active session' })
  }

  return res.json({ user: decoded })
})

app.listen(port, () => {
  console.log(`Backend running on http://localhost:${port}`)
})
