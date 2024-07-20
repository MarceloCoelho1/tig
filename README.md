# TIG - Tiny Git Clone

TIG (Tiny Git Clone) is a simplified implementation of some Git functionalities, focused on understanding internal concepts and learning about file manipulation, compression, and network communication.

## Implemented Commands

### `init`

Initializes a new TIG repository.

```sh
node src/index.js init
```

### `cat-file`

Displays the content of an object stored in the repository.

```sh
node src/index.js cat-file <hash>
```

### `clone`

Clones a remote Git repository.

```sh
node src/index.js clone <repo-url>
```

### `commit`

Creates a commit with the files in the index.

```sh
node src/index.js commit -m "Commit message"
```

### `hash-object`

Hashes an object (file) and stores it in the repository.

```sh
node src/index.js hashObject <file>
```

### `write-tree`

Writes the directory tree from the index to the repository.

```sh
node src/index.js writeTree
```

### `ls-tree`

Displays the directory tree from the index in the console.

```sh
node src/index.js ls-tree <hash>
```