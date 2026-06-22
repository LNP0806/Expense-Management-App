const requestLogger = (req, res, next) => {
  const currentTime = new Date().toISOString();

  console.log(`[${currentTime}] ${req.method} ${req.originalUrl}`);

  next();
};

module.exports = requestLogger;
