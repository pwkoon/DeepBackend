import "reflect-metadata"
import { DataSource } from "typeorm"
// import { User } from "./entity/User"
// import { Post } from "./entity/Post"

export const AppDataSource = new DataSource({
    type: "mysql",
    host: "localhost",
    port: 3306,
    username: "root",
    password: "password",
    database: "deep_blog",
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

