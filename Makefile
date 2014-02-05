
test: node_modules
	@./node_modules/.bin/mocha \
		--require should \
		--reporter spec \
		--timeout 10s \
		--slow 5s

node_modules:
	@npm install

.PHONY: test
