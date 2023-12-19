import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from "typeorm";


@Entity({name: "photos"})
export class Photo {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({
        length: 100,
    })
    name: string

    @Column("text")
    description: string

    @Column()
    filename: string

    @Column("double")
    views: number

    @Column()
    isPublished: boolean
}