import invariant from 'tiny-invariant';
import { useLoaderData, useNavigate } from '@remix-run/react';
import type { ActionFunction, LoaderArgs } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';
import { getSpeakerProposal } from '~/shared-server/proposals/get-speaker-proposal.server';
import { ProposalStatusSection } from '~/shared-components/proposals/ProposalStatusSection';
import { requireSession } from '~/libs/auth/session';
import { useEvent } from '../$event/route';
import { ProposalDetailsSection } from '~/shared-components/proposals/ProposalDetailsSection';
import { PageHeaderTitle } from '~/design-system/layouts/PageHeaderTitle';
import { Container } from '~/design-system/layouts/Container';
import { deleteProposal } from './server/delete-proposal.server';
import { addToast } from '~/libs/toasts/toasts';
import { withZod } from '@remix-validated-form/with-zod';
import { ProposalParticipationSchema } from '~/schemas/proposal';
import { sendParticipationAnswer } from './server/send-participation-answer.server';

export const loader = async ({ request, params }: LoaderArgs) => {
  const userId = await requireSession(request);
  invariant(params.proposal, 'Invalid proposal id');

  const proposal = await getSpeakerProposal(params.proposal, userId);
  return json(proposal);
};

export const action: ActionFunction = async ({ request, params }) => {
  const userId = await requireSession(request);
  invariant(params.proposal, 'Invalid proposal id');

  const form = await request.formData();
  const action = form.get('_action');

  switch (action) {
    case 'delete': {
      await deleteProposal(params.proposal, userId);
      return redirect(`/${params.event}/proposals`, await addToast(request, 'Proposal submission removed.'));
    }
    case 'confirm': {
      const result = await withZod(ProposalParticipationSchema).validate(form);
      if (result.error) return null;
      await sendParticipationAnswer(userId, params.proposal, result.data.participation);
      return json(null, await addToast(request, 'Your response has been sent to organizers.'));
    }
    default:
      return null;
  }
};

export default function ProposalRoute() {
  const { event } = useEvent();
  const proposal = useLoaderData<typeof loader>();
  const navigate = useNavigate();

  return (
    <>
      <PageHeaderTitle title={proposal.title} backOnClick={() => navigate(-1)} />

      <Container className="my-4 space-y-8 sm:my-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-flow-col-dense lg:grid-cols-3">
          <div className="lg:col-span-2 lg:col-start-1">
            <ProposalDetailsSection
              abstract={proposal.abstract}
              references={proposal.references}
              formats={proposal.formats}
              categories={proposal.categories}
              level={proposal.level}
              languages={proposal.languages}
              speakers={proposal.speakers}
            />
          </div>

          <div className="lg:col-span-1 lg:col-start-3">
            <ProposalStatusSection proposal={proposal} event={event} />
          </div>
        </div>
      </Container>
    </>
  );
}
