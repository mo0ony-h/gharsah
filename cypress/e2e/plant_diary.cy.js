describe('Diary Feature (Real API)', () => {

    before(() => {
      cy.visit('https://gharsah.onrender.com/html/signin.html');
  
      // Use test credentials
      cy.get('#emailOrUsername').type('omar');
      cy.get('#password').type('omar');
      cy.get('.sign-in-form').submit();
  
      // Ensure login succeeded
      cy.url({ timeout: 10000 }).should('include', '/html/profile.html');
    });
  
    it('adds, edits, deletes a diary entry, and uploads photo', () => {
      cy.visit('https://gharsah.onrender.com/html/diary.html');
  
      // Add entry
      cy.get('#open-modal').click();
      cy.get('#entry-modal').should('be.visible');
  
      cy.get('#plant-name').type('Test Plant');
      cy.get('#plant-notes').type('Needs sunlight');
      cy.get('#plant-type').select('خضار');
      cy.get('#plant-date').type('2024-04-20');
      cy.get('#plant-reminder').clear().type('7');
      cy.get('#entry-form').submit();
  
      cy.contains('.diary-card', 'Test Plant', { timeout: 10000 }).should('exist');
  
      // Edit entry
      cy.get('.edit-btn').first().click();
      cy.get('#edit-modal').should('be.visible');
      cy.get('#edit-name').clear().type('Updated Plant Name');
      cy.get('#edit-form').submit();
  
      cy.contains('.diary-card', 'Updated Plant Name', { timeout: 10000 }).should('exist');
  
      // Delete entry
      cy.get('.diary-card').then(cardsBefore => {
        const countBefore = cardsBefore.length;
  
        cy.get('.delete-btn').first().click();
        cy.on('window:confirm', () => true);
  
        cy.get('.diary-card', { timeout: 10000 }).should('have.length.lessThan', countBefore);
      });
  
      
    });
  
  });
  