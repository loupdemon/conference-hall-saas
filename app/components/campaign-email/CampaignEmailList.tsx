import c from 'classnames';
import { useMemo } from 'react';
import { Text } from '~/design-system/Typography';
import { Button } from '~/design-system/Buttons';
import Badge from '~/design-system/Badges';
import { useCheckboxSelection } from '~/design-system/useCheckboxSelection';
import { Checkbox } from '~/design-system/forms/Checkboxes';
import { Form } from '@remix-run/react';

type Proposal = {
  id: string;
  title: string;
  speakers: (string | null)[];
  status: string;
};

type Props = { proposals: Array<Proposal>; total: number };

export function CampaignEmailList({ proposals, total }: Props) {
  const ids = useMemo(() => proposals.map(({ id }) => id), [proposals]);

  const { checkboxRef, selection, checked, isSelected, onSelect, toggleAll } = useCheckboxSelection(ids);

  return (
    <div className="-mx-4 mt-4 overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:-mx-6 md:mx-0 md:rounded-lg">
      <div className="flex h-12 flex-row items-center justify-between border-b border-gray-200 bg-gray-100 px-4 py-2 sm:px-6">
        <div className="flex flex-row items-center">
          <input
            type="checkbox"
            className="mr-4 hidden h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 sm:mr-6 sm:inline-block"
            ref={checkboxRef}
            checked={checked}
            onChange={toggleAll}
          />
          <div className="flex items-baseline">
            <Text className="font-medium">
              {selection.length === 0 ? `${total} proposals` : `${selection.length} selected`}
            </Text>
          </div>
        </div>
        <div className="flex flex-row items-center gap-2">
          <Form method="post">
            {selection.map((id) => (
              <input key={id} type="hidden" name="selection[]" value={id} />
            ))}
            <Button variant="secondary" size="s">
              {selection.length !== 0 ? `Send to ${selection.length} proposals` : 'Send to all proposals'}
            </Button>
          </Form>
        </div>
      </div>
      <div className="divide-y divide-gray-200 bg-white">
        {proposals.map((proposal) => (
          <div key={proposal.id} className={c('relative flex', { 'bg-gray-50': isSelected(proposal.id) })}>
            {isSelected(proposal.id) && <div className="absolute inset-y-0 left-0 w-0.5 bg-indigo-600" />}
            <Checkbox
              value={proposal.id}
              checked={isSelected(proposal.id)}
              onChange={(e) => onSelect(proposal.id, e.target.checked)}
              className="flex items-center justify-center px-6"
            />
            <div className="mr-6 flex grow justify-between py-4">
              <div>
                <Text className="truncate font-medium">{proposal.title}</Text>
                <Text className="truncate font-normal text-gray-700" size="xs">
                  by {proposal.speakers.join(', ')}
                </Text>
              </div>
              <div className="flex flex-row items-center gap-2">
                <Badge>{proposal.status.toLowerCase()}</Badge>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
