import mongoose , {Document,Schema} from "mongoose";

export interface IMessage extends Document{
    chatId: mongoose.Types.ObjectId;
    sender:string;
    text?:string;
    image?:{
        url:string;
        publicId:string;
    };
    messageType: "text" | "image";
    seen: boolean;
    seenAt?: Date;
    createdAt: Date;
    updatedAt: Date;
};


//Schema

const schema = new Schema<IMessage>({
    chatId:{
        type:Schema.Types.ObjectId,
        ref:"Chat",
        required:true
    },
    sender:{
        type:String,
        required:true
    },
    text:{
        type:String,
        required:true
    },
    image:{
        url:{
            type:String,
          
        },
        publicId:{
            type:String,
            
        }
    },
    messageType:{
        type:String,
        enum:["text","image"],
        default:"text", 
    },
    seen:{
        type:Boolean,
        default:false
    },
    seenAt:{
        type:Date,
        default:null
    },
   

}, { timestamps:true });


export const Messages = mongoose.model<IMessage>("Message", schema);