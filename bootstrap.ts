import { AppDataSource } from "./src/data-source";
import { Post } from "./src/entity/Post";
import { User } from "./src/entity/User";


export const Bootstrap = async () => {
    const userRepo = AppDataSource.getRepository(User);
    const user = userRepo.create({ firstName: "Jun", lastName: "Puah", email: "jun@gmail.com", age: 30 })
    await userRepo.save(user).catch((err) => {
        console.log("Error: ", err);
    });
    console.log("New user saved!", user);

    const postRepo = AppDataSource.getRepository(Post);
    const post = new Post();
    post.title = "I'm hardcoding first blog-post from backend server!"
    post.content = "This is the isolated repo for backend server which allow front-end to call an end-point and retrieve the data from the mysql database and vice versa!"
    post.user = Promise.resolve(user);

    await postRepo.save(post).catch((err) => {
        console.log("Error: ", err);
    })
}

export const find = async () => {
    const userRepo = AppDataSource.getRepository(User);
    const user = await userRepo.findOne({ where: {firstName: "Jun"} }).catch((err) => {
        console.log(err);
    });
    if (user) 
    console.log("User: ", user, await user.posts);
    
}