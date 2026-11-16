## ONVEP-MCR Context Engine

Watches and modifies the ONVEP-MCR context engine.

### Configuration

- **Context engine URL**: e.g. `http://localhost:3334`.
- **Watched paths**: one per line, `variable_name=path` or just a path. Each one becomes a
  variable of this connection, kept up to date live (its value is the JSON value at the path,
  empty when the path doesn't exist).

```
score=match.score.home
layers.0.name
all=
```

gives `$(context:score)`, `$(context:layers_0_name)` and `$(context:all)` (with `context`
replaced by the label of your connection).

### Run something when a value changes

1. Watch the path in the connection configuration.
2. In **Triggers**, add a trigger with the event **On variable change** on that variable.
3. Add its actions. To copy the new value into a custom variable, use the internal action
   **Custom variable: Set with expression** with `$(context:score)`.

Changes made while Companion was disconnected are read again on reconnection.

### Actions

- **Modify the context**: set, merge, append or delete at a path. The value accepts variables;
  tick _Value is JSON_ to send a number, a boolean, an object… instead of text. A refused write
  (validator, mutator) is logged with the engine error code.
- **Read a value**: returns the value at a path as the action result, to store it in a variable.
