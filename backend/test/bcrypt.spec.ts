import * as bcrypt from 'bcrypt';

describe('bcrypt integration', () => {
  it('hashes and compares correctly', async () => {
    const plain = '@::*&gjbBby';
    const hash = await bcrypt.hash(plain, 12);
    expect(typeof hash).toBe('string');
    const ok = await bcrypt.compare(plain, hash);
    expect(ok).toBe(true);
  });
});
