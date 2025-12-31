describe('GET API', () => {
  it('API Test - 1', () => {
    cy.request('https://jsonplaceholder.typicode.com/users')
      .then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body).to.have.length(10);
      });
  });

  it('API Test - 2', () => {
    cy.request('https://jsonplaceholder.typicode.com/users')
      .then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body).to.have.length.greaterThan(4);
      });
  });

  it('API Test - 3', () => {
    cy.request('https://jsonplaceholder.typicode.com/users')
      .then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body).to.have.length.lessThan(100);
      });
  });
});
