const Koa = require('koa');
const livereload = require('livereload');

const app = new Koa();
const port = 8080;
const liveReloadServer = livereload.createServer({
  exts: ['html', 'css', 'css'],
  applyCSSLive: false // https://github.com/napcs/node-livereload/issues/33#issuecomment-693707006
});

app.use(async ctx => {
  ctx.body = 'Hello World';
});

app.listen(port, async () => {
  console.debug(`server started on port ${port}`);

  await liveReloadServer.watch(__dirname, () => {
    console.info(`Now live watching directory "${__dirname}" for changes.`);
    return Promise.resolve(true);
  });
});