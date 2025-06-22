const { StatusCodes } = require("http-status-codes");
const { response } = require("../utils/response");
const { v4: uuidv4 } = require("uuid");
const AWS = require("aws-sdk");

// Set your AWS credentials
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

const s3 = new AWS.S3();

const uploadFileToS3 = async (fileName, content) => {
  try {
    const params = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: fileName,
      Body: content,
    };

    const data = await s3.upload(params).promise();
    return data.Location;
  } catch (error) {
    console.error(error);
  }
};

//Upload Files to Local Directory
const uploadFile = async (files) => {
  if (files === undefined || !files.image) {
    let msg = "No file found !";
    return response(res, StatusCodes.BAD_REQUEST, false, null, msg);
  }

  try {
    const file = files.image;
    const fileName = `${uuidv4()}${file.name}`;
    const filePath = `${fileName}`;

    const s3FilePath = await uploadFileToS3(fileName, file.data);
    return s3FilePath;
  } catch (error) {
    console.error(error);
    return error;
  }
};

module.exports = {
  uploadFile,
};
