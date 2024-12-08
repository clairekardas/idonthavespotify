import { html } from '@elysiajs/html';
import { staticPlugin } from '@elysiajs/static';
import { Elysia } from 'elysia';

import { apiRouter } from './routes/api';
import { pageRouter } from './routes/page';
import { logger } from './utils/logger';

export const app = new Elysia()
  .use(html())
  .use(
    staticPlugin({
      prefix: '',
      headers: {
        'Cache-Control': 'public, max-age=86400',
      },
    })
  )
  .on('beforeHandle', async ({ request }) => {
    logger.info(
      `${request.method} ${request.url} - ${request.headers.get('user-agent')}`
    );
  })
  .use(apiRouter)
  .use(pageRouter);
