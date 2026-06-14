// Wraps an (async) handler so thrown errors become clean 400s instead of
// crashing the process. Use:  router.get('/x', handle(async (req, res) => …));
export const handle = (fn) => async (req, res) => {
  try { await fn(req, res); }
  catch (e) { res.status(400).json({ error: e.message || 'Request failed' }); }
};
