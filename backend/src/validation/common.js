import { z } from 'zod';

// A MongoDB ObjectId as it appears in URLs: 24 hex characters.
export const objectId = (label = 'id') =>
  z.string().regex(/^[0-9a-f]{24}$/i, `Invalid ${label}`);

export const idParams = (label) => z.object({ id: objectId(label) });
