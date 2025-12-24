describe('API CRUD Tests - ReqRes', () => {
    const baseUrl = 'https://reqres.in/api/users';
    let userId;

    it('Verify Create (POST)', () => {
        cy.request('POST', baseUrl, {
            name: 'John Doe',
            job: 'QA Engineer'
        }).then((response) => {
            expect(response.status).to.eq(201);
            expect(response.body).to.have.property('name', 'John Doe');
            expect(response.body).to.have.property('job', 'QA Engineer');

            userId = response.body.id; // Save user ID
        });
    });

    it('Verify Read (GET)', () => {
        cy.request({
            method: 'GET',
            url: `${baseUrl}/2`,
        }).then((response) => {
            expect(response.status).to.eq(200);
            expect(response.body.data).to.have.property('id', 2);
            expect(response.body.data).to.have.property('email');
        });
    });

    // UPDATE (PUT)
    it('Verify Update (PUT)', () => {
        cy.request('PUT', `${baseUrl}/2`, {
            name: 'John Updated',
            job: 'Senior QA'
        }).then((response) => {
            expect(response.status).to.eq(200);
            expect(response.body).to.have.property('name', 'John Updated');
            expect(response.body).to.have.property('job', 'Senior QA');
        });
    });

    // DELETE
    it('Verify Delete (DELETE)', () => {
        cy.request({
            method: 'DELETE',
            url: `${baseUrl}/2`,
            failOnStatusCode: false
        }).then((response) => {
            expect(response.status).to.eq(204);
        });
    });
});
