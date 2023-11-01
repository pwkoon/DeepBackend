import { Request, Response } from "express"
import express from "express"
import bcrypt from "bcrypt";
import jwt from 'jsonwebtoken'
import { AppDataSource } from "./data-source"
import { User } from "./entity/User"
import { Post } from "./entity/Post"
import { userInfo } from "os";

require('dotenv').config()

//establish database connection
AppDataSource
    .initialize()
    .then(()=>{
        console.log("Data Source has been initialized!")
    })
    .catch((err) => {
        console.error("Error during data source initialization:", err)
    })

// create and setup express app
const app = express()
app.use(express.json())

// create /register route
app.post("/register", async function (req: Request, res: Response) {
    try {
        const userExist = await AppDataSource.getRepository(User).findOneBy({email: req.body.email})
        if (userExist) {
            res.send("User already exist")
            // redirect to login page
            // res.redirect('/login')
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

// create /login routers
app.post('/login', async (req, res) => {
    // Authenticate User
    const currentUser= await AppDataSource.getRepository(User).findOneBy({
        email: req.body.email,
    })
    // Compare the password
    const match = await bcrypt.compare(req.body.password, currentUser.password)
    if (match) {
        const email = req.body.email
        const user = { email: email }
        const accessToken = generateAccessToken(user)
        const refreshToken = jwt.sign(user, process.env.REFRESH_TOKEN_SECRET)
        // refreshTokens.push(refreshToken)
        res.json({ accessToken: accessToken, refreshToken: refreshToken })
    }
  })
  
  
// create /token route
app.post('/refresh-token', async (req, res) => {
    const refreshToken = req.body.refreshToken;
    if (!refreshToken) {
        return res.status(400).json({message: 'Refresh token is required'})
    }

    jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, user) => {
        if (err) {
            return res.status(401).json({ message: "Invalid refresh token" });
        }
        // Valid refresh token, generate a new access token
        const newAccessToken = generateAccessToken(user);
        res.json({ accessToken: newAccessToken });
    })
})
                  
app.get("/posts", authenticateToken, async function (req: Request, res: Response) {
    const posts = await AppDataSource.getRepository(Post).find()
    res.json(posts)
})

app.post("/posts", authenticateToken,  async function (req: Request, res: Response) {
    // const firstUser = await AppDataSource
    // .getRepository(User)
    // .createQueryBuilder("user")
    // .where("user.id = :id", { id: 1 })
    // .getOne()
    
    // const { userId, ...postData } = req.body;
    // const post = await AppDataSource.getRepository(Post).create({...postData, firstUser})
    // const results = await AppDataSource.getRepository(Post).save(post)
    // return res.send(results) 
    const currentUser = (req as any).user
    if (!currentUser) {
        console.log("You have to log in first!")
    }
    // const { user } = req.body
    const post = await AppDataSource.getRepository(Post).create(req.body)
    //check the current login user details
    const results = await AppDataSource.getRepository(Post).save({...post, user: currentUser})
    return res.send(results)
})

app.put("/posts/:id", async function (req: Request, res: Response) {
    const post = await AppDataSource.getRepository(Post).findOneBy({
        id: req.params.id,
    })
    AppDataSource.getRepository(Post).merge(post, req.body)
    const results = await AppDataSource.getRepository(Post).save(post)
    return res.send(results)
})

app.get("/users/:userId/posts.", async function (req: Request, res: Response) {
    const userId = req.params.userId
    // Use the query builder to retrieve user-specific posts
    const posts = await AppDataSource
    .getRepository(Post)
    .createQueryBuilder("post")
    .where("post.userId = :userId", { userId })
    .getMany();
    return res.json(posts);
});

app.delete("/posts/:id", async function (req: Request, res: Response) {
    const results = await AppDataSource.getRepository(Post).delete(req.params.id)
    return res.send(results)
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

// start express server
app.listen(3000)