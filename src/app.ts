import express from "express"
import { Request, Response } from "express"
import { User } from "./entity/User"
import { Post } from "./entity/Post"
import { AppDataSource } from "./data-source"
import { Bootstrap, find } from "../bootstrap"

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

// register routes
app.get("/users", async function (req: Request, res: Response) {
    // here we will have logic to return all users
    const users = await AppDataSource.getRepository(User).find()
    res.json(users)
})

app.get("/users/:id", async function (req: Request, res: Response) {
    // here we will have logic to return user by id
    const results = await AppDataSource.getRepository(User).findOneBy({
        id: req.params.id,
    })
    return res.send(results)
})

app.post("/users", async function (req: Request, res: Response) {
    // here we will have logic to save a user
    const user = await AppDataSource.getRepository(User).create(req.body)
    const results = await AppDataSource.getRepository(User).save(user)
    return res.send(results)
})

app.get("/posts", async function (req: Request, res: Response) {
    const posts = await AppDataSource.getRepository(Post).find()
    res.json(posts)
})

app.post("/posts", async function (req: Request, res: Response) {
    // const firstUser = await AppDataSource
    // .getRepository(User)
    // .createQueryBuilder("user")
    // .where("user.id = :id", { id: 1 })
    // .getOne()

    // const { userId, ...postData } = req.body;
    // const post = await AppDataSource.getRepository(Post).create({...postData, firstUser})
    // const results = await AppDataSource.getRepository(Post).save(post)
    // return res.send(results) 

    const post = await AppDataSource.getRepository(Post).create(req.body)
    const results = await AppDataSource.getRepository(Post).save(post)
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

app.get("/users/:userId/posts", async function (req: Request, res: Response) {
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


// start express server
app.listen(3001)