'use client';

import { useEffect } from 'react';
import { trackAppStartup } from './telemetry';

export default function TelemetryTracker() {
  useEffect(() => {
    void trackAppStartup();
  }, []);

  return null;
}
