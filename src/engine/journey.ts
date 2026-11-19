export type JourneyStage = 'ready' | 'placed' | 'swallow' | 'stomach' | 'intestine' | 'liver' | 'tissue' | 'removal';

// The first five minutes are a deliberately slowed, illustrative prelude.
// The oral ODE starts when the intestinal absorption chapter opens.
export const preludeSeconds = 300;
export const playbackStops = [0, 4, 11, 18, 23, 38, 52] as const;
export const playbackEnd = playbackStops[6];
const stages = ['swallow', 'stomach', 'intestine', 'liver', 'tissue', 'removal'] as const;

export function biologicalStops(duration: number, peak: number | null) {
  const decline = peak ?? duration * .65;
  const liverStart = Math.min(.16, decline * .25);
  const tissueStart = Math.min(.48, decline * .55);
  return [0, 8, preludeSeconds, ...[liverStart, tissueStart, decline, duration].map(h => preludeSeconds + h * 3600)];
}

function intervalIndex(values: readonly number[], t: number) {
  const end = values.findIndex(v => v > t);
  return end < 0 ? values.length - 2 : Math.max(0, end - 1);
}

export function journeyAt(position: number, stops: number[]) {
  const clock = Math.max(0, Math.min(playbackEnd, position));
  const i = intervalIndex(playbackStops, clock);
  const progress = (clock - playbackStops[i]) / (playbackStops[i + 1] - playbackStops[i]);
  const elapsed = stops[i] + progress * (stops[i + 1] - stops[i]);
  const stage: JourneyStage = position <= -2 ? 'ready' : position < 0 ? 'placed' : stages[i];
  return { stage, progress, elapsed, modelHours: Math.max(0, (elapsed - preludeSeconds) / 3600) };
}

export function positionForModelTime(t: number, stops: number[]) {
  const seconds = Math.min(stops[stops.length - 1], preludeSeconds + Math.max(0, t) * 3600);
  const i = intervalIndex(stops, seconds);
  const fraction = (seconds - stops[i]) / (stops[i + 1] - stops[i]);
  return playbackStops[i] + fraction * (playbackStops[i + 1] - playbackStops[i]);
}

export function displayElapsed(seconds: number) {
  const s = Math.round(seconds);
  if (s < 60) return s + ' s';
  if (s < 3600) return Math.floor(s / 60) + ' min ' + String(s % 60).padStart(2, '0') + ' s';
  return Math.floor(s / 3600) + ' h ' + String(Math.floor(s % 3600 / 60)).padStart(2, '0') + ' min';
}
