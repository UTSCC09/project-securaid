import { ObjectId } from "mongodb";

export default class File {
  constructor(name, url, size, uploadDate, author, folderName) {
    this._id = new ObjectId();
    this.name = name;
    this.url = url;
    this.size = size;
    this.uploadDate = uploadDate;
    this.author = author;
    this.folderName = folderName;
  }
}
