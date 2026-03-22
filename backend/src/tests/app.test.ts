import 'dotenv/config';
import request from 'supertest';
import path from 'path';
import { promises as fs } from 'fs';
import { createApp } from '../app';
import { prisma } from '../infrastructure/prismaClient';
import { getUploadDir } from '../config/env';

const app = createApp(prisma);

const uniqueEmail = () => `test-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;

describe('HTTP API', () => {
  afterAll(async () => {
    await prisma.resume.deleteMany();
    await prisma.education.deleteMany();
    await prisma.workExperience.deleteMany();
    await prisma.candidate.deleteMany();
    await prisma.$disconnect();
  });

  describe('GET /', () => {
    it('responds with greeting', async () => {
      const response = await request(app).get('/');
      expect(response.statusCode).toBe(200);
      expect(response.text).toBe('Hola LTI!');
    });
  });

  describe('POST /candidates', () => {
    it('returns 201 for minimal valid body', async () => {
      const email = uniqueEmail();
      const res = await request(app).post('/candidates').send({
        firstName: 'John',
        lastName: 'Doe',
        email,
      });
      expect(res.statusCode).toBe(201);
      expect(res.body).toMatchObject({
        id: expect.any(Number),
        firstName: 'John',
        lastName: 'Doe',
        email,
        phone: null,
        address: null,
      });
    });

    it('returns 400 for fourth education row', async () => {
      const email = uniqueEmail();
      const res = await request(app)
        .post('/candidates')
        .send({
          firstName: 'John',
          lastName: 'Doe',
          email,
          educations: [
            { institution: 'A', title: 'B', startDate: '2020-01-01T00:00:00.000Z' },
            { institution: 'C', title: 'D', startDate: '2020-01-01T00:00:00.000Z' },
            { institution: 'E', title: 'F', startDate: '2020-01-01T00:00:00.000Z' },
            { institution: 'G', title: 'H', startDate: '2020-01-01T00:00:00.000Z' },
          ],
        });
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain('3');
    });

    it('returns 400 for duplicate email', async () => {
      const email = uniqueEmail();
      await request(app).post('/candidates').send({
        firstName: 'John',
        lastName: 'Doe',
        email,
      });
      const res = await request(app).post('/candidates').send({
        firstName: 'Jane',
        lastName: 'Doe',
        email,
      });
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toMatch(/already exists/i);
    });

    it('returns 400 for invalid cv file path', async () => {
      const email = uniqueEmail();
      const res = await request(app)
        .post('/candidates')
        .send({
          firstName: 'John',
          lastName: 'Doe',
          email,
          cv: { filePath: '../outside.txt', fileType: 'application/pdf' },
        });
      expect(res.statusCode).toBe(400);
    });
  });

  describe('POST /upload', () => {
    it('returns 400 when file is missing', async () => {
      const res = await request(app).post('/upload');
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBeDefined();
    });

    it('accepts a small PDF and returns filePath and fileType', async () => {
      const pdfBuffer = Buffer.from(
        '%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF',
        'utf8',
      );
      const res = await request(app)
        .post('/upload')
        .attach('file', pdfBuffer, { filename: 'test.pdf', contentType: 'application/pdf' });
      expect(res.statusCode).toBe(200);
      expect(res.body.filePath).toMatch(/\.pdf$/);
      expect(res.body.fileType).toBe('application/pdf');

      const uploadDir = getUploadDir();
      const full = path.join(uploadDir, res.body.filePath as string);
      await fs.unlink(full).catch(() => undefined);
    });
  });

  describe('POST /candidates with cv', () => {
    it('creates candidate with uploaded cv reference', async () => {
      const pdfBuffer = Buffer.from(
        '%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF',
        'utf8',
      );
      const uploadRes = await request(app)
        .post('/upload')
        .attach('file', pdfBuffer, { filename: 'cv.pdf', contentType: 'application/pdf' });
      expect(uploadRes.statusCode).toBe(200);

      const email = uniqueEmail();
      const createRes = await request(app).post('/candidates').send({
        firstName: 'Anna',
        lastName: 'Smith',
        email,
        cv: {
          filePath: uploadRes.body.filePath,
          fileType: uploadRes.body.fileType,
        },
      });
      expect(createRes.statusCode).toBe(201);

      const uploadDir = getUploadDir();
      await fs.unlink(path.join(uploadDir, uploadRes.body.filePath as string)).catch(() => undefined);
    });
  });
});
