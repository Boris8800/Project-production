import request from 'supertest';

describe('Auth (e2e)', () => {
  const api = 'http://localhost:4000';
  const email = `e2e+${Date.now()}@example.com`;
  const password = 'TestPass123!';

  it('registers and returns tokens', async () => {
    const res = await request(api)
      .post('/v1/auth/register')
      .send({ email, password })
      .set('Content-Type', 'application/json')
      .expect(201);

    expect(res.body).toHaveProperty('accessToken');
    expect(res.body).toHaveProperty('refreshToken');
  }, 20000);

  it('logs in with password', async () => {
    const res = await request(api)
      .post('/v1/auth/login')
      .send({ email, password })
      .set('Content-Type', 'application/json')
      .expect(200);

    expect(res.body).toHaveProperty('accessToken');
  }, 15000);
});
