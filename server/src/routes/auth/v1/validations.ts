import Joi from 'joi';

export const getToken = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});
