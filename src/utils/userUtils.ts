// import { User } from "../entity/User";
// import { AppDataSource } from "../data-source";

// export async function userExists(email: string): Promise<boolean> {
//     const userRepository = AppDataSource.getRepository(User);
//     const existingUser = await userRepository.findOneBy({email});
//     return !!existingUser; // Returns true if a user with the provided username exists, false otherwise.
// }