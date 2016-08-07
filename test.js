import "babel-polyfill"
import React from "react";
import { field } from "./src/index";
import { mount } from "enzyme";
import sinon from "sinon";

import chai, { expect } from "chai";
chai.use(require("sinon-chai"));
chai.use(require("chai-enzyme")());

import jsdom from "jsdom";
const doc = jsdom.jsdom('<!doctype html><html><body></body></html>');
global.document = doc;
global.window = doc.defaultView;

const Errors = field(function err(props) {
  const { errors } = props;
  const e = Object.keys(errors)[0];

  return (
    <div>{ e }</div>
  );
});

const SimpleField = field(function simpleField({ type, name, value, onChange }) {
  return (<input name={ name }
                 type={ type }
                 value={ value }
                 onChange={ onChange } />);
});

const ComplexField = field(function complexField() {
  return (
    <div>
      <SimpleField name="c" type="text" />
      <SimpleField name="d" type="text" />
      <Errors name="d" />
    </div>
  )
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
      onChange: sinon.stub(),
      value: {
        a: "11",
        b: {
          c: "AA",
          d: "BB"
        }
      },
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
      }
    }
    subject = mount(
      <Form { ...props }/>
    )
  });

  it("sets proper values for all nested fields", () => {
    expect(subject.find("[name='a']")).to.have.attr("value").equal("11");
    expect(subject.find("[name='c']")).to.have.attr("value").equal("AA");
    expect(subject.find("[name='d']")).to.have.attr("value").equal("BB");
  });

  it("propagates errors", () => {
    expect(subject).to.have.text("isEmail");
  });

  context("when nested simple field is changed", () => {
    beforeEach(() => {
      subject.find("[name='a']").simulate("change", { target: { value: "22" }});
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
