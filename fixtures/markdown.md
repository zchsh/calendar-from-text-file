# Some markdown file

## Heading, this doesn't matter

Maybe second-level headings are years, and third-level headings are months, that feels like an intuitive way to organize things.

## 2024

## November

- 2024-11-01 - All-day event. This is an all-day event on November 1st. Everything before the first full stop should become the event title. Everything after the event title should become the event description.
- 2024-11-03 at 9:00 - Default duration event. When a start time is specified, but no end time, events should take on a default duration. One hour seems reasonable, it's one unit or whatever. Maybe default duration is configurable through an input option when running the script.
- 2024-11-04 to 10:00 - Default duration event. When a start time is specified, but no end time, events should take on a default duration. One hour seems reasonable, it's one unit or whatever. Maybe default duration is configurable through an input option when running the script.
- 2024-11-05 from 14:00 to 16:00 - Start and end event. Note that I like writing times in 24-hour format. 12 hour vs 24 hour is probably worth making a configurable option at some point too... but for now, I think I'll stick with 24 hour.

## December

- 2024-12-19 - December event. Note that the headings will be ignored completely. All the computer needs to look for is list items that start with `YYYY-MM-DD`. Headings and other decoration are for human use, our script can ignore them.
- 2024-12-21 to 2025-01-05 - Winter break. Multi-day event that should render across all the specified days.
