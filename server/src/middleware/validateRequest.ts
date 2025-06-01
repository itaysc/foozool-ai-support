/* eslint-disable consistent-return */

export const validateRequest = (validationSchema) => {
  return (req, res, next) => {
    if (validationSchema) {
      const r = validationSchema.validate(req.body);
      if (r.error) {
        return res.status(400).send(r.error.details ? r.error.details : r.error);
      }
    }

    return next();
  };
};

export function validateRequestParams(keyValuePairs = {}) {
  return (req, res, next) => {
    if (Object.keys(keyValuePairs).length > 0) {
      const errors: string[] = [];
      Object.keys(keyValuePairs).forEach((key) => {
        const validationSchema = keyValuePairs[key];
        const param = req.params[key];
        const r = validationSchema.validate(param);
        if (r.error) {
          errors.push(r.error.details ? r.error.details : r.error);
        }
      });
      if (errors.length > 0) {
        return res.status(400).send(errors);
      }
    }

    return next();
  };
}