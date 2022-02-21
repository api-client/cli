# Advanced REST Client's HTTP Project CLI

> Work in progress

The CLI for ARC's HTTP projects. This is an alternative use of the data stored in the ARC's HTTP project. It provides a CLI built on top of ARC's core library (@advanced-rest-client/core).

This CLI allows developers to create, manipulate, and execute HTTP projects without ARC's UI.

## CLI

The CLI offers the following commands:

- project create
- project patch
- project move
- project clone
- project list
- project describe
- project folder
- project request
- project environment
- project run
- transform

> Work in progress

## Command Line Options

### Global options

#### --in, -i

Always used when an HTTP project is required as an input. The value points to a location of the project file. This can be replaced by `HTTP_PROJECT` environment variable.

#### --out, -o

By default the command outputs the result to the `std.out`. When `--out` is defined then it writes the contents to the file defined in the value.
The CLI throws an error when a file already exists, unless the `--override` is present. The `--override` can be used without `--out` which will write the result to the same place as input.

#### --override, -s

Overrides the `--out` file location if the file already exists. Can be used without `--out` to override the input.

#### --pretty-print

Whenever a JSON data is the output, it pretty-prints the result.

#### --debug

Prints additional information when running the command. Useful when reporting a bug.

### Common options

### --format, -f

The format to output the data. The default behavior depends on the context. When manipulating the data the default formatter is the own `arc` format which is a JSON object. The default format for reading data from the project file is `table` which prints the detailed description of the result.

### --key-only, -k

Usually used when listing objects. When set it returns keys only rather than entire objects.

### --parent, -p

Then accessing project properties this tells the command to search in the folder which name or the key is the value of this option. Note, delete operations always use keys only instead of name. This is to avoid ambiguity.

### api-client project create

Creates a new HTTP project.

```sh
api-client project create "name" [--project-version "1.2.3"] [--out "project.json"]
```

| Option | Details |
| ------ | ------- |
| --project-version | The version number of the HTTP project. |

### api-client project move

Moves an object inside a project. With this command you can move a request or a folder from the project root to a folder and back. It also allows you to order objects withing the project.

```sh
api-client project move <key> [--parent="[folder key]"] [--index 2]
```

| Option | Details |
| ------ | ------- |
| key | The moved object's key |
| -n, --index | The index to add the object into the list of objects. When not set it adds the object at the end. |

### api-client project clone

Makes a copy of the project and optionally revalidates (re-creates) keys for all object that have keys.

```sh
api-client project clone --in project.json [--revalidate]
```

| Option | Details |
| ------ | ------- |
| --revalidate | Regenerates keys in the project |

### api-client project list

Lists the object in the current folder or the project.

```sh
api-client project list <folders | requests | environments | children> [--key-only] [--reporter="table"]
```

| Option | Details |
| ------ | ------- |
| -k, --key-only | Prints a table with keys only rather than entire objects. |
| -r, --reporter | The reporter to use to print the values. Ignored when --key-only is set. Default to `table`. |

### api-client project info

Prints general information about the project.

```sh
api-client project info
```

### api-client project folder add

Adds a folder to the project of a folder.

```sh
api-client project folder add <folder name> [--skip-existing] [--parent="[folder key]"] [--index=1]
```

| Option | Details |
| ------ | ------- |
| -S, --skip-existing | Ignores the operation when the folder with the same name exists. This command can be used used to ensure that the folder exists. |
| -n, --index | The 0-based position at which to add the folder into the list of items. |

### api-client project folder get

Prints an information about a folder.

```sh
api-client project folder get <key or name> [--reporter="table"]
```

| Option | Details |
| ------ | ------- |
| -r, --reporter | The reporter to use to print the values. Ignored when --key-only is set. Default to "table". |

### api-client project folder find

Finds a folder in the project. It performs a full-text search of a folder.

```sh
api-client project folder find <query> [--key-only] [--format="table"]
```

| Option | Details |
| ------ | ------- |
| -r, --reporter | The reporter to use to print the values. Ignored when --key-only is set. Default to "table". |

### api-client project folder delete

Removes a folder from the project and its contents. This command only accepts folder key as the argument.

```sh
api-client project folder delete <folder key> [--safe]
```

| Option | Details |
| ------ | ------- |
| -S, --safe | Does not throw an error when the folder does not exist. |

### api-client project request add

Adds an HTTP request to a project.

```sh
api-client project request add <url> \
  [--name="request name"] \
  [--method "PUT"] \
  [--parent="[folder key or name]"] [--add-parent] \
  [--header "content-type: application/json"] [--header "x-custom: test"] \
  [--data="{\"test\":true}"]
```

| Option | Details |
| ------ | ------- |
| url | The URL of the request. |
| -n, --name | Sets the name of the request. Default to the URL. |
| -m, --method | The HTTP method of the request. Default to `GET`. |
| -H, --header | The full value of a single header line to add. |
| -d, --data | The payload to send with the request. If used more than once the data pieces will be concatenated with a separating &-symbol. When used with the @-symbol it reads the file from the filesystem. The data does not manipulate the content type header. |
| -n, --index | The 0-based position at which to add the request into the list. |
| --add-parent | When set it creates a folder with the name of "--parent", if one doesn't exist. |

### api-client project request get

Prints information about a request in the project.

```sh
api-client project request get <name or key> [--reporter="table"]
```

| Option | Details |
| ------ | ------- |
| url | The URL of the request. |
| -r, --reporter | The reporter to use to print the values. Ignored when --key-only is set. Default to `table`. |

## Testing

### Testing in development

Testing and watching is little bit tricky because the library is TS and ESM at the same time. Tooling for Node lags behind browser's tooling and it requires several workarounds for the testing to work.

Terminal 1:

```sh
npm run tsc:watch
```

Terminal 2:

```sh
npm run test:mocha:watch2
```

### In the CI

```sh
npm run test
```
