.PHONY: backend web android check preview preview-android frontend-check

ANDROID_SDK ?= $(HOME)/Library/Android/sdk

backend:
	.venv/bin/python manage.py runserver 127.0.0.1:8000

web:
	cd userApp-React-Native && PATH="$(CURDIR)/.local/node/node_modules/.bin:$$PATH" CI=1 npm run web

android:
	"$(ANDROID_SDK)/platform-tools/adb" -e reverse tcp:8000 tcp:8000
	cd userApp-React-Native && PATH="$(CURDIR)/.local/node/node_modules/.bin:$(ANDROID_SDK)/platform-tools:$$PATH" ANDROID_HOME="$(ANDROID_SDK)" VIRTUALQ_API_URL=http://127.0.0.1:8000 CI=1 npm run android -- --localhost --port 19001

check:
	.venv/bin/python manage.py check
	.venv/bin/python manage.py makemigrations --check --dry-run
	.venv/bin/python manage.py test

# Modern visitor app. Legacy web/android targets remain until migration parity.
preview:
	cd frontend && PATH="$(CURDIR)/.local/node/node_modules/.bin:$$PATH" CI=1 npm start -- --web --port 8081 --clear

preview-android:
	"$(ANDROID_SDK)/platform-tools/adb" -e reverse tcp:8000 tcp:8000
	cd frontend && PATH="$(CURDIR)/.local/node/node_modules/.bin:$(ANDROID_SDK)/platform-tools:$$PATH" ANDROID_HOME="$(ANDROID_SDK)" EXPO_PUBLIC_API_URL=http://127.0.0.1:8000 CI=1 npm start -- --android --localhost --port 8081 --clear

frontend-check:
	cd frontend && PATH="$(CURDIR)/.local/node/node_modules/.bin:$$PATH" npm run typecheck
	cd frontend && PATH="$(CURDIR)/.local/node/node_modules/.bin:$$PATH" npm test
	cd frontend && PATH="$(CURDIR)/.local/node/node_modules/.bin:$$PATH" npm run lint
	cd frontend && PATH="$(CURDIR)/.local/node/node_modules/.bin:$$PATH" CI=1 npm run build:web
