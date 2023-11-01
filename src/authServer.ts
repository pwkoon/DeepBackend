import express from "express"
import bcrypt from "bcrypt";
import jwt from 'jsonwebtoken'
import { Request, Response } from "express"
import { AppDataSource } from "./data-source"
import { User } from "./entity/User"

require('dotenv').config()

AppDataSource
    .initialize()
    .then(()=>{
        console.log("Data Source has been initialized!")
    })
    .catch((err) => {
        console.error("Error during data source initialization:", err)
    })

const app = express()
app.use(express.json())

app.post("/register", async function (req: Request, res: Response) {
    try {
        const userExist = await AppDataSource.getRepository(User).findOneBy({email: req.body.email})
        if (userExist) {
            res.send("User already exist")
            res.redirect('/login')
        } 
        const { password } = req.body;
        const user = await AppDataSource.getRepository(User).create(req.body)
        const salt = bcrypt.genSaltSync(10)
        const hashedPassword = await bcrypt.hash(password, salt)
        const results = await AppDataSource.getRepository(User).save({...user, password: hashedPassword})
        return res.send(results)       
    } catch (error) {
        console.log("Error: ", error)
    }
})

app.post('/login', async (req, res) => {
    const currentUser= await AppDataSource.getRepository(User).findOneBy({
        email: req.body.email,
    })
    const match = await bcrypt.compare(req.body.password, currentUser.password)
    if (match) {
        const email = req.body.email
        const user = { email: email }
        const accessToken = generateAccessToken(user)
        const refreshToken = jwt.sign(user, process.env.REFRESH_TOKEN_SECRET)
        res.json({ accessToken: accessToken, refreshToken: refreshToken })
    }
  })
  
app.post('/refresh-token', async (req, res) => {
    const refreshToken = req.body.refreshToken;
    if (!refreshToken) {
        return res.status(400).json({message: 'Refresh token is required'})
    }
    jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err: Error, user: any) => {
        if (err) {
            return res.status(401).json({ message: "Invalid refresh token" });
        }
        const newAccessToken = generateAccessToken(user);
        res.json({ accessToken: newAccessToken });
    })
})

function generateAccessToken(user) {
    return jwt.sign({ user }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' })
}
  
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]
    if (token == null) return res.sendStatus(402)
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
        console.log(err)
        if (err) return res.sendStatus(403)
        req.user = user
        next()
    })
}

app.listen(3001)