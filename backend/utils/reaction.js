async function reactToEntity({
  Model,
  findQuery, // { _id, channelId } or { _id, groupId } ...
  userId,
  emoji,
  reactionsPath = "reactions",
}) {
  if (!emoji) return { status: 400, body: { err: "Emoji is required" } };

  const doc = await Model.findOne(findQuery);
  if (!doc) return { status: 404, body: { err: "Post not found" } };

  const reactions = doc[reactionsPath] || [];
  let previousReaction = null;

  for (const reaction of reactions) {
    if (reaction.reactors.map((id) => id.toString()).includes(userId)) {
      previousReaction = reaction;
      break;
    }
  }

  const reactionsKey = reactionsPath; // e.g. "reactions"

  if (previousReaction && previousReaction.emoji === emoji) {
    await Model.updateOne(
      { _id: doc._id, [`${reactionsKey}.emoji`]: emoji },
      {
        $pull: { [`${reactionsKey}.$.reactors`]: userId },
        $inc: { [`${reactionsKey}.$.count`]: -1 },
      },
    );
    return { status: 200, body: { message: "Reaction removed" } };
  }

  if (previousReaction) {
    await Model.updateOne(
      { _id: doc._id, [`${reactionsKey}.emoji`]: previousReaction.emoji },
      {
        $pull: { [`${reactionsKey}.$.reactors`]: userId },
        $inc: { [`${reactionsKey}.$.count`]: -1 },
      },
    );
  }

  const emojiExists = reactions.some((r) => r.emoji === emoji);

  if (emojiExists) {
    await Model.updateOne(
      { _id: doc._id, [`${reactionsKey}.emoji`]: emoji },
      {
        $addToSet: { [`${reactionsKey}.$.reactors`]: userId },
        $inc: { [`${reactionsKey}.$.count`]: 1 },
      },
    );
  } else {
    await Model.updateOne(
      { _id: doc._id },
      {
        $push: {
          [reactionsKey]: { emoji, count: 1, reactors: [userId] },
        },
      },
    );
  }

  return { status: 200, body: { message: "Reaction updated" } };
}

module.exports = { reactToEntity };
