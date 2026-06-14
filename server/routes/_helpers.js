// Wraps a handler so thrown errors become clean 400s instead of crashes.
// Use:  router.get('/x', handle((req, res) => { ... }));
export const handle = (fn) => (req, res) => {
  try { fn(req, res); }
  catch (e) { res.status(400).json({ error: e.message || 'Request failed' }); }
};
