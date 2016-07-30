# bkrun

[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](http://standardjs.com/)

Your friendly local [Buildkite](https://buildkite.com/) pipeline runner

[![asciicast](https://asciinema.org/a/d1z752j8coyirw2voj8btyctt.png)](https://asciinema.org/a/d1z752j8coyirw2voj8btyctt)

## Why?

Test those pipelines locally, of course.

## Install

```
npm install -g bkrun
```

## Features

* Supports command steps
* Supports wait steps (although these don't actually do anything atm)
* Supports prompt steps
* Supports manual unblock steps
* Supports agent meta-data get/set through a mock buildkite-agent
* Supports environment variables
* Supports pipeline uploading (file upload onlys)

## TODOs

* Asynchronous steps are run sequentially (in order)
* Ensure pipeline-uploading mechanics match (does new env apply to non-uploaded steps going forward? etc)
* Enable pipeline uploading through stdin
