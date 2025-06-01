import Joi from 'joi';

type ValidationSchema = Joi.ObjectSchema;
type AsyncFunction<T, R> = (data: T) => Promise<R>;

function serviceWrapper<T, R>(schema: ValidationSchema | null | AsyncFunction<T, R>, fn?: AsyncFunction<T, R>) {
  return async (data: T): Promise<R> => {
    if (typeof schema === 'function') {
      return schema(data);
    }
    if (!schema && fn) {
      return fn(data);
    }
    const { error, value } = schema!.validate(data, { abortEarly: false });

    if (error) {
      throw new Error (error.details.map((d) => d.message).join(', '));
    }

    return fn!(value);
  };
}

export default serviceWrapper;
