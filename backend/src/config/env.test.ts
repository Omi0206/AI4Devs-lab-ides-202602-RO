describe('config/env', () => {
  const original = process.env;

  afterEach(() => {
    process.env = { ...original };
    jest.resetModules();
  });

  it('getPort defaults to 3000', () => {
    delete process.env.PORT;
    const { getPort } = require('./env');
    expect(getPort()).toBe(3000);
  });

  it('getPort parses PORT', () => {
    process.env.PORT = '4000';
    const { getPort } = require('./env');
    expect(getPort()).toBe(4000);
  });

  it('getPort falls back on invalid PORT', () => {
    process.env.PORT = 'not-a-number';
    const { getPort } = require('./env');
    expect(getPort()).toBe(3000);
  });

  it('getUploadDir defaults to cwd/uploads', () => {
    delete process.env.UPLOAD_DIR;
    const { getUploadDir } = require('./env');
    expect(getUploadDir()).toContain('uploads');
  });

  it('getUploadDir resolves relative path', () => {
    process.env.UPLOAD_DIR = 'custom_uploads';
    const { getUploadDir } = require('./env');
    expect(getUploadDir()).toContain('custom_uploads');
  });

  it('getMaxUploadBytes uses default', () => {
    delete process.env.MAX_UPLOAD_BYTES;
    const { getMaxUploadBytes } = require('./env');
    expect(getMaxUploadBytes()).toBe(10 * 1024 * 1024);
  });

  it('getMaxUploadBytes parses env', () => {
    process.env.MAX_UPLOAD_BYTES = '1024';
    const { getMaxUploadBytes } = require('./env');
    expect(getMaxUploadBytes()).toBe(1024);
  });

  it('getAllowedResumeMimeTypes parses comma list', () => {
    process.env.ALLOWED_RESUME_MIME_TYPES = 'application/pdf, image/png ';
    const { getAllowedResumeMimeTypes } = require('./env');
    expect(getAllowedResumeMimeTypes()).toEqual(['application/pdf', 'image/png']);
  });
});
