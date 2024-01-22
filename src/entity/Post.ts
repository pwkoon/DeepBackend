import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, BeforeInsert } from "typeorm";
import { User } from "./User";
import moment from "moment-timezone";

@Entity({ name: "posts" })
export class Post {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({ type: "varchar", length: 80 })
    title: string;

    @Column({ type: "varchar", length: 3200 })
    content: string;

    @Column({length: 3200})
    photo: string;

    @Column()
    imageName: string;

    @CreateDateColumn()
    created_at: string;

    @UpdateDateColumn()
    updated_at: string;

    @ManyToOne((type) => User, (user) => user.posts)
    @JoinColumn({ name: "userId" })
    // user: Promise<User>; // promise here for lazy loading 
    user: User; // promise here for lazy loading 

}
