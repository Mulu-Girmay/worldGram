const Story = require("../Models/Story");
const { reactToEntity } = require("../utils/reaction");
const { addViewToEntity } = require("../utils/view");

exports.addStory = async (req, res) => {
  try {
    let { caption } = req.body;
    let userId = req.userId;

    if (!userId) {
      res.status(401).json({ message: "userId not found" });
    }
    if (!req.file) {
      res.status(401).json({ message: "file not found" });
    }
    let adding = new Story({
      caption: caption,
      media: req.file.filename,
    });
    await adding.save();
    res.status(201).json({ message: "successfully added story" });
  } catch (err) {
    res.status(500).json({ message: "failed to post story" });
  }
};

exports.reactToStory = async (req, res) => {
  try {
    const result = await reactToEntity({
      Model: Story,
      findQuery: { _id: req.params.storyId },
      userId: req.userId,
      emoji: req.body.emoji,
      reactionsPath: "reactions",
    });

    return res.status(result.status).json(result.body);
  } catch (err) {
    console.error(err);
    res.status(500).json({ err: err.message });
  }
};

exports.addViewToStory = async (req, res) => {
  try {
    const result = await addViewToEntity({
      Model: Story,
      findQuery: { _id: req.params.storyId },
      userId: req.userId,
      viewersPath: "viewers",
      viewerIdField: "userId",
      viewedAtField: "viewedAt",
      notFoundMessage: "Story not found",
    });

    return res.status(result.status).json(result.body);
  } catch (err) {
    console.error(err);
    res.status(500).json({ err: err.message });
  }
};
