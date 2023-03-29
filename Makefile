NAME := temporary-bookmarks
XPI := $(NAME).xpi
SOURCE := css icons js index.html manifest.json

.PHONY: run build clean

build:
	zip -r $(XPI) $(SOURCE)

clean:
	$(RM) $(XPI)

# Install "web-ext" globally!
# snap firefox will not start and will start directly with path /snap/firefox/current/usr/lib/firefox/firefox
run:
	@web-ext run -s ./ \
		--firefox=/snap/firefox/current/usr/lib/firefox/firefox \
		-u 'about:debugging#/runtime/this-firefox'
