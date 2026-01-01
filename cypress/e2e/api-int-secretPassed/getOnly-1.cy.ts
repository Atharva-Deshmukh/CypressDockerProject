describe('GET API', () => {
  it('API Test - 1', () => {
    cy.request(`${Cypress.env('API_BASE_URL')}/users`)
      .then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body).to.have.length(10);
      });
  });

  it('Repository Variable', () => {
      expect(Cypress.env('REPO_VARIABLE')).to.eq(31);
  });
});
