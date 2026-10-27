// An error that already knows which HTTP status it should produce.
// Controllers `throw new HttpError(404, 'Question not found')` and the central
// error handler turns it into the response — no res.status() bookkeeping.
class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
  }
}

export default HttpError;
