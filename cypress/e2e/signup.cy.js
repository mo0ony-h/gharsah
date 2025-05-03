describe('Signup Page - Real API', () => {
    const getRandomString = () => Math.random().toString(36).substring(2, 8);
    const uniqueUser = {
      username: 'user_' + getRandomString(),
      email: 'user_' + getRandomString() + '@example.com',
      password: 'Test1234',
    };
  
    beforeEach(() => {
      cy.visit('https://gharsah.onrender.com/html/signup.html');
    });
  
    it('shows alert for empty fields', () => {
      cy.get('#signup-form').submit();
      cy.on('window:alert', (text) => {
        expect(text).to.include('يرجى ملء جميع الحقول');
      });
    });
  
    it('shows alert for mismatched passwords', () => {
      cy.get('#username').type('testuser');
      cy.get('#email').type('testuser@example.com');
      cy.get('#password').type('Test1234');
      cy.get('#confirm-password').type('Different123');
      cy.get('#signup-form').submit();
  
      cy.on('window:alert', (text) => {
        expect(text).to.include('كلمتا المرور غير متطابقتين');
      });
    });
  
    it('shows alert for weak password', () => {
      cy.get('#username').type('testuser');
      cy.get('#email').type('testuser@example.com');
      cy.get('#password').type('weak'); // too weak
      cy.get('#confirm-password').type('weak');
      cy.get('#signup-form').submit();
  
      cy.on('window:alert', (text) => {
        expect(text).to.include('كلمة المرور');
      });
    });
  
    it('successfully signs up a new user (real API)', () => {
      cy.get('#username').type(uniqueUser.username);
      cy.get('#email').type(uniqueUser.email);
      cy.get('#password').type(uniqueUser.password);
      cy.get('#confirm-password').type(uniqueUser.password);
      cy.get('#signup-form').submit();
  
      cy.on('window:alert', (text) => {
        expect(text).to.include('تم التسجيل بنجاح');
      });
  
      cy.url().should('include', '/html/signin.html');
    });
  
    it('fails if email is already registered', () => {
      // Try registering same user again
      cy.get('#username').type(uniqueUser.username);
      cy.get('#email').type(uniqueUser.email);
      cy.get('#password').type(uniqueUser.password);
      cy.get('#confirm-password').type(uniqueUser.password);
      cy.get('#signup-form').submit();
  
      cy.on('window:alert', (text) => {
        expect(text).to.include('حدث خطأ'); // You can customize this based on your actual backend error message
      });
    });
  });
  