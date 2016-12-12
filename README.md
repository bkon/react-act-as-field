# Simple strictured field HOC

This is a React High Order Component you can use with your own (or
third-party) UX components if you want them to behave like a complex
structured field.

## Installation

Use `npm` or `yarn`:
```
npm install --save react-act-as-field
yarn add react-act-as-field
```

## Usage

A an example of a composite field with the following structure:
```
- year
- currency
  - eur
  - usd
```

```
import React from "react";
import ReactDOM from "react-dom";
import { compose, withState, mapProps, withHandlers } from "recompose";
import { field, decorator } from "react-act-as-field";

const Number = compose(
  decorator,
  mapProps(({ value, onChange }) => ({ value, onChange, type: "number" }))
)("input");

const Currencies = () => (
  <div>
    <div>EUR: <Number name="eur"/></div>
    <div>USD: <Number name="usd"/></div>
  </div>
);
const CurrenciesField = field(Currencies);

const Combined = () => (
  <div>
    <div><CurrenciesField name="currency"/></div>
    <div>YEAR: <Number name="year"/></div>
  </div>
);
const CombinedField = field(Combined);

// field definition ends here; everything below is just a
// visualization boilerplate

const Form = ({ value, errors, onChange, onSubmit }) => (
  <div>
    <CombinedField value={ value }
                   errors={ errors }
                   onChange={ (e) => onChange(e.target.value) } />
    <div><button onClick={ onSubmit }>Submit</button></div>
  </div>
);

const initialState = { year: "2015", currency: { eur: "2", usd: "3" }};
const FormWithState = compose(
  withState("value", "onChange", initialState),
  withHandlers({
    onSubmit: ({ value }) => () => console.log("SUBMIT:", value),
    onChange: ({ onChange }) => (value) => {
      console.log("CHANGE:", value);
      onChange(value);
    }
  })
)(Form);

ReactDOM.render(<FormWithState/>, document.querySelector("#react-component"));
```

## API

### Requirements for the wrapped component

A component should understand two props:
- `value` (self-explanatory)
- `onChange` (a callback to be invoked when input value changes)

`onChange` expects data to be passed in the following format:
```
{
  target: {
    value: "Your component value"
  }
}
```
(see below for explanation why)

Component *may* understand `errors` prop and render some kind of visual indication.
This package does not put any restrictions on the exact format of the error messages for
simple fields. Composite field errors should follow the following structure:
```
{
  year: { ... errors for the year field ... },
  currency: {
    eur: { ... errors for the eur field ... },
    usd: { ... errors for the usd field ... }
  }
}
```

### `decorator`

```
import { decorator } from "react-act-as-field";
```

HOC used to wrap simple fields with no structure (for example, native `input` or `select`,
[Datepicker](https://github.com/Hacker0x01/react-datepicker) and similar)

Use it only if you're pedantic - you always safely can use `field` with just a minor overhead.

### `field` HOC

```
import { field } from "react-act-as-field";
```

HOC used to wrap components which may contain nested fields.

### Technical limitations

Components use the `form` context to communicate with each other.
Other code which uses the same context name may potentially cause
conflicts.

## Questions

### Does returning the whole value every time it's changed requires extra memory?

HOC uses references to original values where possible, so only changed
values are created from scratch.  (Yes, this means that you can use
fast referential equality).

### I want to see only the changed parts

Use [object-deep-diff](https://github.com/rbs392/object-deep-diff) or
similar to compare value returned by onChange and your previous value.
Keep in mind that shallow comparison is possible, as unchanged
elements are not recreated on change.

### Why onChange uses `.target.value` to hold the field value?

In order to be compatible with standard `input`s without requiring two
types of HOCs for them and third-party components.

### What's the difference between `field` and `decorator`?

`field` = `decorator` + possibility to add more nested fields.  If
you're working with a simple field and know what you're doing, use
`decorator`, otherwise `field` is safe enough to use.
