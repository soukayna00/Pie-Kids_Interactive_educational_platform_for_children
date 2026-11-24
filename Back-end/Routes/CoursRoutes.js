const express = require('express');
const router = express.Router();
const multer = require('multer');
const Joi = require('joi');
const { unlink } = require('node:fs/promises');
const { Cours } = require('../Models/Cours');
const Chapitre = require('../Models/Chapitre');
const authMiddleware = require('../Middleware/authMiddleware');
const { uploadDirectory } = require('../uploadDirectory');

const publicCourseFields = '_id titre Thumbnail description chapitres trancheAge Competences quiz';

function requireStudent(req, res, next) {
    if (req.Utilisateur.role !== 'Etudiant') {
        return res.status(403).json({ error: 'A student account is required.' });
    }
    next();
}

router.get('/mine', authMiddleware, requireStudent, async (req, res, next) => {
    try {
        const courses = await Cours.find({ Etudiants: req.Utilisateur._id })
            .select('_id titre description')
            .lean();
        res.set('Cache-Control', 'no-store').json(courses);
    } catch (error) {
        next(error);
    }
});



function requireTeacher(req, res, next) {
    if (req.Utilisateur.role !== 'Enseignant') {
        return res.status(403).json({ error: 'A teacher account is required.' });
    }
    next();
}

function ownedCourse(req) {
    return { _id: req.params.id, enseignant: req.Utilisateur._id };
}

async function requireOwnedCourse(req, res, next) {
    if (!/^[a-f\d]{24}$/i.test(req.params.id)) {
        return res.status(400).json({ error: 'Invalid course ID.' });
    }

    try {
        if (!await Cours.exists(ownedCourse(req))) {
            return res.status(404).json({ error: 'Course not found.' });
        }
        next();
    } catch (error) {
        next(error);
    }
}

router.get('/teaching', authMiddleware, requireTeacher, async (req, res, next) => {
    try {
        const courses = await Cours.find({ enseignant: req.Utilisateur._id })
            .select('_id titre Thumbnail description Competences')
            .populate('Competences', 'Titre')
            .lean();
        res.set('Cache-Control', 'no-store').json(courses);
    } catch (error) {
        next(error);
    }
});

router.get('/:id', async (req, res) => {
    const _id = req.params.id;
    // console.log(`Fetching course data for courseId: ${_id}`); // Add this logging statement
    try {
        const course = await Cours.findById(_id)
            .select(publicCourseFields)
            .populate('chapitres')
            .populate('trancheAge')
            .populate('Competences')
            .populate('quiz');
        if (!course) {
            console.log(`Course data not found for courseId: ${_id}`); // Add this logging statement
            return res.status(404).json({ error: 'Course not found' });
        }
        res.status(200).json(course);
    } catch (e) {
        console.error('Error fetching course data:', e); // Add this logging statement
        res.status(500).json({ error: e.message });
    }
});


router.get('/', async (req, res) => {
    try {
        const courses = await Cours.find({})
            .select(publicCourseFields)
            .populate('chapitres')
            .populate('trancheAge')
            .populate('Competences')
            .populate('quiz');
        res.status(200).json(courses);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});


// Multer configuration
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDirectory());
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname); // Rename the file if needed
    }
});

const upload = multer({ storage: storage });

const objectId = Joi.string().hex().length(24);
const courseFields = Joi.object({
    titre: Joi.string().trim(),
    description: Joi.string().trim(),
    trancheAge: objectId.allow(null),
    Competences: Joi.array().items(objectId).unique(),
});
const createCourseFields = courseFields.fork(['titre', 'description'], (field) => field.required());
const chapterFields = Joi.object({
    titre: Joi.string().trim().required(),
    content: Joi.string().trim().required(),
});

function validateCourse(body = {}, schema) {
    const { titre, description, trancheAge, Competences } = body;
    let skills = Competences;
    if (typeof skills === 'string') {
        try {
            skills = JSON.parse(skills);
        } catch {
            return { error: { message: 'Competences must contain a JSON array of skill IDs.' } };
        }
    }
    return schema.validate({
        titre,
        description,
        trancheAge: trancheAge === '' ? null : trancheAge,
        Competences: skills,
    });
}

async function rejectInvalidForm(res, error, files = [], status = 400) {
    await Promise.allSettled(files.map((file) => unlink(file.path)));
    return res.status(status).json({ message: error.message });
}

router.post('/', authMiddleware, requireTeacher, upload.single('Thumbnail'), async (req, res, next) => {
    try {
        const { error, value } = validateCourse(req.body, createCourseFields);
        if (error) return await rejectInvalidForm(res, error, req.file ? [req.file] : []);

        const course = await Cours.create({
            ...value,
            enseignant: req.Utilisateur._id,
            Thumbnail: req.file ? `uploads/${req.file.filename}` : null,
        });
        res.status(201).json(course);
    } catch (error) {
        next(error);
    }
});

router.patch('/:id/chapitres', authMiddleware, requireTeacher, requireOwnedCourse, upload.array('resources'), async (req, res, next) => {
    try {
        const { error, value } = chapterFields.validate({
            titre: req.body?.titre,
            content: req.body?.content,
        });
        if (error) return await rejectInvalidForm(res, error, req.files);

        const chapter = await Chapitre.create({
            ...value,
            resources: req.files.map((file) => ({ filename: file.filename })),
        });
        const course = await Cours.findOneAndUpdate(
            ownedCourse(req),
            { $push: { chapitres: chapter._id } },
            { new: true },
        ).select(publicCourseFields);

        if (!course) {
            await Chapitre.deleteOne({ _id: chapter._id });
            return await rejectInvalidForm(res, { message: 'Course not found' }, req.files, 404);
        }
        res.json({ message: 'Chapter added successfully', course });
    } catch (error) {
        next(error);
    }
});

router.put('/editCourse/:id', authMiddleware, requireTeacher, requireOwnedCourse, upload.single('Thumbnail'), async (req, res, next) => {
    try {
        const files = req.file ? [req.file] : [];
        const { error, value } = validateCourse(req.body, courseFields);
        if (error) return await rejectInvalidForm(res, error, files);

        const changes = Object.fromEntries(
            Object.entries(value).filter(([, field]) => field !== undefined),
        );
        if (req.file) changes.Thumbnail = `uploads/${req.file.filename}`;

        const course = await Cours.findOneAndUpdate(
            ownedCourse(req), { $set: changes }, { new: true, runValidators: true },
        ).select(publicCourseFields);

        if (!course) return await rejectInvalidForm(res, { message: 'Course not found' }, files, 404);

        res.json({ message: 'Course updated successfully', course });
    } catch (error) {
        next(error);
    }
});


// delete 


// DELETE route to delete a course by ID
router.delete('/deleteCourse/:id', authMiddleware, requireTeacher, requireOwnedCourse, async (req, res) => {
    try {
        const deletedCourse = await Cours.findOneAndDelete(ownedCourse(req));

        if (!deletedCourse) {
            return res.status(404).json({ message: 'Course not found' });
        }

        res.json({ message: 'Course deleted successfully' });
    } catch (error) {
        console.error('Error deleting course:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});


router.post('/enroller/:id', authMiddleware, requireStudent, async (req, res, next) => {
    if (!/^[a-f\d]{24}$/i.test(req.params.id)) {
        return res.status(400).json({ error: 'Invalid course ID.' });
    }

    try {
        const result = await Cours.updateOne(
            { _id: req.params.id },
            { $addToSet: { Etudiants: req.Utilisateur._id } },
        );
        if (result.matchedCount === 0) {
            return res.status(404).json({ error: 'Course not found.' });
        }
        res.json({ enrolled: true });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
