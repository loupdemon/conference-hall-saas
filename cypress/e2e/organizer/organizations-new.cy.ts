import OrganizationEventsPage from 'page-objects/organizer/events-list.page';
import OrganizationNewPage from 'page-objects/organizer/organization-new.page';

describe('Organization create', () => {
  beforeEach(() => {
    cy.task('seedDB', 'organizer/organizations-new');
  });

  afterEach(() => cy.task('disconnectDB'));

  const organizationNew = new OrganizationNewPage();
  const organization = new OrganizationEventsPage();

  it('can create a new organization', () => {
    cy.login();
    organizationNew.visit();
    organizationNew.isPageVisible();

    organizationNew.fillForm({ name: 'Hello world' });
    cy.assertInputText('Organization URL', 'hello-world');
    organizationNew.newOrganization().click();

    organization.isPageVisible();
    cy.assertText('Hello world');
  });

  it('cannot create an organization when slug already exists', () => {
    cy.login();
    organizationNew.visit();
    organizationNew.isPageVisible();

    organizationNew.fillForm({ name: 'orga 1' });
    cy.assertInputText('Organization URL', 'orga-1');
    organizationNew.newOrganization().click();
    organizationNew
      .error('Organization URL')
      .should('contains.text', 'This URL already exists, please try another one.');
  });
});
