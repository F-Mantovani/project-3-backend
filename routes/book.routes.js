const { Router } = require('express')

const User = require('../models/User.model')
const Book = require('../models/Book.model')
const getBookReq = require('./book_functions/getBookReq')
const verifyUserId = require('./helper_functions/verifyUserId.js')
const uploadCloud = require('../config/cloudinary.config')

const router = Router()

//Create a Book
router.post('/', async (req, res) => {

  const { name, author, userId } = getBookReq(req)

  try {
  
    const newBook = await Book.create({ name, author, createdByUser: userId, favoritedByUsers: userId })

    await User.findByIdAndUpdate(userId, { $push: { books: newBook._id }})

    res.status(201).json(newBook)

  } catch (error) {
    
    res.status(500).json({ place: 'Error trying to create a new book', error: error.message })

  }

})

// Upload a Book Image
router.put('/image/:bookId', uploadCloud.single('image') ,async (req, res) => {

  const { bookId } = getBookReq(req)
  const { path } = req.file

  try {
    
    const updatedBook = await Book.findByIdAndUpdate(bookId, { imageUrl: path }, { new: true })
    
    res.status(200).json(updatedBook)

  } catch (error) {

    res.status(error.status || 500).json({ place: "Error trying upload book image", error: error.message })

  }

})

// Get all Books
router.get('/', async (req, res) => {

  try {

    const allBooks = await Book.find()

    res.status(200).json(allBooks)

  } catch (error) {

    res.status(500).json({ place: 'Error trying to get all books', error: error.message })

  }

})

// Get favorite books by the user
router.get('/favorites', async (req, res) => {

  const { userId } = getBookReq(req)

  try {
    
    const favoritedBooks = await Book.find({ favoritedByUsers: userId })

    res.status(200).json(favoritedBooks)

  } catch (error) {
    
    res.status(error.status || 500).json({ place: 'Error trying to get favorite books', error: error.message })

  }

})

// Get one BookById
router.get('/:bookId', async (req, res) => {

  const { bookId } = getBookReq(req)

  try {

    const findBook = await Book.findById(bookId)

    res.status(200).json(findBook)

  } catch (error) {

    res.status(500).json({ place: 'Error trying to get one book', error: error.message })

  }

})

// Delete one Book
router.delete('/delete/:bookId', async (req, res) => {

  const { userId, bookId } = getBookReq(req)

  try {

    const deleted = await Book.findOneAndDelete({ _id: bookId, createdByUser: userId })

    verifyUserId(deleted, "You can't delete a book created by another user")

    await User.updateMany({ $pull: { books: bookId } })

    res.status(204).json()

  } catch (error) {

    res.status(error.status || 500).json({  place: 'Error trying to delete one book', error: error.message })

  }

})


module.exports = router
