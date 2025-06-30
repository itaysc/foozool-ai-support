import Joi from 'joi';

export const zendeskWebhookValidation = Joi.object({
    ticket_id: Joi.string().required(),
    subject: Joi.string().required(),
    status: Joi.string().required(),
    description: Joi.string().required(),
    priority: Joi.string().required(),
    tags: Joi.string().required(),
    created_at: Joi.string().required(),
    external_id: Joi.string().required(),
    requester: Joi.object({
        name: Joi.string().required(),
        email: Joi.string().required(),
    }),
    custom_field_example: Joi.string().required(),
    via: Joi.string().required(),
});