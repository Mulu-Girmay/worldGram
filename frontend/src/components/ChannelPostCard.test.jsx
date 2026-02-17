import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import ChannelPostCard from "./ChannelPostCard";
import Reaction from "./Reaction";
import { ToastProvider } from "./ToastProvider";

vi.mock("react-redux", async () => {
  const actual = await vi.importActual("react-redux");
  return {
    ...actual,
    useSelector: (selector) =>
      selector({
        auth: {
          user: { _id: "user-1" },
        },
      }),
  };
});

function renderWithToast(ui) {
  return render(<ToastProvider>{ui}</ToastProvider>);
}

describe("Reaction", () => {
  it("supports keyboard selection with real button options", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();

    renderWithToast(<Reaction onSelect={onSelect} />);

    const trigger = screen.getByRole("button", { name: /[+➕]/ });
    await user.click(trigger);

    const listbox = screen.getByRole("listbox", { name: /select reaction/i });
    listbox.focus();
    await user.keyboard("{ArrowRight}{Enter}");

    expect(onSelect).toHaveBeenCalledTimes(1);
  });
});

describe("ChannelPostCard", () => {
  const basePost = {
    _id: "post-1",
    text: "hello world",
    viewedBy: [],
    reactions: [],
    comments: [
      {
        _id: "comment-1",
        text: "existing comment",
        authorId: "user-2",
        replies: [],
      },
    ],
  };

  it("calls onReact with post and emoji selection", async () => {
    const user = userEvent.setup();
    const onReact = vi.fn().mockResolvedValue({});

    renderWithToast(
      <ChannelPostCard post={basePost} channel={{}} onReact={onReact} />,
    );

    await user.click(screen.getByTitle("React"));
    await user.click(screen.getByLabelText("React with 👍"));

    await waitFor(() => {
      expect(onReact).toHaveBeenCalledWith(
        expect.objectContaining({ _id: "post-1" }),
        "👍",
      );
    });
  });

  it("submits a comment through callback", async () => {
    const user = userEvent.setup();
    const onAddComment = vi.fn().mockResolvedValue({});

    renderWithToast(
      <ChannelPostCard
        post={basePost}
        channel={{}}
        onAddComment={onAddComment}
      />,
    );

    await user.type(screen.getByPlaceholderText("Write a comment"), "new comment");
    await user.click(screen.getByRole("button", { name: "Post" }));

    await waitFor(() => {
      expect(onAddComment).toHaveBeenCalledWith(
        expect.objectContaining({ _id: "post-1" }),
        "new comment",
      );
    });
  });

  it("submits a reply through callback when comments are open", async () => {
    const user = userEvent.setup();
    const onReply = vi.fn().mockResolvedValue({});

    renderWithToast(<ChannelPostCard post={basePost} channel={{}} onReply={onReply} />);

    await user.click(screen.getByText(/read comments/i));
    await user.click(screen.getByRole("button", { name: "Reply" }));
    await user.type(screen.getByPlaceholderText("Write reply"), "reply text");
    await user.click(screen.getByRole("button", { name: "Send" }));

    await waitFor(() => {
      expect(onReply).toHaveBeenCalledWith(
        expect.objectContaining({ _id: "post-1" }),
        "comment-1",
        "reply text",
      );
    });
  });
});
