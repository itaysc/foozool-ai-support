import { z } from 'zod';

type ValidationSchema = z.ZodSchema;
type AsyncFunction<T, R> = (data: T) => Promise<R>;

function serviceWrapper<T, R>(schema: ValidationSchema | null | AsyncFunction<T, R>, fn?: AsyncFunction<T, R>) {
  return async (data: T): Promise<R> => {
    if (typeof schema === 'function') {
      return schema(data);
    }
    if (!schema && fn) {
      return fn(data);
    }
    const result = schema!.safeParse(data);

    if (!result.success) {
      throw new Error(result.error.issues.map((issue) => issue.message).join(', '));
    }

    return fn!(result.data as T);
  };
}

export default serviceWrapper;
