import Joi from 'joi';
import { ZendeskTicket } from 'src/types';
   
export const newTicket = Joi.object({
   ticket: Joi.object<ZendeskTicket>().required(),
});
    