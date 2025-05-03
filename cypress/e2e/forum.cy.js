describe('Forum Feature (Real API)', () => {

    beforeEach(() => {
      // Visit the sign-in page and log in before each test to ensure the user is logged in
      cy.visit('https://gharsah.onrender.com/html/signin.html');
  
      // Login with test user
      cy.get('#emailOrUsername').type('omar');
      cy.get('#password').type('omar');
      cy.get('.sign-in-form').submit();
  
      // Wait until redirected to profile, ensuring login is successful
      cy.url({ timeout: 10000 }).should('include', '/html/profile.html');
  
      // Now visit the forum page after ensuring user is logged in
      cy.visit('https://gharsah.onrender.com/html/forum.html');
      cy.get('h2').should('contain', '🌿 المنتدى الزراعي');  // Verify forum page is loaded
    });
  
    it('creates a new forum post with image', () => {
      // Add a new post
      cy.get('#new-post-btn').click();
      cy.get('#post-modal').should('be.visible');
  
      cy.get('#post-title').type('تجربة زراعة ريحان');
      cy.get('#post-category').select('تجربة');
      cy.get('#post-content').type('شاركت تجربتي في زراعة الريحان في فناء المنزل.');
      cy.get('#post-form').submit();
  
      cy.get('#postsList', { timeout: 10000 }).should('contain', 'تجربة زراعة ريحان');
    });
  
    it('filters posts by category', () => {
      // Apply a filter
      cy.get('#filter-category').select('تجربة');
      cy.wait(1000);  // Wait for the posts to filter
    });
  
    it('replies to a forum post', () => {
      // Make sure there's at least one post available to reply to
      cy.get('#postsList .reply-btn').first().click();
      cy.get('#reply-modal').should('be.visible');
  
      cy.get('#reply-content').type('شكراً على المشاركة! جربت نفس الطريقة ونجحت.');
      cy.get('#submit-reply').click();
  
      // Wait and check that reply modal closes
      cy.get('#reply-modal', { timeout: 10000 }).should('not.be.visible');
    });
  
  });
  