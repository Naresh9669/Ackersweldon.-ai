import { models, model, Schema, Types } from 'mongoose';

export interface IUserinfo extends Document{
    _id: string,
    user_name: string,
    user_handle:string
}
const UserInfoSchema = new Schema<IUserinfo>({
    _id: {type: String},
    user_name:{ type:String },
    user_handle: {type: String }
})
export const UserInfo = models.user_info || model<IUserinfo>('user_info', UserInfoSchema);


