describe('Login Page - Real API', () => {
  beforeEach(() => {
    cy.visit('https://gharsah.onrender.com/html/signin.html');
  });

  it('shows error if fields are empty', () => {
    cy.get('.sign-in-form').submit();
    cy.on('window:alert', (text) => {
      expect(text).to.contains('يرجى ملء جميع الحقول');
    });
  });

  it('logs in with valid credentials (real API)', () => {
    // Replace with valid test credentials from your real database
    const emailOrUsername = 'omar';
    const password = 'omar';

    cy.get('#emailOrUsername').type(emailOrUsername);
    cy.get('#password').type(password);
    cy.get('.sign-in-form').submit();

    // After login, you should redirect to the profile page
    cy.url().should('include', 'https://gharsah.onrender.com/html/profile.html');

    // Confirm token exists in localStorage
    cy.window().then((win) => {
      const token = win.localStorage.getItem('token');
      expect(token).to.exist;
    });
  });

  it('fails login with invalid credentials (real API)', () => {
    cy.get('#emailOrUsername').type('wronguser');
    cy.get('#password').type('wrongpassword');
    cy.get('.sign-in-form').submit();

    cy.on('window:alert', (text) => {
      expect(text).to.satisfy((msg) => msg.includes('خطأ') || msg.includes('يرجى')); // Arabic fallback
    });
  });
});
