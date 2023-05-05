import { number$ } from "./observable";

// subscribe to the value emitted by the observable
number$.subscribe({
  next: value => console.log(value),
  complete: () => console.log("Complete!"),
  error: error => console.log(error),
});
