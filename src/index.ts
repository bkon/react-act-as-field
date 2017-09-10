import {
  ComponentEnhancer,
  compose,
  getContext,
  InferableComponentEnhancer,
  withContext,
  withProps
} from "recompose";

import { ComponentType, PropTypes, ValidationMap } from "react";

export type mapper<TInner, TOutter> = (input: TInner) => TOutter;

export type SimpleValue = string | number | boolean;
export type CompositeValue = object;
export type GenericValue = CompositeValue | SimpleValue;

export type ObjectErrors<Value> = {
  [K in keyof Value]: ErrorsType<Value[K]>;
};

export interface ILiteralErrors {
  [ruleName: string]: string;
}

export type ErrorsType<Value> = ObjectErrors<Value> | ILiteralErrors;

export interface IChangeEvent<Value> {
  target: {
    value: Value;
  };
}

export type ChangeHandler<Value> = (event: IChangeEvent<Value>) => void;

export interface IFieldCallbackProps<Value> {
  onChange: ChangeHandler<Value>;
}

export interface IFieldDataProps<Value> {
  value: Value;
  errors: ErrorsType<Value>;
}

export type FieldProps<Value> = IFieldCallbackProps<Value> & IFieldDataProps<Value>;

export type OptionalFieldProps<Value> = FieldProps<Value> | {};

export interface IFieldInContextProps<Value> {
  name?: keyof Value;
  form?: FieldProps<Value>;
}

export interface IFormContext<Value> {
  form: FieldProps<Value>;
}

export type FormContextProvider<Value> = (
  childContextTypes: ValidationMap<IFormContext<Value>>,
  getChildContext: mapper<FieldProps<Value>, IFormContext<Value>>
) => InferableComponentEnhancer<{}>;

const valueShape = PropTypes.oneOfType([
  PropTypes.string,
  PropTypes.number,
  PropTypes.bool,
  PropTypes.object,
  PropTypes.array
]);

const errorShape = PropTypes.any;

const formContextShape = PropTypes.shape({
  errors: errorShape,
  onChange: PropTypes.func.isRequired,
  value: valueShape.isRequired
});

const consumesFormContext = <
  V extends CompositeValue
>(
  target: ComponentType<IFormContext<V>>
) => {
  return getContext<IFormContext<V>>({
    form: formContextShape
  })(target);
};

const providesFormContext = <V extends GenericValue>(target: ComponentType) => {
  return withContext<IFormContext<V>, FieldProps<V>>(
    { form: formContextShape },
    function getChildContext(props) {
      const { value, errors, onChange } = props;
      return { form: { value, errors, onChange }};
    }
  )(target);
};

const providesFieldProps = <
  V extends CompositeValue,
  K extends keyof V
>(target: ComponentType) => {
  return withProps<
    OptionalFieldProps<V[K]>,
    IFieldInContextProps<V>
    >(function fieldProps(
      props: IFieldInContextProps<V>
    ): OptionalFieldProps<V[K]> {
    const { form, name } = props;
    if (!form || !name) {
      return {};
    }

    return {
      errors: form.errors && (form.errors as ObjectErrors<V>)[name] || {},
      onChange(e) {
        const subvalue: V[K] = e.target.value;

        const value: V = ({
          ...(form.value as CompositeValue),
          [name]: subvalue
        }) as any as V;

        form.onChange({ target: { value }});
      },
      value: form.value[name]
    };
  })(target);
};

const decorator = compose(
  consumesFormContext,
  providesFieldProps
);

const field = compose(
  decorator,
  providesFormContext
);

export {
  field,
  decorator
};
