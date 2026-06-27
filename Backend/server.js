import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { MongoClient } from 'mongodb'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const envPath = path.join(__dirname, '.env')
const rootEnvPath = path.join(__dirname, '..', '.env')
const envFile = fs.existsSync(envPath) ? envPath : rootEnvPath
dotenv.config({ path: envFile })

const app = express()
const port = process.env.PORT || 5000
const usersFilePath = path.join(__dirname, 'data', 'users.json')
const frontEndDist = path.join(__dirname, '../Forntend/dist')
const mongoUri = process.env.MONGO_URI || ''
const mongoClient = mongoUri ? new MongoClient(mongoUri) : null
let usersCollection = null
let mongoConnected = false

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

const connectMongo = async () => {
  if (!mongoClient) {
    console.warn('No MONGO_URI provided, using local JSON storage')
    return
  }

  await mongoClient.connect()
  const db = mongoClient.db()
  usersCollection = db.collection('users')
  await usersCollection.createIndex({ email: 1 }, { unique: true })
  mongoConnected = true
  console.log('Connected to MongoDB')
}

connectMongo().catch((error) => {
  console.error('MongoDB connection failed:', error.message || error)
})

const findUserByEmail = async (email) => {
  if (mongoConnected && usersCollection) {
    return usersCollection.findOne({ email })
  }
  return users.find((u) => u.email === email)
}

const insertUser = async (user) => {
  if (mongoConnected && usersCollection) {
    await usersCollection.insertOne(user)
    return user
  }
  users.push(user)
  saveUsers(users)
  return user
}

const updateUser = async (user) => {
  if (mongoConnected && usersCollection) {
    await usersCollection.updateOne({ email: user.email }, { $set: user }, { upsert: true })
    return user
  }

  const index = users.findIndex((u) => u.email === user.email)
  if (index >= 0) {
    users[index] = user
  } else {
    users.push(user)
  }
  saveUsers(users)
  return user
}

const allowedOrigins = [
  process.env.FRONTEND_ORIGIN || 'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000',
  'https://website-3.onrender.com',
].filter(Boolean)

app.use((req, res, next) => {
  const origin = req.headers.origin || '*'
  if (!origin || allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin || '*')
    res.header('Access-Control-Allow-Credentials', 'true')
  }
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization'
  )
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS')
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204)
  }
  next()
})
app.use(cors({ origin: allowedOrigins, credentials: true }))
app.options(/.*/, cors({ origin: allowedOrigins, credentials: true }))
app.use(express.json())

const createPasswordHash = (password, salt) =>
  crypto.scryptSync(password, salt, 64).toString('hex')

const createToken = (user) =>
  jwt.sign(
    {
      id: user.id,
      email: user.email,
      name: user.name,
    },
    process.env.JWT_SECRET || 'supersecret',
    { expiresIn: '7d' }
  )

const verifyPassword = (password, user) => {
  if (!user?.passwordHash || !user?.salt) return false
  return createPasswordHash(password, user.salt) === user.passwordHash
}

app.get('/api/health', (req, res) => {
  res.json({ ok: true, message: 'Backend is running' })
})

app.post('/api/auth/register', async (req, res) => {
  const { email, password, name } = req.body

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password required' })
  }

  const normalizedEmail = email.toLowerCase().trim()
  if (await findUserByEmail(normalizedEmail)) {
    return res.status(409).json({ message: 'User already exists' })
  }

  const salt = crypto.randomBytes(16).toString('hex')
  const newUser = {
    id: Date.now().toString(),
    email: normalizedEmail,
    name: name || 'User',
    salt,
    passwordHash: createPasswordHash(password, salt),
    provider: 'local',
  }

  await insertUser(newUser)

  const token = createToken(newUser)

  res.json({
    user: { id: newUser.id, email: newUser.email, name: newUser.name },
    token,
  })
})

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body
  const normalizedEmail = email?.toLowerCase().trim()
  const user = await findUserByEmail(normalizedEmail)

  if (!user) {
    return res.status(401).json({ message: 'User not found' })
  }

  if (!verifyPassword(password, user)) {
    return res.status(401).json({ message: 'Wrong password' })
  }

  const token = createToken(user)

  res.json({
    user: { id: user.id, email: user.email, name: user.name },
    token,
  })
})

app.post('/api/auth/google', async (req, res) => {
  const { credential } = req.body

  if (!credential) {
    return res.status(400).json({ message: 'Google credential is required' })
  }

  try {
    const googleResponse = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(
        credential
      )}`
    )
    const googlePayload = await googleResponse.json().catch(() => ({}))

    if (
      !googleResponse.ok ||
      !googlePayload.email ||
      (googlePayload.email_verified !== true && googlePayload.email_verified !== 'true')
    ) {
      return res.status(401).json({ message: 'Google authentication failed' })
    }

    const normalizedEmail = googlePayload.email.toLowerCase()
    let user = await findUserByEmail(normalizedEmail)

    if (!user) {
      user = {
        id: Date.now().toString(),
        email: normalizedEmail,
        name: googlePayload.name || normalizedEmail.split('@')[0],
        provider: 'google',
        photo: googlePayload.picture || '',
        salt: '',
        passwordHash: '',
      }
      await insertUser(user)
    } else {
      user.photo = googlePayload.picture || user.photo || ''
      await updateUser(user)
    }

    const token = createToken(user)
    res.json({ user: { id: user.id, email: user.email, name: user.name, photo: user.photo }, token })
  } catch (error) {
    res.status(500).json({ message: 'Google authentication failed' })
  }
})

app.post('/api/auth/logout', (req, res) => {
  res.status(204).send()
})

app.use(express.static(frontEndDist))

app.get(/.*/, (req, res) => {
  res.sendFile(path.join(frontEndDist, 'index.html'))
})

app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`)
})
