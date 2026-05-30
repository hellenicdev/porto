import mongoose from 'mongoose';

const tradeSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  coin: {
    type: String,
    required: true,
    enum: ['bitcoin', 'ethereum', 'solana'],
  },
  type: {
    type: String,
    required: true,
    enum: ['BUY', 'SELL'],
  },
  quantity: {
    type: Number,
    required: true,
    min: 0.00000001,
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

tradeSchema.set('toJSON', {
  transform(_doc, ret) {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export default mongoose.model('Trade', tradeSchema);
