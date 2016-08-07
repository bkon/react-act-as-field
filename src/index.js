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
  PropTypes.object
])

const formContextShape = PropTypes.shape({
  value: valueShape.isRequired,
  onChange: PropTypes.func.isRequired
});

const consumesFormContext = getContext({
  form: formContextShape
});

const providesFormContext = withContext(
  { form: formContextShape },
  function getChildContext(props) {
    const { value, onChange } = props;
    return { form: { value, onChange }};
  }
);

const providesFieldProps = withProps(function fieldProps(props) {
  const { form, name } = props;
  if (!form || !name) {
    return {};
  }

  return {
    value: form.value[name],
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

export { field };
