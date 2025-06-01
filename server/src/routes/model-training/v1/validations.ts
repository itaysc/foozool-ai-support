import Joi from 'joi';

export const trainModelSchema = Joi.object({
    maxPages: Joi.number().optional().default(100),
    perPage: Joi.number().optional().default(100),
    fromPage: Joi.number().optional().default(1),
});
