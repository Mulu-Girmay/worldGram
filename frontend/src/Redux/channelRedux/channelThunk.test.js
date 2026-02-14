import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  subscribeChannel,
  unsubscribeChannel,
  addAdmin,
  removeAdmin,
} from "./channelThunk";
import {
  subscribeChannelApi,
  unsubscribeChannelApi,
  addAdminApi,
  removeAdminApi,
} from "../../api/channelApi";

vi.mock("../../api/channelApi", () => ({
  subscribeChannelApi: vi.fn(),
  unsubscribeChannelApi: vi.fn(),
  addAdminApi: vi.fn(),
  removeAdminApi: vi.fn(),
}));

const getState = () => ({ auth: { accessToken: "token-1" } });

describe("channelThunk", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("subscribeChannel calls API with channel id and token", async () => {
    subscribeChannelApi.mockResolvedValue({ message: "ok" });
    const dispatch = vi.fn();

    const action = await subscribeChannel("channel-1")(dispatch, getState, undefined);

    expect(subscribeChannelApi).toHaveBeenCalledWith("channel-1", "token-1");
    expect(action.type).toBe("subscribeChannel/fulfilled");
  });

  it("unsubscribeChannel calls API with channel id and token", async () => {
    unsubscribeChannelApi.mockResolvedValue({ message: "ok" });
    const dispatch = vi.fn();

    const action = await unsubscribeChannel("channel-1")(dispatch, getState, undefined);

    expect(unsubscribeChannelApi).toHaveBeenCalledWith("channel-1", "token-1");
    expect(action.type).toBe("unsubscribeChannel/fulfilled");
  });

  it("addAdmin trims username before API call", async () => {
    addAdminApi.mockResolvedValue({ message: "ok" });
    const dispatch = vi.fn();

    const action = await addAdmin({
      id: "channel-1",
      payload: { newAdminUsername: "  alice  " },
    })(dispatch, getState, undefined);

    expect(addAdminApi).toHaveBeenCalledWith(
      "channel-1",
      { newAdminUsername: "alice" },
      "token-1",
    );
    expect(action.type).toBe("addAdmin/fulfilled");
  });

  it("removeAdmin trims username before API call", async () => {
    removeAdminApi.mockResolvedValue({ message: "ok" });
    const dispatch = vi.fn();

    const action = await removeAdmin({
      id: "channel-1",
      payload: { adminUsername: "  bob  " },
    })(dispatch, getState, undefined);

    expect(removeAdminApi).toHaveBeenCalledWith(
      "channel-1",
      { adminUsername: "bob" },
      "token-1",
    );
    expect(action.type).toBe("removeAdmin/fulfilled");
  });

  it("subscribeChannel rejects when id is missing", async () => {
    const dispatch = vi.fn();

    const action = await subscribeChannel("")(dispatch, getState, undefined);

    expect(action.type).toBe("subscribeChannel/rejected");
    expect(action.payload).toEqual(
      expect.objectContaining({ message: "channel id is required" }),
    );
  });
});
