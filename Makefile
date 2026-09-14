.PHONY: backend web android check

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
