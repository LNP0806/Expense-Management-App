const successResponse = (res, message, data = null, statusCode = 200, metadata = null) => {
  const response = {
    success: true,
    message,
    data,
  };

  if (metadata) {
    response.metadata = metadata;
  }

  return res.status(statusCode).json(response);
};

module.exports = {
  successResponse,
};