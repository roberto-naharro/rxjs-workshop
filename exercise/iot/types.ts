export interface IoTSignal {
  location: string;
  timestamp: number;
  type: string;
  data: Record<string, unknown>;
}

export interface IoTLightSignal extends IoTSignal {
  type: "light";
  data: {
    ambientLight: number;
  };
}

export const isLightSignal = (signal: IoTSignal): signal is IoTLightSignal =>
  signal.type === "light";

export interface IoTTempSignal extends IoTSignal {
  type: "temperature";
  data: {
    temperature: number;
  };
}

export const isTempSignal = (signal: IoTSignal): signal is IoTTempSignal =>
  signal.type === "temperature";

export interface IoTMotionSignal extends IoTSignal {
  type: "motion";
  data: {
    motion: boolean;
  };
}

export const isMotionSignal = (signal: IoTSignal): signal is IoTMotionSignal =>
  signal.type === "motion";

export interface IoTLightSwitchStateSignal extends IoTSignal {
  type: "lightSwitchState";
  data: {
    lightSwitchState: boolean;
  };
}

export const isLightSwitchStateSignal = (
  signal: IoTSignal
): signal is IoTLightSwitchStateSignal =>
  signal.type === "lightSwitchState";

export interface IoTAdjustTempSignal extends IoTSignal {
  type: "adjustTemperature";
  data: {
    adjustTemperature: number;
    auto?: boolean;
  };
}

export const isAdjustTempSignal = (
  signal: IoTSignal
): signal is IoTAdjustTempSignal => signal.type === "adjustTemperature";
