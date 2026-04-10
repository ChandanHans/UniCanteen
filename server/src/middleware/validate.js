const { error } = require("../utils/apiResponse");

function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const errors = result.error.errors.map((e) => ({
        field: e.path.join("."),
        message: e.message,
      }))
      const firstMessage = errors[0]?.message || "Validation failed"
      return error(res, firstMessage, 400, errors)
    }
    req.body = result.data;
    next();
  };
}

module.exports = validate;
