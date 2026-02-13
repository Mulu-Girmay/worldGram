# Message Context Menu - Usage Examples

## Overview
The MessageContextMenu component provides Telegram-like message options for channels, groups, and private chats.

## Features
- ✅ Reply to messages
- ✅ Copy text
- ✅ Forward messages
- ✅ Pin messages (admin only)
- ✅ Share messages
- ✅ Edit messages (owner only)
- ✅ Delete messages (owner/admin only)

## Components Created

### 1. MessageContextMenu.jsx
The main modal component with all message actions.

### 2. ChatMessage.jsx
Example chat message component with integrated context menu.

### 3. ChannelPostCard.jsx (Updated)
Updated to include the context menu with three-dot button.

## Usage Examples

### For Channel Posts
```jsx
import ChannelPostCard from "./components/ChannelPostCard";

<ChannelPostCard 
  post={postData} 
  isOwner={true} 
/>
```

### For Private/Group Chats
```jsx
import ChatMessage from "./components/ChatMessage";

<ChatMessage 
  message={messageData} 
  isOwn={true} 
  isGroupAdmin={false} 
/>
```

### Custom Implementation
```jsx
import MessageContextMenu from "./components/MessageContextMenu";
import { useState } from "react";

function MyComponent() {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <>
      <button onClick={() => setShowMenu(true)}>
        Show Options
      </button>

      <MessageContextMenu
        isOpen={showMenu}
        onClose={() => setShowMenu(false)}
        message={yourMessage}
        onEdit={() => console.log("Edit")}
        onDelete={() => console.log("Delete")}
        onForward={() => console.log("Forward")}
        onPin={() => console.log("Pin")}
        onCopy={() => navigator.clipboard.writeText(yourMessage.text)}
        onReply={() => console.log("Reply")}
        onShare={() => console.log("Share")}
        canEdit={true}
        canDelete={true}
        canPin={true}
      />
    </>
  );
}
```

## Props

### MessageContextMenu Props
| Prop | Type | Required | Description |
|------|------|----------|-------------|
| isOpen | boolean | Yes | Controls modal visibility |
| onClose | function | Yes | Called when modal closes |
| message | object | Yes | The message object |
| onEdit | function | Yes | Edit handler |
| onDelete | function | Yes | Delete handler |
| onForward | function | Yes | Forward handler |
| onPin | function | Yes | Pin handler |
| onCopy | function | Yes | Copy handler |
| onReply | function | Yes | Reply handler |
| onShare | function | Yes | Share handler |
| canEdit | boolean | No | Show edit option (default: false) |
| canDelete | boolean | No | Show delete option (default: false) |
| canPin | boolean | No | Show pin option (default: false) |

## Integration with Redux

To connect with your Redux actions:

```jsx
import { useDispatch } from "react-redux";
import { deletePost, editPost, pinPost } from "../Redux/postRedux/postThunk";

const MyComponent = () => {
  const dispatch = useDispatch();

  const handleDelete = () => {
    dispatch(deletePost({ channelId, postId }));
  };

  const handleEdit = () => {
    // Show edit form or modal
  };

  const handlePin = () => {
    dispatch(pinPost({ channelId, postId }));
  };

  // ... rest of component
};
```

## Styling
The component uses Tailwind CSS. Colors match your app's theme:
- Primary green: `#6fa63a`
- Background: `#f3f9ee`
- Borders: `#6fa63a/25`

## Notes
- The menu automatically closes after any action
- Copy function uses the Clipboard API
- All handlers are customizable
- Permissions (canEdit, canDelete, canPin) control which options appear
