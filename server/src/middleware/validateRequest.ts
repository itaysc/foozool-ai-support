/* eslint-disable consistent-return */
import { z } from 'zod';

export const validateRequest = (validationSchema: z.ZodSchema) => {
  return (req: any, res: any, next: any) => {
    if (validationSchema) {
      const result = validationSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).send({
          error: 'Validation failed',
          details: result.error.issues
        });
      }
      // Replace req.body with validated data
      req.body = result.data;
    }

    return next();
  };
};

export function validateRequestParams(keyValuePairs: Record<string, z.ZodSchema> = {}) {
  return (req: any, res: any, next: any) => {
    if (Object.keys(keyValuePairs).length > 0) {
      const errors: any[] = [];
      Object.keys(keyValuePairs).forEach((key) => {
        const validationSchema = keyValuePairs[key];
        const param = req.params[key];
        const result = validationSchema.safeParse(param);
        if (!result.success) {
          errors.push(...result.error.issues);
        }
      });
      if (errors.length > 0) {
        return res.status(400).send({
          error: 'Parameter validation failed',
          details: errors
        });
      }
    }

    return next();
  };
}