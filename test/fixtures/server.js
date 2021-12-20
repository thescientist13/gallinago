import Koa from 'koa';
import livereload from 'livereload';
import { fileURLToPath, URL } from 'url';

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
  const dirname = fileURLToPath(new URL('.', import.meta.url));

  await liveReloadServer.watch(dirname, () => {
    console.info(`Now live watching directory "${dirname}" for changes.`);
    return Promise.resolve(true);
  });
});