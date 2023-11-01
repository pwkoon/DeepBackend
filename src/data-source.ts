import "reflect-metadata"
import { DataSource } from "typeorm"
// import { User } from "./entity/User"
// import { Post } from "./entity/Post"
require('dotenv').config()

export const AppDataSource = new DataSource({
    type: "mysql",
    host: process.env.MYSQL_HOST,
    port: 3306,
    username: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    synchronize: true,
    logging: false,
    entities: [ 
        "src/entity/*.ts"
     ],
    migrations: [
        "src/migration/*.ts"
    ],
    subscribers: [
        "src/subscriber/*.ts"
    ],

})

