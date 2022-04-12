const { Router } = require('express')

const Event = require('../models/Events.model')
const User = require('../models/User.model')
const checkIfEventExists = require('./event_functions/checkIfEventExists')
const confirmEventStatus = require('./event_functions/confirmEventStatus')
const createEventReqPayload = require('./event_functions/createEventReqPayload')

const router = Router()

router.post('/', async (req, res) => {

  const { title, description, user, date } = createEventReqPayload(req)

  try {

    const is_past = confirmEventStatus(date)

    const newEvent = await Event.create({
      title,
      description,
      user,
      date,
      is_past,
    })

    await User.findByIdAndUpdate(user, { $push: { events: newEvent._id } })

    res.status(200).json(newEvent)

  } catch (error) {

    res.status(500).json(error.message)

  }

})

router.get('/', async (req, res) => {

  const { userId } = req.user

  try {

    const allUserEvents = await Event.find({ user: userId })

    res.status(200).json(allUserEvents)

  } catch (error) {

    res.status(500).json(error.message)
  }

})

router.put('/:eventId', async (req, res) => {

  const { title, description, user, date } = createEventReqPayload(req)

  const { eventId } = req.params

  const confirmIfEventIsPast = confirmEventStatus(date)

  try {
    const updatedEvent = await Event.findOneAndUpdate({ _id: eventId, user: user }, {
        title,
        description,
        user,
        date,
        is_past: confirmIfEventIsPast,
      }, { new: true })

    checkIfEventExists(updatedEvent)

    res.status(200).json(updatedEvent)

  } catch (error) {

    res.status(error.status || 500).json({ error: error.message })

  }

})

router.delete('/deleteOne/:eventId', async (req, res) => {

  const { userId } = req.user
  const { eventId } = req.params

  try {

    await Event.findByIdAndDelete({ _id: eventId, user: userId })

    await User.findByIdAndUpdate(userId, { $pull: { events: eventId } })

    res.status(200).json()

  } catch (error) {
    res.status(500).json({ place: 'Error trying delete a event', error: error.message })
  }
})

router.delete('/deleteAll', async (req, res) => {

  const { userId } = req.user

  try {

    await Event.deleteMany({ user: userId })

    await User.findByIdAndUpdate(userId, { $unset: { events: '' } })

    res.status(200).json()

  } catch (error) {

    res.status(500).json(error.message)
  }
  
})

module.exports = router