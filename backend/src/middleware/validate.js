// Route-level request validation with zod:
//   router.post('/login', validate({ body: loginSchema }), loginUser)
//
// - `body` is replaced with the parsed result, so controllers receive trimmed,
//   typed data and unknown keys are stripped (a client can't sneak in
//   `role: 'admin'`).
// - `params` is checked but left as-is.
// A failed parse throws a ZodError, which errorHandler turns into a 400.
export const validate = ({ body, params }) => (req, res, next) => {
  if (params) {
    params.parse(req.params);
  }
  if (body) {
    req.body = body.parse(req.body ?? {});
  }
  next();
};
