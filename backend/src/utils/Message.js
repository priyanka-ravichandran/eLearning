
const Message = {
  USER: {
    CREATED: "User created successfully",
    UPDATE_SUCCESS: "User updated successfully",
    DELETED: "User deleted successfully",
    NOT_FOUND: "No user Found!",
    COULD_NOT_CREATE_USER: "Could not create user due to user error",
    COULD_NOT_UPDATE_USER: "Could not update!",
    COULD_NOT_DELETE_USER: "Could not delete!",
    PROVIDE_INFORMATION: "Please provide all the information",
    EMAIL_HAVE_ACCOUNT: "This Email Already have an Account",
    SIX_CHARACTER_PASSWORD: "Password must be minimum 6 character",
    NOT_AUTHORIZED: "User is not authorized",
  },
  AUTH: {
    PROVIDE_INFORMATION: "Could not login, Please Provide all information",
    ACCOUNT_NOT_EXIST: "No account exists with this email",
    COULD_NOT_LOGIN: "Could not login",
    INCORRECT_PASSWORD: "Incorrect Password!",
    LOGIN_SUCCESS: "Login successful",
    INVALID_CODE: "Verification code is invalid",
    RESET_PASSWORD_SUCCESS: "Password reset successfully",
  },
  INTERNAL_SERVER_ERROR: "Internal Server Error",
};

module.exports = {
  Message,
};
