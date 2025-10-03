# Initial Requirements Doc

NOTE: This is not a formal requirements doc. It is just a dictated/written description of my requirements.

I have a notes section of my personal website where I publish short notes. Sometimes these are just thoughts, but many times they are comments on an article, video or other piece of content. These notes are markdown or MDX files in an Astro site. To create a note about a thing on the web I currently have to open Cursor, create a new note (using a command line tool) and paste the sourceURL/title etc into the frontmatter. I then keep cursor open as I read and copy over anything I want to quote as blockquotes while adding my own thoughts. This is very high-friction while browsing the web.

I want to build a simple Chrome extension. Which allows me to Click the extension button and have a sidebar open in Chrome Storing the URL as well as the page's title, image original URL, etc. The sidebar will contain a Markdown editor where I can type my own thoughts on the page. If I highlight some text on the page And click a button I want that text to be added into the bottom of the markdown as a block quote. Then allowing me to comment on that block quote underneath it.

When I'm done with a page, I want a new DRAFT note file created in my personal astro website with all the front matter set correctly and with all of the markdown if any also included in there. I am okay if this is done locally on my machine, but it could conceivably also be done remotely via web calls etc (though this would likeley complicate things).

The manual workflow which I want looks something like this:

1. Find a page I want to share as a Note on my website.
2. Click the extension and add my initial thoughts.
3. (Optionally) add some highlights from the page as blockquotes with my thoughts.
4. Hit save it and continue browsing the web.

Later...

1. Open Cursor and see all the draft notes I've created.
2. Manually edit etc (end perhaps delete some)
3. Manually publish the site via git push to https://github.com/dannysmith/dannyis-astro as I would any other change to my site.

## Additional Constraints & information

- Only I will use this extension
- Only for notes which are about something else on the internet (and therefore have a sourceURL).
- Should be as simple and robust as possible. The less code & complexity the better. I do not want an additional maintenance burden for this tool.
- Zero (or near-zero) cost in money.
- My personal website is at https://danny.is and is a statically-generated Astro site deployed to Vercel. The code is at https://github.com/dannysmith/dannyis-astro
- The published notes are at https://danny.is/notes
- I currently manually create notes using npm run newnote which runs this script locally: https://raw.githubusercontent.com/dannysmith/dannyis-astro/refs/heads/main/scripts/create-note.ts

## Example Notes

Note on a Youtube Video:
Raw MD/MDX: https://raw.githubusercontent.com/dannysmith/dannyis-astro/refs/heads/main/src/content/notes/1700733150901-apples-thunderbolt-3-cables.md
Published Note: https://danny.is/notes/apples-thunderbolt-3-cables/
Note on Article with quote:
Raw MD/MDX: https://raw.githubusercontent.com/dannysmith/dannyis-astro/refs/heads/main/src/content/notes/2025-07-08-the-rise-of-the-ai-native-employee.md
Published Note: https://danny.is/notes/the-rise-of-the-ai-native-employee/
