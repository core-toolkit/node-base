module.exports = (router, { __name__Controller }) => router.sub('/__nameLower__')
  .get('/', __name__Controller.getAll)
  .get('/:id(\\d+)', __name__Controller.get)
  .use(router.Middlewares.AuthMiddleware)
  .post('/', __name__Controller.add);
