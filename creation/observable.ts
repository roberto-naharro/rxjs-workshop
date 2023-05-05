import { Observable } from "rxjs";
import { faker } from "@faker-js/faker";

// Observable variable names should end with $
export const number$ = new Observable<number>((subscriber) => {
  let i: number = 1;
  let wait = faker.datatype.number({ min: 10, max: 300 });

  const interval = setInterval(() => {
    if (wait > 200) {
      // Error the observable after 200ms
      // an error finishes the observable too
      subscriber.error("Error!");
    }

    // Emit a value every wait ms
    subscriber.next(i++);

    if (i > 5) {
      interval && clearInterval(interval);
      // Complete the observable after 10 values
      subscriber.complete();
    }
  }, wait);
});
