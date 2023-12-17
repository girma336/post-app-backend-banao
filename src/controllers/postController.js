const PostModel = require("../models/postModel");

exports.createPost = async (req, res) => {
  try {
    const { title, content } = req.body;
    const author = req.user._id;
    const newPost = await PostModel.create({ title, content, author });

    return res.status(201).json({
      message: 'Post create successfully',
      data: {
        post: newPost,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

exports.getAllPosts = async (req, res) => {
  try {
    const posts = await PostModel.find();

    if (posts.length === 0) {
      return res.status(404).json({
        status: 'fail',
        message: 'There are no posts.',
      });
    }

    return res.status(200).json({
      status: 'success',
      message: 'Posts fetched successfully.',
      data: {
        posts,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.getPostById = async (req, res) => {
  try {
    const postId = req.params.id
    const post = await PostModel.findById(postId);

    if (!post) {
      return res.status(404).json({
        status: 'fail',
        message: `There is no post with this postId: ${postId}.`,
      });
    }

    return res.status(200).json({
      status: 'success',
      message: 'Posts fetched successfully.',
      data: {
        post,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.updatePost = async (req, res) => {
  try {
    const { title, content } = req.body;
    const postId = req.params.id;
    const post = await PostModel.findById(postId);

    if (!post) {
      return res.status(404).json({
        status: 'fail',
        message: `There is no post with this postId: ${postId}.`,
      });
    }

    if (title) {
      post.title = title;
    }

    if (content) {
      post.content = content;
    }

    const updatedPost = await post.save();

    return res.status(200).json({
      status: 'success',
      message: 'Post updated successfully.',
      data: {
        post: updatedPost,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};


exports.deletePost = async (req, res) => {
  try {
    const postId = req.params.id;
    const post = await PostModel.findById(postId);

    if (!post) {
      return res.status(404).json({
        status: 'fail',
        message: `There is no post with this postId: ${postId}.`,
      });
    }

    await post.deleteOne({ _id: postId });

    return res.status(200).json({
      status: 'success',
      message: 'Post deleted successfully.',
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};


// Create comment and like for given post

exports.createComment = async (req, res) => {
  try {
    const postId = req.params.id;
    const { text } = req.body;
    const post = await PostModel.findById(postId);

    if (!post) {
      return res.status(404).json({
        status: 'fail',
        message: `There is no post with this postId: ${postId}.`,
      });
    }

    const comment = {
      text,
      author: req.user._id,
    };


    post.comments.push(comment);
    await post.save();

    return res.status(201).json({
      status: 'success',
      message: 'Comment created successfully.',
      data: {
        comment,
      },
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.updateComment = async (req, res) => {
  try {
    const { postId, commentId } = req.params;
    const post = await PostModel.findById(postId);
    const { text } = req.body;

    if (!post) {
      return res.status(404).json({
        status: 'fail',
        message: `There is no post with this postId: ${postId}.`,
      });
    }

    const comment = post.comments.find((comment) => comment._id.toString() === commentId);

    if (!comment) {
      return res.status(404).json({
        status: 'fail',
        message: `There is no comment with this commentId: ${commentId}.`,
      });
    }

    if (text) {
      comment.text = text;
      await post.save();
    }

    return res.status(200).json({
      status: 'success',
      message: 'Comment updated successfully.',
      data: {
        comment,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.deleteComment = async (req, res) => {
  try {
    const { postId, commentId } = req.params;
    const post = await PostModel.findById(postId);

    if (!post) {
      return res.status(404).json({
        status: 'fail',
        message: `There is no post with this postId: ${postId}.`,
      });
    }

    const commentIndex = post.comments.findIndex((comment) => comment._id.toString() === commentId);

    if (commentIndex === -1) {
      return res.status(404).json({
        status: 'fail',
        message: `There is no comment with this commentId: ${commentId}.`,
      });
    }

    post.comments.splice(commentIndex, 1);
    await post.save();

    return res.status(200).json({
      status: 'success',
      message: 'Comment deleted successfully.',
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.createLike = async (req, res) => {
  try {
    const { postId } = req.params;
    const post = await PostModel.findById(postId);

    if (!post) {
      return res.status(404).json({
        status: 'fail',
        message: `There is no post with this postId: ${postId}.`,
      });
    }

    if (!req.user || !req.user._id) {
      return res.status(401).json({
        status: 'fail',
        message: 'Unauthorized: User not authenticated.',
      });
    }

    const userLiked = post.likes.some((like) => like.author.equals(req.user._id));

    if (userLiked) {
      return res.status(409).json({
        status: 'fail',
        message: 'You have already liked this post.',
      });
    }

    post.likes.push({ author: req.user._id });
    await post.save();

    return res.status(201).json({
      status: 'success',
      message: 'Like created successfully.',
      data: {
        likes: post.likes,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.deleteLike = async (req, res) => {
  try {
    const { postId, likeId } = req.params;
    const post = await PostModel.findById(postId);

    if (!post) {
      return res.status(404).json({
        status: 'fail',
        message: `There is no post with this postId: ${postId}.`,
      });
    }

    const likeIndex = post.likes.findIndex((like) => like._id.toString() === likeId);

    if (likeIndex === -1) {
      return res.status(404).json({
        status: 'fail',
        message: `There is no like with this likeId: ${likeId}.`,
      });
    }

    post.likes.splice(likeIndex, 1);
    await post.save();

    return res.status(200).json({
      status: 'success',
      message: 'Like deleted successfully.',
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};