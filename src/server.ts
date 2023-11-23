import express from "express"
import jwt from 'jsonwebtoken'
import { Request, Response } from "express"
import { AppDataSource } from "./data-source"
import { Post } from "./entity/Post"
import { User } from "./entity/User"

require('dotenv').config()
const cors = require('cors')

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
app.use(cors())
                  
app.get("/posts", authenticateToken, async function (req: Request, res: Response) {
    const posts = await AppDataSource.getRepository(Post).find()
    res.json(posts)
})

app.post("/posts", authenticateToken, async function (req: Request, res: Response) {
    const user = await AppDataSource.getRepository(User).findOneBy({email: req.body.email})
    const post = await AppDataSource.getRepository(Post).create(req.body)
    const results = await AppDataSource.getRepository(Post).save({...post, user: user})
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


app.delete("/posts/:id", async function (req: Request, res: Response) {
    const results = await AppDataSource.getRepository(Post).delete(req.params.id)
    return res.send(results)
})

// app.get("/users/:userId/posts.", async function (req: Request, res: Response) {
//     const userId = req.params.userId
//     const posts = await AppDataSource
//     .getRepository(Post)
//     .createQueryBuilder("post")
//     .where("post.userId = :userId", { userId })
//     .getMany();
//     return res.json(posts);
// });

app.get("/user/posts", authenticateToken, async function (req: Request, res: Response) {
    console.log("printing req", req.user.user.email)
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
        req.user = user
        next()
    })
}

app.listen(4000)