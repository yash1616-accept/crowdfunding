import mongoose, { Schema, Document } from 'mongoose';

export interface ICampaign extends Document {
  creatorId: string;
  creatorName: string;
  contactEmail: string;
  category: 'Tech' | 'Creative' | 'Community' | 'Other';
  hook: string;
  blueprint: string;
  fundingGoal: number;
  currentFunding: number;
  milestones: Array<{ description: string; unlockPercentage: number }>;
  stretchGoals: Array<{ description: string; requiredFunding: number }>;
  backers: Array<{ username: string; amount: number; date: Date }>;
  status: 'Draft' | 'Active' | 'Funded' | 'Failed';
  createdAt: Date;
}

const CampaignSchema: Schema = new Schema({
  creatorId:    { type: String, required: true },
  creatorName:  { type: String, required: true },
  contactEmail: { type: String, default: '' },
  category: { type: String, enum: ['Tech', 'Creative', 'Community', 'Other'], default: 'Other' },
  hook:         { type: String, required: true },
  blueprint:    { type: String, required: true },
  fundingGoal:  { type: Number, required: true },
  currentFunding: { type: Number, default: 0 },
  milestones:   [{ description: String, unlockPercentage: Number }],
  stretchGoals: [{ description: String, requiredFunding: Number }],
  backers:      [{ username: String, amount: Number, date: { type: Date, default: Date.now } }],
  status: { type: String, enum: ['Draft', 'Active', 'Funded', 'Failed'], default: 'Draft' },
  createdAt: { type: Date, default: Date.now }
});

// Delete cached model to ensure schema changes are picked up in dev
if (mongoose.models.Campaign) {
  delete mongoose.models.Campaign;
}

export default mongoose.model<ICampaign>('Campaign', CampaignSchema);
