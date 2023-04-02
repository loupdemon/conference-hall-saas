class LoginPage {
  visit(redirectTo?: string) {
    if (redirectTo) {
      cy.visit(`/login?redirectTo=${redirectTo}`);
    } else {
      cy.visit('/login');
    }
    this.isPageVisible();
  }

  isPageVisible() {
    cy.findByRole('heading', { name: 'Log in to Conference Hall' }).should('exist');
  }

  signinWithGoogle(username: string) {
    cy.findByRole('button', { name: 'Continue with Google' }).click();
    cy.url().should('contain', '/emulator');
    cy.findByText(username).click();
  }
}

export default LoginPage;
