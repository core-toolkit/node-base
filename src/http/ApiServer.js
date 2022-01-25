const express = require('express');

module.exports = (router, port, { HttpServer: Log }) => {
  const app = express().use(router);

  return () => app.listen(port, () => Log.i(`Listening on port ${port}`));
};
