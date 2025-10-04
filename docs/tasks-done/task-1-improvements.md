# Task: Improvements

## 1. Fix Filename Generation

1. Currently new note filenames Prefixed with a Unix timestamp. I'd like them to instead be prefixed with ISO date eg 2025-01-01-the-name-here.md

2. Currently if the title of the source document is extremely long it will split that up and downcase it and put hyphens in it and everything. But I can end up with some extremely long names here. So we should limit the kind of number of words that can be included in a filename.

3. There's currently, as far as I know, Nothing to handle if we get duplicates. So if it tries to write a file called `2025-01-01-cool-thing.md` And that already exists. I assume it will just fail somehow. Instead what we should do is have it create `2025-01-01-cool-thing-1.md` and so on.

## 2. Make Title Editable

This title should be editable, although it should be pre-populated in the way it currently is.

## 3. Better Content Editor

1. When adding a highlight with the button, two blank lines should be inserted after it and the cursor should be placed there and the editor focussed.
2. When pasting a URL over a selected word in the editor, it should insert a markdown link as you'd expect.

## 4. Dark Mode

A suitable dark mode when the browser or operating system is in dark mode.

## 2. Configurable Path for Notes folder

Make the local path to the notes directory configurable in a settings pane, stored locally somehow.
