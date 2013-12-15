
test:
	@./node_modules/.bin/mocha \
		--require should \
		--reporter spec \
		--timeout 10000

.PHONY: test