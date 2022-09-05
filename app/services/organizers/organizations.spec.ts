import { disconnectDB, resetDB } from 'tests/db-helpers';
import { eventFactory } from 'tests/factories/events';
import { organizationFactory } from 'tests/factories/organization';
import { userFactory } from 'tests/factories/users';
import { db } from '../db';
import { ForbiddenOperationError, OrganizationNotFoundError } from '../errors';
import {
  changeMemberRole,
  getOrganization,
  getOrganizationEvents,
  getOrganizationMembers,
  getOrganizations,
  removeMember,
} from './organizations';

describe('#getOrganizations', () => {
  beforeEach(async () => {
    await resetDB();
  });
  afterEach(disconnectDB);

  it('return user organizations', async () => {
    const user = await userFactory();
    await organizationFactory({ owners: [user], attributes: { name: 'My orga owner', slug: 'orga-owner' } });
    await organizationFactory({ members: [user], attributes: { name: 'My orga member', slug: 'orga-member' } });
    await organizationFactory({ reviewers: [user], attributes: { name: 'My orga reviewer', slug: 'orga-reviewer' } });

    const organizations = await getOrganizations(user.id);

    expect(organizations).toEqual([
      { name: 'My orga member', slug: 'orga-member', role: 'MEMBER' },
      { name: 'My orga owner', slug: 'orga-owner', role: 'OWNER' },
      { name: 'My orga reviewer', slug: 'orga-reviewer', role: 'REVIEWER' },
    ]);
  });
});

describe('#getOrganization', () => {
  beforeEach(async () => {
    await resetDB();
  });
  afterEach(disconnectDB);

  it('returns organization belonging to user', async () => {
    const user = await userFactory();
    await organizationFactory({ owners: [user], attributes: { name: 'My orga 1', slug: 'my-orga1' } });
    await organizationFactory({ members: [user], attributes: { name: 'My orga 2', slug: 'my-orga2' } });

    const organizations = await getOrganization('my-orga2', user.id);

    expect(organizations).toEqual({ name: 'My orga 2', slug: 'my-orga2', role: 'MEMBER' });
  });

  it('throws an error when user is not member of the organization', async () => {
    const user = await userFactory();
    await organizationFactory({ attributes: { name: 'My orga', slug: 'my-orga' } });
    await expect(getOrganization('my-orga', user.id)).rejects.toThrowError(OrganizationNotFoundError);
  });

  it('throws an error when organization not found', async () => {
    const user = await userFactory();
    await expect(getOrganization('XXX', user.id)).rejects.toThrowError(OrganizationNotFoundError);
  });
});

describe('#getOrganizationEvents', () => {
  beforeEach(async () => {
    await resetDB();
  });
  afterEach(disconnectDB);

  it('returns organization events', async () => {
    const user = await userFactory();
    const organization = await organizationFactory({ owners: [user], attributes: { slug: 'my-orga' } });
    await eventFactory({ attributes: { name: 'Event 1', slug: 'event1' }, organization, traits: ['conference'] });
    await eventFactory({ attributes: { name: 'Event 2', slug: 'event2' }, organization, traits: ['meetup'] });

    const organization2 = await organizationFactory({ owners: [user] });
    await eventFactory({ traits: ['conference-cfp-open'], organization: organization2 });

    const events = await getOrganizationEvents('my-orga', user.id);
    expect(events).toEqual([
      { name: 'Event 1', slug: 'event1', type: 'CONFERENCE' },
      { name: 'Event 2', slug: 'event2', type: 'MEETUP' },
    ]);
  });

  it('returns nothing when user is not member of the organization', async () => {
    const user = await userFactory();
    const organization = await organizationFactory({ attributes: { slug: 'my-orga' } });
    await eventFactory({ organization });

    const events = await getOrganizationEvents('my-orga', user.id);
    expect(events).toEqual([]);
  });
});

describe('#getOrganizationMembers', () => {
  beforeEach(async () => {
    await resetDB();
  });
  afterEach(disconnectDB);

  it('returns organization members', async () => {
    const owner = await userFactory({
      traits: ['clark-kent'],
      attributes: { id: '1', photoURL: 'https://img.com/a.png' },
    });
    const member = await userFactory({
      traits: ['bruce-wayne'],
      attributes: { id: '2', photoURL: 'https://img.com/b.png' },
    });
    const reviewer = await userFactory({
      traits: ['peter-parker'],
      attributes: { id: '3', photoURL: 'https://img.com/c.png' },
    });
    const organization = await organizationFactory({
      owners: [owner],
      members: [member],
      reviewers: [reviewer],
      attributes: { slug: 'my-orga' },
    });
    const other = await userFactory();
    await organizationFactory({ owners: [other] });

    const members = await getOrganizationMembers(organization.slug, owner.id);
    expect(members).toEqual([
      { id: '2', name: 'Bruce Wayne', role: 'MEMBER', photoURL: 'https://img.com/b.png' },
      { id: '1', name: 'Clark Kent', role: 'OWNER', photoURL: 'https://img.com/a.png' },
      { id: '3', name: 'Peter Parker', role: 'REVIEWER', photoURL: 'https://img.com/c.png' },
    ]);
  });

  it('returns nothing when user is not member of the organization', async () => {
    const user = await userFactory();
    const owner = await userFactory();
    const organization = await organizationFactory({ owners: [owner], attributes: { slug: 'my-orga' } });

    const events = await getOrganizationMembers(organization.slug, user.id);
    expect(events).toEqual([]);
  });
});

describe('#changeMemberRole', () => {
  beforeEach(async () => {
    await resetDB();
  });
  afterEach(disconnectDB);

  it('changes the role of a member when user has owner role', async () => {
    const owner = await userFactory({ traits: ['clark-kent'], attributes: { id: '1' } });
    const member = await userFactory({ traits: ['bruce-wayne'], attributes: { id: '2' } });
    const orga = await organizationFactory({ owners: [owner], members: [member] });

    await changeMemberRole(orga.slug, owner.id, member.id, 'REVIEWER');

    const updated = await db.organizationMember.findUnique({
      where: { memberId_organizationId: { memberId: member.id, organizationId: orga.id } },
    });
    expect(updated?.role).toEqual('REVIEWER');
  });

  it('throws an error when user updates its own role of the organization', async () => {
    const owner = await userFactory({ traits: ['clark-kent'], attributes: { id: '1' } });
    const orga = await organizationFactory({ owners: [owner] });

    await expect(changeMemberRole(orga.slug, owner.id, owner.id, 'REVIEWER')).rejects.toThrowError(
      ForbiddenOperationError
    );
  });

  it('throws an error when user is not owner of the organization', async () => {
    const owner = await userFactory({ traits: ['clark-kent'], attributes: { id: '1' } });
    const member = await userFactory({ traits: ['bruce-wayne'], attributes: { id: '2' } });
    const orga = await organizationFactory({ owners: [owner], members: [member] });

    await expect(changeMemberRole(orga.slug, member.id, owner.id, 'REVIEWER')).rejects.toThrowError(
      ForbiddenOperationError
    );
  });
});

describe('#removeMember', () => {
  beforeEach(async () => {
    await resetDB();
  });
  afterEach(disconnectDB);

  it('removes a member when user has owner role', async () => {
    const owner = await userFactory({ traits: ['clark-kent'], attributes: { id: '1' } });
    const member = await userFactory({ traits: ['bruce-wayne'], attributes: { id: '2' } });
    const orga = await organizationFactory({ owners: [owner], members: [member] });

    await removeMember(orga.slug, owner.id, member.id);

    const updated = await db.organizationMember.findUnique({
      where: { memberId_organizationId: { memberId: member.id, organizationId: orga.id } },
    });
    expect(updated).toBeNull();
  });

  it('throws an error when user tries to remove itself', async () => {
    const owner = await userFactory({ traits: ['clark-kent'], attributes: { id: '1' } });
    const orga = await organizationFactory({ owners: [owner] });

    await expect(removeMember(orga.slug, owner.id, owner.id)).rejects.toThrowError(ForbiddenOperationError);
  });

  it('throws an error when user is not owner of the organization', async () => {
    const owner = await userFactory({ traits: ['clark-kent'], attributes: { id: '1' } });
    const member = await userFactory({ traits: ['bruce-wayne'], attributes: { id: '2' } });
    const orga = await organizationFactory({ owners: [owner], members: [member] });

    await expect(removeMember(orga.slug, member.id, owner.id)).rejects.toThrowError(ForbiddenOperationError);
  });
});
