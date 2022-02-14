# CLI command

This document describes requirements for CLI commands. This is used to built-in a functionality that will make the CLI work.

Most of the command requires an option pointing to ARC's HTTP project location.

## Global options

### --in, -i

Used whenever an HTTP project is used as an input. The value points to a location of the project file. This can be replaced by `HTTP_PROJECT` environment variable.

### --out, -o

By default the command outputs the result to the `std.out`. When `--out` is defined then it writes the contents to the file defined in the value.
The CLI throws an error when a file already exists, unless the `--override` is present. The `--override` can be used without `--out` which will write the result to the same place as input.

### --override, -s

Overrides the `--out` file location if the file already exists. Can be used without `--out` to override the input.

## Common options

### --format, -f

The format to output the data. By default the output format is `arc` which is ARC's own format. Different command support different formats.

### --key-only, -k

Usually used when listing objects. When set it returns keys only rather than entire objects.

### --parent, -p

Then accessing project properties this tells the command to search in the folder which name or the key is the value of this option. Note, delete operations always use keys only instead of name. This is to avoid ambiguity.

## Project

### Project manipulation

```sh
# manipulating
- [x] arc project create "name" --version "1.2.3"
- [ ] arc project patch [set|append|delete] [path] --value="test"
- [ ] arc project move [key] --parent="[folder key]" --index 2 # moves an object between folders and indexes. When the parent is the same as the source parent this only moves the object in the position inside the parent. No parent means moving it into the project's root.
- [ ] arc project clone --revalidate # makes a copy of the project and revalidates (re-creates) keys for all object that have keys.

# reading
- [x] arc project list folders --key-only --format="arc|table"
- [x] arc project list requests --key-only --format="arc|table"
- [x] arc project list environments --key-only --format="arc|table"
- [x] arc project list children --format="arc|table" --parent [folder id]
- [ ] arc project describe [key] --format="arc|table"
```

### Project folder commands

```sh
- [x] arc project folder add my-folder --skip-existing --parent="[folder key]"
- [x] arc project folder get [folder id] --in="project.json"
- [x] arc project folder find [folder name] --key-only --format="arc|table"
- [x] arc project folder delete [folder id] --in="project.json"
- [ ] arc project folder patch [folder id] [set|append|delete] [path] --value="test"
```

### Project request commands

```sh
- [ ] arc project request add https://httpbin.org/put \
  --name="request name" \
  --method "PUT" \
  --parent="[folder key or name]" --add-missing-parent \
  --header "content-type: application/json" --header "x-custom: test" \
  --data="{\"test\":true}"

- [ ] arc project request get [REQUEST ID]
- [ ] arc project request delete [REQUEST ID]
- [ ] arc project request patch [REQUEST ID] [set|append|delete] [path] --value="test"
- [ ] arc project request find https://httpbin.org/get
```

### Project environment commands

```sh
- [ ] arc project environment add [name] --skip-existing --parent="[folder key]"
- [ ] arc project environment delete [environment id] --safe
- [ ] arc project environment list --parent="[folder key]"
- [ ] arc project environment find [name or key] --in="project.json"
- [ ] arc project environment patch [environment id] [set|append|delete] [path] --value="test"
```

### Project runner

```sh
- [ ] arc project run # runs requests directly added to the project
- [ ] arc project run --parent="[folder key]" --format="arc|table|har"
- [ ] arc project run --environment "[env name or key]" # selected environment
- [ ] arc project run --with-base-uri="https://custom.api.com" # sets the execution base URI for the requests.
- [ ] arc project run --with-variable=name=value # sets/overrides a variable in the execution context.
- [ ] arc project run --request="[key or name]" # runs only the specific request. Can be combined with `--parent`.
```

## Project transformers

```sh
- [ ] arc transform project --out="file.json" --format="arc|postman 2.1"
- [ ] arc transform request --format="arc|har|curl|postman 2.1"
- [ ] arc transform project --parent="[folder name or key]" --format="arc|har"
```
