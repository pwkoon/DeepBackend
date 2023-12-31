import express, { Request, Response } from "express"
import jwt from 'jsonwebtoken'
import { AppDataSource } from "./data-source"
import { Post } from "./entity/Post"
import { User } from "./entity/User"
import crypto from 'crypto'
import sharp from "sharp"

import multer from 'multer'
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

require('dotenv').config()

const cors = require('cors')
const storage = multer.memoryStorage()
const upload = multer({ storage: storage })
const app = express()
app.use(express.json())
app.use(cors())

const randomImageName = (bytes = 32) => crypto.randomBytes(16).toString('hex')

const bucketName = process.env.BUCKET_NAME
const bucketRegion = process.env.BUCKET_REGION
const accessKey = process.env.ACCESS_KEY
const secretAccessKey = process.env.SECRET_ACCESS_KEY

const s3 = new S3Client({
    credentials: {
        accessKeyId: accessKey,
        secretAccessKey: secretAccessKey,
    },
    region: bucketRegion,
})

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
    for (const post of posts) {
        const getObjectParams = {
            Bucket: bucketName,
            Key: post.imageName,
        }
        const command = new GetObjectCommand(getObjectParams);
        const url = await getSignedUrl(s3, command, { expiresIn: 3600 });
        post.photo = url
        console.log("url", url)
    }
    res.json(posts)
})

app.get("/posts/:id", authenticateToken, async function (req: Request, res: Response) {
    const post = await AppDataSource.getRepository(Post).findOneBy({
        id: req.params.id,
    })
    res.json(post)
})

app.post("/posts", authenticateToken, upload.single('image'), async function (req: Request, res: Response) {
    const user = await AppDataSource.getRepository(User).findOneBy({email: req.user.user.email})
    const buffer = await sharp(req.file.buffer).resize({height: 600, width: 600, fit: "fill"}).toBuffer()
    const imageName = randomImageName();
    const params = {
        Bucket: bucketName,
        Key: imageName,
        Body: buffer,
        ContentType: req.file.mimetype,
    }
    const command = new PutObjectCommand(params)
    await s3.send(command)

    const photo = `https://${bucketName}.s3-${bucketRegion}.amazonaws.com/${imageName}`;
    const post = await AppDataSource.getRepository(Post).create({title: req.body.title, content: req.body.content, photo: photo, imageName: imageName})
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
    .leftJoinAndSelect("post.user", "user")  // Assuming "user" is the property name in the Post entity that represents the User relation
    .where("post.userId = :userId", { userId })
    .getMany();
    for (const post of posts) {
        const getObjectParams = {
            Bucket: bucketName,
            Key: post.imageName,
        }
        const command = new GetObjectCommand(getObjectParams);
        const url = await getSignedUrl(s3, command, { expiresIn: 3600 });
        post.photo = url
    }
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