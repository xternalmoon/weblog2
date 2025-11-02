import mongoose from 'mongoose';

const blogSchema = new mongoose.Schema({
  blog_id: {
    type: String,
    required: true,
    unique: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  banner: {
    type: String,
    default: ""
  },
  des: {
    type: String,
    maxlength: 200,
    default: ""
  },
  content: {
    type: Array,
    default: []
  },
  tags: {
    type: [String],
    default: []
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'users'
  },
  publishedAt: {
    type: Date,
    default: null
  },
  activity: {
    total_likes: {
      type: Number,
      default: 0
    },
    total_comments: {
      type: Number,
      default: 0
    },
    total_reads: {
      type: Number,
      default: 0
    },
    total_parent_comments: {
      type: Number,
      default: 0
    }
  },
  comments: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: 'comments'
  },
  liked_by: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: 'users',
    default: []
  },
  draft: {
    type: Boolean,
    default: true
  },
  editedAt: {
    type: Date
  }
}, {
  timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }
});

// Indexes for better search performance
blogSchema.index({ title: 'text', des: 'text', content: 'text', tags: 'text' });
blogSchema.index({ author: 1 });
blogSchema.index({ publishedAt: -1 });
blogSchema.index({ 'activity.total_reads': -1 });

export default mongoose.model('blogs', blogSchema);

