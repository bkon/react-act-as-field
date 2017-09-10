import "babel-polyfill";
import { mount } from "enzyme";
import * as React from "react";
import sinon from "sinon";

import { ChangeHandler, decorator, field, IFieldDataProps } from "../src/index";

import chai, { expect } from "chai";
chai.use(require("sinon-chai"));
chai.use(require("chai-enzyme")());

import jsdom from "jsdom";
const doc = jsdom.jsdom("<!doctype html><html><body></body></html>");
(global as any).document = doc;
(global as any).window = doc.defaultView;

type Value = string;

const UnwrappedErrors: React.SFC<IFieldDataProps<Value>> = (props) => {
  const { errors } = props;
  const e = Object.keys(errors)[0];

  return (
    <div className="error">{ e }</div>
  );
};

const Errors = field(UnwrappedErrors);

const UnwrappedDecorator: React.SFC<IFieldDataProps<Value>> =
  ({ errors, children }) => {
  const e = Object.keys(errors)[0];

  return (
    <div>
      <div className="decorator">{ e }</div>
      <div>{ children }</div>
    </div>
  );
};

const ErrorDecorator = decorator(UnwrappedDecorator);

interface ISimpleFieldProps {
  name: string;
  type: string;
  value: string;
  onChange: ChangeHandler<string>;
}

const UnwrappedSimpleField: React.SFC<ISimpleFieldProps> =
  ({ type, name, value, onChange }) =>
    <input name={ name }
           type={ type }
           value={ value }
           onChange={ onChange } />;

const SimpleField = field(UnwrappedSimpleField);

const ComplexField = field(function complexField() {
  return (
    <div>
      <ErrorDecorator name="c">
        <SimpleField name="c" type="text" />
      </ErrorDecorator>
      <SimpleField name="d" type="text" />
      <Errors name="d" />
    </div>
  );
});

const Form = field(function form() {
  return (
    <div>
      <SimpleField name="a" type="text" />
      <ComplexField name="b"/>
    </div>
  );
});

describe("field HOC", () => {
  let subject;
  let props;

  beforeEach(() => {
    props = {
      errors: {
        a: {},
        b: {
          c: {
            format: true
          },
          d: {
            isEmail: true
          }
        }
      },
      onChange: sinon.stub(),
      value: {
        a: "11",
        b: {
          c: "AA",
          d: "BB"
        }
      }
    };

    subject = () => mount(
      <Form { ...props }/>
    );
  });

  it("sets proper values for all nested fields", () => {
    expect(subject().find("[name='a']")).to.have.attr("value").equal("11");
    expect(subject().find("[name='c']")).to.have.attr("value").equal("AA");
    expect(subject().find("[name='d']")).to.have.attr("value").equal("BB");
  });

  it("propagates errors", () => {
    expect(subject().find(".error")).to.have.text("isEmail");
  });

  it("propagates errors to decorators", () => {
    expect(subject().find(".decorator")).to.have.text("format");
  });

  context("when no errors is provided", () => {
    beforeEach(() => {
      props.errors = undefined;
    });

    it("assumes there's no errors", () => {
      expect(subject().find(".error")).to.have.text("");
    });
  });

  context("when nested simple field is changed", () => {
    beforeEach(() => {
      subject().find("[name='a']").simulate("change", { target: { value: "22" }});
    });

    it("calls onChange of the root form element", () => {
      const value = {
        a: "22",
        b: {
          c: "AA",
          d: "BB"
        }
      };

      expect(props.onChange).to.have.been.calledWith({ target: { value }});
    });
  });
});
