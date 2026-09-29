// Validasi & sanitasi input dengan zod. Field tak dikenal dibuang, dan tipe dipaksa
// (mis. username harus string, bukan objek {"$ne": ""}) sehingga aman dari NoSQL injection.
// Pemakaian: validate(schema) untuk body, validate(schema, 'query') / validate(schema, 'params')
const validate = (schema, source = 'body') => (req, res, next) => {
  const result = schema.safeParse(req[source]);
  if (!result.success) return next(result.error);
  req[source] = result.data;
  next();
};

module.exports = validate;
