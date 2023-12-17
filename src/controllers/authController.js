const UserModel = require('../models/userModel');
const PostModel = require('../models/postModel');
const { promisify } = require('util');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const signToken = (id) => {
  const token = jwt.sign({ id }, 'new-girma-secret-nanao', {
    expiresIn: '90d',
  });
  return token;
};

exports.signup = async (req, res) => {
  try {
    const { email, username, password } = req.body;

    const existingUser = await UserModel.findOne({
      $or: [{ email }, { username }],
    });
    if (existingUser) {
      return res
        .status(400)
        .json({ message: 'Email or username already exists' });
    }

    const newUser = await UserModel.create({ email, username, password });

    const token = signToken(newUser._id);

    return res.status(201).json({
      message: 'User registered successfully',
      token,
      data: {
        user: newUser,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await UserModel.findOne({ username });

    if (!user || !(await user.correctPassword(password, user.password))) {
      return res.status(401).json({ message: 'Incorrect username or password' });
    }

    const token = signToken(user._id);

    res.status(200).json({
      status: 'success',
      token,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.forgetPassword = async (req, res) => {
  try {
    const user = await UserModel.findOne({ email: req.body.email });

    if (!user) {
      return res.status(404).json({
        status: 'fail',
        message: 'There is no user with that email address.',
      });
    }

    const resetToken = user.createPasswordResteToken();
    await user.save({ validateBeforeSave: false });

    res.status(200).json({
      status: 'success',
      message: 'Reset token sent to email.',
      resetToken
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const hashedToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    const user = await UserModel.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        status: 'fail',
        message: 'Token is invalid or has expired.',
      });
    }

    user.password = req.body.password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;

    await user.save();

    res.status(200).json({
      status: 'success',
      message: 'Password reset successful.',
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ success: 'fail', message: 'You are not logged in! Please log in to get access.' });
  }

  try {
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
    const currentUser = await UserModel.findById(decoded.id);

    if (!currentUser) {
      return res.status(401).json({ success: 'fail', message: 'The user belonging to this token does not exist.' });
    }

    req.user = currentUser;
    next();
  } catch (error) {
    return res.status(401).json({ success: 'fail', message: 'Invalid token.' });
  }
};

exports.restrictToPost = () => {
  return async (req, res, next) => {
    try {
      const post = await PostModel.findById(req.params.id);
      if (!post || post.author.toString() !== req.user._id.toString()) {
        return res.status(403).json({ success: 'fail', message: 'You do not have permission to perform this action.' });
      }

      next();
    } catch (error) {
      return res.status(500).json({ success: 'fail', message: 'Server error.' });
    }
  };
}

exports.restrictToPostComment = () => {
  return async (req, res, next) => {
    try {
      const { postId, commentId } = req.params;
  
      const post = await PostModel.findById(postId);
      if (!post) {
        return res.status(404).json({ success: 'fail', message: 'Post not found.' });
      }

      const comment = post.comments.find((data) => data._id.toString() === commentId);
      if (!comment || comment.author.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: 'fail',
          message: 'You do not have permission to perform this action.',
        });
      }

      next();
    } catch (error) {
      return res.status(500).json({ success: 'fail', message: 'Server error.' });
    }
  };
};

exports.restrictToPostLike = () => {
  return async (req, res, next) => {
    try {
      const { postId, likeId } = req.params;
  
      const post = await PostModel.findById(postId);
      if (!post) {
        return res.status(404).json({ success: 'fail', message: 'Post not found.' });
      }

      const like = post.likes.find((data) => data._id.toString() === likeId);
      if (!like || like.author.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: 'fail',
          message: 'You do not have permission to perform this action.',
        });
      }

      next();
    } catch (error) {
      return res.status(500).json({ success: 'fail', message: 'Server error.' });
    }
  };
};
