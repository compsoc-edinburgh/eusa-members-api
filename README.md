# eusa-members-api
This provides a simple API for getting a list of members of any given EUSA society.

## get started

```bash
$ git clone https://github.com/compsoc-edinburgh/eusa-members-api
$ cd eusa-members-api
$ yarn install
```

Then edit `config.json`:

```
    "orgID": 8868,
    "groupID": 8872,

    "port": 3000,
    "cachefile": "instance/cache.json"
```

And also `secret.json`:

```
{
    "email": "sXXXXXXX@ed.ac.uk",
    "password": "your-password-here"
}
```

You can find `orgID` in the URL when visiting an organisation page, for example:

```
https://www.eusa.ed.ac.uk/organisation/admin/8868/
                                             ^^^^
                                             HERE
```

## run (dev)

```bash
$ node server.js
```

## build

```bash
$ docker build -t eusa-members-api .
```
