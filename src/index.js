import {
  compose,
  getContext,
  withContext,
  withProps
} from "recompose";

import { PropTypes } from "react";

const valueShape = PropTypes.oneOfType([
  PropTypes.string,
  PropTypes.number,
  PropTypes.bool,
  PropTypes.object,
  PropTypes.array
]);

const errorShape = PropTypes.any;

const formContextShape = PropTypes.shape({
  value: valueShape.isRequired,
  errors: errorShape.isRequired,
  onChange: PropTypes.func.isRequired
});

const consumesFormContext = getContext({
  form: formContextShape
});

const providesFormContext = withContext(
  { form: formContextShape },
  function getChildContext(props) {
    const { value, errors, onChange } = props;
    return { form: { value, errors, onChange }};
  }
);

const providesFieldProps = withProps(function fieldProps(props) {
  const { form, name } = props;
  if (!form || !name) {
    return {};
  }

  return {
    value: form.value[name],
    errors: form.errors[name],
    onChange: function(e) {
      const value = {
        ...form.value,
        [name]: e.target.value
      };

      form.onChange({ target: { value }});
    }
  }
});

const field = compose(
  consumesFormContext,
  providesFieldProps,
  providesFormContext
);

const decorator = compose(
  consumesFormContext,
  providesFieldProps
);

export {
  field,
  decorator
};
