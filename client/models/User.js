import { ObjectId } from "mongodb";

export default class User {
  constructor(name, email, passwordHash) {
    this._id = new ObjectId();
    this.name = name;
    this.email = email;
    this.passwordHash = passwordHash;
  }
}
