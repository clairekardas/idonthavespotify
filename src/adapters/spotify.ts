import { ADAPTERS_QUERY_LIMIT } from '~/config/constants';
import { Adapter, MetadataType } from '~/config/enum';
import { ENV } from '~/config/env';
import {
  cacheSearchResultLink,
  cacheSpotifyAccessToken,
  getCachedSearchResultLink,
  getCachedSpotifyAccessToken,
} from '~/services/cache';
import { SearchMetadata, SearchResultLink } from '~/services/search';
import { getOrUpdateAccessToken } from '~/utils/access-token';
import { responseMatchesQuery } from '~/utils/compare';
import HttpClient from '~/utils/http-client';
import { logger } from '~/utils/logger';

interface SpotifyAuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface SpotifySearchResponse {
  [type: string]: {
    total: number;
    items: [
      {
        name: string;
        external_urls: {
          spotify: string;
        };
      },
    ];
  };
}

const SPOTIFY_SEARCH_TYPES = {
  [MetadataType.Song]: 'track',
  [MetadataType.Album]: 'album',
  [MetadataType.Playlist]: 'playlist',
  [MetadataType.Artist]: 'artist',
  [MetadataType.Show]: 'show',
  [MetadataType.Podcast]: 'episode',
};

export async function getSpotifyLink(query: string, metadata: SearchMetadata) {
  const searchType = SPOTIFY_SEARCH_TYPES[metadata.type];
  if (!searchType) return null;

  const params = new URLSearchParams({
    q: query,
    type: searchType,
    limit: String(ADAPTERS_QUERY_LIMIT),
  });

  const url = new URL(ENV.adapters.spotify.apiUrl);
  url.search = params.toString();

  const cache = await getCachedSearchResultLink(url);
  if (cache) {
    logger.info(`[Spotify] (${url}) cache hit`);
    return cache;
  }

  try {
    const response = await HttpClient.get<SpotifySearchResponse>(url.toString(), {
      headers: {
        Authorization: `Bearer ${await getOrUpdateSpotifyAccessToken()}`,
      },
    });

    const [[, data]] = Object.entries(response);
    if (data.total === 0) {
      throw new Error(`No results found: ${JSON.stringify(response)}`);
    }

    const { name, external_urls } = data.items[0];

    const searchResultLink = {
      type: Adapter.Spotify,
      url: external_urls.spotify,
      isVerified: responseMatchesQuery(name ?? '', query),
    } as SearchResultLink;

    await cacheSearchResultLink(url, searchResultLink);

    return searchResultLink;
  } catch (error) {
    logger.error(`[Spotify] (${url}) ${error}`);
    return null;
  }
}

export async function getOrUpdateSpotifyAccessToken() {
  return getOrUpdateAccessToken(
    getCachedSpotifyAccessToken,
    async () => {
      const data = new URLSearchParams({
        grant_type: 'client_credentials',
      });

      const response = await HttpClient.post<SpotifyAuthResponse>(
        ENV.adapters.spotify.authUrl,
        data,
        {
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/x-www-form-urlencoded',
            Authorization:
              'Basic ' +
              Buffer.from(
                ENV.adapters.spotify.clientId + ':' + ENV.adapters.spotify.clientSecret
              ).toString('base64'),
          },
        }
      );

      return {
        accessToken: response.access_token,
        expiresIn: response.expires_in,
      };
    },
    cacheSpotifyAccessToken
  );
}
