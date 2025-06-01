import Joi from 'joi';
import { ZendeskTicket } from '@common/types';
   
export const newTicket = Joi.object({
   ticket: Joi.object<ZendeskTicket>().required(),
});
    