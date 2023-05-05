import { Observable, from, pipe } from "rxjs";
import { distinctUntilChanged, filter, map, switchMap } from "rxjs/operators";

interface Message {
  userName: string;
  message: string;
  timestamp: number;
}

const printMessage = (message: Message) =>
  `${message.userName} - ${message.message} (${message.timestamp})`;

const notifyUser = async (message: Message) => {
  await Promise.resolve();
  console.log(`\x1b[33mAPI called - ${message.timestamp}\x1b[0m`);
};

//------------------------------------------------
const filterPipe = pipe(
  filter<Message>(
    (event) => event.message.includes("!") && event.message.length > 30
  ),
  distinctUntilChanged(
    (previous, current) => previous.timestamp === current.timestamp
  )
);

export function filterMessagesSolution(
  messages$: Observable<Message>
): Observable<string> {
  return messages$.pipe(
    filterPipe,
    map((event) => printMessage(event))
  );
}

export function filterMessagesSolutionBonus(
  messages$: Observable<Message>
): Observable<string> {
  return messages$.pipe(
    filterPipe,
    switchMap((event) => {
      const formattedMessage = printMessage(event);
      return from(notifyUser(event)).pipe(map(() => formattedMessage));
    })
  );
}

//------------------------------------------------