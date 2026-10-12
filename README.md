# Daily Task Tracker

A simple tracker for daily tasks and habits that runs entirely in the browser. No account, no server, no build step.

## Features

**Tasks**
- Add tasks for any day and allocate hours and minutes to each
- Tick tasks off as you complete them
- Daily and weekly completion percentages, measured by tasks completed or by time completed

**Habits**
- Pick from 20 preset habits (drink water, exercise, meditate, and more) or add your own with a custom icon
- Habits repeat every day; tick each one off with a single click
- Optional daily reminder time per habit, delivered as a system notification

**Everything else**
- Week view with a percentage for each day, and navigation between weeks
- Bar chart and donut chart of completion for the week
- Live clock, with a clear warning whenever you are viewing a day other than today
- Light and dark mode
- Export and import of all data as a JSON backup file

## Running it

Open `index.html` in a browser. That's all.

To serve it locally instead (recommended if you want reminders, since some browsers only allow notifications on served pages):

```bash
python3 -m http.server 5173
```

Then visit `http://localhost:5173`.

## Deploying

The project is plain static files, so it can be hosted anywhere. On [Vercel](https://vercel.com), import the repository and deploy with the default settings: no framework, no build command, no output directory.

## Project structure

```
├── index.html        Page structure
├── css/
│   └── styles.css    Styling, including the light and dark themes
└── js/
    └── app.js        Tracker logic
```

There are no dependencies. The charts are drawn with plain HTML, CSS and SVG.

## Your data

Everything is saved in your browser's local storage, on your device. Nothing is sent anywhere.

This means:
- Data stays put when you close the tab or the browser.
- Each browser and each device has its own separate tracker; nothing syncs between them.
- Clearing the site's browsing data erases the tracker, and private windows don't keep it.

Use **Export** in the Backup section to save a copy, and **Import** to restore it or move it to another device. Importing replaces whatever is in the tracker at the time.

## Reminders

Set a time next to a habit and allow notifications when the browser asks. A reminder fires once a day at that time unless the habit is already ticked.

Reminders only fire while the tracker is open in a browser tab (a background tab is fine). They are intended for desktop browsers; phones generally won't show them.
