async function forwardEntity({
  SourceModel,
  TargetModel,
  findQuery, // { _id, "postId", channelId, "channelId" }
  userId,
  destination,
  original,
  snapshot,
}) {
  if (!destination) {
    return { status: 400, body: { err: "Destination required!" } };
  }

  const doc = await SourceModel.findOne(findQuery);
  if (!doc) {
    return { status: 404, body: { err: "Content not found" } };
  }

  await SourceModel.updateOne(
    { _id: doc._id },
    {
      $inc: { "forward.count": 1 },
      $set: {
        "forward.lastForwardedAt": new Date(),
        "forward.lastForwardedTo": destination.id,
      },
    },
  );

  const newContent = await TargetModel.create({
    ...snapshot,
    forward: {
      forwardedBy: userId,
      forwardedAt: new Date(),
      original,
      snapshot,
    },
  });

  return { status: 201, body: newContent };
}

module.exports = { forwardEntity };
