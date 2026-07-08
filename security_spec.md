# Security Specification for Nakamal Admin Ecosystem

## Data Invariants
1. A user can only read and write their own profile in `/users/{userId}`.
2. Only admins can see all users (though our blueprint doesn't strictly define admin access yet, we should prepare for it).
3. A user can only access chats where they are a participant.
4. Messages can only be sent to a chat if the sender is a participant of that chat.
5. `createdAt` and `senderId` are immutable.

## The "Dirty Dozen" Payloads (Designed to Fail)
1. **Identity Spoofing**: Attempt to create a user profile with a different UID.
2. **Ghost Fields**: Adding `isAdmin: true` to a user profile update.
3. **Orphaned Message**: Sending a message to a chat the user is not in.
4. **ID Poisoning**: Using a 1MB string as a chatId.
5. **Timestamp Fraud**: Setting `createdAt` to a future date instead of `request.time`.
6. **Privilege Escalation**: Updating `role` from "user" to "admin".
7. **Unauthorized List Query**: Listing all chats without filtering by participant identity.
8. **Malicious Array Injection**: Adding 1000 participants to a Chat.
9. **State Shortcut**: Attempting to set `approved: true` by a non-admin.
10. **Shadow Update**: Updating a field that shouldn't exist in the schema.
11. **PII Leak**: Non-owner trying to read a user's private info (if any).
12. **Type Poisoning**: Sending a string for a field that should be a boolean.

## Test Runner Plan
We will use the `emulator` if available, but for now we focus on the rules.
