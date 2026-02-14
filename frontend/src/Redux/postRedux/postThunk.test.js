import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  reactToPost,
  addCommentToPost,
  replyToPostComment,
  forwardPost,
} from "./postThunk";
import {
  reactToPostApi,
  addCommentApi,
  replyToCommentApi,
  forwardPostApi,
} from "../../api/postApi";

vi.mock("../../api/postApi", () => ({
  reactToPostApi: vi.fn(),
  addCommentApi: vi.fn(),
  replyToCommentApi: vi.fn(),
  forwardPostApi: vi.fn(),
}));

const getState = () => ({ auth: { accessToken: "token-1" } });

describe("postThunk", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("reactToPost passes emoji and token to API", async () => {
    reactToPostApi.mockResolvedValue({ data: { ok: true } });
    const dispatch = vi.fn();

    const action = await reactToPost({
      channelId: "channel-1",
      postId: "post-1",
      emoji: "👍",
    })(dispatch, getState, undefined);

    expect(reactToPostApi).toHaveBeenCalledWith(
      "channel-1",
      "post-1",
      { emoji: "👍" },
      "token-1",
    );
    expect(action.type).toBe("reactToPost/fulfilled");
  });

  it("addCommentToPost trims text before API call", async () => {
    addCommentApi.mockResolvedValue({ ok: true });
    const dispatch = vi.fn();

    const action = await addCommentToPost({
      channelId: "channel-1",
      postId: "post-1",
      text: "  hello  ",
    })(dispatch, getState, undefined);

    expect(addCommentApi).toHaveBeenCalledWith(
      "channel-1",
      "post-1",
      { text: "hello" },
      "token-1",
    );
    expect(action.type).toBe("post/addCommentToPost/fulfilled");
  });

  it("replyToPostComment trims text before API call", async () => {
    replyToCommentApi.mockResolvedValue({ ok: true });
    const dispatch = vi.fn();

    const action = await replyToPostComment({
      channelId: "channel-1",
      postId: "post-1",
      commentId: "comment-1",
      text: "  reply here  ",
    })(dispatch, getState, undefined);

    expect(replyToCommentApi).toHaveBeenCalledWith(
      "channel-1",
      "post-1",
      "comment-1",
      { text: "reply here" },
      "token-1",
    );
    expect(action.type).toBe("post/replyToPostComment/fulfilled");
  });

  it("forwardPost sends destination payload", async () => {
    forwardPostApi.mockResolvedValue({ data: { forwarded: true } });
    const dispatch = vi.fn();

    const action = await forwardPost({
      channelId: "channel-1",
      postId: "post-1",
      destination: { type: "channel", id: "target-1" },
    })(dispatch, getState, undefined);

    expect(forwardPostApi).toHaveBeenCalledWith(
      "channel-1",
      "post-1",
      { type: "channel", id: "target-1" },
      "token-1",
    );
    expect(action.type).toBe("forwardPost/fulfilled");
  });

  it("reactToPost rejects when required args are missing", async () => {
    const dispatch = vi.fn();

    const action = await reactToPost({
      channelId: "channel-1",
      postId: "post-1",
      emoji: "",
    })(dispatch, getState, undefined);

    expect(action.type).toBe("reactToPost/rejected");
    expect(action.payload).toEqual(
      expect.objectContaining({
        message: "channelId, postId and emoji are required",
      }),
    );
  });
});
