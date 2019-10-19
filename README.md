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
{
    "email": "sXXXXXXX@ed.ac.uk",
    "password": "your-password-here"
}
```

## run (dev)

```bash
$ node server.js
```

## build

```bash
$ docker build -t eusa-members-api .
```

