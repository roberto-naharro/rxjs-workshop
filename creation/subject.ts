import { Subject } from "rxjs";

export const event$ = new Subject<string>();

// subscribe to the subject
event$.subscribe({
  next: value => console.log(value),
  complete: () => console.log("Complete!"),
  error: error => console.log(error),
});

// emit values to the subject
event$.next("Hello");
event$.next("World");
event$.next("!");
event$.complete();
