// configuration
const express=require("express");
const mongoose=require("mongoose");
const dotenv=require("dotenv");
const cors =require('cors');
const cookieParser =require('cookie-parser');
const { mkdirSync } = require('node:fs');
const { uploadDirectory } = require('./uploadDirectory');
const authMiddleware = require('./Middleware/authMiddleware');
const router = express.Router();



// basede donnée model
const Cours=require("./Models/Cours");
const Utilisateur=require("./Models/Utilisateur");
const Etudiant=require("./Models/Etudiant");
const Enseignant=require("./Models/Enseignant");
const Chapitre=require("./Models/Chapitre");
const Quiz=require("./Models/Quiz");
const TrancheAge = require("./Models/TrancheAge");  
const Competence=require("./Models/Competence")




// routes
const utilisateurRoutes = require('./Routes/utilisateurRoutes');
const EtudiantRoutes = require('./Routes/EtudiantsRoutes');
const ChapitresRoutes=require('./Routes/ChapitresRoutes');
const EnseignantRoutes=require('./Routes/EnseignantRoutes');
const CompetencesRoutes=require('./Routes/CompetencesRoutes');
const QuizRoutes=require('./Routes/QuizRoutes');
const CoursRoutes=require('./Routes/CoursRoutes');
const TrancheAgeRoutes = require('./Routes/TrancheAgeRoutes');  


dotenv.config();

const app = express();
const production = process.env.NODE_ENV === 'production';
const frontendOrigins = (process.env.PIE_KIDS_FRONTEND_ORIGIN || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(express.json());
app.use(cors({ origin: frontendOrigins.length ? frontendOrigins : !production }));
mkdirSync(uploadDirectory(), { recursive: true });
app.use('/uploads', express.static(uploadDirectory(), {
  index: false,
  setHeaders(res) {
    res.set('Content-Security-Policy', 'sandbox');
    res.set('X-Content-Type-Options', 'nosniff');
  },
}));

// The hosted app only exposes the account and catalog routes it uses.
if (production) {
  app.use((req, res, next) => {
    const pathname = req.path.toLowerCase().replace(/\/+$/, '');
    const read = req.method === 'GET' || req.method === 'HEAD';
    const publicPaths = {
      '/etudiants': req.method === 'POST' && ['/etudiants/login', '/etudiants/register'].includes(pathname),
      '/enseignant': req.method === 'POST' && pathname === '/enseignant/register-enseignant',
      '/utilisateurs': false,
      '/chapitres': false,
      '/competences': read && pathname === '/competences/all',
      '/trancheage': read && pathname === '/trancheage',
      '/quiz': (read || req.method === 'POST') && pathname === '/quiz',
    };
    const prefix = '/' + pathname.split('/')[1];
    if (Object.hasOwn(publicPaths, prefix) && !publicPaths[prefix]) {
      return res.status(404).json({ message: 'Not found' });
    }
    next();
  });
}

app.use('/Etudiants', EtudiantRoutes);
app.use('/Enseignant', EnseignantRoutes);
app.use('/Utilisateurs', utilisateurRoutes);
app.use('/chapitres', ChapitresRoutes);
app.use('/competences', CompetencesRoutes);
app.use('/quiz', QuizRoutes);
app.use('/cours', CoursRoutes);
app.use('/trancheAge', TrancheAgeRoutes);

app.get('/health', (_req, res) => {
  const ready = mongoose.connection.readyState === 1;
  res.status(ready ? 200 : 503).json({ ready });
});

app.get('/verify-token', authMiddleware, (req, res) => {
  res.set('Cache-Control', 'no-store');
  res.json({
    isAuthenticated: true,
    id: req.Utilisateur._id,
    name: req.Utilisateur.nom,
    role: req.Utilisateur.role,
  });
});




const port = process.env.PORT || 4000;

mongoose.connect(process.env.MONGO_url)
  .then(() => {
    app.listen(port, '0.0.0.0', () => console.log(`Server is running on port ${port}`));
  })
  .catch((error) => {
    console.error('MongoDB startup failed:', error.name);
    process.exitCode = 1;
  });
