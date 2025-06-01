import joi from 'joi';

export const createUserSchema = joi.object({
  email: joi.string().email().required(),
  password: joi.string().required(),
  firstName: joi.string().required(),
  lastName: joi.string().required(),
  organization: joi.string().required(),
});
