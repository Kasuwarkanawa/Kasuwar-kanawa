import { ErrorRequestHandler, RequestHandler } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';

export const notFound: RequestHandler = (_req, res) => res.status(404).json({ error: 'Endpoint not found.' });
export const errorHandler: ErrorRequestHandler = (error: any, _req, res, _next) => {
  if (error instanceof ZodError) return res.status(400).json({ error: 'Invalid request.', details: error.flatten() });
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') return res.status(409).json({ error: 'A record with this value already exists.' });
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') return res.status(404).json({ error: 'Record not found.' });
  const status = Number.isInteger(error?.statusCode) ? error.statusCode : 500;
  if (status >= 500) console.error(error);
  return res.status(status).json({ error: status >= 500 ? 'An unexpected server error occurred.' : error.message });
};
