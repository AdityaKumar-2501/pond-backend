import mongoose from "mongoose";

export default function db(url){
    return mongoose.connect(url);
}