import express, { Request, Response } from "express"
import jwt from 'jsonwebtoken'
import { AppDataSource } from "./data-source"
import { Post } from "./entity/Post"
import { User } from "./entity/User"

require('dotenv').config()
const cors = require('cors')
// const multer  = require('multer')
// const upload = multer({ dest: 'uploads/' })
const app = express()
app.use(express.json())
app.use(cors())

AppDataSource
    .initialize()
    .then(()=>{
        console.log("Data Source has been initialized!")
    })
    .catch((err) => {
        console.error("Error during data source initialization:", err)
    })

app.get("/posts", authenticateToken, async function (req: Request, res: Response) {
    const posts = await AppDataSource.getRepository(Post).find({ relations: {
        user: true,
    },})
    res.json(posts)
    console.log(posts)
})

app.get("/posts/:id", authenticateToken, async function (req: Request, res: Response) {
    const post = await AppDataSource.getRepository(Post).findOneBy({
        id: req.params.id,
    })
    res.json(post)
})

app.post("/posts", authenticateToken, async function (req: Request, res: Response) {
    const user = await AppDataSource.getRepository(User).findOneBy({email: req.user.user.email})
    const post = await AppDataSource.getRepository(Post).create(req.body)
    const results = await AppDataSource.getRepository(Post).save({...post, user: user})
    return res.send(results)
})

app.put("/posts/:id", authenticateToken, async function (req: Request, res: Response) {
    const post = await AppDataSource.getRepository(Post).findOneBy({
        id: req.params.id,
    })
    AppDataSource.getRepository(Post).merge(post, req.body)
    const results = await AppDataSource.getRepository(Post).save(post)
    return res.send(results)
})

app.delete("/posts/:id", async function (req: Request, res: Response) {
    const postToDelete = await AppDataSource.getRepository(Post).findOneBy({
        id: req.params.id,
    })
    if (postToDelete) {
        res.json(postToDelete)
        AppDataSource.getRepository(Post).remove(postToDelete);
    }
})

app.get("/user/posts", authenticateToken, async function (req: Request, res: Response) {
    const userExist = await AppDataSource.getRepository(User).findOneBy({email: req.user.user.email})
    const userId = await userExist.id
    const posts = await AppDataSource
    .getRepository(Post)
    .createQueryBuilder("post")
    .where("post.userId = :userId", { userId })
    .getMany();
    return res.json(posts);
});

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]
    if (token == null) return res.sendStatus(402)
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
        console.log(err)
        if (err) return res.sendStatus(403)
        console.log(req)
        console.log("print from authenticatoken", user)
        req.user = user
        next()
    })
}

app.listen(4000)