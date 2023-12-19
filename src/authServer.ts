import express, { Request, Response } from "express"
import bcrypt from "bcrypt";
import jwt from 'jsonwebtoken'
import { AppDataSource } from "./data-source"
import { User } from "./entity/User"

require('dotenv').config()
const cookieParser = require('cookie-parser');
const cors = require('cors')
const app = express()
app.use(express.json())
app.use(cors())
app.use(cookieParser());

const corsOptions = {
    origin: 'http://localhost:3000', // Specify the origin of your client application
    credentials: true, // Allow credentials (cookies, HTTP authentication) to be sent
};
app.use(cors(corsOptions));

AppDataSource
    .initialize()
    .then(()=>{
        console.log("Data Source has been initialized!")
    })
    .catch((err) => {
        console.error("Error during data source initialization:", err)
    })

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
    try {
        const userExist = await AppDataSource.getRepository(User).findOneBy({email: req.body.email})
        if (!userExist) {
            res.redirect('/register')
        } else {
            const match = await bcrypt.compare(req.body.password, userExist.password)
            if (match) {
                const email = req.body.email
                const user = { email: email, username: userExist.username, id: userExist.id }
                const accessToken = generateAccessToken(user)
                const refreshToken = jwt.sign(user, process.env.REFRESH_TOKEN_SECRET)
                res.json({ user: user, accessToken: accessToken, refreshToken: refreshToken })
                // res.cookie('jwtToken', accessToken, { httpOnly: true, secure: true }) //{ httpOnly: true, maxAge: 3600000 }
            }
        }
    } catch (error) {
        console.log("Error: ", error)
    }
})

app.post('/logout', (req, res) => {
    res.status(200).json({ message: 'Logout successful' });
    // Clear the JWT token cookie
    // res.clearCookie('jwtToken');
  });
  
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

  
app.listen(4001)