describe('ملف المستخدم - صفحة الملف الشخصي', () => {
    beforeEach(() => {
      // Visit login page and log in
      cy.visit('https://gharsah.onrender.com/html/signin.html');
      cy.get('#emailOrUsername').type('omar');
      cy.get('#password').type('omar');
      cy.get('.sign-in-form').submit();
  
      // Ensure login and wait for redirection
      cy.url().should('include', '/html/profile.html');
    });
  
    it('يجب أن يحتوي على العنوان "غرسة - الملف الشخصي"', () => {
      cy.title().should('include', 'غرسة - الملف الشخصي');
    });
  
    it('يحتوي على صورة الملف الشخصي والعناصر الأساسية', () => {
      cy.get('#profile-avatar').should('be.visible');
      cy.get('#username').should('exist');
      cy.get('#user-bio').should('exist');
    });
  
    it('يعرض أزرار تعديل ومتابعة وتسجيل الخروج', () => {
      cy.get('#edit-profile-btn').should('exist');
      cy.get('#follow-btn').should('exist');
      cy.get('#signout-btn').should('exist');
    });
  
    it('يفتح نموذج التعديل عند النقر على زر التعديل', () => {
      cy.get('#edit-profile-btn').click();
      cy.get('#edit-modal').should('be.visible');
    });
  
    it('يغلق النموذج عند النقر على زر الإغلاق', () => {
      cy.get('#edit-profile-btn').click();
      cy.get('.close-btn').click();
      cy.get('#edit-modal').should('not.be.visible');
    });
  });
  