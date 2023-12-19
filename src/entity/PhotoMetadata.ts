import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    OneToOne,
    JoinColumn,
} from "typeorm"
import { Photo } from "./Photo"

@Entity({name: "photo_metadata"})
export class PhotoMetadata {
    @PrimaryGeneratedColumn()
    id: number

    @Column("int")
    height: number

    @Column("int")
    width: number

    @Column()
    orientation: string

    @Column()
    compressed: boolean

    @Column()
    comment: string

    @OneToOne(() => Photo)
    @JoinColumn()
    photo: Photo
}