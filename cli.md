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
- [x] api-client project create "name" --version "1.2.3"
- [ ] api-client project patch [set|append|delete] [path] --value="test"
- [x] api-client project move [key] --parent="[folder key]" --index 2 # moves an object between folders and indexes. When the parent is the same as the source parent this only moves the object in the position inside the parent. No parent means moving it into the project's root.
- [x] api-client project clone --revalidate # makes a copy of the project and revalidates (re-creates) keys for all object that have keys.

# reading
- [x] api-client project list folders --key-only --format="arc|table"
- [x] api-client project list requests --key-only --format="arc|table"
- [x] api-client project list environments --key-only --format="arc|table"
- [x] api-client project list children --format="arc|table" --parent [folder id]
- [x] api-client project info # prints information about the project
```

### Project folder commands

```sh
- [x] api-client project folder add my-folder --skip-existing --parent="[folder key]"
- [x] api-client project folder get [folder id] --in="project.json"
- [x] api-client project folder find [query] --key-only --format="arc|table"
- [x] api-client project folder delete [folder id] --in="project.json"
- [ ] api-client project folder patch [folder id] [set|append|delete] [path] --value="test"
```

### Project request commands

```sh
- [x] api-client project request add https://httpbin.org/put \
  --name="request name" \
  --method "PUT" \
  --parent="[folder key or name]" --add-missing-parent \
  --header "content-type: application/json" --header "x-custom: test" \
  --data="{\"test\":true}"

- [x] api-client project request get [REQUEST ID]
- [x] api-client project request delete [REQUEST ID]
- [ ] api-client project request patch [REQUEST ID] [set|append|delete] [path] --value="test"
- [x] api-client project request find [query]
```

### Project environment commands

```sh
- [x] api-client project environment add [name] --base-uri "api.com" --protocol "https:" --base-path "/v2/api" --parent="[folder key]" --description "My environment" --server-description "My API server"
- [x] api-client project environment delete [environment id] --safe
- [ ] api-client project environment list --parent="[folder key]"
- [ ] api-client project environment find [query]
- [ ] api-client project environment get [key]
- [ ] api-client project environment patch [environment id] [set|append|delete] [path] --value="test"

- [ ] api-client project variables list [environment id] --show-values
- [ ] api-client project variables add [environment id] --name VarName --value 1234 --disabled --type integer
- [ ] api-client project variables delete [environment id] [variable id]
- [ ] api-client project variables patch [environment id] [variable id]
```

### Project runner

```sh
- [ ] api-client project run # runs requests directly added to the project
- [ ] api-client project run --parent="[folder key]" --format="arc|table|har"
- [ ] api-client project run --environment "[env name or key]" # selected environment
- [ ] api-client project run --with-base-uri="https://custom.api.com" # sets the execution base URI for the requests.
- [ ] api-client project run --with-variable=name=value # sets/overrides a variable in the execution context.
- [ ] api-client project run --request="[key or name]" # runs only the specific request. Can be combined with `--parent`.
```

## Project transformers

```sh
- [ ] api-client transform project --out="file.json" --format="arc|postman 2.1"
- [ ] api-client transform request --format="arc|har|curl|postman 2.1"
- [ ] api-client transform project --parent="[folder name or key]" --format="arc|har"
```
