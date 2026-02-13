async function addViewToEntity({
  Model,
  findQuery,
  userId,
  viewersPath,
  viewerIdField,
  viewedAtField,
  countPath,
  notFoundMessage = "Post not found",
}) {
  const doc = await Model.findOne(findQuery);
  if (!doc) return { status: 404, body: { err: notFoundMessage } };
  console.log("addViewToEntity called", {
    findQuery,
    userId,
    viewersPath,
    countPath,
  });

  const viewers = doc.get(viewersPath) || [];
  console.log("current viewers value:", viewers);
  const alreadyViewed = viewerIdField
    ? viewers.some(
        (viewer) => viewer?.[viewerIdField]?.toString() === userId.toString(),
      )
    : viewers.map((id) => id.toString()).includes(userId.toString());

  if (alreadyViewed) {
    return { status: 200, body: { message: "View already counted" } };
  }

  const update = {};
  if (viewerIdField) {
    const newViewer = { [viewerIdField]: userId };
    if (viewedAtField) {
      newViewer[viewedAtField] = new Date();
    }
    update.$push = { [viewersPath]: newViewer };
  } else {
    update.$addToSet = { [viewersPath]: userId };
  }
  if (countPath) {
    update.$inc = { [countPath]: 1 };
  }

  console.log("update object for view:", update);

  await Model.updateOne({ _id: doc._id }, update);

  console.log("updateOne executed for", doc._id);

  return { status: 200, body: { message: "View registered" } };
}

module.exports = { addViewToEntity };
