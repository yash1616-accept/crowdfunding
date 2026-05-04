import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  email: string;
  passwordHash: string;
  role: 'Creator' | 'Backer';
  trustScore: number;
  createdAt: Date;
  skills: string[];
  availability: number;
}

const UserSchema: Schema = new Schema({
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['Creator', 'Backer'], default: 'Backer' },
  trustScore: { type: Number, default: 100 },
  createdAt: { type: Date, default: Date.now },
  skills: [{ type: String }],
  availability: { type: Number, default: 0 }
});

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
