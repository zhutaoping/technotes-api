const User = require("../models/User");
const Note = require("../models/Note");

// @route GET /notes
// @desc Get all notes
// @access Private
const getAllNotes = async (req, res) => {
	const notes = await Note.find().lean();
	if (!notes?.length) {
		return res.status(400).json({ message: "No notes found" });
	}

	const notesWithUser = await Promise.all(
		notes.map(async (note) => {
			const user = await User.findById(note.user).lean().exec();
			return { ...note, username: user.username };
		})
	);

	res.json(notesWithUser);
};

// @desc Create new note
// @route POST /notes
// @access Private
const createNewNote = async (req, res, next) => {
	const { user, title, text } = req.body;

	// Confirm data
	if (!user || !title || !text) {
		return res.status(400).json({ message: "All fields are required" });
	}

	// Check for duplicate title
	const duplicate = await Note.findOne({ title })
		.collation({ locale: "en", strength: 2 })
		.lean()
		.exec();
	if (duplicate) {
		return res.status(409).json({ message: "Duplicate note title" });
	}
	const note = await Note.create({ user, title, text });

	if (note) {
		return res.status(201).json({ message: "New note created" });
	} else {
		return res.status(400).json({ message: "Invalid note data received" });
	}
};

// @desc Update a note
// @route PATCH /notes
// @access Private
const updateNote = async (req, res) => {
	const { id, user, title, text, completed } = req.body;

	if (!id || !user || !title || !text || typeof completed !== "boolean") {
		return res.status(400).json({ message: "All fields are required." });
	}

	const note = await Note.findById(id).exec();
	if (!note) {
		return res.status(400).json({ message: "Note not found" });
	}

	const duplicate = await Note.findOne({ title })
		.collation({ locale: "en", strength: 2 })
		.lean()
		.exec();
	if (duplicate && duplicate?._id.toString() !== id) {
		return res.status(409).json({ message: "Duplicate note title" });
	}

	note.user = user;
	note.title = title;
	note.text = text;
	note.completed = completed;

	const updateNote = await note.save();

	res.json({ message: `Note '${updateNote.title}' updated` });
};

// @desc Delete a note
// @route DELETE /notes
// @access Private
const deleteNote = async (req, res) => {
	const { id } = req.body;
	if (!id) {
		res.status(400).json({ message: "Note ID required." });
	}

	const note = await Note.findById(id).exec();
	if (!note) {
		return res.status(400).json({ message: "Note not found" });
	}

	const result = await note.deleteOne();

	const reply = `Note '${result.title}' with ID ${result.id} deleted.`;

	res.json(reply);
};

module.exports = {
	getAllNotes,
	createNewNote,
	updateNote,
	deleteNote,
};
