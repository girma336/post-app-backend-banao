const express = require('express');
const postController = require('./../controllers/postController');
const authController = require('./../controllers/authController');
const router = express.Router();

// post
router.post('/', authController.protect, postController.createPost);
router.get('/', authController.protect, postController.getAllPosts);
router.get('/:id', authController.protect, postController.getPostById);
router.put('/:id', authController.protect, authController.restrictToPost(), postController.updatePost);
router.delete('/:id', authController.protect, authController.restrictToPost(), postController.deletePost);

// comment
router.post('/:id/comment', authController.protect, postController.createComment);
router.put('/:postId/comment/:commentId', authController.protect, authController.restrictToPostComment(), postController.updateComment);
router.delete('/:postId/comment/:commentId', authController.protect, authController.restrictToPostComment(), postController.deleteComment);

// likes
router.post('/:postId/likes', authController.protect, postController.createLike);
router.delete('/:postId/likes/:likeId', authController.protect, authController.restrictToPostLike(), postController.deleteLike);


module.exports = router;