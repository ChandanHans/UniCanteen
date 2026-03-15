const { error } = require("../utils/apiResponse");

function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const errors = result.error.errors.map((e) => ({
        field: e.path.join("."),
        message: e.message,
      }));
      return error(res, "Validation failed", 400, errors);
    }
    req.body = result.data;
    next();
  };
}

module.exports = validate;
