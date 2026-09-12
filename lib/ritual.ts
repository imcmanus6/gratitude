import type { Circle } from "./types";
const weekdays = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
export function ritualDue(circle: Circle, date = new Date()): string | null {
  if (circle.muted || circle.cadence === "none") return null;
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: circle.timezone,
    weekday: "long",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const part = (type: string) =>
    parts.find((p) => p.type === type)?.value || "";
  if (circle.cadence === "weekly" && part("weekday") !== circle.day)
    return null;
  if (`${part("hour")}:${part("minute")}` !== circle.time) return null;
  return `${circle.id}-${part("year")}-${part("month")}-${part("day")}-${circle.time}`;
}
export function calendarEvent(circle: Circle, date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: circle.timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const part = (type: string) =>
    parts.find((p) => p.type === type)?.value || "";
  const local = new Date(
    Date.UTC(
      Number(part("year")),
      Number(part("month")) - 1,
      Number(part("day")),
    ),
  );
  if (circle.cadence === "weekly") {
    const target = weekdays.indexOf(circle.day);
    let delta = (target - local.getUTCDay() + 7) % 7;
    if (delta === 0 && `${part("hour")}:${part("minute")}` >= circle.time)
      delta = 7;
    local.setUTCDate(local.getUTCDate() + delta);
  } else if (`${part("hour")}:${part("minute")}` >= circle.time)
    local.setUTCDate(local.getUTCDate() + 1);
  const stamp = local.toISOString().slice(0, 10).replace(/-/g, "");
  const escape = (s: string) =>
    s
      .replace(/\\/g, "\\\\")
      .replace(/\n/g, "\\n")
      .replace(/,/g, "\\,")
      .replace(/;/g, "\\;");
  const day = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"][
    weekdays.indexOf(circle.day)
  ];
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//NAI//Gratitude Circles//EN",
    "BEGIN:VEVENT",
    `UID:${circle.id}@gratitude.nai`,
    `DTSTAMP:${date
      .toISOString()
      .replace(/[-:]/g, "")
      .replace(/\.\d{3}/, "")}`,
    `DTSTART;TZID=${circle.timezone}:${stamp}T${circle.time.replace(":", "")}00`,
    `SUMMARY:${escape(circle.name)} — gratitude ritual`,
    `DESCRIPTION:${escape(circle.prompt)}`,
    `RRULE:FREQ=${circle.cadence === "daily" ? "DAILY" : `WEEKLY;BYDAY=${day}`}`,
    "BEGIN:VALARM",
    "TRIGGER:PT0M",
    "ACTION:DISPLAY",
    `DESCRIPTION:${escape(circle.prompt)}`,
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}
