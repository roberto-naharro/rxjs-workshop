import { inspect } from "util";
import { Observable, concat, defer, merge, of, range } from "rxjs";
import {
  concatMap,
  delay,
  filter,
  groupBy,
  ignoreElements,
  map,
  mergeMap,
  pairwise,
  repeat,
  share,
  switchMap,
} from "rxjs/operators";
import { faker } from "@faker-js/faker";

import { rooms } from "./constants";
import {
  IoTSignal,
  IoTLightSignal,
  IoTTempSignal,
  IoTMotionSignal,
} from "./types";

export const getRoom = () => {
  return faker.helpers.arrayElement(rooms);
};

export const createRandomSignal = <T extends IoTSignal>(
  type: T["type"],
  data: T["data"],
  location?: () => string
): T => {
  return {
    type,
    location: location ? location() : getRoom(),
    timestamp: new Date().getTime(),
    data,
  } as T;
};

export const createIoTSingleDeviceStream = <T extends IoTSignal>(
  type: T["type"],
  data: () => T["data"],
  interval?: () => number
) =>
  defer(() => {
    const signals = faker.helpers
      .arrayElements(rooms)
      .map((room) => createRandomSignal(type, data(), () => room));

    const randomDelay = interval
      ? interval()
      : faker.number.int({ min: 100, max: 1000 });

    return concat(
      of(...signals).pipe(delay(faker.number.int({ min: 10, max: 200 }))),
      of(undefined).pipe(delay(randomDelay), ignoreElements())
    );
  }).pipe(repeat());

export const signalToString =
  (color: string = "[90m") =>
  (signal: IoTSignal) =>
    `\x1b${color}${inspect(signal, {
      compact: true,
      breakLength: Infinity,
      colors: false,
    })}\x1b[0m`;

export const createIoTStream = () => {
  const light$: Observable<IoTLightSignal> = concat(
    // start with a light signal with ambient light of 0 to 100
    range(0, 100),
    // then go from 100 to 0
    range(0, 100).pipe(map((value) => 100 - value))
  ).pipe(
    concatMap((value) => {
      const randomDelay = faker.number.int({ min: 200, max: 500 });

      // delay the signal by a random amount of time
      return of(value).pipe(delay(randomDelay));
    }),
    // emit ambient light signal for random rooms
    concatMap((value) => {
      const randomRooms = faker.helpers.arrayElements(rooms);

      return of(...randomRooms).pipe(
        map((room) => {
          return createRandomSignal<IoTLightSignal>(
            "light",
            {
              ambientLight: value,
            },
            () => room
          );
        })
      );
    }),
    repeat()
  );

  const temp$ = createIoTSingleDeviceStream<IoTTempSignal>(
    "temperature",
    () => {
      return {
        temperature: faker.number.float({ min: 10, max: 40, precision: 0.1 }),
      };
    }
  ).pipe(
    groupBy((signal) => signal.location),
    // join all signals back together
    mergeMap((signal) =>
      signal.pipe(
        pairwise(),
        // filter out signals that are too far apart
        filter(([prev, curr]) => {
          const diff = Math.abs(prev.data.temperature - curr.data.temperature);
          return diff < 5 || diff > 1;
        }),
        map(([prev, curr]) => curr)
      )
    )
  );

  const motion$: Observable<IoTMotionSignal> = createIoTSingleDeviceStream(
    "motion",
    () => {
      return {
        motion: true,
      };
    },
    () => {
      return faker.number.int({ min: 100, max: 7000 });
    }
  );

  return merge(light$, temp$, motion$).pipe(share());
};
