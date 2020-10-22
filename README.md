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

To use the dashboard, you'll need to add some Google OAuth keys to auth with
our GAdmin workspace. Follow the instructions in [the compsoc-sso-template
repo](https://github.com/compsoc-edinburgh/compsoc-sso-framework#how) (may be
private), and then add them to the `secret.json` file:

```
{
    // ...
    "google": {
        "client_id": "YOUR_CLIENT_ID",
        "client_secret": "YOUR_CLIENT_SECRET",
        "callback": "https://YOUR_DEPLOYMENT_URL/auth/google/callback"
    }
}
```

Additionally, you'll need to add the sendy API key, deployment, and target
list. Instructions on how to find this information can be found at the [Sendy
API documentation](https://sendy.co/api). Once you get this information, you
can set it in `secret.json`:

```
{
    // ...
    "sendy": {
        "sendy_url": "https://YOUR_SENDY_URL/sendy",
        "api_key": "YOUR_SENDY_API_KEY",
        "target_list": "YOUR_SENDY_TARGET_LIST"
    }
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
