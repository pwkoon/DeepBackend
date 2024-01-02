import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from "typeorm";
import { User } from "./User";

@Entity({ name: "posts" })
export class Post {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({ type: "varchar", length: 80 })
    title: string;

    @Column()
    content: string;

    @Column()
    photo: string;

    @Column()
    imageName: string;

    @ManyToOne((type) => User, (user) => user.posts)
    // user: Promise<User>; // promise here for lazy loading 
    user: User; // promise here for lazy loading 
}
