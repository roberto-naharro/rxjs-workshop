/**
 * Exercise: IoT
 * 
 * To run the examples, run `yarn launch exercise/iot`
 */
import {
  Observable,
  defer,
  BehaviorSubject,
  of,
  merge,
  combineLatest,
  race,
  from,
} from "rxjs";
import {
  tap,
  filter,
  delay,
  repeat,
  distinctUntilChanged,
  map,
  ignoreElements,
  startWith,
  take,
  switchMap,
  endWith,
} from "rxjs/operators";

import {
  IoTSignal,
  IoTLightSwitchStateSignal,
  isLightSignal,
  isMotionSignal,
  IoTMotionSignal,
  IoTAdjustTempSignal,
  isAdjustTempSignal,
} from "./types";
import { createIoTStream, signalToString } from "./helpers";
import { rooms } from "./constants";

/**
 * Main stream
 */
const signals$: Observable<IoTSignal> = createIoTStream();

/**
 * When motion is detected in the living room, and the ambient light is below
 * 50, turn on the light for 5 seconds.
 */
export const turnOnAndOffLightInLivingRoom$ = (
  sourceStream$: Observable<IoTSignal>
) =>
  defer(() => {
    const createCurrentLightStateSignal = (lightSwitchState: boolean) => {
      return {
        location: "living room",
        timestamp: new Date().getTime(),
        type: "lightSwitchState",
        data: {
          lightSwitchState,
        },
      } as IoTLightSwitchStateSignal;
    };

    const timeWithLightOn = 5 * 1000;
    const ambientLightThreshold = 50;

    // Subject to keep track of the current light state and to return
    const lightSwitchState$ = new BehaviorSubject<IoTLightSwitchStateSignal>(
      createCurrentLightStateSignal(false)
    );

    // get ambient light signals from living room
    const ambientLight$ = sourceStream$.pipe(
      filter(isLightSignal),
      filter((signal) => signal.location === "living room")
    );

    const getCurrentFalseMotionSignal = () => {
      return {
        type: "motion",
        location: "living room",
        timestamp: new Date().getTime(),
        data: {
          motion: false,
        },
      } as IoTMotionSignal;
    };

    const motion$ = race(
      // get motion signals from living room
      sourceStream$.pipe(
        filter(isMotionSignal),
        filter((signal) => signal.location === "living room"),
        take(1)
      ),
      // if there is no motion signal in the required seconds, emit a motion signal with motion: false
      defer(() => {
        return of(getCurrentFalseMotionSignal());
      }).pipe(delay(timeWithLightOn))
    ).pipe(
      repeat(),
      startWith(getCurrentFalseMotionSignal())
      // tap((signal) => console.log(signalToString("[33m")(signal)))
    );

    return merge(
      lightSwitchState$.pipe(
        distinctUntilChanged(
          (prev, curr) =>
            prev.data.lightSwitchState === curr.data.lightSwitchState
        )
      ),
      combineLatest([ambientLight$, motion$]).pipe(
        tap(([ambientLightSignal, motionSignal]) => {
          const currentLightState =
            lightSwitchState$.value.data.lightSwitchState;
          const ambientLight = ambientLightSignal.data.ambientLight;
          const motion = motionSignal.data.motion;

          // If the ambient light is more than the threshold, turn off the light
          if (currentLightState && ambientLight > ambientLightThreshold) {
            lightSwitchState$.next(createCurrentLightStateSignal(false));
            return;
          }

          // If the ambient light is less than the threshold
          if (ambientLight < ambientLightThreshold) {
            // it there is motion, turn on the light. If there is no motion, turn off the light
            lightSwitchState$.next(createCurrentLightStateSignal(motion));
          }
        }),
        ignoreElements()
      )
    );
  });

/**
 * When nobody is at home, lower the temperature to 15 degrees. If somebody
 * changes the temperature manually, the timeout is reset.
 */
export const lowerTemperatureWhenNobodyAtHome$ = (
  sourceStream$: Observable<IoTSignal>
) =>
  defer(() => {
    // signals to lower the temperature
    const createTemperatureSignals = () => {
      return rooms.map((room) => {
        return {
          location: room,
          timestamp: new Date().getTime(),
          type: "adjustTemperature",
          data: {
            adjustTemperature: 15,
            auto: true,
          },
        } as IoTAdjustTempSignal;
      });
    };

    // to test, we check for motion in all house for only 5 seconds. Normally,
    // we would check for motion in all rooms for 30 minutes
    const noMotionThreshold = 5 * 1000;

    /**
     * emit a `undefined`value if the temperature is manually turned on
     */
    let hasReceivedManualTurnedOnSignal$ = sourceStream$.pipe(
      filter((signal) => isAdjustTempSignal(signal)),
      filter((signal) => signal.data.auto !== true),
      take(1),
      ignoreElements(),
      endWith(true)
    );

    /**
     * if there is motion in any room, emit a `undefined` value
     *  */
    const hasReceivedMotionSignal$ = sourceStream$.pipe(
      filter(isMotionSignal),
      take(1),
      ignoreElements(),
      endWith(true)
    );

    /**
     * passed the timeout, emit the lower temperature signals
     */
    const hasPassedTheTimeout$ = defer(() => {
      return of("timeout");
    }).pipe(delay(noMotionThreshold));

    return merge(
      // the first signal coming from any of the following observables will be
      // used to know when to send the temperature signals
      race(
        hasReceivedMotionSignal$,
        hasReceivedManualTurnedOnSignal$,
        hasPassedTheTimeout$,
      ).pipe(
        repeat(),
        distinctUntilChanged(),
        filter((result) => result === "timeout"),
        switchMap(() => from(createTemperatureSignals()))
      )
    ) as Observable<IoTAdjustTempSignal>;
  });

merge(
  signals$.pipe(map(signalToString())),
  turnOnAndOffLightInLivingRoom$(signals$).pipe(map(signalToString("[33m"))),
  lowerTemperatureWhenNobodyAtHome$(signals$).pipe(map(signalToString("[35m")))
).subscribe({
  next: console.log,
  complete: () => console.log("Complete"),
  error: (err) => console.error(err),
});
