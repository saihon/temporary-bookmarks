NAME := temporary-bookmarks
XPI := $(NAME).xpi
SOURCE := css icons js index.html manifest.json

.PHONY: test build clean

build:
	zip -r $(XPI) $(SOURCE)

clean:
	$(RM) $(XPI)

test:
	node js/define.js test
