.PHONY: build
build:
	mkdir -p /Users/zachshilton/code/calendar-from-text-file/output
	node ~/code/calendar-from-text-file/scripts/markdown-to-ics.mjs /Users/zachshilton/Library/CloudStorage/Dropbox/Obsidian/zchsh/Calendar/Calendar.md /Users/zachshilton/code/calendar-from-text-file/output/test.ics