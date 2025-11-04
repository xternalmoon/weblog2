import express from 'express';
import Comment from '../models/Comment.js';
import Blog from '../models/Blog.js';
import Notification from '../models/Notification.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// Add comment
router.post('/add-comment', verifyToken, async (req, res) => {
  try {
    const { _id, blog_author, comment, replying_to } = req.body;
    const userId = req.user._id;

    if (!comment.trim()) {
      return res.status(400).json({ error: 'Comment cannot be empty' });
    }

    const commentObj = new Comment({
      blog_id: _id,
      blog_author,
      comment,
      commented_by: userId,
      isReply: !!replying_to,
      parent: replying_to
    });

    await commentObj.save();

    // If it's a reply, add to parent's children array
    if (replying_to) {
      await Comment.findByIdAndUpdate(replying_to, {
        $push: { children: commentObj._id }
      });
    }

    // Add comment to blog
    await Blog.findByIdAndUpdate(_id, {
      $push: { comments: commentObj._id },
      $inc: { 
        'activity.total_comments': 1,
        'activity.total_parent_comments': replying_to ? 0 : 1 
      }
    });

    // Create notification
    if (blog_author.toString() !== userId.toString()) {
      await Notification.create({
        type: replying_to ? 'reply' : 'comment',
        blog: _id,
        notification_for: blog_author,
        user: userId,
        comment: commentObj._id
      });
    }

    // Return populated comment for frontend to render immediately
    const populated = await Comment.findById(commentObj._id)
      .populate('commented_by', 'personal_info.fullname personal_info.username personal_info.profile_img')
      .lean();

    res.json({
      _id: populated._id,
      blog_id: populated.blog_id,
      blog_author: populated.blog_author,
      comment: populated.comment,
      children: populated.children || [],
      commented_by: populated.commented_by,
      isReply: populated.isReply,
      parent: populated.parent,
      commentedAt: populated.commentedAt
    });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get blog comments
router.post('/get-blog-comments', async (req, res) => {
  try {
    const { blog_id, skip = 0 } = req.body;

    const comments = await Comment.find({
      blog_id,
      isReply: false,
      deletedAt: null
    })
      .populate('commented_by', 'personal_info.fullname personal_info.username personal_info.profile_img')
      .sort({ commentedAt: -1 })
      .skip(parseInt(skip))
      .limit(10);

    res.json(comments);
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get replies
router.post('/get-replies', async (req, res) => {
  try {
    const { _id, skip = 0 } = req.body;

    const replies = await Comment.find({
      parent: _id,
      isReply: true
    })
      .populate('commented_by', 'personal_info.fullname personal_info.username personal_info.profile_img')
      .sort({ commentedAt: -1 })
      .skip(parseInt(skip))
      .limit(5);

    res.json({ replies });
  } catch (error) {
    console.error('Get replies error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete comment
router.post('/delete-comment', verifyToken, async (req, res) => {
  try {
    const { _id } = req.body;
    const userId = req.user._id;

    const comment = await Comment.findById(_id);
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    if (comment.commented_by.toString() !== userId.toString()) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    await Comment.findByIdAndUpdate(_id, { deletedAt: Date.now() });
    
    // Update blog comment count
    await Blog.findByIdAndUpdate(comment.blog_id, {
      $inc: { 'activity.total_comments': -1 }
    });

    // If it's a reply, remove from parent's children array
    if (comment.parent) {
      await Comment.findByIdAndUpdate(comment.parent, {
        $pull: { children: _id }
      });
    }

    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

