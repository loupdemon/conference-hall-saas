import type { LoaderFunction } from '@remix-run/node';
import { json } from '@remix-run/node';
import { useLoaderData, useSearchParams } from '@remix-run/react';
import { Container } from '../design-system/Container';
import { H1 } from '../design-system/Typography';
import { SearchEventsList } from '../components/SearchEventsList';
import type { SearchEvents } from '../services/events/search.server';
import { searchEvents, validateFilters, validatePage } from '../services/events/search.server';
import { mapErrorToResponse } from '../services/errors';
import { SearchEventsForm } from '../components/SearchEventsForm';
import { SearchPagination } from '../design-system/Pagination';
import { EmptyState } from '~/design-system/EmptyState';
import { FaceFrownIcon } from '@heroicons/react/24/outline';

export const loader: LoaderFunction = async ({ request }) => {
  const url = new URL(request.url);
  const filters = validateFilters(url.searchParams);
  const page = validatePage(url.searchParams);

  try {
    const results = await searchEvents(filters, page);
    return json<SearchEvents>(results);
  } catch (err) {
    mapErrorToResponse(err);
  }
};

export default function IndexRoute() {
  const { filters, results, pagination } = useLoaderData<SearchEvents>();
  const [searchParams] = useSearchParams();
  const talkId = searchParams.get('talkId');

  return (
    <div>
      <Container className="py-0 sm:py-24">
        <H1 className="hidden sm:block">Conferences and meetups.</H1>
        <SearchEventsForm filters={filters} className="mt-4" />
      </Container>
      <Container className="pb-8">
        {results?.length === 0 ? (
          <EmptyState
            icon={FaceFrownIcon}
            label="No results found!"
            description="Adjust the filters to find your results."
          />
        ) : (
          <SearchEventsList events={results} forTalkId={talkId} />
        )}
        {pagination.total > 1 && <SearchPagination pathname="/" {...pagination} className="mt-8" />}
      </Container>
    </div>
  );
}
