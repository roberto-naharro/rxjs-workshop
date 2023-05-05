import { Observable, of } from "rxjs";
import { shareReplay } from "rxjs/operators";
import { inspect } from "util";
import { faker } from "@faker-js/faker";
import { filterMessagesSolution, filterMessagesSolutionBonus } from "./solution";

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

function filterMessages(messages$: Observable<Message>): Observable<string> {
  // TODO: complete function
  return of("");
  // remove line above and replace with your solution
}

const addRandomExclamationInsideMessage = (message: string) => {
  if (faker.datatype.boolean()) return message;
  const out = message.split("");
  out.splice(faker.datatype.number({ min: 0, max: message.length }), 1, "!");

  return out.join("");
};

const messageEvent$ = new Observable<Message>((subscriber) => {
  let timeout: ReturnType<typeof setTimeout> | undefined;

  const randomTime = () => faker.datatype.number({ min: 500, max: 3000 });

  const stop = () => timeout && clearTimeout(timeout);

  const eventGenerator = () => ({
    userName: faker.internet.userName(),
    message: addRandomExclamationInsideMessage(faker.lorem.sentence()),
    timestamp: Date.now(),
  });

  const tick = () => {
    let time = randomTime();
    stop();

    timeout = setTimeout(() => {
      const event = eventGenerator();

      tick();
      subscriber.next(event);
      // Simulate duplicate event
      if (faker.datatype.boolean()) {
        subscriber.next(event);
      }
    }, time);
  };

  tick();
}).pipe(shareReplay());

const filteredMessages$ = filterMessages(messageEvent$);
// const filteredMessages$ = filterMessagesSolutionBonus(messageEvent$);

messageEvent$.subscribe((message) =>
  console.log(`\n\x1b[90m${inspect(message)}\x1b[0m`)
);
filteredMessages$.subscribe((message) =>
  console.log(`\x1b[36m${message}\x1b[0m`)
);
