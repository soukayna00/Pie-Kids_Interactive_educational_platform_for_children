const jwt = require('jsonwebtoken');
const Utilisateur = require('../Models/Utilisateur');

module.exports = async function authMiddleware(req, res, next) {
  const header = req.get('Authorization');
  const token = header?.replace(/^Bearer\s+/i, '').trim();
  if (!token) return res.status(401).json({ error: 'Please authenticate.' });

  let userId;
  try {
    const claims = jwt.verify(token, process.env.JWT_PRIVATEKEY || process.env.JWT_SECRET, {
      algorithms: ['HS256'],
    });
    userId = claims._id;
    if (typeof userId !== 'string' || !/^[a-f\d]{24}$/i.test(userId)) {
      return res.status(401).json({ error: 'Please authenticate.' });
    }
  } catch {
    return res.status(401).json({ error: 'Please authenticate.' });
  }

  try {
    const user = await Utilisateur.findById(userId).select('_id nom role').lean();
    if (!user) return res.status(401).json({ error: 'Please authenticate.' });

    req.Utilisateur = user;
    next();
  } catch (error) {
    next(error);
  }
};
