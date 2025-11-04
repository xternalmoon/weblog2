import express from 'express';
import Blog from '../models/Blog.js';
import User from '../models/User.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// Get latest blogs
router.post('/latest-blogs', async (req, res) => {
  try {
    const { page = 1 } = req.body;
    const perPage = 10;
    const skip = (page - 1) * perPage;

    const blogs = await Blog.find({ draft: false })
      .populate('author', 'personal_info.fullname personal_info.username personal_info.profile_img')
      .sort({ publishedAt: -1 })
      .skip(skip)
      .limit(perPage);

    res.json({ blogs });
  } catch (error) {
    console.error('Latest blogs error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all latest blogs count
router.post('/all-latest-blogs-count', async (req, res) => {
  try {
    const count = await Blog.countDocuments({ draft: false });
    res.json({ totalDocs: count });
  } catch (error) {
    console.error('Count error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get trending blogs
router.get('/trending-blogs', async (req, res) => {
  try {
    const blogs = await Blog.find({ draft: false })
      .populate('author', 'personal_info.fullname personal_info.username personal_info.profile_img')
      .sort({ 'activity.total_reads': -1, 'activity.total_likes': -1, publishedAt: -1 })
      .limit(5);

    res.json({ blogs });
  } catch (error) {
    console.error('Trending blogs error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single blog
router.post('/get-blog', async (req, res) => {
  try {
    const { blog_id, draft, mode } = req.body;

    let blog;
    if (mode === 'edit') {
      blog = await Blog.findOne({ blog_id }).populate(
        'author',
        'personal_info.fullname personal_info.username personal_info.profile_img'
      );
    } else {
      blog = await Blog.findOne({ blog_id, draft: draft || false }).populate(
        'author',
        'personal_info.fullname personal_info.username personal_info.profile_img'
      );

      if (blog) {
        // Increment read count
        await Blog.findByIdAndUpdate(blog._id, {
          $inc: { 'activity.total_reads': 1 }
        });
      }
    }

    if (!blog) {
      return res.status(404).json({ error: 'Blog not found' });
    }

    res.json({ blog });
  } catch (error) {
    console.error('Get blog error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create blog
router.post('/create-blog', verifyToken, async (req, res) => {
  try {
    const { id, title, des, banner, content, tags, draft } = req.body;
    const author = req.user._id;

    let blog;
    if (id) {
      // Update existing blog
      const updateData = { title, des, banner, content, tags, draft, editedAt: Date.now() };
      
      // If publishing (draft changes from true to false), set publishedAt
      const existingBlog = await Blog.findOne({ blog_id: id });
      if (existingBlog && existingBlog.draft && !draft && !existingBlog.publishedAt) {
        updateData.publishedAt = Date.now();
      }
      
      blog = await Blog.findOneAndUpdate(
        { blog_id: id },
        updateData,
        { new: true }
      );
    } else {
      // Create new blog
      const blog_id = `blog_${Date.now()}_${author}`;
      const blogData = {
        blog_id,
        title,
        des,
        banner,
        content,
        tags,
        author,
        draft
      };
      
      // Set publishedAt if not a draft
      if (!draft) {
        blogData.publishedAt = Date.now();
      }
      
      blog = new Blog(blogData);
      await blog.save();

      // Update user's blogs array
      await User.findByIdAndUpdate(author, {
        $push: { blogs: blog._id }
      });
    }

    res.json({ blog_id: blog.blog_id });
  } catch (error) {
    console.error('Create blog error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete blog
router.post('/delete-blog', verifyToken, async (req, res) => {
  try {
    const { blog_id } = req.body;
    const author = req.user._id;

    const blog = await Blog.findOne({ blog_id });

    if (!blog) {
      return res.status(404).json({ error: 'Blog not found' });
    }

    if (blog.author.toString() !== author.toString()) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    await Blog.findByIdAndDelete(blog._id);
    await User.findByIdAndUpdate(author, { $pull: { blogs: blog._id } });

    res.json({ message: 'Blog deleted successfully' });
  } catch (error) {
    console.error('Delete blog error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// User written blogs
router.post('/user-written-blogs', verifyToken, async (req, res) => {
  try {
    const { page = 1, draft, query } = req.body;
    const author = req.user._id;
    const perPage = 10;
    const skip = (page - 1) * perPage;

    let searchQuery = { author };
    if (draft !== undefined) {
      searchQuery.draft = draft;
    }
    if (query) {
      searchQuery.title = new RegExp(query, 'i');
    }

    const blogs = await Blog.find(searchQuery)
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(perPage);

    res.json({ blogs });
  } catch (error) {
    console.error('User blogs error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// User written blogs count
router.post('/user-written-blogs-count', verifyToken, async (req, res) => {
  try {
    const { draft, query } = req.body;
    const author = req.user._id;

    let searchQuery = { author };
    if (draft !== undefined) {
      searchQuery.draft = draft;
    }
    if (query) {
      searchQuery.title = new RegExp(query, 'i');
    }

    const count = await Blog.countDocuments(searchQuery);
    res.json({ totalDocs: count });
  } catch (error) {
    console.error('User blogs count error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Search blogs
router.post('/search-blogs', async (req, res) => {
  try {
    const { query, tag, page = 1, eliminate_blog, limit } = req.body;
    const perPage = limit || 10;
    const skip = (page - 1) * perPage;

    let searchQuery = { draft: false };
    
    if (eliminate_blog) {
      const blogToEliminate = await Blog.findOne({ blog_id: eliminate_blog });
      if (blogToEliminate) {
        searchQuery._id = { $ne: blogToEliminate._id };
      }
    }
    
    if (query) {
      // Try text search first, fallback to regex if text index doesn't work
      try {
        searchQuery.$text = { $search: query };
      } catch (e) {
        searchQuery.$or = [
          { title: new RegExp(query, 'i') },
          { des: new RegExp(query, 'i') },
          { tags: { $in: [new RegExp(query, 'i')] } }
        ];
      }
    }
    if (tag) {
      searchQuery.tags = tag;
    }

    let sortOptions = {};
    if (query && searchQuery.$text) {
      sortOptions = { score: { $meta: 'textScore' }, publishedAt: -1 };
    } else {
      sortOptions = { publishedAt: -1 };
    }

    const blogs = await Blog.find(searchQuery)
      .populate('author', 'personal_info.fullname personal_info.username personal_info.profile_img')
      .sort(sortOptions)
      .skip(skip)
      .limit(perPage);

    res.json({ blogs });
  } catch (error) {
    console.error('Search blogs error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Search blogs count
router.post('/search-blogs-count', async (req, res) => {
  try {
    const { query, tag, eliminate_blog } = req.body;

    let searchQuery = { draft: false };
    
    if (eliminate_blog) {
      const blogToEliminate = await Blog.findOne({ blog_id: eliminate_blog });
      if (blogToEliminate) {
        searchQuery._id = { $ne: blogToEliminate._id };
      }
    }
    
    if (query) {
      try {
        searchQuery.$text = { $search: query };
      } catch (e) {
        searchQuery.$or = [
          { title: new RegExp(query, 'i') },
          { des: new RegExp(query, 'i') },
          { tags: { $in: [new RegExp(query, 'i')] } }
        ];
      }
    }
    if (tag) {
      searchQuery.tags = tag;
    }

    const count = await Blog.countDocuments(searchQuery);
    res.json({ totalDocs: count });
  } catch (error) {
    console.error('Search blogs count error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Like blog
router.post('/like-blog', verifyToken, async (req, res) => {
  try {
    const { _id, islikedByUser } = req.body;
    const userId = req.user._id;

    const blog = await Blog.findById(_id);
    if (!blog) {
      return res.status(404).json({ error: 'Blog not found' });
    }

    const isLiked = blog.liked_by.some(id => id.toString() === userId.toString());

    if (islikedByUser || isLiked) {
      // Unlike - remove user from liked_by and decrement
      await Blog.findByIdAndUpdate(_id, {
        $pull: { liked_by: userId },
        $inc: { 'activity.total_likes': -1 }
      });
      res.json({ message: 'Blog unliked successfully', liked: false });
    } else {
      // Like - add user to liked_by and increment
      await Blog.findByIdAndUpdate(_id, {
        $addToSet: { liked_by: userId },
        $inc: { 'activity.total_likes': 1 }
      });
      res.json({ message: 'Blog liked successfully', liked: true });
    }
  } catch (error) {
    console.error('Like blog error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Check if liked
router.post('/isliked-by-user', verifyToken, async (req, res) => {
  try {
    const { _id } = req.body;
    const userId = req.user._id;

    const blog = await Blog.findById(_id);
    if (!blog) {
      return res.status(404).json({ error: 'Blog not found' });
    }

    const isLiked = blog.liked_by.some(id => id.toString() === userId.toString());
    res.json({ result: isLiked });
  } catch (error) {
    console.error('Is liked error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Distinct random tags from published blogs
router.get('/tags/distinct', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 12, 50);
    // Get distinct tags
    const distinctTags = await Blog.distinct('tags', { draft: false });
    // Shuffle and take up to limit
    for (let i = distinctTags.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [distinctTags[i], distinctTags[j]] = [distinctTags[j], distinctTags[i]];
    }
    res.json({ tags: distinctTags.slice(0, limit) });
  } catch (error) {
    console.error('Distinct tags error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

