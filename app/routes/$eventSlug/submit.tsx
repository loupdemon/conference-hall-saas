import { LoaderFunction, Outlet, useLoaderData, useMatches } from 'remix';
import { Container } from '../../components/layout/Container';
import { SectionPanel } from '../../components/Panels';
import { requireUserSession } from '../../features/auth/auth.server';
import { Steps } from '../../features/event-submission/components/Steps';
import { getSubmitSteps, SubmitSteps } from '../../features/event-submission/load-steps.server';

export const loader: LoaderFunction = async ({ request, context, params }) => {
  await requireUserSession(request);
  return getSubmitSteps({ request, context, params });
};

export default function EventSubmitRoute() {
  const steps = useLoaderData<SubmitSteps>()
  const matches = useMatches();
  const currentStep = matches[matches.length - 1].handle?.step

  return (
    <Container className="-mt-24 grid grid-cols-1 items-start sm:gap-8">
      <SectionPanel id="talk-submission" title="Talk submission">
        <Steps steps={steps} currentStep={currentStep} />
        <div className="overflow-hidden sm:rounded-md">
          <Outlet />
        </div>
      </SectionPanel>
    </Container>
  );
}


