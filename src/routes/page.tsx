import { Elysia } from 'elysia';

import { logger } from '~/utils/logger';

import { searchPayloadValidator, searchQueryValidator } from '~/validations/search';

import { search } from '~/services/search';

import MainLayout from '~/views/layouts/main';
import Home from '~/views/pages/home';

import SearchCard from '~/views/components/search-card';
import ErrorMessage from '~/views/components/error-message';

export const pageRouter = new Elysia()
  .onError(({ error, code, set }) => {
    logger.error(`[pageRouter]: ${error}`);

    if (code === 'NOT_FOUND') {
      set.headers = {
        'HX-Location': '/',
      };

      return;
    }

    set.status = 200;

    if (code === 'VALIDATION' || code === 'PARSE') {
      return <ErrorMessage message={error.message} />;
    }

    return <ErrorMessage message="Something went wrong, try again later." />;
  })
  .get(
    '/',
    async ({ query: { id }, redirect }) => {
      try {
        const searchResult = id ? await search({ searchId: id }) : undefined;

        return (
          <MainLayout
            title={searchResult?.title}
            description={searchResult?.description}
            image={searchResult?.image}
          >
            <Home source={searchResult?.source}>
              {searchResult && <SearchCard searchResult={searchResult} />}
            </Home>
          </MainLayout>
        );
      } catch (err) {
        logger.error(err);
        return redirect('/', 404);
      }
    },
    {
      query: searchQueryValidator,
    }
  )
  .post(
    '/search',
    async ({ body: { link } }) => {
      const searchResult = await search({ link });
      return <SearchCard searchResult={searchResult} />;
    },
    {
      body: searchPayloadValidator,
    }
  );
