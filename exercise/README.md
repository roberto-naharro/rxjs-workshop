# Exercise

You are building a real-time chat application that receives messages from multiple users. Each message is represented as an object with the following format:

```typescript
{
  userName: string;
  message: string;
  timestamp: number; // Unix timestamp in milliseconds
}
```

Your task is to implement a function `filterMessages` that takes an observable of messages and returns an observable of filtered messages. The filtered messages should meet the following criteria:

- The message length is greater than 30 characters.
- The message contains at least one exclamation mark ('!').
- The result should be in a specific format (calling the `printMessage` function).
- It should remove duplicate messages (messages with the same timestamp).

The function should take the following parameter:

- `messages$: Observable<Message>`: An observable of messages.

The function should emit filtered messages as they arrive.

## Bonus track

- when a message is filtered, you should send a notification to the user that sent the message (calling the `notifyUser` function).
