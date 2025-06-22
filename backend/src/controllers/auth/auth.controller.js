const { StatusCodes } = require("http-status-codes");
const { createToken } = require("../../utils/JwtConfig");

const { response } = require("../../utils/response");
const { securePassword, comparePassword } = require("../../utils/Password");
const studentRepository = require("../../repository/student.repository");

const { Message } = require("../../utils/Message");

const register = async (req, res) => {
  try {
    const { name, grade, email, password } = req.body;

    if (!name || !grade || !email || !password) {
      return response(
        res,
        StatusCodes.BAD_REQUEST,
        false,
        {},
        Message.USER.PROVIDE_INFORMATION
      );
    }

    const oldUser = await studentRepository.findStudentByEmail(email);
    if (oldUser) {
      return response(
        res,
        StatusCodes.NOT_ACCEPTABLE,
        false,
        {},
        Message.USER.EMAIL_HAVE_ACCOUNT
      );
    }

    if (password.length < 6) {
      return response(
        res,
        StatusCodes.NOT_ACCEPTABLE,
        false,
        {},
        Message.USER.SIX_CHARACTER_PASSWORD
      );
    }
    const hashedPassword = await securePassword(req.body.password);
    const user = await studentRepository.createStudent({
      name: name,
      grade: grade,
      email: email,
      password: hashedPassword,
    });
    if (!user) {
      return response(
        res,
        StatusCodes.FORBIDDEN,
        false,
        {},
        Message.USER.COULD_NOT_CREATE_USER
      );
    }
    return response(
      res,
      StatusCodes.ACCEPTED,
      true,
      null,
      Message.USER.CREATED
    );
  } catch (error) {
    console.log(error);
    return response(
      res,
      StatusCodes.INTERNAL_SERVER_ERROR,
      false,
      {},
      Message.INTERNAL_SERVER_ERROR
    );
  }
};

//login
const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return response(
      res,
      StatusCodes.BAD_REQUEST,
      false,
      {},
      Message.AUTH.PROVIDE_INFORMATION
    );
  }

  try {
    const user = await studentRepository.findStudentByEmail(email);

    if (!user) {
      return response(
        res,
        StatusCodes.NOT_FOUND,
        false,
        {},
        Message.AUTH.ACCOUNT_NOT_EXIST
      );
    }
    const matched = await comparePassword(password, user.password);
    if (matched) {
      const token = await createToken(user);
      if (token) {
        const student_details = await studentRepository.findById(user._id);

        return response(
          res,
          StatusCodes.OK,
          true,
          {
            token: token,
            student_details: student_details,
            user: student_details?.student,
          },
          Message.AUTH.LOGIN_SUCCESS
        );
      }
      return response(
        res,
        StatusCodes.BAD_REQUEST,
        false,
        {},
        Message.AUTH.COULD_NOT_LOGIN
      );
    } else {
      return response(
        res,
        StatusCodes.NOT_ACCEPTABLE,
        false,
        {},
        Message.AUTH.INCORRECT_PASSWORD
      );
    }
  } catch (error) {
    return response(
      res,
      StatusCodes.INTERNAL_SERVER_ERROR,
      false,
      {},
      error.message
    );
  }
};

module.exports = {
  register,
  login,
};
