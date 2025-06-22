const joi = require('joi')
const { response } = require('../../utils/response')
const { StatusCodes } = require('http-status-codes')

const createStudentValidation = async (req, res, next) => {
  const validation = joi.object({
    name: joi.string().trim(true).max(50).required(),
    grade: joi.number().required(),
    email: joi.string().email().trim(true).required(),
    password: joi.string().min(6).trim(true).required()
  })

  const data = {
    name: req.body.name,
    grade: req.body.grade,
    email: req.body.email,
    password: req.body.password
  }
  const { error } = validation.validate(data)
  if (error) {
    let msg = `Error in Student Data : ${error.message}`

    return response(res, StatusCodes.NOT_ACCEPTABLE, false, {}, msg)
  } else {
    next()
  }
}
module.exports = { createStudentValidation }
