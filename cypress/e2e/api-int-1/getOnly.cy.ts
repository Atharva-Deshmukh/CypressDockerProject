describe('Users API', () => {
  it('Verify GET users API call', () => {
    cy.request('https://jsonplaceholder.typicode.com/users')
      .then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body).to.have.length(10);
      });
  });
});
